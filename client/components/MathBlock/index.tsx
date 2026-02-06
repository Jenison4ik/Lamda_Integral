import katex from "katex";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import styles from "./style.module.css"

// Ленивая загрузка CSS KaTeX для улучшения LCP
// CSS загружается только при первом использовании MathBlock
let katexCssLoaded = false;
const loadKatexCss = () => {
  if (!katexCssLoaded && typeof document !== "undefined") {
    const existingLink = document.querySelector('link[href*="katex"]');
    if (!existingLink) {
      // Используем динамический импорт для CSS
      import("katex/dist/katex.min.css").catch(() => {
        // Fallback: создаем link элемент если динамический импорт не работает
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "/node_modules/katex/dist/katex.min.css";
        link.media = "print";
        link.onload = () => {
          link.media = "all";
        };
        document.head.appendChild(link);
      });
    }
    katexCssLoaded = true;
  }
};

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

    // Загружаем CSS асинхронно при первом использовании
    loadKatexCss();

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
