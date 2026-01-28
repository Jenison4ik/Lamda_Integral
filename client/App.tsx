import { useState, useEffect } from "react";
import { init, retrieveRawInitData } from "@tma.js/sdk-react";
import NonTg from "./pages/NonTg";
import { hapticFeedback, useRawInitData } from "@tma.js/sdk-react";
import { Button } from "./components/ui/button";

interface ApiResponse {
  message: string;
}

interface CreateUserResponse {
  ok: boolean;
  user?: { id: number; telegramId: string; username: string | null; createdAt: string };
  error?: string;
}

function App() {
  try {
    init();
  } catch (e) {
    return <NonTg />;
  }
  const user = retrieveRawInitData();
  const user2 = useRawInitData()

  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserError, setAddUserError] = useState<string | null>(null);
  const [addUserSuccess, setAddUserSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchMessage();
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
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
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
      setAddUserSuccess(`Пользователь #${data.user!.id} (tg: ${data.user!.telegramId}) создан`);
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
          {addUserError && <p className="error" style={{ marginTop: "0.5rem" }}>{addUserError}</p>}
          {addUserSuccess && <p style={{ marginTop: "0.5rem", color: "var(--success, green)" }}>{addUserSuccess}</p>}
        </div>
      </main>
      <div>
        <p>Информация о пользователе</p>
        <RowRender>{JSON.stringify(user)}</RowRender>
        <RowRender>{JSON.stringify(user2)}</RowRender>
      </div>
    </div>
  );
}

export default App;


function RowRender({children}:{children: React.ReactNode}) {
  return <div style={{maxWidth:"90%"}}>{children}</div>
}