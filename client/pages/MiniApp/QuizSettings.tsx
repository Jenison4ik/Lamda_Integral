import { useAppContext } from "@/providers/AppContex";
import useHaptic from "@/hooks/useHaptic";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  backButton,
  retrieveLaunchParams,
} from "@tma.js/sdk-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import "./style.css";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@radix-ui/react-label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { MoveRight } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";



export default function QuizSettings() {
  const { setAppState } = useAppContext();
  const { hapticTrigger } = useHaptic();
  const launchParams = useMemo(() => retrieveLaunchParams(), []);
  const [numOfQuestions, setNumOfQuestions] = useState(10);
  const [inputValue, setInputValue] = useState("10");
  const [isPending, startTransition] = useTransition();


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
        backButton.unmount()

      }
    }
    return () => { }
  }

  useEffect(() => {
    const backbtn = backToMenuBtn();

    return backbtn;
  }, [])


  return (
    <main>
      <Card>
        <CardHeader className="flex items-center gap-2 ">
          <img
            src={
              launchParams?.tgWebAppData?.user?.photo_url ??
              "./img/user_placeholder.jpeg"
            }
            alt="user"
            className="w-50px] h-[50px] rounded-full"
          />
          <CardTitle className="text-xl">
            Привет 👋, {launchParams?.tgWebAppData?.user?.first_name}!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Выбери параметры квиза и приступай к решению интегралов</p>
          <FieldGroup>
            <Field>
              <div className="flex items-center gap-3 mb-3">
                <FieldLabel htmlFor="input-field-num-of-questions" className="whitespace-nowrap font-semibold    text-lg">
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
                  placeholder="Количество вопросов"
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
              <FieldDescription>
                Минимум 5, максимум 20
              </FieldDescription>
            </Field>

            <Separator />
            <Field>
              <FieldLabel className="whitespace-nowrap font-semibold text-lg">Вариант ответов</FieldLabel>
              <RadioGroup defaultValue="end" onValueChange={() => (hapticTrigger("soft"))} disabled={isPending}>
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
        className="w-full mt-4 bg-primary text-background hover:bg-primary/80 text-lg font-semibold cursor-pointer"
        onClick={() => {
          hapticTrigger("medium");
          startTransition(() => {
            setAppState("quiz");
          })
        }}
        disabled={isPending}
      >
        {isPending ? <Spinner /> : "Поехали"}
        {!isPending && <MoveRight scale={15} />}
      </Button>
    </main>
  );
}
