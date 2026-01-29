import { useAppContext } from "@/providers/AppContex";
import { useEffect, useMemo, Suspense, lazy } from "react";
import { swipeBehavior, viewport } from "@tma.js/sdk-react";

import "./style.css";
import LoadScreen from "./LoadScreen";

// ✅ lazy создаётся ОДИН раз
const MainScreen = lazy(() => import("./MainScreen"));
const QuizSettings = lazy(() => import("./QuizSettings"));
const QuizScreen = lazy(() => import("./QuizScreen"));
const ResultScreen = lazy(() => import("./ResultScreen"));

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

  useEffect(() => {
    swipeBehavior.mount();
    swipeBehavior.disableVertical();

    viewport.mount();
    viewport.expand();

    return () => {
      swipeBehavior.unmount();
      try {
        (viewport as any).unmount();
      } catch (e) {
        console.error(e);
      }
    };
  }, []);

  // ✅ useMemo ТЕПЕРЬ работает корректно
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

  return (
    <Suspense
      fallback={
        <LoadScreen/>
      }
    >
      <StateComponent />
    </Suspense>
  );
}
