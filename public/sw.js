const CACHE_NAME = 'bathlance-v3'; // 캐시 버전 업데이트 (새 서비스 워커 적용을 위해)
const urlsToCache = [
  '/',
  '/manifest.json',
];

// 설치 이벤트
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('새 캐시 열림:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
  );
  // 즉시 새 서비스 워커 활성화
  self.skipWaiting();
});

// 활성화 이벤트
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('이전 캐시 삭제:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // 모든 클라이언트에 즉시 새 서비스 워커 적용
      return self.clients.claim();
    })
  );
});

// 네트워크 요청 가로채기
self.addEventListener('fetch', (event) => {
  // Chrome 확장 프로그램 요청은 캐시하지 않음
  if (event.request.url.startsWith('chrome-extension://') ||
      event.request.url.startsWith('chrome://') ||
      event.request.url.startsWith('moz-extension://') ||
      event.request.url.startsWith('safari-extension://')) {
    return;
  }

  // Clerk 인증 요청 및 API 요청은 서비스 워커를 거치지 않고 직접 네트워크로 전달
  if (event.request.url.includes('clerk') || 
      event.request.url.includes('api') ||
      event.request.method !== 'GET') {
    // 명시적으로 네트워크 요청을 전달하여 서비스 워커가 방해하지 않도록 함
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 캐시에 있으면 캐시 반환, 없으면 네트워크 요청
        if (response) {
          return response;
        }
        return fetch(event.request).then((response) => {
          // 유효한 응답만 캐시
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Chrome 확장 프로그램 응답은 캐시하지 않음
          if (event.request.url.startsWith('chrome-extension://') ||
              event.request.url.startsWith('chrome://') ||
              event.request.url.startsWith('moz-extension://') ||
              event.request.url.startsWith('safari-extension://')) {
            return response;
          }
          
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          return response;
        });
      })
  );
});

// 푸시 알림 (나중에 사용)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : '새로운 알림이 있어요!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  event.waitUntil(
    self.registration.showNotification('🛁 배슬랜스', options)
  );
});







