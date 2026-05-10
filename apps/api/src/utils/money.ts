const SCALE = Number(process.env.AMOUNT_CONVERSION_RATE ?? 100_000);

export function toScaled(value: string | number): number {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(n)) return 0;
  return Math.round(n * SCALE);
}

export function fromScaled(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0.00';
  return (value / SCALE).toFixed(2);
}
