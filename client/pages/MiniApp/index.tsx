import { useAppContext } from "@/providers/AppContex";
import { useUsersInit } from "@/hooks/useUsersInit";
import { useEffect, useMemo, useState, Suspense, lazy } from "react";
import { swipeBehavior, viewport } from "@tma.js/sdk-react";

import "./style.css";
import LoadScreen from "./LoadScreen";

const mainScreenImport = () => import("./MainScreen");
const MainScreen = lazy(mainScreenImport);
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
  const [mainChunkLoaded, setMainChunkLoaded] = useState(false);

  // Параллельно с useUsersInit подгружаем чанк MainScreen
  useEffect(() => {
    mainScreenImport().then(() => setMainChunkLoaded(true));
  }, []);

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

  const stateContent = useMemo(() => {
    switch (appState) {
      case "main":
        return <MainScreen />;
      case "difficulty-pick":
        return <QuizSettings />;
      case "quiz":
        return <QuizScreen />;
      case "result":
        return <ResultScreen />;
      default:
        return <FallbackScreen />;
    }
  }, [appState]);

  const bothReady = appState === "main" ? isReady && mainChunkLoaded : isReady;

  if (!bothReady) {
    return <LoadScreen />;
  }

  return <Suspense fallback={null}>{stateContent}</Suspense>;
}
