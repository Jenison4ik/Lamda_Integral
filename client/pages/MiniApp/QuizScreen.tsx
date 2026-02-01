import { useAppContext } from "@/providers/AppContex";
import { Button } from "@/components/ui/button";
import useHaptic from "@/hooks/useHaptic";
import MathBlock from "@/components/MathBlock";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FieldLabel } from "@/components/ui/field";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export default function QuizScreen() {
  const { hapticTrigger } = useHaptic();
  const { setAppState } = useAppContext();
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const handleAnswerChange = (value: string) => {
    hapticTrigger("soft");
    setSelectedAnswer(value);
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-4 ">
      <div className="flex flex-row items-center justify-between gap-4 text-sm w-full max-w-sm">
        <Badge>Вопрос 1/10</Badge>
        <Badge variant={"secondary"}>{"Не решен"}</Badge>
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Вычислите неопределенный интеграл</CardTitle>
        </CardHeader>
        <CardContent>
          <MathBlock
            formula="\int \frac{dx}{\sqrt{1 - (\ln x)^2}} \cdot \frac{1}{x}"
            className="text-lg"
            fontSize={30}
          />
        </CardContent>
      </Card>
      <Card className="w-full max-w-sm">
        <CardContent>
          <RadioGroup
            className="max-w-sm"
            value={selectedAnswer}
            onValueChange={handleAnswerChange}
          >
            <FieldLabel htmlFor="plus-plan">
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>
                    <MathBlock formula="\arcsin(\ln x) + C" fontSize={15} />
                  </FieldTitle>
                </FieldContent>
                <RadioGroupItem
                  value="plus"
                  id="plus-plan"
                  className="hidden"
                />
              </Field>
            </FieldLabel>
            <FieldLabel htmlFor="pro-plan">
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>
                    <MathBlock formula="\arccos(\ln x) + C" fontSize={15} />
                  </FieldTitle>
                </FieldContent>
                <RadioGroupItem value="pro" id="pro-plan" className="hidden" />
              </Field>
            </FieldLabel>
            <FieldLabel htmlFor="enterprise-plan">
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>
                    <MathBlock formula="\ln|\ln x + \sqrt{1-(\ln x)^2}| + C" fontSize={15} />
                  </FieldTitle>
                </FieldContent>
                <RadioGroupItem
                  value="enterprise"
                  id="enterprise-plan"
                  className="hidden"
                />
              </Field>
            </FieldLabel>
          </RadioGroup>
        </CardContent>
      </Card>
      <Button
        onClick={() => {
          hapticTrigger("medium");
          setAppState("result");
        }}
        className="w-full max-w-sm mt-4 bg-primary text-background hover:bg-primary/80 text-base font-medium cursor-pointer"
        disabled={!selectedAnswer}
      >
        {selectedAnswer ? "Следующий вопрос" : "Выберите ответ"}
      </Button>
    </main>
  );
}
