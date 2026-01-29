import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type QuestionPayload = {
  difficulty: string;
  questions: QuestionItem[];
};

type QuestionItem = {
  question: string;
  answers: string[];
  correct: number;
};

type QuestionRow = {
  id: number | string;
  difficulty: string;
  question: string;
  answers: { text: string; isCorrect: boolean }[];
  source: string;
};

type ImportQuestionsResponse =
  | { ok: true; createdQuestions: number; createdAnswers: number }
  | { ok: false; error: string };

type GetQuestionsResponse =
  | {
      ok: true;
      questions: {
        id: number;
        difficulty: string;
        text: string;
        createdAt: string;
        answers: { id: number; text: string; isCorrect: boolean }[];
      }[];
      nextOffset: number;
      hasMore: boolean;
    }
  | { ok: false; error: string };

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? "";
const PAGE_SIZE = 30;
const SCROLL_ROOT_MARGIN = "240px";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseQuestionItem = (item: unknown, index: number): QuestionItem => {
  if (!isRecord(item)) {
    throw new Error(`Вопрос #${index + 1} должен быть объектом.`);
  }
  if (typeof item.question !== "string" || !item.question.trim()) {
    throw new Error(`Вопрос #${index + 1}: поле question обязательно.`);
  }
  if (!Array.isArray(item.answers) || item.answers.length === 0) {
    throw new Error(
      `Вопрос #${index + 1}: поле answers должно быть непустым массивом.`,
    );
  }
  if (!item.answers.every((answer) => typeof answer === "string")) {
    throw new Error(
      `Вопрос #${index + 1}: все элементы answers должны быть строками.`,
    );
  }
  if (typeof item.correct !== "number" || !Number.isInteger(item.correct)) {
    throw new Error(
      `Вопрос #${index + 1}: поле correct должно быть целым числом.`,
    );
  }
  if (item.correct < 0 || item.correct >= item.answers.length) {
    throw new Error(
      `Вопрос #${index + 1}: поле correct выходит за пределы answers.`,
    );
  }
  return {
    question: item.question.trim(),
    answers: item.answers,
    correct: item.correct,
  };
};

const parsePayload = (raw: unknown): QuestionPayload[] => {
  // Поддержка формата: массив объектов
  if (Array.isArray(raw)) {
    if (raw.length === 0) {
      throw new Error("Файл содержит пустой массив.");
    }
    return raw.map((item, index) => {
      if (!isRecord(item)) {
        throw new Error(`Элемент #${index + 1} массива должен быть объектом.`);
      }
      const difficulty = item.difficulty;
      if (typeof difficulty !== "string" || !difficulty.trim()) {
        throw new Error(
          `Элемент #${index + 1}: поле difficulty обязательно и должно быть строкой.`,
        );
      }
      const questions = item.questions;
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error(
          `Элемент #${index + 1}: поле questions должно быть непустым массивом.`,
        );
      }
      const parsedQuestions = questions.map((q, qIndex) =>
        parseQuestionItem(q, qIndex + 1),
      );
      return {
        difficulty: difficulty.trim(),
        questions: parsedQuestions,
      };
    });
  }

  // Поддержка формата: один объект
  if (!isRecord(raw)) {
    throw new Error("Файл должен содержать JSON-объект или массив объектов.");
  }

  const difficulty = raw.difficulty;
  if (typeof difficulty !== "string" || !difficulty.trim()) {
    throw new Error("Поле difficulty обязательно и должно быть строкой.");
  }

  const questions = raw.questions;
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("Поле questions должно быть непустым массивом.");
  }

  const parsedQuestions = questions.map((item, index) =>
    parseQuestionItem(item, index + 1),
  );

  return [
    {
      difficulty: difficulty.trim(),
      questions: parsedQuestions,
    },
  ];
};

export default function AdminPanel() {
  const [isAuthed, setIsAuthed] = useState(
    () => sessionStorage.getItem("admin_authed") === "1",
  );
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  const [rows, setRows] = useState<QuestionRow[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isLoadingRef = useRef(false);

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);

    if (!ADMIN_PASSWORD) {
      setAuthError("Пароль администратора не задан в .env.");
      return;
    }
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem("admin_authed", "1");
      setIsAuthed(true);
      setPassword("");
      return;
    }
    setAuthError("Неверный пароль.");
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_authed");
    setIsAuthed(false);
    setPassword("");
  };

  const fetchQuestions = useCallback(
    async (nextOffset: number, replace: boolean) => {
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;
      setIsLoading(true);
      setLoadError(null);

      try {
        const params = new URLSearchParams();
        params.set("limit", String(PAGE_SIZE));
        params.set("offset", String(nextOffset));
        if (difficultyFilter !== "all") {
          params.set("difficulty", difficultyFilter);
        }

        const response = await fetch(`/api/questions?${params.toString()}`);
        const responseText = await response.text();
        let data: GetQuestionsResponse;
        try {
          data = responseText
            ? JSON.parse(responseText)
            : { ok: false, error: "" };
        } catch {
          throw new Error(
            response.ok
              ? "Сервер вернул не JSON"
              : `Сервер вернул ${response.status}. Убедитесь, что бэкенд запущен.`,
          );
        }

        if (!response.ok || !data.ok) {
          throw new Error(data.ok ? "Не удалось получить вопросы" : data.error);
        }

        const mappedRows: QuestionRow[] = data.questions.map((question) => ({
          id: question.id,
          difficulty: question.difficulty,
          question: question.text,
          answers: question.answers.map((answer) => ({
            text: answer.text,
            isCorrect: answer.isCorrect,
          })),
          source: "БД",
        }));

        setRows((prev) => (replace ? mappedRows : [...prev, ...mappedRows]));
        //setOffset(data.nextOffset);
        setHasMore(data.hasMore);
      } catch (error) {
        setLoadError(
          error instanceof Error
            ? error.message
            : "Не удалось получить вопросы.",
        );
      } finally {
        setIsLoading(false);
        isLoadingRef.current = false;
      }
    },
    [difficultyFilter],
  );

  const resetAndLoad = useCallback(() => {
    setRows([]);
    setOffset(0);
    setHasMore(true);
    fetchQuestions(0, true);
  }, [fetchQuestions]);

  useEffect(() => {
    if (!isAuthed) return;
    resetAndLoad();
  }, [difficultyFilter, isAuthed, resetAndLoad]);

  useEffect(() => {
    if (!isAuthed) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoading) {
          fetchQuestions(offset, false);
        }
      },
      { rootMargin: SCROLL_ROOT_MARGIN },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchQuestions, hasMore, isAuthed, isLoading, offset]);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setImportError(null);
    setImportSuccess(null);

    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsImporting(true);
    try {
      const text = await file.text();
      const payloads = parsePayload(JSON.parse(text));
      const importedCount = payloads.reduce(
        (sum, payload) => sum + payload.questions.length,
        0,
      );

      const response = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payloads }),
      });
      const responseText = await response.text();
      let data: ImportQuestionsResponse;
      try {
        data = responseText
          ? JSON.parse(responseText)
          : { ok: false, error: "" };
      } catch {
        throw new Error(
          response.ok
            ? "Сервер вернул не JSON"
            : `Сервер вернул ${response.status}. Убедитесь, что бэкенд запущен.`,
        );
      }
      if (!response.ok || !data.ok) {
        throw new Error(
          data.ok ? "Не удалось импортировать вопросы" : data.error,
        );
      }

      resetAndLoad();
      setImportSuccess(
        `Импортировано вопросов: ${importedCount} (файл ${file.name}). В БД добавлено: ${data.createdQuestions}.`,
      );
    } catch (error) {
      setImportError(
        error instanceof Error
          ? error.message
          : "Не удалось импортировать файл.",
      );
    } finally {
      setIsImporting(false);
      event.target.value = "";
    }
  };

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Доступ в панель вопросов</CardTitle>
            <CardDescription>
              Введите пароль из .env, чтобы открыть панель.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!ADMIN_PASSWORD && (
              <Alert variant="destructive">
                <AlertTitle>Пароль не задан</AlertTitle>
                <AlertDescription>
                  Добавьте `VITE_ADMIN_PASSWORD` в .env или .env.local.
                </AlertDescription>
              </Alert>
            )}
            {authError && (
              <Alert variant="destructive">
                <AlertTitle>Ошибка</AlertTitle>
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            )}
            <form className="space-y-3" onSubmit={handleLogin}>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Пароль</Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="Введите пароль"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={!ADMIN_PASSWORD}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={!ADMIN_PASSWORD}
              >
                Войти
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold">Панель вопросов</h1>
            <p className="text-muted-foreground">
              Загружайте вопросы из JSON и проверяйте их в таблице.
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Выйти
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Импорт из JSON</CardTitle>
            <CardDescription>
              Формат: difficulty + массив questions с полями question, answers,
              correct.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {importError && (
              <Alert variant="destructive">
                <AlertTitle>Ошибка импорта</AlertTitle>
                <AlertDescription>{importError}</AlertDescription>
              </Alert>
            )}
            {importSuccess && (
              <Alert>
                <AlertTitle>Импорт завершен</AlertTitle>
                <AlertDescription>{importSuccess}</AlertDescription>
              </Alert>
            )}
            <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
              <div className="space-y-2">
                <Label htmlFor="json-file">JSON файл с вопросами</Label>
                <Input
                  id="json-file"
                  type="file"
                  accept="application/json,.json"
                  onChange={handleFileChange}
                  disabled={isImporting}
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setRows([]);
                  setOffset(0);
                  setHasMore(true);
                }}
                disabled={isImporting}
              >
                Сбросить список
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-4">
            <div className="space-y-1">
              <CardTitle>Таблица вопросов</CardTitle>
              <CardDescription>
                Загружено: {rows.length}. Показ по частям при скролле.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-2">
                <Label htmlFor="difficulty-filter">Сложность</Label>
                <Select
                  value={difficultyFilter}
                  onValueChange={setDifficultyFilter}
                >
                  <SelectTrigger id="difficulty-filter" className="w-[200px]">
                    <SelectValue placeholder="Все уровни" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все</SelectItem>
                    <SelectItem value="easy">easy</SelectItem>
                    <SelectItem value="medium">medium</SelectItem>
                    <SelectItem value="hard">hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={resetAndLoad}
                disabled={isLoading}
              >
                Обновить список
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>
                Для добавления используйте импорт JSON. Новые данные появятся
                после импорта или обновления списка.
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Сложность</TableHead>
                  <TableHead>Вопрос</TableHead>
                  <TableHead>Ответы</TableHead>
                  <TableHead>Правильный</TableHead>
                  <TableHead>Источник</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      {isLoading
                        ? "Загрузка вопросов..."
                        : "Пока нет загруженных вопросов."}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Badge variant="outline">{row.difficulty}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-normal">
                        {row.question}
                      </TableCell>
                      <TableCell className="whitespace-normal">
                        <div className="flex flex-wrap gap-2">
                          {row.answers.map((answer, index) => (
                            <Badge
                              key={`${row.id}-${index}`}
                              variant={
                                answer.isCorrect ? "default" : "secondary"
                              }
                            >
                              {index + 1}. {answer.text}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">
                          {row.answers
                            .map((answer, index) =>
                              answer.isCorrect ? index + 1 : null,
                            )
                            .filter((value): value is number => value !== null)
                            .join(", ") || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-normal">
                        {row.source}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {loadError && (
              <Alert variant="destructive" className="mt-4">
                <AlertTitle>Ошибка загрузки</AlertTitle>
                <AlertDescription>{loadError}</AlertDescription>
              </Alert>
            )}
            <div ref={sentinelRef} className="h-6" />
            {isLoading && rows.length > 0 && (
              <p className="mt-3 text-sm text-muted-foreground">
                Загружаем ещё вопросы...
              </p>
            )}
            {!hasMore && rows.length > 0 && (
              <p className="mt-3 text-sm text-muted-foreground">
                Больше вопросов нет.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
