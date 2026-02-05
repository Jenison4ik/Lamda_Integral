import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ensureUser } from "@/service/users";
import { cn } from "@/lib/utils";

export interface UserAgreementProps {
  /** Вызывается после успешного создания пользователя (ensureUser); родитель делает refetch и переходит в основное приложение */
  onAccepted: () => void;
}

export default function UserAgreement({ onAccepted }: UserAgreementProps) {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!agreed || loading) return;
    setError(null);
    setLoading(true);
    try {
      const result = await ensureUser();
      if (result.ok) {
        onAccepted();
      } else {
        setError(result.error ?? "Не удалось продолжить");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка соединения");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col min-h-screen p-4">
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <h1 className="text-2xl font-bold mb-2">Пользовательское соглашение</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Для использования приложения необходимо принять условия
          пользовательского соглашения и политики конфиденциальности.
        </p>

        <label
          className={cn(
            "flex items-start gap-3 rounded-md border p-4 cursor-pointer transition-colors",
            agreed ? "border-primary bg-primary/5" : "border-input hover:bg-muted/50",
          )}
        >
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            disabled={loading}
            className="mt-1 size-4 rounded border-input accent-primary"
            aria-label="Я согласен с условиями"
          />
          <span className="text-sm">
            Я согласен с условиями пользовательского соглашения и политики
            конфиденциальности
          </span>
        </label>

        {error && (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button
          className="mt-6 w-full"
          disabled={!agreed || loading}
          onClick={handleSubmit}
        >
          {loading ? "Загрузка…" : "Продолжить"}
        </Button>
      </div>
    </main>
  );
}
