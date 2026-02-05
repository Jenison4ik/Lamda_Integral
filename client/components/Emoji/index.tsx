import Lottie from "lottie-react";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Emoji({
  type,
}: {
  type: "sad" | "pockerface" | "star";
}) {
  const [animationData, setAnimationData] = useState<any>(null);
  useEffect(() => {
    switch (type) {
      case "sad":
        import("./sad.json").then((m) =>
          setAnimationData(structuredClone(m.default))
        );
        break;
      case "pockerface":
        import("./pokerface.json").then((m) =>
          setAnimationData(structuredClone(m.default))
        );
        break;
      case "star":
        import("./star.json").then((m) =>
          setAnimationData(structuredClone(m.default))
        );
        break;
    }
  }, [type]);

  return (
    <div style={{ width: 100, height: 100 }}>
      {animationData ? (
        <Lottie animationData={animationData} loop autoplay />
      ) : (
        <Skeleton className="w-full h-full border-radius-full" />
      )}
    </div>
  );
}
