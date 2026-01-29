import { Suspense, lazy } from "react";
import { init } from "@tma.js/sdk-react";
import MiniApp from "./pages/MiniApp";
import { AppProvider } from "./providers/AppContex";

// Ленивая загрузка страниц для разделения на отдельные бандлы
const AdminPanel = lazy(() => import("./pages/Admin"));
const NonTg = lazy(() => import("./pages/NonTg"));

function App() {
  const isAdminRoute =
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/admin");

  if (isAdminRoute) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
            <p>Загрузка админ-панели...</p>
          </div>
        }
      >
        <AdminPanel />
      </Suspense>
    );
  }

  try {
    init();
  } catch (e) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
            <p>Загрузка...</p>
          </div>
        }
      >
        <NonTg />
      </Suspense>
    );
  }

  // Получаем параметры запуска, которые содержат данные пользователя

  return (
    <AppProvider>
      <MiniApp />
    </AppProvider>
  );
}

export default App;
