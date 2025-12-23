"use client";

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js", { updateViaCache: "none" })
          .then((registration) => {
            console.log("Service Worker 등록 성공:", registration.scope);

            // 서비스 워커 업데이트 확인
            registration.addEventListener("updatefound", () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener("statechange", () => {
                  if (
                    newWorker.state === "installed" &&
                    navigator.serviceWorker.controller
                  ) {
                    // 새 서비스 워커가 설치되었고, 현재 페이지가 제어되고 있으면
                    console.log(
                      "새 Service Worker가 설치되었습니다. 페이지를 새로고침하세요."
                    );
                    // 자동으로 새로고침 (선택사항)
                    // window.location.reload();
                  }
                });
              }
            });
          })
          .catch((error) => {
            console.error("Service Worker 등록 실패:", error);
          });

        // 주기적으로 업데이트 확인
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.addEventListener(
            "message",
            (event: Event) => {
              const messageEvent = event as MessageEvent;
              if (
                messageEvent.data &&
                messageEvent.data.type === "SKIP_WAITING"
              ) {
                window.location.reload();
              }
            }
          );
        }
      });
    }
  }, []);

  return null;
}
