import { useState } from 'react';
import { useRouter } from 'next/router';
import { saveToken } from '@/utils/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const router = useRouter();

  async function handleLogin(e) {
    e.preventDefault();
    setError(null);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      saveToken(data.access_token);
      router.push('/polisy');
    } else {
      setError(data.detail || 'Nie udało się zalogować');
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20">
      <h2 className="text-2xl font-bold mb-4">Logowanie</h2>

      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="w-full border p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Hasło"
          className="w-full border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="text-red-500">{error}</p>}

        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">
          Zaloguj się
        </button>
      </form>

      <p className="mt-4 text-sm">
        Nie masz konta?{' '}
        <a href="/register" className="text-blue-500 underline">
          Zarejestruj się
        </a>
      </p>
    </div>
  );
}
