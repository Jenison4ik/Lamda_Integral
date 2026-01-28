import DarkVeil from "@/components/DarkVeil";
import styles from "./style.scss";
import { Button } from "@/components/ui/button";
import { RiTelegram2Fill } from "react-icons/ri";
export default function NonTg() {
  function handleClick() {
    window.location.href = "https://t.me/lambda_integral_bot";
  }

  return (
    <div className="relative h-screen w-screen text-white overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <DarkVeil
          hueShift={0}
          noiseIntensity={0}
          scanlineIntensity={0}
          speed={0.5}
          scanlineFrequency={0}
          warpAmount={0}
          resolutionScale={1}
        />
      </div>
      <div className="relative flex flex-col items-center justify-center gap-4 h-full w-full">
        <h1 className="font-bold text-6xl text-center">Lamda Integrall</h1>
        <p className="text-center">
          Это телеграм бот для тренировки по интегрированию, вы можете
          опробовать его прямо сейчас
        </p>
        <Button
          onClick={handleClick}
          className={
            "gap-2 w-auto cursor-pointer hover:scale-105 transition-all duration-300 bg-white text-black hover:bg-white/80"
          }
        >
          <RiTelegram2Fill className="size-4" />
          Попробовать сейчас
        </Button>
      </div>
    </div>
  );
}
