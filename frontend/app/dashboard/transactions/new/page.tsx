'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { PlusIcon, TrashIcon, ArrowLeftIcon } from '@phosphor-icons/react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import type { Service } from '@/lib/types';

interface ItemDraft {
  shoeDescription: string;
  serviceId: string;
  status: string;
}

export default function NewTransactionPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '' });
  const [pickupDate, setPickupDate] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [items, setItems] = useState<ItemDraft[]>([
    { shoeDescription: '', serviceId: '', status: 'pending' },
  ]);

  const { data: services = [] } = useQuery({
    queryKey: ['services', 'active'],
    queryFn: () => api.services.list(true),
  });

  const primaryServices = services.filter((s: Service) => s.type === 'primary');
  const addonServices = services.filter((s: Service) => s.type === 'add_on');

  const calcTotal = () => {
    return items.reduce((sum, item) => {
      if (!item.serviceId) return sum;
      const svc = services.find((s: Service) => s.id === parseInt(item.serviceId, 10));
      return sum + (svc ? parseFloat(svc.price) : 0);
    }, 0);
  };

  const createMut = useMutation({
    mutationFn: () =>
      api.transactions.create({
        customerName: customer.name || undefined,
        customerPhone: customer.phone || undefined,
        customerEmail: customer.email || undefined,
        pickupDate: pickupDate || undefined,
        total: String(calcTotal()),
        paid: '0',
        items: items
          .filter((i) => i.shoeDescription || i.serviceId)
          .map((i) => {
            const svc = i.serviceId
              ? services.find((s: Service) => s.id === parseInt(i.serviceId, 10))
              : null;
            return {
              shoeDescription: i.shoeDescription || undefined,
              serviceId: i.serviceId ? parseInt(i.serviceId, 10) : undefined,
              status: i.status,
              price: svc ? svc.price : undefined,
            };
          }),
      }),
    onSuccess: (txn) => router.push(`/dashboard/transactions/${txn.id}`),
  });

  const addItem = () =>
    setItems((prev) => [...prev, { shoeDescription: '', serviceId: '', status: 'pending' }]);

  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const updateItem = (idx: number, field: keyof ItemDraft, value: string) =>
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));

  const total = calcTotal();

  return (
    <div>
      <PageHeader
        title="New Transaction"
        action={
          <Link href="/dashboard/transactions">
            <Button variant="ghost" size="sm">
              <ArrowLeftIcon size={14} />
              Back
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-3 gap-8">
        {/* Main form */}
        <div className="col-span-2 space-y-6">
          {/* Customer info */}
          <div className="bg-white border border-zinc-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-zinc-950 mb-4">Customer</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Input
                  label="Name"
                  id="name"
                  placeholder="Juan dela Cruz"
                  value={customer.name}
                  onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))}
                />
              </div>
              <Input
                label="Phone"
                id="phone"
                placeholder="09XX XXX XXXX"
                value={customer.phone}
                onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))}
              />
              <Input
                label="Email"
                id="email"
                type="email"
                placeholder="juan@example.com"
                value={customer.email}
                onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))}
              />
            </div>
          </div>

          {/* Items */}
          <div className="bg-white border border-zinc-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-zinc-950">Shoes & Services</h2>
              <Button variant="ghost" size="sm" onClick={addItem}>
                <PlusIcon size={13} weight="bold" />
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end p-3 bg-zinc-50 rounded-md"
                >
                  <Input
                    label={idx === 0 ? 'Shoe Description' : undefined}
                    placeholder="e.g. Nike Air Max 1, White/Black"
                    value={item.shoeDescription}
                    onChange={(e) => updateItem(idx, 'shoeDescription', e.target.value)}
                  />
                  <Select
                    label={idx === 0 ? 'Service' : undefined}
                    value={item.serviceId}
                    onChange={(e) => updateItem(idx, 'serviceId', e.target.value)}
                  >
                    <option value="">— Select service —</option>
                    {primaryServices.length > 0 && (
                      <optgroup label="Primary">
                        {primaryServices.map((s: Service) => (
                          <option key={s.id} value={s.id}>
                            {s.name} — ₱{parseFloat(s.price).toFixed(2)}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {addonServices.length > 0 && (
                      <optgroup label="Add-ons">
                        {addonServices.map((s: Service) => (
                          <option key={s.id} value={s.id}>
                            {s.name} — ₱{parseFloat(s.price).toFixed(2)}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </Select>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    disabled={items.length === 1}
                    className="p-2 text-zinc-400 hover:text-red-500 transition-colors disabled:opacity-30"
                  >
                    <TrashIcon size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          <div className="bg-white border border-zinc-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-zinc-950 mb-4">Details</h2>
            <div className="space-y-4">
              <Input
                label="Pickup Date"
                id="pickup"
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
              />
              <Input
                label="Promo Code"
                id="promo"
                placeholder="SAVE20"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-zinc-950 mb-3">Summary</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">Items</span>
                <span className="font-mono text-zinc-950">{items.filter((i) => i.serviceId).length}</span>
              </div>
              <div className="flex items-center justify-between text-sm border-t border-zinc-100 pt-2">
                <span className="font-medium text-zinc-950">Total</span>
                <span className="font-mono font-semibold text-zinc-950">
                  ₱{total.toFixed(2)}
                </span>
              </div>
            </div>

            <Button
              className="w-full mt-4"
              disabled={createMut.isPending}
              onClick={() => createMut.mutate()}
            >
              {createMut.isPending ? 'Creating...' : 'Create Transaction'}
            </Button>

            {createMut.isError && (
              <p className="text-xs text-red-500 mt-2">{createMut.error.message}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
