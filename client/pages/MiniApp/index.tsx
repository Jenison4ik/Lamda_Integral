import { useAppContext } from "@/providers/AppContex";
import { useCheckUser, useUsersInit } from "@/hooks/useUsersInit";
import { useEffect, useMemo, Suspense, lazy, useState } from "react";
import { swipeBehavior, viewport } from "@tma.js/sdk-react";

import "./style.css";
import LoadScreen from "./LoadScreen";
import UserAgreement from "./UserAgreement";

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

/**
 * Основной контент Mini App: показывается только когда пользователь уже в БД.
 * useUsersInit вызывается здесь, поэтому он не выполняется до принятия оферты на UserAgreement.
 */
function MiniAppMain() {
  const { appState } = useAppContext();
  const [uiReady, setUiReady] = useState(false);
  const { isReady } = useUsersInit({ logResult: true });
  const loadScreenMemo = useMemo(() => <LoadScreen />, []);

  useEffect(() => {
    import("./MainScreen").then(() => setUiReady(true));

    return () => {
      swipeBehavior.unmount();
      try {
        (viewport as unknown as { unmount: () => void }).unmount();
      } catch (e) {
        console.error(e);
      }
    };
  }, []);

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

  // if (!isReady || !uiReady) {
  //   return loadScreenMemo;
  // }

  return (
    <Suspense fallback={loadScreenMemo}>
      <StateComponent />
    </Suspense>
  );
}

export default function MiniApp() {
  //Настройки отображения приложения
  useEffect(() => {
    swipeBehavior.mount();
    swipeBehavior.disableVertical();
    viewport.mount();
    viewport.expand();
  }, []);
  const { isReady: isUserReady, isInDb, refetch } = useCheckUser();

  // Пока не узнали, есть ли пользователь в БД — загрузка
  if (!isUserReady) {
    return <LoadScreen />;
  }

  // Пользователя нет в БД — экран оферты; useUsersInit здесь не вызывается
  if (!isInDb) {
    return <UserAgreement onAccepted={() => refetch()} />;
  }

  // Пользователь в БД — показываем основной контент (useUsersInit вызывается внутри)
  return <MiniAppMain />;
}
