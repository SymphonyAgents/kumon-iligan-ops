'use client';

import { useRef } from 'react';
import { toPng } from 'html-to-image';
import { QRCodeCanvas } from 'qrcode.react';
import { PrinterIcon, EnvelopeIcon, ArrowRightIcon } from '@phosphor-icons/react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatDate, formatPeso } from '@/lib/utils';
import { toTitleCase } from '@/utils/text';
import { generateClaimStubEmailLink, openLinkReliably } from '@/utils/email';
import { ClaimStubPreview } from '@/components/transactions/ClaimStubPreview';
import type { Transaction } from '@/lib/types';

interface ClaimStubDialogProps {
  open: boolean;
  txn: Transaction | null;
  onViewTransaction: () => void;
}

export function ClaimStubDialog({ open, txn, onViewTransaction }: ClaimStubDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stubRef = useRef<HTMLDivElement>(null);

  if (!txn) return null;

  const balance = parseFloat(txn.total) - parseFloat(txn.paid);
  const items = txn.items ?? [];

  function handlePrint() {
    const qrDataUrl = (canvasRef.current as HTMLCanvasElement | null)?.toDataURL() ?? '';
    const win = window.open('', '_blank', 'width=400,height=700');
    if (!win) return;

    win.document.write(`<!DOCTYPE html>
<html><head>
  <title>Claim Stub — #${txn!.number}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Courier New', monospace; font-size: 12px; padding: 24px; color: #000; }
    .stub { max-width: 280px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 2px solid #000; }
    .header h1 { font-size: 15px; font-weight: bold; letter-spacing: 2px; }
    .header h2 { font-size: 10px; margin-top: 2px; font-weight: normal; letter-spacing: 1px; }
    .txn-num { font-size: 18px; font-weight: bold; text-align: center; margin: 12px 0; }
    .section { margin: 10px 0; }
    .row { display: flex; justify-content: space-between; margin: 3px 0; }
    .label { color: #555; }
    .divider { border-top: 1px dashed #000; margin: 8px 0; }
    .bold { font-weight: bold; }
    .qr { display: flex; justify-content: center; margin: 14px 0; }
    .footer { text-align: center; font-size: 10px; color: #555; margin-top: 8px; }
  </style>
</head><body>
  <div class="stub">
    <div class="header">
      <h1>SNEAKER DOCTOR</h1>
      <h2>CLAIM STUB</h2>
    </div>
    <div class="txn-num">#${txn!.number}</div>
    <div class="divider"></div>
    <div class="section">
      <div class="row"><span class="label">Customer</span><span>${toTitleCase(txn!.customerName) || '—'}</span></div>
      <div class="row"><span class="label">Phone</span><span>${txn!.customerPhone || '—'}</span></div>
      <div class="row"><span class="label">Pickup Date</span><span>${formatDate(txn!.pickupDate)}</span></div>
    </div>
    <div class="divider"></div>
    <div class="section">
      ${items.map((item, i) => `<div class="row"><span class="label">${i + 1}. ${item.shoeDescription || 'Item'}</span><span>${formatPeso(item.price ?? '0')}</span></div>`).join('')}
    </div>
    <div class="divider"></div>
    <div class="section">
      <div class="row"><span class="label">Total</span><span>${formatPeso(txn!.total)}</span></div>
      <div class="row"><span class="label">Paid</span><span>${formatPeso(txn!.paid)}</span></div>
      <div class="row bold"><span>Balance</span><span>${balance <= 0 ? 'Fully Paid' : formatPeso(balance)}</span></div>
    </div>
    <div class="qr"><img src="${qrDataUrl}" width="120" height="120" /></div>
    <div class="footer">Present this stub when claiming your shoes.</div>
  </div>
  <script>window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); }</script>
</body></html>`);
    win.document.close();
  }

  const emailLink = txn.customerEmail ? generateClaimStubEmailLink(txn) : null;

  function handleEmail() {
    if (!emailLink || !stubRef.current) return;

    // Open compose window first (synchronous — must be in the gesture handler)
    openLinkReliably(emailLink);

    // Use the Promise form of ClipboardItem so the browser holds the user gesture
    // context while toPng renders. Without this, iOS revokes gesture permission
    // before clipboard.write() is called, causing a silent failure.
    const stub = stubRef.current;
    navigator.clipboard
      .write([
        new ClipboardItem({
          'image/png': toPng(stub, { pixelRatio: 2 }).then(async (dataUrl) => {
            const res = await fetch(dataUrl);
            return res.blob();
          }),
        }),
      ])
      .then(() => {
        toast.success('Stub image copied', { description: 'Paste into the email body' });
      })
      .catch(() => {
        // Clipboard API not supported on this device/browser — user can screenshot instead
      });
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="bg-white sm:max-w-sm overflow-y-auto max-h-[90vh]" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-base">Claim Stub</DialogTitle>
        </DialogHeader>

        {/* Hidden canvas used only for print (toDataURL) */}
        <QRCodeCanvas
          ref={canvasRef as React.Ref<HTMLCanvasElement>}
          value={txn.number}
          size={160}
          className="hidden absolute"
        />

        {/* Receipt preview */}
        <div className="flex justify-center">
          <ClaimStubPreview ref={stubRef} txn={txn} />
        </div>

        <div className="flex flex-col gap-2 mt-2">
          <div className="flex gap-2">
            <Button variant="dark" size="sm" className="flex-1" onClick={handlePrint}>
              <PrinterIcon size={13} />
              Print
            </Button>
            {emailLink && (
              <button
                type="button"
                onClick={handleEmail}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium border border-zinc-200 rounded-md text-zinc-700 hover:bg-zinc-50 transition-colors duration-150"
              >
                <EnvelopeIcon size={13} />
                Email
              </button>
            )}
          </div>
          <Button variant="ghost" size="sm" className="w-full" onClick={onViewTransaction}>
            View Transaction
            <ArrowRightIcon size={13} />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
