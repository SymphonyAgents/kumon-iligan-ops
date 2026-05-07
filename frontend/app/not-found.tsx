import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <p className="font-mono text-6xl font-semibold text-foreground mb-2">404</p>
      <p className="text-sm text-muted-foreground mb-6">This page doesn&apos;t exist.</p>
      <Link
        href="/"
        className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors duration-150"
      >
        Go home
      </Link>
    </div>
  );
}
