import { useAppContext } from "@/providers/AppContex";
import { useUsersInit } from "@/hooks/useUsersInit";
import { useEffect, useMemo, Suspense, lazy, useState } from "react";
import { swipeBehavior, useLaunchParams, viewport } from "@tma.js/sdk-react";

import "./style.css";
import LoadScreen from "./LoadScreen";

// Lazy-загрузка экранов
const MainScreen = lazy(() => import("./MainScreen"));
const QuizSettings = lazy(() => import("./QuizSettings"));
const QuizScreen = lazy(() => import("./QuizScreen"));
const ResultScreen = lazy(() => import("./ResultScreen"));

// Фолбэк для неизвестного состояния
function FallbackScreen() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-4">Заглушка</h1>
      <p className="text-muted-foreground">
        Компонент для этого состояния еще не создан
      </p>
    </main>
  );
}

export default function MiniApp() {
  const { appState } = useAppContext();
  const [uiReady, setUiReady] = useState(false);
  const data = useLaunchParams();
  const { isReady } = useUsersInit({ payload: { telegramId: data.tgWebAppData?.user?.id, username: data.tgWebAppData?.user?.username }, logResult: true });
  // Мемоизированный LoadScreen, чтобы использовать один и тот же элемент
  const loadScreenMemo = useMemo(() => <LoadScreen />, []);

  // Инициализация SDK + preload MainScreen
  useEffect(() => {
    // SDK
    swipeBehavior.mount();
    swipeBehavior.disableVertical();
    viewport.mount();
    viewport.expand();

    // Preload MainScreen (lazy)
    import("./MainScreen").then(() => setUiReady(true));

    return () => {
      swipeBehavior.unmount();
      try {
        (viewport as any).unmount();
      } catch (e) {
        console.error(e);
      }
    };
  }, []);

  // Определяем, какой экран рендерить по appState
  const StateComponent = useMemo(() => {
    switch (appState) {
      case "main":
        return MainScreen;
      case "difficulty-pick":
        return QuizSettings;
      case "quiz":
        return QuizScreen;
      case "result":
        return ResultScreen;
      default:
        return FallbackScreen;
    }
  }, [appState]);

  // Если данные пользователя или UI ещё не готовы — показываем LoadScreen
  if (!isReady || !uiReady) {
    return loadScreenMemo;
  }

  // Suspense для ленивых экранов, fallback = LoadScreen (мемоизирован)
  return (
    <Suspense fallback={loadScreenMemo}>
      <StateComponent />
    </Suspense>
  );
}
