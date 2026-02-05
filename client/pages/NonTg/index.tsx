import DarkVeil from "@/components/DarkVeil";
import { Button } from "@/components/ui/button";
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
        <h1 className="font-bold text-6xl text-center">Lambda Integrall</h1>
        <p className="text-center">
          Это телеграм бот для тренировки по интегрированию, вы можете
          опробовать его прямо сейчас
        </p>
        <Button
          onClick={handleClick}
          className={
            "gap-2 w-auto cursor-pointer hover:scale-105 transition-all duration-300 bg-primary text-white"
          }
        >
          <img src="./img/telegram.svg" alt="" className="w-[15px] h-auto" />
          Попробовать сейчас
        </Button>
      </div>
    </div>
  );
}
