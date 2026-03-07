import { useTransition } from "react";
import { useAppContext } from "@/providers/AppContex";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import AnimatedLogo from "@/components/AnimatedLogo";

export default function MainScreen() {
  const { setAppState } = useAppContext();
  const [isPending, startTransition] = useTransition();

  const handleStartQuiz = () => {
    startTransition(() => {
      setAppState("difficulty-pick");
    });
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      <AnimatedLogo />
      <h1 className="text-3xl font-bold mb-4 text-center">Добро пожаловать в Lambda Integral!</h1>
      <p className="text-muted-foreground mb-6 text-center">Главный экран</p>
      <Button
        onClick={handleStartQuiz}
        disabled={isPending}
        className="w-full max-w-xs relative"
      >
        <span className={isPending ? "invisible" : undefined}>Начать квиз</span>
        {isPending && (
          <span className="absolute inset-0 flex items-center justify-center">
            <Spinner className="size-5" />
          </span>
        )}
      </Button>
    </main>
  );
}

