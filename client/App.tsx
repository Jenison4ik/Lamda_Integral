import { useState, useEffect, useMemo, Suspense, lazy } from "react";
import { init, retrieveLaunchParams, viewport } from "@tma.js/sdk-react";
import { hapticFeedback, swipeBehavior } from "@tma.js/sdk-react";
import { Button } from "./components/ui/button";
import { Slider } from "./components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";

// Ленивая загрузка страниц для разделения на отдельные бандлы
const AdminPanel = lazy(() => import("./pages/Admin"));
const NonTg = lazy(() => import("./pages/NonTg"));

interface ApiResponse {
  message: string;
}

interface CreateUserResponse {
  ok: boolean;
  user?: {
    id: number;
    telegramId: string;
    username: string | null;
    createdAt: string;
  };
  error?: string;
}

function App() {
  const isAdminRoute =
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/admin");

  if (isAdminRoute) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
            <p>Загрузка админ-панели...</p>
          </div>
        }
      >
        <AdminPanel />
      </Suspense>
    );
  }

  try {
    init();
  } catch (e) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
            <p>Загрузка...</p>
          </div>
        }
      >
        <NonTg />
      </Suspense>
    );
  }

  // Получаем параметры запуска, которые содержат данные пользователя
  const launchParams = useMemo(() => retrieveLaunchParams(), []);
  const user = launchParams?.tgWebAppData?.user || null;
  const initData = launchParams?.tgWebAppData || null;

  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<
    "light" | "medium" | "heavy" | "rigid" | "soft"
  >("light");
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserError, setAddUserError] = useState<string | null>(null);
  const [addUserSuccess, setAddUserSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchMessage();
    swipeBehavior.mount();
    swipeBehavior.disableVertical();

    viewport.mount();
    viewport.expand();
    return () => {
      swipeBehavior.unmount();
      try {
        (viewport as any).unmount(); // почему то нет метода, но в документации есть -> https://docs.telegram-mini-apps.com/packages/tma-js-sdk/features/viewport
      } catch (e) {
        console.error(e);
      }
    };
  }, []);

  const fetchMessage = async () => {
    hapticFeedback.isSupported() && hapticFeedback.impactOccurred("medium");
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/hello");
      const text = await response.text();
      let data: ApiResponse;
      try {
        data = text ? JSON.parse(text) : { message: "" };
      } catch {
        throw new Error(
          response.ok
            ? "Сервер вернул не JSON"
            : `Сервер вернул ${response.status}. Убедитесь, что бэкенд запущен (npm run dev).`,
        );
      }
      if (!response.ok) {
        throw new Error("Failed to fetch");
      }
      setMessage(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const addUser = async () => {
    hapticFeedback.isSupported() && hapticFeedback.impactOccurred("light");
    setAddUserLoading(true);
    setAddUserError(null);
    setAddUserSuccess(null);
    try {
      if (!user) {
        throw new Error("User not found");
      }
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId: user.id, username: user.username }),
      });
      const text = await res.text();
      let data: CreateUserResponse;
      try {
        data = text ? JSON.parse(text) : { ok: false };
      } catch {
        throw new Error(
          res.ok
            ? "Сервер вернул не JSON"
            : `Сервер вернул ${res.status}. Убедитесь, что бэкенд запущен (npm run dev).`,
        );
      }
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Ошибка при создании пользователя");
      }
      setAddUserSuccess(
        `Пользователь #${data.user!.id} (tg: ${data.user!.telegramId}) создан`,
      );
    } catch (err) {
      setAddUserError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setAddUserLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>TG Integral App 2.0</h1>
        <p>React + Vite + Express + TypeScript</p>
        <img
          src={user?.photo_url ?? "./img/user_placeholder.jpeg"}
          alt=""
          className="w-[100px] h-[100px] rounded-full object-cover"
        />
        <p>Hi 👋, {user?.first_name ?? ""}</p>
      </header>
      <main className="app-main">
        {loading && <p>Загрузка...</p>}
        {error && <p className="error">Ошибка: {error}</p>}
        {message && !loading && (
          <div className="message">
            <h2>Ответ от сервера:</h2>
            <p>{message}</p>
          </div>
        )}
        <Button onClick={fetchMessage} disabled={loading}>
          Обновить
        </Button>

        <div style={{ marginTop: "1rem" }}>
          <Button
            onClick={addUser}
            disabled={addUserLoading}
            variant="secondary"
          >
            {addUserLoading ? "Добавляем…" : "Добавить пользователя"}
          </Button>
          {addUserError && (
            <p className="error" style={{ marginTop: "0.5rem" }}>
              {addUserError}
            </p>
          )}
          {addUserSuccess && (
            <p style={{ marginTop: "0.5rem", color: "var(--success, green)" }}>
              {addUserSuccess}
            </p>
          )}
        </div>
        <Select
          value={feedback}
          onValueChange={(value) =>
            setFeedback(
              value as "light" | "medium" | "heavy" | "rigid" | "soft",
            )
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a feedback" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">Light</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="heavy">Heavy</SelectItem>
            <SelectItem value="rigid">Rigid</SelectItem>
            <SelectItem value="soft">Soft</SelectItem>
          </SelectContent>
        </Select>

        <Slider
          onValueChange={() => {
            hapticFeedback.isSupported() &&
              hapticFeedback.impactOccurred(feedback);
          }}
          min={0}
          max={100}
          defaultValue={[20]}
          step={10}
        />
      </main>
      <div>
        <p>Информация о пользователе</p>
        {user ? (
          <>
            <RowRender>
              <div>
                <strong>ID:</strong> {user.id}
              </div>
              <div>
                <strong>Имя:</strong> {user.first_name} {user.last_name || ""}
              </div>
              <div>
                <strong>Username:</strong> {user.username || "не указан"}
              </div>
              <div>
                <strong>Язык:</strong> {user.language_code || "не указан"}
              </div>
              <div style={{ marginTop: "1rem" }}>
                <strong>Полные данные (JSON):</strong>
                <pre style={{ fontSize: "0.8rem", overflow: "auto" }}>
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
            </RowRender>
            {initData && (
              <div style={{ marginTop: "1rem" }}>
                <RowRender>
                  <div>
                    <strong>Init Data (JSON):</strong>
                    <pre style={{ fontSize: "0.8rem", overflow: "auto" }}>
                      {JSON.stringify(initData, null, 2)}
                    </pre>
                  </div>
                </RowRender>
              </div>
            )}
          </>
        ) : (
          <RowRender>Данные пользователя недоступны</RowRender>
        )}
      </div>
    </div>
  );
}

export default App;

function RowRender({ children }: { children: React.ReactNode }) {
  return <div style={{ maxWidth: "90%" }}>{children}</div>;
}
