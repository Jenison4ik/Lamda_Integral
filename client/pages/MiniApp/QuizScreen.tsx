import { useAppContext } from "@/providers/AppContex";
import { Button } from "@/components/ui/button";
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

export default function QuizScreen() {
  const { setAppState } = useAppContext();
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const handleAnswerChange = (value: string) => {
    setSelectedAnswer(value);
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Вопрос 1</CardTitle>
        </CardHeader>
        <CardContent>
          <MathBlock formula="\int \frac{dx}{\sqrt{1 - (\ln x)^2}} \cdot \frac{1}{x}" />
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
                    <MathBlock formula="\arcsin(\ln x) + C" />
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
                    <MathBlock formula="\arccos(\ln x) + C" />
                  </FieldTitle>
                </FieldContent>
                <RadioGroupItem value="pro" id="pro-plan" className="hidden" />
              </Field>
            </FieldLabel>
            <FieldLabel htmlFor="enterprise-plan">
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>
                    <MathBlock formula="\ln|\ln x + \sqrt{1-(\ln x)^2}| + C" />
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
        onClick={() => setAppState("result")}
        className="w-full mt-4 bg-primary text-background hover:bg-primary/80 text-base font-medium cursor-pointer"
        disabled={!selectedAnswer}
      >
        {selectedAnswer ? "Следующий вопрос" : "Выберите ответ"}
      </Button>
    </main>
  );
}
