import { useAppContext } from "@/providers/AppContex";
import { useCheckUser, useUsersInit } from "@/hooks/useUsersInit";
import { useEffect, Suspense, lazy } from "react";
import { swipeBehavior, viewport } from "@tma.js/sdk-react";

import "./style.css";
import LoadScreen from "./LoadScreen";
import UserAgreement from "./UserAgreement";

// Lazy screens
const MainScreen = lazy(() => import("./MainScreen"));
const QuizSettings = lazy(() => import("./QuizSettings"));
const QuizScreen = lazy(() => import("./QuizScreen"));
const ResultScreen = lazy(() => import("./ResultScreen"));

// ---------- Fallback ----------
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

// ---------- Main content ----------
function MiniAppMain() {
  const { appState } = useAppContext();

  // Запускается только когда пользователь уже в БД
  useUsersInit({ logResult: true });

  // Выбор экрана без useMemo — он тут не нужен
  let Screen: React.ComponentType;

  switch (appState) {
    case "main":
      Screen = MainScreen;
      break;
    case "difficulty-pick":
      Screen = QuizSettings;
      break;
    case "quiz":
      Screen = QuizScreen;
      break;
    case "result":
      Screen = ResultScreen;
      break;
    default:
      Screen = FallbackScreen;
  }

  return (
    <Suspense fallback={null}>
      <Screen />
    </Suspense>
  );
}

// ---------- Root ----------
export default function MiniApp() {
  const { isReady: isUserReady, isInDb, refetch } = useCheckUser();

  // Telegram MiniApp viewport setup
  useEffect(() => {
    swipeBehavior.mount();
    swipeBehavior.disableVertical();

    viewport.mount();
    viewport.expand();

    // Prefetch main screen chunk (убирает белый флеш)
    import("./MainScreen");

    return () => {
      try {
        swipeBehavior.unmount?.();
      } catch (e) {
        console.error(e);
      }

      try {
        (viewport as any).unmount?.();
      } catch (e) {
        console.error(e);
      }
    };
  }, []);

  // Loader показывается поверх всего и не размонтируется
  const showLoader = !isUserReady;

  return (
    <>
      {/* Основное содержимое */}
      {isUserReady && !isInDb && <UserAgreement onAccepted={refetch} />}

      {isUserReady && isInDb && <MiniAppMain />}

      {/* Overlay loader */}
      {showLoader && (
        <div className="fixed inset-0 z-50">
          <LoadScreen />
        </div>
      )}
    </>
  );
}
