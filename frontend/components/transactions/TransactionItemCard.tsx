'use client';

import { type FieldErrors, type UseFormRegister, type UseFormSetValue } from 'react-hook-form';
import { CameraIcon, TrashIcon, XIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import type { Service } from '@/lib/types';
import type { TransactionFormData } from '@/schemas/transaction.schema';

export type PendingPhoto = { file: File; previewUrl: string };

interface TransactionItemCardProps {
  index: number;
  register: UseFormRegister<TransactionFormData>;
  errors: FieldErrors<TransactionFormData>;
  setValue: UseFormSetValue<TransactionFormData>;
  primaryServices: Service[];
  addonServices: Service[];
  primaryServiceId: string;
  addonServiceIds: string[];
  pendingPhoto: PendingPhoto | undefined;
  canRemove: boolean;
  onRemove: () => void;
  onPhotoClick: () => void;
  onRemovePhoto: () => void;
}

export function TransactionItemCard({
  index,
  register,
  errors,
  setValue,
  primaryServices,
  addonServices,
  primaryServiceId,
  addonServiceIds,
  pendingPhoto,
  canRemove,
  onRemove,
  onPhotoClick,
  onRemovePhoto,
}: TransactionItemCardProps) {
  return (
    <div className="p-3 bg-zinc-50 rounded-md space-y-3">
      {/* Shoe description */}
      <div className="flex gap-2 items-start">
        <div className="flex-1 space-y-1">
          <Input
            placeholder="e.g. Nike Air Max 1, White/Black"
            {...register(`items.${index}.shoeDescription`)}
          />
          {errors.items?.[index]?.shoeDescription && (
            <p className="text-xs text-red-500">
              {errors.items[index].shoeDescription?.message}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          className="w-9 h-9 flex items-center justify-center rounded-md bg-red-400 text-white hover:bg-red-500 transition-colors disabled:opacity-30 shrink-0"
        >
          <TrashIcon size={14} />
        </button>
      </div>

      {/* Before photo */}
      {pendingPhoto ? (
        <div className="flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={onPhotoClick}
            className="flex items-center gap-2.5 flex-1 min-w-0 p-2 bg-white border border-zinc-200 rounded-md hover:border-zinc-300 transition-colors text-left"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pendingPhoto.previewUrl}
              alt="Before preview"
              className="w-10 h-10 rounded object-cover shrink-0"
            />
            <div>
              <p className="text-xs font-medium text-zinc-700">Before photo selected</p>
              <p className="text-xs text-zinc-400">Tap to change</p>
            </div>
          </button>
          <button
            type="button"
            onClick={onRemovePhoto}
            className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 transition-colors shrink-0"
            title="Remove photo"
          >
            <XIcon size={14} weight="bold" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onPhotoClick}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 bg-white border border-dashed border-zinc-300 rounded-md hover:border-blue-400 hover:bg-blue-50 transition-colors group"
        >
          <div className="w-7 h-7 rounded bg-zinc-100 group-hover:bg-blue-100 flex items-center justify-center shrink-0 transition-colors">
            <CameraIcon size={15} className="text-zinc-400 group-hover:text-blue-500 transition-colors" />
          </div>
          <span className="text-xs font-medium text-zinc-500 group-hover:text-blue-600 transition-colors">
            Upload photo
          </span>
        </button>
      )}

      {/* Primary service picker */}
      <div>
        <span className="text-xs font-medium text-zinc-500 block mb-1.5">Primary Service</span>
        {primaryServices.length === 0 ? (
          <p className="text-xs text-zinc-400">No primary services available.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {primaryServices.map((s) => {
              const selected = primaryServiceId === String(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setValue(`items.${index}.primaryServiceId`, selected ? '' : String(s.id))}
                  className={cn(
                    'inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md border transition-colors duration-100',
                    selected
                      ? 'bg-zinc-950 text-white border-zinc-950'
                      : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50',
                  )}
                >
                  {s.name}
                  <span className={cn('font-mono', selected ? 'opacity-60' : 'text-zinc-400')}>
                    ₱{parseFloat(s.price).toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        {errors.items?.[index]?.primaryServiceId && (
          <p className="text-xs text-red-500 mt-1">
            {errors.items[index].primaryServiceId?.message}
          </p>
        )}
      </div>

      {/* Add-on picker */}
      {addonServices.length > 0 && (
        <div>
          <span className="text-xs font-medium text-zinc-500 block mb-1.5">Add-ons</span>
          <div className="flex flex-wrap gap-1.5">
            {addonServices.map((s) => {
              const selected = addonServiceIds.includes(String(s.id));
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    const next = selected
                      ? addonServiceIds.filter((id) => id !== String(s.id))
                      : [...addonServiceIds, String(s.id)];
                    setValue(`items.${index}.addonServiceIds`, next);
                  }}
                  className={cn(
                    'inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md border transition-colors duration-100',
                    selected
                      ? 'bg-zinc-700 text-white border-zinc-700'
                      : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50',
                  )}
                >
                  {s.name}
                  <span className={cn('font-mono', selected ? 'opacity-60' : 'text-zinc-400')}>
                    +₱{parseFloat(s.price).toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
