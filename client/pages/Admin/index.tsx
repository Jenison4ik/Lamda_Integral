import { useState } from "react";
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
  id: string;
  difficulty: string;
  question: string;
  answers: string[];
  correct: number;
  source: string;
};

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? "";

const createRowId = () => {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `q_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

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

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setImportError(null);
    setImportSuccess(null);

    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const payloads = parsePayload(JSON.parse(text));
      const nextRows: QuestionRow[] = [];

      // Обрабатываем каждый payload (может быть массив или один объект)
      for (const payload of payloads) {
        for (const question of payload.questions) {
          nextRows.push({
            id: createRowId(),
            difficulty: payload.difficulty,
            question: question.question,
            answers: question.answers,
            correct: question.correct,
            source: file.name,
          });
        }
      }

      setRows((prev) => [...nextRows, ...prev]);
      setImportSuccess(
        `Импортировано вопросов: ${nextRows.length} (файл ${file.name}).`,
      );
    } catch (error) {
      setImportError(
        error instanceof Error
          ? error.message
          : "Не удалось импортировать файл.",
      );
    } finally {
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
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setRows([])}
              >
                Очистить таблицу
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Таблица вопросов</CardTitle>
            <CardDescription>Всего загружено: {rows.length}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>
                Для добавления используйте импорт JSON.
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
                      Пока нет загруженных вопросов.
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
                                index === row.correct ? "default" : "secondary"
                              }
                            >
                              {index + 1}. {answer}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">{row.correct + 1}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-normal">
                        {row.source}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
