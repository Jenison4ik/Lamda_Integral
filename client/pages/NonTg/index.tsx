import styles from "./style.scss";
import { RiTelegram2Fill } from "react-icons/ri";
export default function NonTg() {
  function handleClick() {
    window.location.href = "https://t.me/lambda_integral_bot";
  }

  return (
    <div>
      <h1>Lamda Integrall</h1>
      <p>
        Это телеграм бот для тренировки по интегрированию, вы можете опробовать
        его прямо сейчас
      </p>
      <button onClick={handleClick}>
        <RiTelegram2Fill />
        Попробовать сейчас
      </button>
    </div>
  );
}
