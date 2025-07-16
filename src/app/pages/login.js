import { useState } from 'react';
import { useRouter } from 'next/router';
import { saveToken } from '@/utils/auth';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true); // true = login, false = register
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? '/login' : '/register';

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      if (isLogin) {
        saveToken(data.access_token);
        router.push('/polisys');
      } else {
        // po rejestracji automatycznie przełącz na logowanie
        setIsLogin(true);
      }
    } else {
      setError(data.detail || 'Coś poszło nie tak');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20">
      <h2 className="text-2xl font-bold mb-4">{isLogin ? 'Logowanie' : 'Rejestracja'}</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
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
          {isLogin ? 'Zaloguj się' : 'Zarejestruj się'}
        </button>
      </form>

      <button
        onClick={() => {
          setIsLogin(!isLogin);
          setError(null);
        }}
        className="mt-4 text-sm text-blue-500 underline"
      >
        {isLogin ? 'Nie masz konta? Zarejestruj się' : 'Masz już konto? Zaloguj się'}
      </button>
    </div>
  );
}
