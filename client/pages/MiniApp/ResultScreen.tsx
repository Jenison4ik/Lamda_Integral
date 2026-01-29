import { useAppContext } from "@/providers/AppContex";
import { Button } from "@/components/ui/button";

export default function ResultScreen() {
  const { setAppState } = useAppContext();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-4">Результаты</h1>
      <p className="text-muted-foreground mb-6">Экран результатов в разработке</p>
      <Button 
        onClick={() => setAppState("main")}
        className="w-full max-w-xs"
      >
        Вернуться на главную
      </Button>
    </main>
  );
}

