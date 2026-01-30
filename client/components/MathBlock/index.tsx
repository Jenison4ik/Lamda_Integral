import katex from "katex";
import { useEffect, useRef } from "react";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";

export default function MathBlock({
  formula,
  className,
}: {
  formula: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref?.current) return;

    katex.render(formula, ref.current, {
      displayMode: true,
      throwOnError: false,
    });
  }, [formula]);
  return <div ref={ref} className={cn("katex", className)}></div>;
}
