import { useEffect, useState } from 'react';
import { getToken } from '../../utils/auth';

export default function Polisy() {
  const [polisy, setPolisy] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPolisy() {
      const token = getToken();

      const res = await fetch('https://api.autoguardian.pl/pobierz-polisy', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setPolisy(data);
      } else {
        alert('Błąd: ' + (data.detail || 'Nie udało się pobrać danych'));
      }

      setLoading(false);
    }

    fetchPolisy();
  }, []);

  if (loading) return <p>Ładowanie...</p>;

  return (
    <div>
      <h1>Moje polisy</h1>

      {polisy.length === 0 ? (
        <p>Brak zapisanych polis</p>
      ) : (
        <ul>
          {polisy.map((p) => (
            <li key={p.id}>
              <strong>ID:</strong> {p.id} — <strong>Utworzono:</strong>{' '}
              {new Date(p.created_at).toLocaleString()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
