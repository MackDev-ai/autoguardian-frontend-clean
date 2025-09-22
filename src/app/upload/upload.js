import { useState } from 'react';
import { getToken } from '../../utils/auth';

export default function UploadPDF() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file) return alert('Wybierz plik PDF');

    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    const token = getToken();

    // 1. Wyślij plik PDF do backendu
    const res = await fetch('https://api.autoguardian.pl/upload-pdf', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await res.json();
    setResult(data);

    if (!res.ok) {
      alert('Błąd OCR: ' + (data.detail || 'Nieznany błąd'));
      setLoading(false);
      return;
    }

    // 2. Wyślij dane do zapisania w bazie
    const save = await fetch('https://api.autoguardian.pl/zapisz-polise', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ data: data.extracted }),
    });

    const saved = await save.json();
    if (save.ok) {
      alert('Polisa zapisana do bazy!');
    } else {
      alert('Błąd zapisu: ' + (saved.detail || 'Nieznany'));
    }

    setLoading(false);
  };

  return (
    <div>
      <h1>Wgraj plik PDF z polisą</h1>
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={!file || loading}>
        {loading ? 'Przetwarzanie...' : 'Wyślij i zapisz'}
      </button>

      {result && (
        <div style={{ marginTop: '2rem' }}>
          <h2>Podgląd danych z PDF:</h2>
          <pre>{JSON.stringify(result.extracted, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
