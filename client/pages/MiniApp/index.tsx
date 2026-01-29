import { useAppContext } from "@/providers/AppContex";
import { useEffect, useMemo, Suspense, lazy } from "react";
import {
  swipeBehavior,
  viewport,
} from "@tma.js/sdk-react";

import "./style.css";

export default function MiniApp(){
    const { appState } = useAppContext();

    useEffect(() => {
        swipeBehavior.mount();
        swipeBehavior.disableVertical();
    
        viewport.mount();
        viewport.expand();
        return () => {
          swipeBehavior.unmount();
          try {
            (viewport as any).unmount(); // почему то нет этого метода, но в документации есть -> https://docs.telegram-mini-apps.com/packages/tma-js-sdk/features/viewport
          } catch (e) {
            console.error(e);
          }
        };
      }, []);

    // Ленивая загрузка компонента только при изменении appState
    const StateComponent = useMemo(() => {
      switch (appState) {
        case "main":
          return lazy(() => import("./MainScreen"));
        case "difficulty-pick":
          return lazy(() => import("./QuizSettings"));
        case "quiz":
          return lazy(() => import("./QuizScreen"));
        case "result":
          return lazy(() => import("./ResultScreen"));
        default:
          return lazy(() => Promise.resolve({
            default: () => (
              <main className="flex flex-col items-center justify-center min-h-screen p-4">
                <h1 className="text-3xl font-bold mb-4">Заглушка</h1>
                <p className="text-muted-foreground">Компонент для этого состояния еще не создан</p>
              </main>
            )
          }));
      }
    }, [appState]);

    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
            <p>Загрузка...</p>
          </div>
        }
      >
        <StateComponent />
      </Suspense>
    );
}