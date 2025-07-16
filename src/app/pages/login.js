// pages/login.js

import { useState } from 'react';
import { saveToken } from '../utils/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleLogin(e) {
    e.preventDefault();

    const form = new URLSearchParams();
    form.append('username', email);
    form.append('password', password);

    const res = await fetch('https://api.autoguardian.pl/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
    });

    const data = await res.json();
    console.log(data);

    if (res.ok) {
      saveToken(data.access_token);
      alert('Zalogowano!');
    } else {
      alert('Błąd: ' + data.detail);
    }
  }

  return (
    <form onSubmit={handleLogin}>
      <h1>Logowanie</h1>
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Hasło" value={password} onChange={e => setPassword(e.target.value)} />
      <button type="submit">Zaloguj</button>
    </form>
  );
}
