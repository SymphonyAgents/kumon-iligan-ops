'use client';

import { CameraIcon } from '@phosphor-icons/react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { formatDate, formatPeso } from '@/lib/utils';
import type { Service, Promo, Customer } from '@/lib/types';
import type { TransactionFormData } from '@/schemas/transaction.schema';
import type { PendingPhoto } from '@/components/transactions/TransactionItemCard';

interface TransactionConfirmDialogProps {
  open: boolean;
  data: TransactionFormData | null;
  services: Service[];
  pendingPhotos: Map<number, PendingPhoto>;
  selectedPromo: Promo | undefined;
  total: number;
  rawTotal: number;
  existingCustomer: Customer | null | undefined;
  isBusy: boolean;
  isUploadingPhotos: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function TransactionConfirmDialog({
  open,
  data,
  services,
  pendingPhotos,
  selectedPromo,
  total,
  rawTotal,
  existingCustomer,
  isBusy,
  isUploadingPhotos,
  onConfirm,
  onCancel,
}: TransactionConfirmDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      title="Create transaction?"
      confirmLabel={isUploadingPhotos ? 'Uploading photos...' : 'Confirm & Create'}
      confirmVariant="dark"
      loading={isBusy}
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      {data && (
        <div className="space-y-4">
          {/* Customer grid */}
          <div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">Customer</p>
            <div className="grid grid-cols-2 gap-2">
              {data.customerName && (
                <div className="bg-zinc-50 rounded-md p-2.5">
                  <p className="text-xs text-zinc-400 mb-0.5">Name</p>
                  <p className="text-sm text-zinc-950 truncate">{data.customerName}</p>
                </div>
              )}
              <div className="bg-zinc-50 rounded-md p-2.5">
                <p className="text-xs text-zinc-400 mb-0.5">Phone</p>
                <p className="text-sm font-mono text-zinc-950">{data.customerPhone}</p>
              </div>
              <div className="bg-zinc-50 rounded-md p-2.5">
                <p className="text-xs text-zinc-400 mb-0.5">Pickup</p>
                <p className="text-sm text-zinc-950">{formatDate(data.pickupDate)}</p>
              </div>
              {existingCustomer !== undefined && (
                <div className="bg-zinc-50 rounded-md p-2.5">
                  <p className="text-xs text-zinc-400 mb-0.5">Customer</p>
                  <p className={`text-sm ${existingCustomer ? 'text-emerald-600' : 'text-zinc-500'}`}>
                    {existingCustomer ? 'Existing' : 'New'}
                  </p>
                </div>
              )}
              {selectedPromo && (
                <div className="bg-zinc-50 rounded-md p-2.5">
                  <p className="text-xs text-zinc-400 mb-0.5">Promo</p>
                  <p className="text-sm font-mono text-emerald-600">
                    {selectedPromo.code} · -{parseFloat(selectedPromo.percent).toFixed(0)}%
                  </p>
                </div>
              )}
              {data.note && (
                <div className="bg-zinc-50 rounded-md p-2.5 col-span-2">
                  <p className="text-xs text-zinc-400 mb-0.5">Note</p>
                  <p className="text-sm text-zinc-700 whitespace-pre-wrap">{data.note}</p>
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">Items</p>
            <div className="space-y-1.5">
              {data.items.map((item, idx) => {
                const svc = item.primaryServiceId
                  ? services.find((s) => s.id === parseInt(item.primaryServiceId, 10))
                  : null;
                const addons = (item.addonServiceIds ?? [])
                  .map((id) => services.find((s) => s.id === parseInt(id, 10)))
                  .filter(Boolean) as Service[];
                const photo = pendingPhotos.get(idx);
                return (
                  <div key={idx} className="bg-zinc-50 rounded-md p-2.5 flex gap-2.5">
                    {photo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo.previewUrl}
                        alt="Before"
                        className="w-10 h-10 rounded object-cover shrink-0 self-start"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-950 truncate mb-1.5">
                        {item.shoeDescription || `Item ${idx + 1}`}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {svc && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-zinc-200 text-zinc-600">
                            {svc.name}
                          </span>
                        )}
                        {addons.map((a) => (
                          <span key={a.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-zinc-100 text-zinc-500">
                            +{a.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Photos note */}
          {pendingPhotos.size > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
              <CameraIcon size={14} className="text-blue-500 shrink-0" />
              <p className="text-xs text-blue-600">
                {pendingPhotos.size} before photo{pendingPhotos.size > 1 ? 's' : ''} will be uploaded after creation
              </p>
            </div>
          )}

          {/* Total */}
          <div className="flex justify-between items-center border border-emerald-500 rounded-md px-3 py-2.5">
            <span className="text-sm font-medium text-zinc-950">Total</span>
            <div className="text-right">
              {selectedPromo && (
                <p className="font-mono text-xs text-zinc-400 line-through">₱{rawTotal.toFixed(2)}</p>
              )}
              <span className="font-mono font-semibold text-emerald-600">{formatPeso(String(total.toFixed(2)))}</span>
            </div>
          </div>
        </div>
      )}
    </ConfirmDialog>
  );
}
