import { useAppContext } from "@/providers/AppContex";
import useHaptic from "@/hooks/useHaptic";
import { useEffect, useMemo, useState, useTransition } from "react";
import { backButton, retrieveLaunchParams } from "@tma.js/sdk-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import "./style.css";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@radix-ui/react-label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { MoveRight } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";

export default function QuizSettings() {
  const { setAppState } = useAppContext();
  const { hapticTrigger } = useHaptic();
  const launchParams = useMemo(() => retrieveLaunchParams(), []);
  const [numOfQuestions, setNumOfQuestions] = useState(10);
  const [inputValue, setInputValue] = useState("10");
  const [isPending, startTransition] = useTransition();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const photoUrl = launchParams?.tgWebAppData?.user?.photo_url;
  const firstName = launchParams?.tgWebAppData?.user?.first_name;
  const hasUserData = !!firstName;

  const showTextSkeleton = !hasUserData;

  function backToMenuBtn() {
    if (backButton.isSupported()) {
      backButton.mount();
      backButton.show();
      backButton.onClick(() => {
        backButton.onClick(() => {
          startTransition(() => {
            setAppState("main");
          });
        });
      });
      return () => {
        backButton.hide();
        backButton.unmount();
      };
    }
    return () => {};
  }

  useEffect(() => {
    const backbtn = backToMenuBtn();

    return backbtn;
  }, []);

  useEffect(() => {
    //Загрузка аватарки
    if (photoUrl) {
      console.log("photoUrl", photoUrl);
      setImageLoaded(false);
      setImageError(false);
    }
  }, [photoUrl]);

  return (
    <main>
      <Card>
        <CardHeader className="flex items-center gap-2 ">
          <div className="w-[50px] h-[50px] rounded-full shrink-0 relative">
            {photoUrl && (
              <>
                <img
                  src={photoUrl}
                  alt="user"
                  className="w-full h-full rounded-full object-cover"
                  style={{
                    opacity: imageLoaded && !imageError ? 1 : 0,
                    position:
                      imageLoaded && !imageError ? "relative" : "absolute",
                  }}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => {
                    setImageError(true);
                  }}
                />
                {(!imageLoaded || imageError) && (
                  <Skeleton className="w-full h-full rounded-full absolute inset-0" />
                )}
              </>
            )}
            {!photoUrl && <Skeleton className="w-full h-full rounded-full" />}
          </div>

          {showTextSkeleton ? (
            <div className="grid gap-2 flex-1">
              <Skeleton className="h-6 w-[200px]" />
            </div>
          ) : (
            <CardTitle className="text-xl">Привет 👋, {firstName}!</CardTitle>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Выбери параметры квиза и приступай к решению интегралов
          </p>
          <FieldGroup>
            <Field>
              <div className="flex items-center gap-3 mb-3 justify-between">
                <FieldLabel
                  htmlFor="input-field-num-of-questions"
                  className="whitespace-nowrap font-semibold    text-lg"
                >
                  Количество вопросов
                </FieldLabel>
                <Input
                  id="input-field-num-of-questions"
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min="5"
                  max="20"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                  }}
                  onBlur={(e) => {
                    const value = parseInt(e.target.value);
                    if (isNaN(value) || value < 5) {
                      setNumOfQuestions(5);
                      setInputValue("5");
                    } else if (value > 20) {
                      setNumOfQuestions(20);
                      setInputValue("20");
                    } else {
                      setNumOfQuestions(value);
                      setInputValue(value.toString());
                    }
                  }}
                  placeholder=""
                  className="w-auto min-w-[80px]"
                  disabled={isPending}
                />
              </div>
              <Slider
                min={5}
                max={20}
                step={1}
                value={[numOfQuestions]}
                onValueChange={(values) => {
                  setNumOfQuestions(values[0]);
                  setInputValue(values[0].toString());
                  hapticTrigger("soft");
                }}
                className="w-full"
                disabled={isPending}
              />
              <FieldDescription>Минимум 5, максимум 20</FieldDescription>
            </Field>

            <Separator />
            <Field>
              <FieldLabel className="whitespace-nowrap font-semibold text-lg">
                Вариант ответов
              </FieldLabel>
              <RadioGroup
                defaultValue="end"
                onValueChange={() => hapticTrigger("soft")}
                disabled={isPending}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="every" id="every" />
                  <Label htmlFor="every">Ответы после каждого</Label>
                </div>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="end" id="end" />
                  <Label htmlFor="end">Результат в конце</Label>
                </div>
              </RadioGroup>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>
      <Button
        className="w-full max-w-sm mt-4 bg-primary text-background hover:bg-primary/80 text-base font-medium cursor-pointer"
        onClick={() => {
          hapticTrigger("medium");
          startTransition(() => {
            setAppState("quiz");
          });
        }}
        disabled={isPending}
      >
        {isPending ? <Spinner /> : "Поехали"}
        {!isPending && <MoveRight scale={35} strokeWidth={2.75} />}
      </Button>
    </main>
  );
}
