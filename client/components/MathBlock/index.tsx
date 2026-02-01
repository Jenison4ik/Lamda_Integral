import katex from "katex";
import { useEffect, useRef } from "react";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";
import styles from "./style.module.css"

export default function MathBlock({
  formula,
  className,
  fontSize
}: {
  formula: string;
  className?: string;
  fontSize?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref?.current) return;

    katex.render(formula, ref.current, {
      displayMode: true,
      throwOnError: false,
    });
  }, [formula]);
  return (
    <div className={cn("text-base", styles["math-block"], className)}>
      <div ref={ref} className="katex w-full h-full" style={fontSize ? { fontSize: `${fontSize}px` } : {}} />
    </div>
  );
}
