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
    const logoUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/sneaker-doc-logo.png`
      : '/sneaker-doc-logo.png';

    const activeItems = items.filter((i) => i.status !== 'cancelled');
    const isPartialClaim = activeItems.length > 0 && activeItems.some((i) => i.status !== 'claimed');

    return (
      <div
        ref={ref}
        className="font-mono text-[11px] bg-white w-[280px] border border-zinc-200 rounded-md overflow-hidden"
      >
        {/* Header: Logo + QR only — no text */}
        <div className="flex flex-col items-center pt-4 pb-3 px-4 border-b border-zinc-200 gap-2">
          <img
            src={logoUrl}
            alt="Sneaker Doctor"
            width={48}
            height={48}
            className="object-contain"
            style={{ display: 'block' }}
          />
          <QRCodeSVG value={txn.number} size={72} level="M" />
          <p className="text-[10px] text-zinc-400 font-mono tracking-wider">#{txn.number}</p>
          <p className="text-zinc-500 text-[10px] tracking-widest uppercase">
            {isPartialClaim ? 'Partial Claim Stub' : 'Claim Stub'}
          </p>
        </div>
        {isPartialClaim && (
          <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 text-center">
            <p className="text-[10px] text-amber-700 font-medium uppercase tracking-wider">
              Partial — {activeItems.filter((i) => i.status === 'claimed').length} of {activeItems.length} item{activeItems.length !== 1 ? 's' : ''} claimed
            </p>
          </div>
        )}

        {/* Customer info */}
        <div className="px-4 py-3 border-b border-dashed border-zinc-200 space-y-1">
          <div className="flex justify-between gap-2">
            <span className="text-zinc-400">Customer</span>
            <span className="text-right">{toTitleCase(txn.customerName) || '—'}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-zinc-400">Phone</span>
            <span>{txn.customerPhone || '—'}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-zinc-400">Pickup</span>
            <span>{formatDate(txn.newPickupDate ?? txn.pickupDate)}</span>
          </div>
        </div>

        {/* Items */}
        {items.length > 0 && (
          <div className="px-4 py-3 border-b border-dashed border-zinc-200 space-y-1.5">
            {activeItems.length > 1 && (
              <p className="text-[10px] text-zinc-400 uppercase tracking-widest mb-1">
                {activeItems.length} items
              </p>
            )}
            {items.map((item) => {
              const cancelled = item.status === 'cancelled';
              const notYetClaimed = isPartialClaim && !cancelled && item.status !== 'claimed';
              return (
                <div key={item.id} className="flex justify-between gap-2">
                  <span className={
                    cancelled ? 'text-zinc-300 line-through truncate'
                    : notYetClaimed ? 'text-zinc-300 truncate'
                    : 'text-zinc-500 truncate'
                  }>
                    • {item.shoeDescription || 'Item'}
                    {notYetClaimed && <span className="ml-1 text-[9px] uppercase tracking-wider">(pending)</span>}
                  </span>
                  <span className={`shrink-0 ${cancelled || notYetClaimed ? 'text-zinc-300' : ''}`}>
                    {formatPeso(item.price ?? '0')}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Totals */}
        <div className="px-4 py-3 border-b border-dashed border-zinc-200 space-y-1">
          <div className="flex justify-between gap-2">
            <span className="text-zinc-400">Total</span>
            <span>{formatPeso(txn.total)}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-zinc-400">Paid</span>
            <span className="text-emerald-700">{formatPeso(txn.paid)}</span>
          </div>
          <div className="flex justify-between gap-2 font-semibold">
            <span>Balance</span>
            <span className={balance > 0 ? 'text-red-600' : 'text-emerald-700'}>
              {balance <= 0 ? 'Fully Paid' : formatPeso(balance)}
            </span>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-zinc-400 text-[10px] py-3 px-4">
          Present this stub when claiming your shoes.
        </p>
      </div>
    );
  },
);
