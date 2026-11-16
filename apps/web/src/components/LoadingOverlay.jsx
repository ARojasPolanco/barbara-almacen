import { useEffect, useState } from 'react';
import { Loader2, Store } from 'lucide-react';
import { subscribeToApiActivity } from '../services/api';

export default function LoadingOverlay() {
  const [pending, setPending] = useState(0);
  const [visible, setVisible] = useState(false);
  const [slow, setSlow] = useState(false);

  useEffect(() => subscribeToApiActivity(setPending), []);

  useEffect(() => {
    if (pending === 0) {
      setVisible(false);
      setSlow(false);
      return undefined;
    }

    if (visible) return undefined;

    const timer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(timer);
  }, [pending, visible]);

  useEffect(() => {
    if (!visible) {
      setSlow(false);
      return undefined;
    }

    const timer = setTimeout(() => setSlow(true), 3500);
    return () => clearTimeout(timer);
  }, [visible]);

  useEffect(() => {
    if (!visible) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-100/90 p-4 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <div className="flex w-full max-w-xs flex-col items-center rounded-3xl border border-stone-200 bg-white px-8 py-10 text-center shadow-2xl">
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-700 text-white">
          <Store className="h-6 w-6 opacity-30" />
          <Loader2 className="absolute h-8 w-8 animate-spin" />
        </div>

        <p className="mt-5 text-sm font-semibold text-stone-900">
          {slow ? 'Despertando la base de datos...' : 'Conectando con el servidor...'}
        </p>
        <p className="mt-1 text-xs text-stone-500">
          {slow ? 'Esto puede tardar unos segundos.' : 'Un momento por favor.'}
        </p>

        <div className="mt-5 h-1 w-32 overflow-hidden rounded-full bg-stone-100">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-emerald-600" />
        </div>
      </div>
    </div>
  );
}
