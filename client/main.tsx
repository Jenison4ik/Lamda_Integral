import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/index.css";

// Отложенная загрузка SpeedInsights для улучшения LCP
const loadSpeedInsights = () => {
  import("@vercel/speed-insights/react").then(({ SpeedInsights }) => {
    const root = document.getElementById("root");
    if (root && !document.querySelector('[data-speed-insights]')) {
      const speedInsightsDiv = document.createElement("div");
      speedInsightsDiv.setAttribute("data-speed-insights", "true");
      root.appendChild(speedInsightsDiv);
      const { createRoot } = ReactDOM;
      createRoot(speedInsightsDiv).render(<SpeedInsights />);
    }
  }).catch(() => {
    // Игнорируем ошибки загрузки SpeedInsights
  });
};

// Загружаем SpeedInsights после первого рендера
if (typeof window !== "undefined") {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(loadSpeedInsights, { timeout: 2000 });
  } else {
    setTimeout(loadSpeedInsights, 2000);
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
