import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register Service Worker for PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const swPath = `${process.env.PUBLIC_URL || ""}/service-worker.js`;
    navigator.serviceWorker
      .register(swPath)
      .then((registration) => {
        console.log(
          "Service Worker registered successfully:",
          registration.scope
        );

        // 定期檢查更新（每小時檢查一次）
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // 每小時檢查一次

        // 檢查是否有更新
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                // 有新版本可用
                console.log("New version available!");
                // 自動更新，不詢問用戶
                newWorker.postMessage({ type: "SKIP_WAITING" });
              }
            });
          }
        });

        // 手動檢查更新（頁面可見時）
        document.addEventListener("visibilitychange", () => {
          if (!document.hidden) {
            registration.update();
          }
        });
      })
      .catch((error) => {
        console.log("Service Worker registration failed:", error);
      });

    // 監聽 Service Worker 更新
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
