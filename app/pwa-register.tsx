'use client';

import { useEffect } from 'react';

export function PWARegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('Service Worker 등록 성공:', registration.scope);
          })
          .catch((error) => {
            console.log('Service Worker 등록 실패:', error);
          });
      });
    }
  }, []);

  return null;
}







