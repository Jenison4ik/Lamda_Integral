import Lottie from "lottie-react";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Emoji({
  type,
  className,
  ...props
}: {
  type: "sad" | "pockerface" | "star";
} & React.ComponentProps<"div">) {
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
    <div className={className} {...props}>
      {animationData ? (
        <Lottie animationData={animationData} loop autoplay style={{ width: "100%", height: "100%" }} />
      ) : (
        <Skeleton className="w-full h-full rounded-full" style={{ width: "100%", height: "100%" }} />
      )}
    </div>
  );
}
