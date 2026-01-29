import { useAppContext } from "@/providers/AppContex";
import { Button } from "@/components/ui/button";
import MathBlock from "@/components/MathBlock";

export default function QuizScreen() {
  const { setAppState } = useAppContext();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-4">Квиз</h1>
      <MathBlock formula="\int \frac{dx}{\sqrt{(\ln x)^2 + 1}} \cdot \frac{1}{x}"/>
      <p className="text-muted-foreground mb-6">Экран квиза в разработке</p>
      <Button 
        onClick={() => setAppState("result")}
        className="w-full max-w-xs"
      >
        Завершить квиз (заглушка)
      </Button>
    </main>
  );
}

