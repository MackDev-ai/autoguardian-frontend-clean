// pages/me.js
"use client";

import { useEffect, useState } from 'react';
import { getToken } from '../../utils/auth';

export default function Me() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function fetchMe() {
      const token = getToken();
      const res = await fetch('https://api.autoguardian.pl/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok) {
        setUser(data);
      } else {
        alert('Błąd: ' + data.detail);
      }
    }

    fetchMe();
  }, []);

  if (!user) return <p>Ładowanie danych...</p>;

  return (
    <div>
      <h1>Twój profil</h1>
      <p>Email: {user.email}</p>
    </div>
  );
}
