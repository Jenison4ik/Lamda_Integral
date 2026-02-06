import { useAppContext } from "@/providers/AppContex";
import { Button } from "@/components/ui/button";
import Emoji from "@/components/Emoji";
import { useCurrentSession, useSessionResults } from "@/hooks/api/useSession";
import MathBlock from "@/components/MathBlock";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp, Check, X } from "lucide-react";
import { useState } from "react";

export default function ResultScreen() {
  const { setAppState } = useAppContext();
  const { data: session } = useCurrentSession();
  const {
    data: results,
    isLoading,
    isError,
    error,
  } = useSessionResults(session?.id);
  const [detailsOpen, setDetailsOpen] = useState(false);

  if (!session?.id) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-muted-foreground mb-6">
          Нет данных сессии. Вернитесь на главную и начните квиз.
        </p>
        <Button onClick={() => setAppState("main")} className="w-full max-w-xs">
          На главную
        </Button>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-4">
        <Skeleton className="h-16 w-16 rounded-full mb-4" />
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-6 w-32 mb-6" />
        <Button disabled className="w-full max-w-xs">
          Загрузка...
        </Button>
      </main>
    );
  }

  if (isError || !results) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-4">
        <Emoji type="sad" />
        <h1 className="text-xl font-bold mb-2">Ошибка загрузки</h1>
        <p className="text-muted-foreground mb-6 text-center text-sm">
          {error instanceof Error ? error.message : "Не удалось загрузить результаты"}
        </p>
        <Button onClick={() => setAppState("main")} className="w-full max-w-xs">
          На главную
        </Button>
      </main>
    );
  }

  const { totalQuestions, correctAnswers, percentage, details } = results;
  const emojiType =
    percentage >= 70 ? "star" : percentage >= 40 ? "pockerface" : "sad";
  const isGood = percentage >= 70;

  return (
    <main className="flex flex-col items-center min-h-screen p-4 pb-8">
      <Emoji type={emojiType} />
      <h1 className="text-2xl font-bold mt-2 mb-1">Результаты квиза</h1>
      <p className="text-muted-foreground text-sm mb-6">
        {correctAnswers} из {totalQuestions} правильных
      </p>

      <Card className="w-full max-w-sm mb-6">
        <CardContent className="pt-6">
          <div className="text-center">
            <span
              className={`text-4xl font-bold ${isGood ? "text-green-600" : "text-amber-600"
                }`}
            >
              {percentage}%
            </span>
          </div>
        </CardContent>
      </Card>

      {details.length > 0 && (
        <div className="w-full max-w-sm">
          <Button
            variant="outline"
            className="w-full mb-4"
            onClick={() => setDetailsOpen((v) => !v)}
          >
            {detailsOpen ? (
              <>
                <ChevronUp className="mr-2 h-4 w-4" />
                Скрыть детали
              </>
            ) : (
              <>
                <ChevronDown className="mr-2 h-4 w-4" />
                Показать по вопросам
              </>
            )}
          </Button>
          {detailsOpen && (
            <div className="flex flex-col gap-3">
              {details.map((d, i) => (
                <Card key={d.questionId}>
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-sm">
                        Вопрос {i + 1}
                      </CardTitle>
                      {d.isCorrect ? (
                        <Check className="h-5 w-5 text-green-600 shrink-0" />
                      ) : (
                        <X className="h-5 w-5 text-red-500 shrink-0" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Задание: </span>
                      <MathBlock formula={d.questionText} fontSize={14} />
                    </div>
                    <div>
                      <span className="text-muted-foreground">Ваш ответ: </span>
                      <MathBlock formula={d.chosenAnswerText} fontSize={14} />
                    </div>
                    {!d.isCorrect && (
                      <div>
                        <span className="text-muted-foreground">Верный ответ: </span>
                        <MathBlock formula={d.correctAnswerText} fontSize={14} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <Button
        onClick={() => setAppState("main")}
        className="w-full max-w-sm mt-auto bg-primary text-background hover:bg-primary/80"
      >
        Вернуться на главную
      </Button>
    </main>
  );
}
