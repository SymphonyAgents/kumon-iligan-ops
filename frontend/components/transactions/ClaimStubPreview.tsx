'use client';

import { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { formatDate, formatPeso } from '@/lib/utils';
import { toTitleCase } from '@/utils/text';
import type { Transaction } from '@/lib/types';

interface ClaimStubPreviewProps {
  txn: Transaction;
}

export const ClaimStubPreview = forwardRef<HTMLDivElement, ClaimStubPreviewProps>(
  function ClaimStubPreview({ txn }, ref) {
    const balance = parseFloat(txn.total) - parseFloat(txn.paid);
    const items = txn.items ?? [];

    return (
      <div ref={ref} className="font-mono text-xs border border-zinc-200 rounded-md p-4 space-y-3 bg-zinc-50">
        <div className="text-center pb-3 border-b border-zinc-300">
          <p className="font-bold text-sm tracking-widest">SNEAKER DOCTOR</p>
          <p className="text-zinc-500 text-[10px] tracking-wider">CLAIM STUB</p>
        </div>

        <p className="text-center text-xl font-bold tracking-wide">#{txn.number}</p>

        <div className="border-t border-dashed border-zinc-300 pt-3 space-y-1">
          <div className="flex justify-between">
            <span className="text-zinc-500">Customer</span>
            <span>{toTitleCase(txn.customerName) || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Phone</span>
            <span>{txn.customerPhone || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Pickup</span>
            <span>{formatDate(txn.pickupDate)}</span>
          </div>
        </div>

        {items.length > 0 && (
          <div className="border-t border-dashed border-zinc-300 pt-3 space-y-1">
            {items.map((item, i) => (
              <div key={item.id} className="flex justify-between">
                <span className="text-zinc-500 truncate max-w-[160px]">{i + 1}. {item.shoeDescription || 'Item'}</span>
                <span>{formatPeso(item.price ?? '0')}</span>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-dashed border-zinc-300 pt-3 space-y-1">
          <div className="flex justify-between">
            <span className="text-zinc-500">Total</span>
            <span>{formatPeso(txn.total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Paid</span>
            <span className="text-emerald-700">{formatPeso(txn.paid)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Balance</span>
            <span className={balance > 0 ? 'text-red-600' : 'text-emerald-700'}>
              {balance <= 0 ? 'Fully Paid' : formatPeso(balance)}
            </span>
          </div>
        </div>

        <div className="flex justify-center pt-1">
          <QRCodeSVG value={txn.number} size={96} />
        </div>
        <p className="text-center text-zinc-400 text-[10px]">Present this stub when claiming your shoes.</p>
      </div>
    );
  }
);
