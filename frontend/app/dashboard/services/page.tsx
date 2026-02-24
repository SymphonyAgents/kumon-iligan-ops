'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusIcon, TrashIcon, PencilSimpleIcon, CheckIcon, XIcon } from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { formatPeso } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import type { Service } from '@/lib/types';

interface ServiceForm {
  name: string;
  type: 'primary' | 'add_on';
  price: string;
}

const EMPTY_FORM: ServiceForm = { name: '', type: 'primary', price: '' };

export default function ServicesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ServiceForm>(EMPTY_FORM);

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => api.services.list(),
  });

  const createMut = useMutation({
    mutationFn: () => api.services.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
      setShowForm(false);
      setForm(EMPTY_FORM);
    },
  });

  const updateMut = useMutation({
    mutationFn: () => api.services.update(editId!, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
      setEditId(null);
      setForm(EMPTY_FORM);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.services.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      api.services.update(id, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  });

  const startEdit = (s: Service) => {
    setEditId(s.id);
    setForm({ name: s.name, type: s.type, price: s.price });
    setShowForm(false);
  };

  const cancelEdit = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
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
                        onClick={() => updateMut.mutate()}
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
        <div className="bg-white border border-zinc-200 rounded-lg p-5 mb-6">
          <h3 className="text-sm font-semibold text-zinc-950 mb-4">New Service</h3>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Service Name"
              placeholder="e.g. Basic Clean"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <Select
              label="Type"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'primary' | 'add_on' }))}
            >
              <option value="primary">Primary</option>
              <option value="add_on">Add-on</option>
            </Select>
            <Input
              label="Price (₱)"
              type="number"
              placeholder="0.00"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              className="font-mono"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <Button disabled={createMut.isPending || !form.name || !form.price} onClick={() => createMut.mutate()}>
              {createMut.isPending ? 'Saving...' : 'Save Service'}
            </Button>
            <Button variant="ghost" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}>
              Cancel
            </Button>
          </div>
        </div>
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
