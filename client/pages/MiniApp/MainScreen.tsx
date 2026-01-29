import { useAppContext } from "@/providers/AppContex";
import { Button } from "@/components/ui/button";

export default function MainScreen() {
  const { setAppState } = useAppContext();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-4">Главный экран</h1>
      <p className="text-muted-foreground mb-6">Добро пожаловать в Lambda Integral!</p>
      <Button 
        onClick={() => setAppState("difficulty-pick")}
        className="w-full max-w-xs"
      >
        Начать квиз
      </Button>
    </main>
  );
}

