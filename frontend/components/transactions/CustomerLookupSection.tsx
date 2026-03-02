'use client';

import { useState } from 'react';
import {
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
  useWatch,
} from 'react-hook-form';
import { ArrowLeftIcon, ArrowRightIcon } from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import type { Customer } from '@/lib/types';
import type { TransactionFormData } from '@/schemas/transaction.schema';

interface CustomerLookupSectionProps {
  register: UseFormRegister<TransactionFormData>;
  errors: FieldErrors<TransactionFormData>;
  setValue: UseFormSetValue<TransactionFormData>;
  control: Control<TransactionFormData>;
  step: 'phone' | 'details';
  existingCustomer: Customer | null | undefined;
  onCustomerResolved: (customer: Customer | null) => void;
  onChangePhone: () => void;
}

export function CustomerLookupSection({
  register,
  errors,
  setValue,
  control,
  step,
  existingCustomer,
  onCustomerResolved,
  onChangePhone,
}: CustomerLookupSectionProps) {
  const [lookingUp, setLookingUp] = useState(false);
  const phoneValue = useWatch({ control, name: 'customerPhone' }) ?? '';

  async function handleFindCustomer() {
    if (phoneValue.length < 11) return;
    setLookingUp(true);
    try {
      const customer = await api.customers.findByPhone(phoneValue);
      if (customer) {
        if (customer.name) setValue('customerName', customer.name);
        if (customer.email) setValue('customerEmail', customer.email);
      } else {
        setValue('customerName', '');
        setValue('customerEmail', '');
      }
      onCustomerResolved(customer);
    } catch {
      setValue('customerName', '');
      setValue('customerEmail', '');
      onCustomerResolved(null);
    } finally {
      setLookingUp(false);
    }
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        {step === 'details' && (
          <button
            type="button"
            onClick={onChangePhone}
            className="p-1.5 text-zinc-500 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200 rounded-md transition-colors"
            title="Change number"
          >
            <ArrowLeftIcon size={13} weight="bold" />
          </button>
        )}
        <h2 className="text-sm font-semibold text-zinc-950">Customer</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {step === 'phone' ? (
          <div className="col-span-2 flex flex-col gap-1.5">
            <span className="text-xs font-medium text-zinc-700">Phone number</span>
            <div className="flex gap-2">
              <Input
                placeholder="09XX XXX XXXX"
                className="flex-1 w-full"
                {...register('customerPhone')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleFindCustomer();
                  }
                }}
              />
              <Button
                type="button"
                variant="dark"
                size="sm"
                disabled={phoneValue.length !== 11 || lookingUp}
                onClick={handleFindCustomer}
                className="shrink-0"
              >
                {lookingUp ? <Spinner /> : <ArrowRightIcon size={14} weight="bold" />}
              </Button>
            </div>
            {errors.customerPhone && (
              <p className="text-xs text-red-500">{errors.customerPhone.message}</p>
            )}
          </div>
        ) : (
          <>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Input
                label="Name"
                placeholder="Juan dela Cruz"
                {...register('customerName')}
              />
              {errors.customerName && (
                <p className="text-xs text-red-500">{errors.customerName.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-zinc-700">Phone</span>
              <Input
                placeholder="09XX XXX XXXX"
                className="w-full"
                readOnly
                {...register('customerPhone')}
              />
              {existingCustomer
                ? <p className="text-xs text-emerald-600">Existing customer</p>
                : <p className="text-xs text-zinc-400">New customer</p>
              }
            </div>
            <div className="flex flex-col gap-1.5">
              <Input
                label="Email"
                type="email"
                placeholder="juan@example.com"
                {...register('customerEmail')}
              />
              {errors.customerEmail && (
                <p className="text-xs text-red-500">{errors.customerEmail.message}</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
