import { useAppContext } from "@/providers/AppContex";
import { Button } from "@/components/ui/button";
import useHaptic from "@/hooks/useHaptic";
import MathBlock from "@/components/MathBlock";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldTitle,
  FieldLabel,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCurrentSession,
  useQuestion,
  usePrefetchQuestion,
  useSubmitAnswer,
  SubmitAnswerResponse,
} from "@/hooks/api/useSession";

// =====================
// Skeleton компоненты
// =====================

function QuestionSkeleton() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-16 w-full" />
      </CardContent>
    </Card>
  );
}

function AnswersSkeleton() {
  return (
    <Card className="w-full max-w-sm">
      <CardContent className="flex flex-col gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}

// =====================
// Основной компонент
// =====================

export default function QuizScreen() {
  const { hapticTrigger } = useHaptic();
  const { setAppState } = useAppContext();

  // Состояние
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswerId, setSelectedAnswerId] = useState<number | null>(null);
  const [answerResult, setAnswerResult] = useState<SubmitAnswerResponse | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Данные
  const { data: session } = useCurrentSession();
  const { data: questionData, isLoading: isLoadingQuestion } = useQuestion(
    session?.id,
    currentIndex
  );
  const prefetchQuestion = usePrefetchQuestion();
  const submitMutation = useSubmitAnswer();

  // Prefetch следующего вопроса
  useEffect(() => {
    if (session && questionData && !questionData.isLast) {
      prefetchQuestion(session.id, currentIndex + 1);
    }
  }, [session, questionData, currentIndex, prefetchQuestion]);

  // Синхронизация currentIndex с сессией при монтировании
  useEffect(() => {
    if (session?.currentIndex !== undefined) {
      setCurrentIndex(session.currentIndex);
    }
  }, [session?.currentIndex]);

  const question = questionData?.question;
  const isLast = questionData?.isLast ?? false;
  const totalQuestions = session?.totalQuestions ?? 0;
  const showAnswersAfterEach = session?.showAnswersAfterEach ?? false;

  // Обработчик выбора ответа
  const handleAnswerChange = (value: string) => {
    if (answerResult || isSubmitting) return; // уже ответили или идёт отправка
    hapticTrigger("soft");
    setSelectedAnswerId(Number(value));
  };

  // Обработчик отправки ответа
  const handleSubmit = () => {
    if (!session || !question || selectedAnswerId === null) return;

    hapticTrigger("medium");
    setIsSubmitting(true);

    submitMutation.mutate(
      {
        sessionId: session.id,
        questionId: question.id,
        answerId: selectedAnswerId,
      },
      {
        onSuccess: (result) => {
          setIsSubmitting(false);
          if (showAnswersAfterEach) {
            // Показываем результат
            setAnswerResult(result);
            hapticTrigger(result.isCorrect ? "light" : "heavy");
          } else {
            // Сразу переходим к следующему
            goToNext();
          }
        },
        onError: () => {
          setIsSubmitting(false);
          hapticTrigger("heavy");
        },
      }
    );
  };

  // Переход к следующему вопросу или результатам
  const goToNext = () => {
    if (isLast) {
      setAppState("result");
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswerId(null);
      setAnswerResult(null);
    }
  };

  // Получение стиля для варианта ответа
  const getAnswerStyle = (answerId: number) => {
    if (!answerResult) return "";

    if (answerId === answerResult.correctAnswerId) {
      return "border-green-500 bg-green-500/10";
    }
    if (answerId === selectedAnswerId && !answerResult.isCorrect) {
      return "border-red-500 bg-red-500/10";
    }
    return "opacity-50";
  };

  // Текст кнопки
  const getButtonText = () => {
    if (!selectedAnswerId) return "Выберите ответ";
    if (answerResult) return isLast ? "Результаты" : "Следующий вопрос";
    return "Ответить";
  };

  // Обработчик кнопки
  const handleButtonClick = () => {
    if (answerResult) {
      goToNext();
    } else {
      handleSubmit();
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-4 p-bottom-4">
      {/* Заголовок с прогрессом */}
      <div className="flex flex-row items-center justify-between gap-4 text-sm w-full max-w-sm">
        {isLoadingQuestion ? (
          <>
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-20" />
          </>
        ) : (
          <>
            <Badge>
              Вопрос {currentIndex + 1}/{totalQuestions}
            </Badge>
            <Badge
              variant={
                answerResult
                  ? answerResult.isCorrect
                    ? "default"
                    : "destructive"
                  : "secondary"
              }
            >
              {answerResult
                ? answerResult.isCorrect
                  ? "Верно!"
                  : "Неверно"
                : "Не решён"}
            </Badge>
          </>
        )}
      </div>

      {/* Карточка с вопросом */}
      {isLoadingQuestion ? (
        <QuestionSkeleton />
      ) : question ? (
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Вычислите неопределённый интеграл</CardTitle>
          </CardHeader>
          <CardContent>
            <MathBlock
              formula={question.text}
              className="text-lg"
              fontSize={24}
            />
          </CardContent>
        </Card>
      ) : null}

      {/* Карточка с ответами */}
      {isLoadingQuestion ? (
        <AnswersSkeleton />
      ) : question ? (
        <Card className="w-full max-w-sm">
          <CardContent>
            <RadioGroup
              className="max-w-sm"
              value={selectedAnswerId?.toString() ?? ""}
              onValueChange={handleAnswerChange}
              disabled={isSubmitting || !!answerResult}
            >
              {question.answers.map((answer) => (
                <FieldLabel key={answer.id} htmlFor={`answer-${answer.id}`}>
                  <Field
                    orientation="horizontal"
                    className={getAnswerStyle(answer.id)}
                  >
                    <FieldContent>
                      <FieldTitle>
                        <MathBlock formula={answer.text} fontSize={15} />
                      </FieldTitle>
                    </FieldContent>
                    <RadioGroupItem
                      value={answer.id.toString()}
                      id={`answer-${answer.id}`}
                      className="hidden"
                      disabled={!!answerResult}
                    />
                  </Field>
                </FieldLabel>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      ) : null}

      {/* Кнопка действия */}
      <Button
        onClick={handleButtonClick}
        className="w-full max-w-sm mt-4 bg-primary text-background hover:bg-primary/80 text-base font-medium cursor-pointer"
        disabled={!selectedAnswerId || isSubmitting || isLoadingQuestion}
      >
        {isSubmitting ? "Отправка..." : getButtonText()}
      </Button>
    </main>
  );
}
