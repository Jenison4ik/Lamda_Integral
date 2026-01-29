import { AppProvider } from "@/providers/AppContex";
import useHaptic from "@/hooks/useHaptic";
import { useEffect, useMemo } from "react";
import {
  retrieveLaunchParams,
  swipeBehavior,
  viewport,
} from "@tma.js/sdk-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import "./style.css";

export default function MiniApp() {
  const { hapticTrigger } = useHaptic();
  const launchParams = useMemo(() => retrieveLaunchParams(), []);

  //ВЫставление настроек
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

  return (
    <AppProvider>
      <main>
        <Card>CardContent</Card>
        <CardHeader className="flex items-start gap-2">
          <img
            src={
              launchParams?.tgWebAppData?.user?.photo_url ??
              "./img/user_placeholder.jpeg"
            }
            alt="user"
            className="w-[40px] h-[40px] rounded-full"
          />
          <CardTitle>
            Привет 👋, {launchParams?.tgWebAppData?.user?.first_name}!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>Ваш контент здесь</div>
        </CardContent>
      </main>
    </AppProvider>
  );
}
