'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { api, ApiError } from '@/lib/api';

interface QrScanDialogProps {
  open: boolean;
  onClose: () => void;
}

export function QrScanDialog({ open, onClose }: QrScanDialogProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);

  const [mode, setMode] = useState<'camera' | 'manual'>('camera');
  const [cameraActive, setCameraActive] = useState(false);
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async (userInitiated = false) => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;

      // Wait for video element to be ready
      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((t) => t.stop());
        setMode('manual');
        return;
      }

      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');

      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = reject;
        setTimeout(reject, 5000); // 5s timeout
      });

      await video.play();
      setCameraActive(true);
      startScanning(video);
    } catch (err) {
      const isDenied =
        err instanceof DOMException &&
        (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError');
      if (userInitiated && isDenied) {
        setError('Camera access was denied. Allow camera access in your browser settings.');
      } else {
        setMode('manual');
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startScanning(video: HTMLVideoElement) {
    // Use BarcodeDetector if available (Chrome/Android), else canvas-based fallback
    if ('BarcodeDetector' in window) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      const tick = async () => {
        if (!video || video.readyState < 2) {
          animFrameRef.current = requestAnimationFrame(tick);
          return;
        }
        try {
          const barcodes = await detector.detect(video);
          if (barcodes.length > 0) {
            await handleResult(barcodes[0].rawValue);
            return;
          }
        } catch { /* continue */ }
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
    } else {
      // Canvas-based fallback for Safari
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const tick = async () => {
        if (!video || video.readyState < 2 || !ctx) {
          animFrameRef.current = requestAnimationFrame(tick);
          return;
        }
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        try {
          // Dynamically import jsQR as a canvas-based fallback
          const jsQR = (await import('jsqr')).default;
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            await handleResult(code.data);
            return;
          }
        } catch { /* continue */ }
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
    }
  }

  async function handleResult(number: string) {
    stopCamera();
    setLoading(true);
    setError('');
    try {
      const txn = await api.transactions.getByNumber(number.trim());
      onClose();
      router.push(`/transactions/${txn.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError(`Transaction "${number.trim()}" not found.`);
      } else {
        setError('Failed to look up transaction. Try again.');
      }
      setMode('manual');
      setValue(number.trim());
      setTimeout(() => inputRef.current?.focus(), 50);
    } finally {
      setLoading(false);
    }
  }

  // Start camera with a small delay to let the dialog finish mounting
  useEffect(() => {
    if (open) {
      setValue('');
      setError('');
      setMode('camera');
      const timer = setTimeout(() => startCamera(), 300);
      return () => clearTimeout(timer);
    } else {
      stopCamera();
    }
  }, [open, startCamera, stopCamera]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    await handleResult(value);
  }

  function switchToManual() {
    stopCamera();
    setMode('manual');
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function switchToCamera() {
    setValue('');
    setError('');
    setMode('camera');
    setTimeout(() => startCamera(true), 100);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !loading) onClose(); }}>
      <DialogContent className="bg-white sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Scan QR Code</DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            {mode === 'camera'
              ? 'Point camera at the claim stub QR code.'
              : 'Enter the transaction number printed on the claim stub.'}
          </DialogDescription>
        </DialogHeader>

        {/* Camera view — always rendered so videoRef is always in DOM */}
        <div className={mode === 'camera' ? 'block' : 'hidden'}>
          <div className="relative bg-zinc-950 rounded-lg overflow-hidden aspect-square w-full">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
              autoPlay
            />
            {cameraActive && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 relative">
                  <div className="absolute top-0 left-0 w-7 h-7 border-t-[3px] border-l-[3px] border-white rounded-tl-sm" />
                  <div className="absolute top-0 right-0 w-7 h-7 border-t-[3px] border-r-[3px] border-white rounded-tr-sm" />
                  <div className="absolute bottom-0 left-0 w-7 h-7 border-b-[3px] border-l-[3px] border-white rounded-bl-sm" />
                  <div className="absolute bottom-0 right-0 w-7 h-7 border-b-[3px] border-r-[3px] border-white rounded-br-sm" />
                </div>
              </div>
            )}
            {loading && (
              <div className="absolute inset-0 bg-zinc-950/60 flex items-center justify-center">
                <Spinner className="text-white" />
              </div>
            )}
            {!cameraActive && !loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Spinner className="text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Manual input */}
        {mode === 'manual' && (
          <form onSubmit={handleSubmit} className="space-y-3 pt-1">
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => { setValue(e.target.value); setError(''); }}
              placeholder="e.g. 0001"
              className="w-full px-3 py-3 text-base font-mono text-center bg-white border border-zinc-200 rounded-md text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              autoComplete="off"
              spellCheck={false}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <Button
              type="submit"
              variant="dark"
              size="sm"
              className="w-full"
              disabled={!value.trim() || loading}
            >
              {loading ? <Spinner /> : 'Find Transaction'}
            </Button>
          </form>
        )}

        {error && mode === 'camera' && (
          <p className="text-xs text-red-500 text-center -mt-1">{error}</p>
        )}

        <button
          type="button"
          onClick={mode === 'camera' ? switchToManual : switchToCamera}
          className="text-xs text-zinc-400 hover:text-zinc-600 text-center w-full transition-colors"
        >
          {mode === 'camera' ? 'Enter number manually' : 'Use camera instead'}
        </button>
      </DialogContent>
    </Dialog>
  );
}
