'use client';

import { useState, useRef, useEffect } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { PlusIcon, ArrowLeftIcon, CurrencyDollarIcon } from '@phosphor-icons/react';
import Link from 'next/link';
import { transactionSchema, type TransactionFormData } from '@/schemas/transaction.schema';
import { compressWithFallback } from '@/utils/photo';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CustomerLookupSection } from '@/components/transactions/CustomerLookupSection';
import { TransactionItemCard, type PendingPhoto } from '@/components/transactions/TransactionItemCard';
import { TransactionConfirmDialog } from '@/components/transactions/TransactionConfirmDialog';
import { ClaimStubDialog } from '@/components/transactions/ClaimStubDialog';
import type { Service, Promo, Customer, Transaction } from '@/lib/types';
import { calcItemPrice, calcRawTotal, findPromo, applyPromo } from '@/utils/pricing';
import { PAYMENT_METHOD_LABELS, cn } from '@/lib/utils';
import { ITEM_STATUS } from '@/lib/constants';

const PAYMENT_METHODS = ['cash', 'gcash', 'card', 'bank_deposit'] as const;

async function doPhotoUpload(txnId: number, itemId: number, file: File): Promise<void> {
  const { blob } = await compressWithFallback(file);
  const { signedUrl, publicUrl } = await api.uploads.presignedUrl({
    txnId,
    itemId,
    type: 'before',
    extension: 'jpg',
  });
  const res = await fetch(signedUrl, {
    method: 'PUT',
    body: blob,
    headers: { 'Content-Type': 'image/jpeg' },
  });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  await api.transactions.updateItem(txnId, itemId, { beforeImageUrl: publicUrl });
}

export function NewTransactionForm() {
  const router = useRouter();

  const { data: services = [] } = useQuery({
    queryKey: ['services', 'active'],
    queryFn: () => api.services.list(true),
  });

  const { data: promos = [] } = useQuery({
    queryKey: ['promos', 'active'],
    queryFn: () => api.promos.list(true),
  });

  const today = new Date().toISOString().split('T')[0];
  const validPromos = (promos as Promo[]).filter((p) => {
    if (p.dateFrom && p.dateFrom > today) return false;
    if (p.dateTo && p.dateTo < today) return false;
    return true;
  });

  const primaryServices = (services as Service[]).filter((s) => s.type === 'primary');
  const addonServices = (services as Service[]).filter((s) => s.type === 'add_on');

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      customerStreetName: '',
      customerBarangay: '',
      customerCity: '',
      customerProvince: '',
      customerCountry: '',
      pickupDate: '',
      promoId: '',
      note: '',
      paymentMethod: '',
      paymentAmount: '',
      paymentReference: '',
      items: [{ shoeDescription: '', primaryServiceId: '', addonServiceIds: [] }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = useWatch({ control, name: 'items' });
  const watchedPromoId = useWatch({ control, name: 'promoId' }) ?? 'none';
  const watchedPaymentMethod = useWatch({ control, name: 'paymentMethod' }) ?? '';
  const watchedPaymentAmount = useWatch({ control, name: 'paymentAmount' }) ?? '';

  const [customerStep, setCustomerStep] = useState<'phone' | 'details'>('phone');
  const [existingCustomer, setExistingCustomer] = useState<Customer | null | undefined>(undefined);
  const [pendingSubmit, setPendingSubmit] = useState<TransactionFormData | null>(null);
  const pendingSubmitStable = useRef<TransactionFormData | null>(null);
  if (pendingSubmit !== null) pendingSubmitStable.current = pendingSubmit;
  const [createdTxn, setCreatedTxn] = useState<Transaction | null>(null);

  // Photo state — keyed by item field index
  const [pendingPhotos, setPendingPhotos] = useState<Map<number, PendingPhoto>>(() => new Map());
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const pendingPhotosRef = useRef(pendingPhotos);
  pendingPhotosRef.current = pendingPhotos;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingPhotoTarget = useRef<number | null>(null);

  // Revoke all object URLs on unmount
  useEffect(() => {
    return () => {
      pendingPhotosRef.current.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl));
    };
  }, []);

  function handleRemovePhoto(idx: number) {
    const existing = pendingPhotosRef.current.get(idx);
    if (existing) URL.revokeObjectURL(existing.previewUrl);
    setPendingPhotos((prev) => {
      const next = new Map(prev);
      next.delete(idx);
      return next;
    });
  }

  function handlePhotoClick(idx: number) {
    pendingPhotoTarget.current = idx;
    fileInputRef.current?.click();
  }

  function handlePhotoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || pendingPhotoTarget.current === null) return;

    if (file.size === 0) { toast.error('File is empty'); return; }
    if (file.size > 20 * 1024 * 1024) { toast.error('File must be under 20MB'); return; }
    if (file.type && !file.type.startsWith('image/')) { toast.error('Only image files are allowed'); return; }

    const idx = pendingPhotoTarget.current;
    const previewUrl = URL.createObjectURL(file);
    const existing = pendingPhotosRef.current.get(idx);
    if (existing) URL.revokeObjectURL(existing.previewUrl);

    setPendingPhotos((prev) => {
      const next = new Map(prev);
      next.set(idx, { file, previewUrl });
      return next;
    });
  }

  function handleRemoveItem(idx: number) {
    const existing = pendingPhotosRef.current.get(idx);
    if (existing) URL.revokeObjectURL(existing.previewUrl);

    // Rebuild map with shifted indices
    const next = new Map<number, PendingPhoto>();
    pendingPhotosRef.current.forEach((v, k) => {
      if (k < idx) next.set(k, v);
      else if (k > idx) next.set(k - 1, v);
    });
    setPendingPhotos(next);
    remove(idx);
  }

  function handleChangePhone() {
    setCustomerStep('phone');
    setExistingCustomer(undefined);
    setValue('customerName', '');
    setValue('customerEmail', '');
    setValue('customerStreetName', '');
    setValue('customerBarangay', '');
    setValue('customerCity', '');
    setValue('customerProvince', '');
  }

  const rawTotal = calcRawTotal(watchedItems ?? [], services as Service[]);
  const selectedPromo = findPromo(watchedPromoId, validPromos);
  const total = applyPromo(rawTotal, selectedPromo);

  const createMut = useMutation({
    mutationFn: (data: TransactionFormData) => {
      const allItems = data.items.map((i) => {
        const itemPrice = calcItemPrice(i, services as Service[]);
        return {
          shoeDescription: i.shoeDescription || undefined,
          serviceId: i.primaryServiceId ? parseInt(i.primaryServiceId, 10) : undefined,
          addonServiceIds: (i.addonServiceIds ?? []).map((id) => parseInt(id, 10)).filter(Boolean),
          status: ITEM_STATUS.PENDING,
          price: itemPrice > 0 ? String(itemPrice) : undefined,
        };
      });
      return api.transactions.create({
        customerName: data.customerName || undefined,
        customerPhone: data.customerPhone || undefined,
        customerEmail: data.customerEmail || undefined,
        customerStreetName: data.customerStreetName || undefined,
        customerBarangay: data.customerBarangay || undefined,
        customerCity: data.customerCity || undefined,
        customerProvince: data.customerProvince || undefined,
        customerCountry: 'Philippines',
        isExistingCustomer: existingCustomer != null,
        pickupDate: data.pickupDate || undefined,
        note: data.note || undefined,
        promoId: data.promoId && data.promoId !== 'none' ? parseInt(data.promoId, 10) : undefined,
        total: total.toFixed(2),
        paid: '0',
        items: allItems,
      });
    },
    onSuccess: async (txn, data) => {
      const items = txn.items ?? [];
      const uploads = items
        .map((item, idx) => ({ item, pending: pendingPhotosRef.current.get(idx) }))
        .filter((x): x is { item: typeof x.item; pending: PendingPhoto } => !!x.pending);

      if (uploads.length > 0) {
        setIsUploadingPhotos(true);
        await Promise.allSettled(
          uploads.map(({ item, pending }) =>
            doPhotoUpload(txn.id, item.id, pending.file).catch(() => {
              toast.error(`Photo upload failed for item "${item.shoeDescription || `#${item.id}`}"`);
            }),
          ),
        );
        setIsUploadingPhotos(false);
      }

      // Record initial payment if provided
      const payAmt = parseFloat(data.paymentAmount ?? '0');
      let paidSoFar = 0;
      if (payAmt > 0 && data.paymentMethod) {
        await api.transactions.addPayment(txn.id, {
          method: data.paymentMethod,
          amount: payAmt.toFixed(2),
          ...(data.paymentReference?.trim() ? { referenceNumber: data.paymentReference.trim() } : {}),
        }).then(() => {
          paidSoFar = payAmt;
        }).catch(() => {
          toast.error('Transaction created but initial payment failed to record');
        });
      }

      toast.success('Transaction created');
      setPendingSubmit(null);
      setCreatedTxn({ ...txn, paid: paidSoFar.toFixed(2) });
    },
    onError: (err: Error) => {
      toast.error('Failed to create transaction', { description: err.message });
    },
  });

  const paymentExceedsTotal = !!watchedPaymentAmount && parseFloat(watchedPaymentAmount) > total;
  const isBusy = createMut.isPending || isUploadingPhotos;

  return (
    <div>
      <PageHeader
        title="New Transaction"
        backButton={
          <Link href="/transactions">
            <Button variant="ghost" size="sm">
              <ArrowLeftIcon size={14} />
            </Button>
          </Link>
        }
      />

      {/* Hidden file input shared across all item rows */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoFileChange}
      />

      <form onSubmit={handleSubmit(
        (data) => {
          const missingIdx = data.items.findIndex((_, idx) => !pendingPhotos.has(idx));
          if (missingIdx !== -1) {
            toast.error('Before photo required', {
              description: `Shoe ${missingIdx + 1} is missing a before photo.`,
            });
            return;
          }
          setPendingSubmit(data);
        },
        () => {
          // Zod validation failed — if we're still on the phone step the errors are on unmounted
          // fields and won't be visible, so surface a toast instead.
          if (customerStep === 'phone') {
            toast.error('Customer required', { description: 'Enter and confirm the customer phone number.' });
          }
        },
      )}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="col-span-2 space-y-6">
            {/* Customer */}
            <CustomerLookupSection
              register={register}
              errors={errors}
              setValue={setValue}
              control={control}
              step={customerStep}
              existingCustomer={existingCustomer}
              onCustomerResolved={(customer) => {
                setExistingCustomer(customer);
                setCustomerStep('details');
              }}
              onChangePhone={handleChangePhone}
            />

            {/* Items */}
            <div className="bg-white border border-zinc-200 rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-zinc-950">Shoes & Services</h2>
                <Button
                  type="button"
                  variant="dark"
                  size="sm"
                  onClick={() => append({ shoeDescription: '', primaryServiceId: '', addonServiceIds: [] })}
                >
                  <PlusIcon size={13} weight="bold" />
                  Add Item
                </Button>
              </div>

              {errors.items?.root && (
                <p className="text-xs text-red-500 mb-3">{errors.items.root.message}</p>
              )}

              <div className="space-y-3">
                {fields.map((field, idx) => (
                  <TransactionItemCard
                    key={field.id}
                    index={idx}
                    register={register}
                    errors={errors}
                    setValue={setValue}
                    primaryServices={primaryServices}
                    addonServices={addonServices}
                    primaryServiceId={watchedItems?.[idx]?.primaryServiceId ?? ''}
                    addonServiceIds={watchedItems?.[idx]?.addonServiceIds ?? []}
                    pendingPhoto={pendingPhotos.get(idx)}
                    canRemove={fields.length > 1}
                    onRemove={() => handleRemoveItem(idx)}
                    onPhotoClick={() => handlePhotoClick(idx)}
                    onRemovePhoto={() => handleRemovePhoto(idx)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            <div className="bg-white border border-zinc-200 rounded-lg p-5">
              <h2 className="text-sm font-semibold text-zinc-950 mb-4">Details</h2>
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <Input
                    label="Pickup Date"
                    type="date"
                    min={today}
                    {...register('pickupDate')}
                  />
                  {errors.pickupDate && (
                    <p className="text-xs text-red-500">{errors.pickupDate.message}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-700">Promo Code</label>
                  <Select
                    value={watchedPromoId || 'none'}
                    onValueChange={(v) => setValue('promoId', v === 'none' ? '' : v)}
                  >
                    <SelectTrigger className="h-9 text-sm w-full border-zinc-200 font-mono">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {validPromos.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          <span className="font-mono">{p.code}</span>
                          <span className="text-zinc-400 ml-1.5">· -{parseFloat(p.percent).toFixed(0)}%</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-700">Note</label>
                  <textarea
                    rows={3}
                    placeholder="Internal note..."
                    {...register('note')}
                    className="px-3 py-2 text-sm bg-white border border-zinc-200 rounded-md text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <CurrencyDollarIcon size={14} className="text-zinc-400" />
                <h2 className="text-sm font-semibold text-zinc-950">Payment Details</h2>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-zinc-700">Payment Method</label>
                    <Select
                      value={watchedPaymentMethod || 'none'}
                      onValueChange={(v) => setValue('paymentMethod', v === 'none' ? '' : v)}
                    >
                      <SelectTrigger className="h-9 text-sm w-full border-zinc-200">
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {PAYMENT_METHODS.map((m) => (
                          <SelectItem key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-zinc-700">Reference #</label>
                    <input
                      type="text"
                      placeholder="e.g. GCash ref"
                      {...register('paymentReference')}
                      className="h-9 w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
                {watchedPaymentMethod && watchedPaymentMethod !== 'none' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-zinc-700">Amount Paid</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      {...register('paymentAmount')}
                      className={cn(
                        'px-3 py-2 text-sm font-mono bg-white border rounded-md text-right text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
                        watchedPaymentAmount && parseFloat(watchedPaymentAmount) > total
                          ? 'border-red-400'
                          : 'border-zinc-200',
                      )}
                    />
                    {watchedPaymentAmount && parseFloat(watchedPaymentAmount) > total && (
                      <p className="text-xs text-red-500">
                        Amount cannot exceed total of ₱{total.toFixed(2)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-lg p-5">
              <h2 className="text-sm font-semibold text-zinc-950 mb-3">Summary</h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Shoes</span>
                  <span className="font-mono text-zinc-950">
                    {(watchedItems ?? []).filter((i) => i?.primaryServiceId).length}
                  </span>
                </div>
                {pendingPhotos.size > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500">Photos</span>
                    <span className="font-mono text-zinc-950">{pendingPhotos.size}</span>
                  </div>
                )}
                {selectedPromo && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500">Promo</span>
                    <span className="font-mono text-emerald-600">-{parseFloat(selectedPromo.percent).toFixed(0)}%</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm border-t border-zinc-100 pt-2">
                  <span className="font-medium text-zinc-950">Total</span>
                  <div className="text-right">
                    {selectedPromo && (
                      <p className="font-mono text-xs text-zinc-400 line-through">₱{rawTotal.toFixed(2)}</p>
                    )}
                    <span className="font-mono font-semibold text-zinc-950">
                      ₱{total.toFixed(2)}
                    </span>
                  </div>
                </div>
                {watchedPaymentAmount && parseFloat(watchedPaymentAmount) > 0 && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">Initial Payment</span>
                      <span className="font-mono text-emerald-600">₱{parseFloat(watchedPaymentAmount).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">Balance</span>
                      <span className="font-mono text-zinc-950">₱{Math.max(0, total - parseFloat(watchedPaymentAmount)).toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>

              <Button
                type="submit"
                className="w-full mt-4"
                disabled={isBusy || paymentExceedsTotal}
              >
                {isBusy ? <Spinner /> : 'Create Transaction'}
              </Button>
            </div>
          </div>
        </div>
      </form>

      <TransactionConfirmDialog
        open={pendingSubmit !== null}
        data={pendingSubmitStable.current}
        services={services as Service[]}
        pendingPhotos={pendingPhotos}
        selectedPromo={selectedPromo ?? undefined}
        total={total}
        rawTotal={rawTotal}
        existingCustomer={existingCustomer}
        isBusy={isBusy}
        isUploadingPhotos={isUploadingPhotos}
        onConfirm={() => {
          if (!pendingSubmit) return;
          createMut.mutate(pendingSubmit);
        }}
        onCancel={() => { if (!isBusy) setPendingSubmit(null); }}
      />

      <ClaimStubDialog
        open={createdTxn !== null}
        txn={createdTxn}
        onViewTransaction={() => {
          if (createdTxn) router.push(`/transactions/${createdTxn.id}`);
        }}
      />
    </div>
  );
}
