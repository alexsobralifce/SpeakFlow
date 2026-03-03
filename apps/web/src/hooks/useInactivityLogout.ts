"use client";
import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * useInactivityLogout
 * Watches mouse/keyboard/touch activity. If the user does nothing for
 * INACTIVITY_TIMEOUT_MS, calls the logout API and redirects to /login.
 */
export function useInactivityLogout() {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (_) { }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('speakflow_user');
      localStorage.removeItem('speakflow_level');
      localStorage.removeItem('speakflow_topic');
    }
    router.replace('/login?reason=inactivity');
  }, [router]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(logout, INACTIVITY_TIMEOUT_MS);
  }, [logout]);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'pointerdown', 'touchstart', 'scroll', 'click'];
    events.forEach(ev => window.addEventListener(ev, resetTimer, { passive: true }));
    resetTimer(); // start immediately

    return () => {
      events.forEach(ev => window.removeEventListener(ev, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resetTimer]);
}
