import { useEffect, useState } from 'react';

export function useCountdown(expiresAt: number | null): string {
  const [remaining, setRemaining] = useState<string>('');

  useEffect(() => {
    if (!expiresAt) {
      setRemaining('No active access');
      return;
    }

    const update = () => {
      const diff = expiresAt - Date.now();
      if (diff <= 0) {
        setRemaining('Expired');
        return;
      }
      const hrs = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setRemaining(`${hrs}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`);
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  return remaining;
}
