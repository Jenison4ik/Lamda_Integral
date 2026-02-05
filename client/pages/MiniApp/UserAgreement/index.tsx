import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ensureUser } from "@/service/users";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import AnimatedLogo from "@/components/AnimatedLogo";

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
        <Card className="w-full max-w-sm flex flex-col items-center justify-start">
          <CardContent>
            <AnimatedLogo />
            <h1 className="text-2xl font-bold mb-2 text-center">
              Пользовательское соглашение
            </h1>
            <p className="text-muted-foreground text-sm mb-6">
              Для использования приложения необходимо принять условия{" "}
              <a
                href="https://telegra.ph/Usloviya-ispolzovaniya-Lambda-Integral-02-02"
                className="text-primary visited:text-primary underline underline-offset-2 hover:text-primary/90"
              >
                пользовательского соглашения
              </a>{" "}
              и{" "}
              <a
                href="https://telegra.ph/Politika-konfidencialnosti-Lambda-Integral-02-02"
                className="text-primary visited:text-primary underline underline-offset-2 hover:text-primary/90"
              >
                политики конфиденциальности
              </a>
              .
            </p>

            <label
              className={cn(
                "flex items-start gap-3 rounded-md border p-4 cursor-pointer transition-colors",
                agreed
                  ? "border-primary bg-primary/5"
                  : "border-input hover:bg-muted/50"
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
          </CardContent>
        </Card>

        <Button
          className="w-full mt-4 bg-primary text-background hover:bg-primary/80 text-base font-medium cursor-pointer"
          disabled={!agreed || loading}
          onClick={handleSubmit}
        >
          {loading ? "Загрузка…" : "Продолжить"}
        </Button>
      </div>
    </main>
  );
}
