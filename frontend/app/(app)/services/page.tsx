'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { PlusIcon, TrashIcon, PencilSimpleIcon, CheckIcon, XIcon } from '@phosphor-icons/react';
import { formatPeso } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ServiceForm } from '@/components/forms/service-form';
import {
  useServicesQuery,
  useUpdateServiceMutation,
  useToggleServiceMutation,
  useDeleteServiceMutation,
} from '@/hooks/useServicesQuery';
import type { Service } from '@/lib/types';

interface EditForm {
  name: string;
  type: 'primary' | 'add_on';
  price: string;
}

const EMPTY_EDIT: EditForm = { name: '', type: 'primary', price: '' };

export default function ServicesPage() {
  const searchParams = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<EditForm>(EMPTY_EDIT);

  useEffect(() => {
    if (searchParams.get('new') === '1') setShowForm(true);
  }, [searchParams]);

  const { data: services = [], isLoading } = useServicesQuery();

  const updateMut = useUpdateServiceMutation(() => {
    setEditId(null);
    setForm(EMPTY_EDIT);
  });

  const deleteMut = useDeleteServiceMutation();
  const toggleActive = useToggleServiceMutation();

  const startEdit = (s: Service) => {
    setEditId(s.id);
    setForm({ name: s.name, type: s.type, price: s.price });
    setShowForm(false);
  };

  const cancelEdit = () => {
    setEditId(null);
    setForm(EMPTY_EDIT);
  };

  const primaryServices = (services as Service[]).filter((s) => s.type === 'primary');
  const addonServices = (services as Service[]).filter((s) => s.type === 'add_on');

  const renderSection = (title: string, list: Service[]) => (
    <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden mb-5">
      <div className="px-5 py-3.5 border-b border-zinc-100 bg-zinc-50">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{title}</h2>
      </div>
      {list.length === 0 ? (
        <p className="px-5 py-5 text-sm text-zinc-400">None yet.</p>
      ) : (
        <table className="w-full text-sm">
          <tbody className="divide-y divide-zinc-100">
            {list.map((s) =>
              editId === s.id ? (
                <tr key={s.id} className="bg-blue-50/40">
                  <td className="px-4 py-2.5 w-1/2">
                    <input
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full px-2 py-1 text-sm border border-zinc-200 rounded focus:outline-none focus:border-blue-500"
                    />
                  </td>
                  <td className="px-4 py-2.5 w-32">
                    <select
                      value={form.type}
                      onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'primary' | 'add_on' }))}
                      className="text-sm border border-zinc-200 rounded px-2 py-1 focus:outline-none"
                    >
                      <option value="primary">Primary</option>
                      <option value="add_on">Add-on</option>
                    </select>
                  </td>
                  <td className="px-4 py-2.5 w-28">
                    <input
                      type="number"
                      value={form.price}
                      onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                      className="w-full px-2 py-1 text-sm border border-zinc-200 rounded font-mono focus:outline-none focus:border-blue-500"
                    />
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => updateMut.mutate({ id: editId!, form })}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                      >
                        <CheckIcon size={14} weight="bold" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-1.5 text-zinc-400 hover:bg-zinc-100 rounded transition-colors"
                      >
                        <XIcon size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={s.id} className="hover:bg-zinc-50 group transition-colors">
                  <td className="px-4 py-3">
                    <span className={`font-medium ${s.isActive ? 'text-zinc-950' : 'text-zinc-400 line-through'}`}>
                      {s.name}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-zinc-400">
                      {s.type === 'primary' ? 'Primary' : 'Add-on'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-zinc-700">
                    {formatPeso(s.price)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => toggleActive.mutate({ id: s.id, isActive: !s.isActive })}
                        className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded transition-colors"
                      >
                        {s.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => startEdit(s)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded transition-colors"
                      >
                        <PencilSimpleIcon size={13} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${s.name}"?`)) deleteMut.mutate(s.id);
                        }}
                        className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <TrashIcon size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Services"
        subtitle="Manage the service catalog"
        action={
          <Button onClick={() => { setShowForm((v) => !v); cancelEdit(); }}>
            <PlusIcon size={14} weight="bold" />
            Add Service
          </Button>
        }
      />

      {showForm && (
        <ServiceForm
          onSuccess={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
        />
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-zinc-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : services.length === 0 ? (
        <EmptyState title="No services yet" description="Add your first service to the catalog." />
      ) : (
        <>
          {renderSection('Primary Services', primaryServices)}
          {renderSection('Add-ons', addonServices)}
        </>
      )}
    </div>
  );
}
