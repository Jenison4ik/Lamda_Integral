import { useState, useEffect } from 'react';
import './App.css';

interface ApiResponse {
  message: string;
}

function App() {
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMessage();
  }, []);

  const fetchMessage = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/hello');
      if (!response.ok) {
        throw new Error('Failed to fetch');
      }
      const data: ApiResponse = await response.json();
      setMessage(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>TG Integral App 2.0</h1>
        <p>React + Vite + Express + TypeScript</p>
      </header>
      <main className="app-main">
        {loading && <p>Загрузка...</p>}
        {error && <p className="error">Ошибка: {error}</p>}
        {message && !loading && (
          <div className="message">
            <h2>Ответ от сервера:</h2>
            <p>{message}</p>
          </div>
        )}
        <button onClick={fetchMessage} disabled={loading}>
          Обновить
        </button>
      </main>
    </div>
  );
}

export default App;

