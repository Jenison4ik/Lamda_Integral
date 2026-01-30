import { useAppContext } from "@/providers/AppContex";
import { useUsersInit } from "@/hooks/useUsersInit";
import { useEffect, useMemo, Suspense, lazy, useState } from "react";
import { swipeBehavior, viewport } from "@tma.js/sdk-react";

import "./style.css";
import LoadScreen from "./LoadScreen";
import { MainScreenLazy, preloadMainScreen } from "./utils/preloadMainscreen";

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
  const { isReady } = useUsersInit({ logResult: true });
  const [uiReady, setUiReady] = useState(false);

  useEffect(() => {
    preloadMainScreen().then(() => {
      setUiReady(true);
      console.log("uiReady ", true); // в колбэке uiReady ещё старое из замыкания — логируем то, что установили
    });

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

  const StateComponent = useMemo(() => {
    switch (appState) {
      case "main":
        return MainScreenLazy;
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

  if (!isReady || !uiReady) {
    return <LoadScreen />;
  }

  return (
    <Suspense fallback={null}>
      <StateComponent />
    </Suspense>
  );
}
