import { AppProvider } from "@/providers/AppContex";
import useHaptic from "@/hooks/useHaptic";
import { useEffect, useMemo } from "react";
import { retrieveLaunchParams, swipeBehavior, viewport } from "@tma.js/sdk-react";
import { Card } from "@/components/ui/card";
import "./style.css"

export default function MiniApp(){
    const { hapticTrigger } = useMemo(()=>  useHaptic(),[]);
    const launchParams = useMemo(() => retrieveLaunchParams(), []);

    //ВЫставление настроек
    useEffect(()=>{
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
    },[])


    return (
        <AppProvider>
            <main>
            <Card><div>Ваш контент здесь</div></Card>
            </main>
        </AppProvider>
    )
}

