import { useEffect, useState, useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ensureUser } from "@/service/users";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import Lottie from "lottie-react";
import { Skeleton } from "@/components/ui/skeleton";

export interface UserAgreementProps {
  /** Вызывается после успешного создания пользователя (ensureUser); родитель делает refetch и переходит в основное приложение */
  onAccepted: () => void;
}

export default function UserAgreement({ onAccepted }: UserAgreementProps) {
  const [agreed, setAgreed] = useState(false);
  const [isPending, startTransition] = useTransition();
  /** После успеха держим UI заблокированным до размонтирования (навигация родителя) */
  const [navigating, setNavigating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!agreed || isPending || navigating) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await ensureUser();
        if (result.ok) {
          setNavigating(true);
          onAccepted();
          return;
        }
        setError(result.error ?? "Не удалось продолжить");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка соединения");
      }
    });
  };

  const busy = isPending || navigating;

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-4 p-bottom-4">
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <Card className="flex flex-col items-center justify-center">
          <CardContent className="w-full max-w-sm flex flex-col items-center justify-center">
            <Folder className="w-[250px] h-[250px]" />
            <h1 className="text-2xl font-bold text-center">
              Lambda Integral
            </h1>
            <p className="text-center mb-2 text-base">Пользовательское соглашение</p>
            <p className="text-muted-foreground text-sm mb-6 text-center">
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
                "flex items-start gap-3 rounded-md border p-4 cursor-pointer transition-colors w-full",
                agreed
                  ? "border-primary bg-primary/5"
                  : "border-input hover:bg-muted/50"
              )}
            >
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                disabled={busy}
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
          disabled={!agreed || busy}
          onClick={handleSubmit}
        >
          {busy ? "Загрузка…" : "Продолжить"}
        </Button>
      </div>
    </main>
  );
}




function Folder({ className, ...props }: React.ComponentProps<"div">) {
  const [animationData, setAnimationData] = useState<any>(null);
  const lottieRef = useRef<any>(null);

  useEffect(() => {
    import("./folder.json").then((m) =>
      setAnimationData(structuredClone(m.default))
    );
  }, []);

  const handleComplete = () => {
    if (lottieRef.current) {
      setTimeout(() => {
        lottieRef.current?.goToAndPlay(0);
      }, 700);
    }
  };

  return <div className={className} {...props}>
    {animationData ? (
      <Lottie
        lottieRef={lottieRef}
        animationData={animationData}
        autoplay
        onComplete={handleComplete}
        style={{ width: "100%", height: "100%" }}
      />
    ) : (
      <Skeleton className="w-full h-full rounded-[10px]" style={{ width: "100%", height: "100%" }} />
    )}
  </div>
}