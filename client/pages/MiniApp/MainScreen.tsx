import { useAppContext } from "@/providers/AppContex";
import { Button } from "@/components/ui/button";
import AnimatedLogo from "@/components/AnimatedLogo";

export default function MainScreen() {
  const { setAppState } = useAppContext();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      <AnimatedLogo />
      <h1 className="text-3xl font-bold mb-4">Добро пожаловать в Lambda Integral!</h1>
      <p className="text-muted-foreground mb-6">Главный экран</p>
      <Button
        onClick={() => setAppState("difficulty-pick")}
        className="w-full max-w-xs"
      >
        Начать квиз
      </Button>
    </main>
  );
}

