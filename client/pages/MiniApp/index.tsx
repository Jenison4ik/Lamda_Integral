import { useAppContext } from "@/providers/AppContex";
import { useCheckUser, useUsersInit } from "@/hooks/useUsersInit";
import {
  useEffect,
  useMemo,
  Suspense,
  lazy,
  useState,
  startTransition,
} from "react";
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
  useUsersInit({ logResult: true });
  const loadScreenMemo = useMemo(() => <LoadScreen />, []);

  // Удаляем предзагрузку MainScreen - lazy loading уже обрабатывает это

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

    return () => {
      try {
        if (typeof swipeBehavior.unmount === "function") {
          swipeBehavior.unmount();
        }
      } catch (e) {
        console.error(e);
      }
      try {
        if (typeof (viewport as unknown as { unmount?: () => void }).unmount === "function") {
          (viewport as unknown as { unmount: () => void }).unmount();
        }
      } catch (e) {
        console.error(e);
      }
    };
  }, []);
  const { isReady: isUserReady, isInDb, refetch } = useCheckUser();
  // Отложенный показ контента: переход из LoadScreen делаем через startTransition,
  // чтобы ре-рендер не блокировал анимацию спиннера на главном потоке.
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (!isUserReady) {
      setShowContent(false);
      return;
    }
    startTransition(() => setShowContent(true));
  }, [isUserReady]);

  // Пока не узнали, есть ли пользователь в БД — загрузка (или ждём конец transition)
  if (!isUserReady || !showContent) {
    return <LoadScreen />;
  }

  // Пользователя нет в БД — экран оферты; useUsersInit здесь не вызывается
  if (!isInDb) {
    return <UserAgreement onAccepted={() => refetch()} />;
  }

  // Пользователь в БД — показываем основной контент (useUsersInit вызывается внутри)
  return <MiniAppMain />;
}
