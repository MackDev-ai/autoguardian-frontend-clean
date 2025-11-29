"use client";
import { useCallback, useEffect, useState } from "react";
import { useAuth, authHeaders } from "../../context/AuthProvider";
import { ENDPOINTS, tryFetch } from "../../lib/api";

/* ==== BACKEND LIBS (CRUD) ==== */
import {
  listVehicles,
  createVehicle,
  deleteVehicle,
  type Vehicle,
  type CreateVehicleInput,
} from "../../lib/vehicles";

import {
  // listPolicies,
  // createPolicy,
  // deletePolicy,
  type Policy,
} from "../../lib/policies";

/* ==== VALIDATORS ==== */
import {
  isValidVIN,
  // isDateRangeValid,
  // isNonNegativeNumberLike,
} from "../../lib/validators";

/* ==== UI (tabs) ==== */
type TabKey = "auth" | "profile" | "garage" | "polisy" | "upload";

type MeData = Record<string, unknown>;

type GarageVehicle = Vehicle & {
  brand?: string;
  reg?: string;
  inspection?: string;
  ocUntil?: string;
  odo?: number | string;
};

type GarageVehicleForm = Partial<GarageVehicle>;

type ISODate = string;
type PolicyLoose = Policy & {
  from?: ISODate;
  to?: ISODate;
};
type Polisa = {
  id: string;
  number: string | null;
  insurer: string | null;
  premium: string | number | null;
  valid_from: string | null;
  valid_to: string | null;
  deductible: string | number | null;
  coverage: string[] | string | null;
};

type ExtractedValue = string | number | boolean | null | undefined;

type ExtractedData = {
  policy_number?: string;
  insurer?: string;
  premium?: string | number;
  start_date?: string;
  end_date?: string;
  deductible?: string | number;
  scope?: string;
  [key: string]: ExtractedValue; // pozwalamy backendowi zwrócić inne pola
};

type PolicyStatusType =
  | "active"
  | "expiring_soon"
  | "expired"
  | "not_started"
  | "unknown";

type PolicyStatus = {
  type: PolicyStatusType;
  label: string;
  daysLeft?: number;
};

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function getPolicyStatus(
  validFrom?: string | null,
  validTo?: string | null
): PolicyStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const from = parseDate(validFrom);
  const to = parseDate(validTo);

  if (!from && !to) {
    return { type: "unknown", label: "Brak danych o okresie" };
  }

  if (from && from.getTime() > today.getTime()) {
    return {
      type: "not_started",
      label: `Jeszcze nieaktywna (start ${from.toLocaleDateString("pl-PL")})`,
    };
  }

  if (to && to.getTime() < today.getTime()) {
    return {
      type: "expired",
      label: `Wygasła ${to.toLocaleDateString("pl-PL")}`,
    };
  }

  if (to) {
    const diffMs = to.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (daysLeft <= 7) {
      return {
        type: "expiring_soon",
        label: `Wygasa za ${daysLeft} dni`,
        daysLeft,
      };
    }
    return {
      type: "active",
      label: `Aktywna (do ${to.toLocaleDateString("pl-PL")})`,
      daysLeft,
    };
  }

  return { type: "active", label: "Aktywna (brak daty końca)" };
}

// interface PolicyListEnvelope {
//   items?: PolicyLoose[];
// }

interface MappedPolicyPreview {
  number: string;
  insurer: string;
  premium: string;
  valid_from: string;
  valid_to: string;
  deductible: string;
  coverage: string;
}

type OcrExtract = PolicyLoose & {
  policy_number?: string;
  number?: string;
  insurer?: string;
  premium?: number | string;
  valid_from?: string;
  valid_to?: string;
  deductible?: number | string;
  coverage?: string[] | string;
  detail?: string;
  [key: string]: unknown;
};

type UploadResponse = OcrExtract | { extracted: OcrExtract; detail?: string };

type LoginResponse = { access_token?: string; detail?: string };
type RegisterResponse = { detail?: string };
type SavePolicyResponse = Record<string, unknown> & { detail?: string };

const EMPTY_MAPPED_POLICY: MappedPolicyPreview = {
  number: "",
  insurer: "",
  premium: "",
  valid_from: "",
  valid_to: "",
  deductible: "",
  coverage: "",
};

function readLocalArray<T>(key: string): T[] {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function detailFrom(payload: unknown): string | undefined {
  if (payload && typeof payload === "object" && "detail" in payload) {
    const value = (payload as { detail?: unknown }).detail;
    return typeof value === "string" ? value : undefined;
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function pickOcrExtract(payload: unknown): OcrExtract | null {
  if (!isRecord(payload)) return null;
  if ("extracted" in payload) {
    const value = (payload as { extracted?: unknown }).extracted;
    return isRecord(value) ? (value as OcrExtract) : null;
  }
  return payload as OcrExtract;
}

function toCreateVehicleInput(form: GarageVehicleForm): CreateVehicleInput {
  const base = {
    ...form,
    make: form.brand ?? form.make,
    plate: form.reg ?? form.plate,
  };
  const { id, created_at, updated_at, ...rest } = base as CreateVehicleInput & {
    id?: unknown;
    created_at?: unknown;
    updated_at?: unknown;
  };
  void id;
  void created_at;
  void updated_at;
  return rest;
}

function policyPeriod(policy: PolicyLoose): { from?: string; to?: string } {
  return {
    from: policy.valid_from ?? policy.from,
    to: policy.valid_to ?? policy.to,
  };
}

function normalizePolicy(policy: PolicyLoose): PolicyLoose {
  const { from, to } = policyPeriod(policy);
  return {
    ...policy,
    valid_from: from,
    valid_to: to,
  };
}

// function extractPolicies(payload: unknown): PolicyLoose[] {
//   if (Array.isArray(payload)) {
//     return payload.filter((item): item is PolicyLoose => typeof item === "object" && item !== null).map(normalizePolicy);
//   }
//   if (payload && typeof payload === "object") {
//     const { items } = payload as PolicyListEnvelope;
//     if (Array.isArray(items)) {
//       return items
//         .filter((item): item is PolicyLoose => typeof item === "object" && item !== null)
//         .map(normalizePolicy);
//     }
//   }
//   return [];
// }

// function formatPolicyPeriod(policy: PolicyLoose): string {
//   const { from, to } = policyPeriod(policy);
//   const safeFrom = from && from.length > 0 ? from : "—";
//   const safeTo = to && to.length > 0 ? to : "—";
//   return `${safeFrom} → ${safeTo}`;
// }

export default function Page() {
  const { setToken, isAuthed } = useAuth();
  const [tab, setTab] = useState<TabKey>("auth");

  return (
  <>
    <header>
      <div className="wrap nav">
        <div className="brand">🚗 AutoGuardian · MVP</div>
        
        {isAuthed ? (
          <>
            {(["profile", "garage", "polisy", "upload"] as TabKey[]).map((t) => (
              <button
                key={t}
                className={`tab ${tab === t ? "active" : ""}`}
                onClick={() => setTab(t)}
              >
                {t === "profile"
                  ? "Profil"
                  : t === "garage"
                  ? "Garaż"
                  : t === "polisy"
                  ? "Polisy"
                  : "Upload PDF"}
              </button>
            ))}
          </>
        ) : (
          <button
            key="auth"
            className={`tab ${tab === "auth" ? "active" : ""}`}
            onClick={() => setTab("auth")}
          >
            Logowanie / Rejestracja
          </button>
        )}

        <div className="right inline">
          <span className="badge">
            {isAuthed ? "Zalogowany" : "Niezalogowany"}
          </span>
          {isAuthed && (
            <button className="btn ghost" onClick={() => setToken(null)}>
              Wyloguj
            </button>
          )}
        </div>
      </div>
    </header>

    <main className="wrap">
      {tab === "auth" && <AuthSection onSuccess={() => setTab("profile")} />}
      {tab === "profile" && <ProfileSection />}
      {tab === "garage" && <GarageSection />}
      {tab === "polisy" && <PolisySection />}
      {tab === "upload" && <UploadSection />}
    </main>
  </>
);
}

/* ========================= AUTH ========================= */
function AuthSection({ onSuccess }: { onSuccess?: () => void }) {
  const { setToken } = useAuth();
  const [loginEmail,setLoginEmail]=useState("");
  const [loginPass,setLoginPass]=useState("");
  const [regEmail,setRegEmail]=useState("");
  const [regPass,setRegPass]=useState("");
  const [loginMsg,setLoginMsg]=useState("");
  const [regMsg,setRegMsg]=useState("");

  async function handleLogin(): Promise<void> {
    setLoginMsg("Logowanie...");
    const res = await tryFetch<LoginResponse>({
      paths: ENDPOINTS.login,
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ email: loginEmail, password: loginPass })
    });
    if (res.ok && (res.data?.access_token)) {
      setToken(res.data.access_token);
      setLoginMsg("✅ Zalogowano.");
      onSuccess?.();
    } else {
      setLoginMsg("❌ " + (detailFrom(res.data) || "Nie udało się zalogować"));
    }
  }

  async function handleRegister(): Promise<void> {
    setRegMsg("Rejestruję...");
    const res = await tryFetch<RegisterResponse>({
      paths: ENDPOINTS.register,
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ email: regEmail, password: regPass })
    });
    if (res.ok) setRegMsg("✅ Rejestracja OK — możesz się zalogować.");
    else setRegMsg("❌ " + (detailFrom(res.data) || "Błąd rejestracji"));
  }

  return (
    <section className="card">
      <h1>Logowanie / Rejestracja</h1>
      <p className="muted">Jedna karta do obu akcji.</p>
      <div className="row two">
        <div className="card">
          <h2>Logowanie</h2>
          <label>Email
            <input value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} />
          </label>
          <label>Hasło
            <input type="password" value={loginPass} onChange={e=>setLoginPass(e.target.value)} />
          </label>
          <div className="inline">
            <button className="btn primary" onClick={handleLogin}>Zaloguj</button>
            <span className="muted">{loginMsg}</span>
          </div>
        </div>

        <div className="card">
          <h2>Rejestracja</h2>
          <label>Email
            <input value={regEmail} onChange={e=>setRegEmail(e.target.value)} />
          </label>
          <label>Hasło
            <input type="password" value={regPass} onChange={e=>setRegPass(e.target.value)} />
          </label>
          <div className="inline">
            <button className="btn green" onClick={handleRegister}>Utwórz konto</button>
            <span className="muted">{regMsg}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ========================= PROFILE (/me) ========================= */
function ProfileSection() {
  const { token } = useAuth();
  const [msg,setMsg]=useState("");
  const [data,setData]=useState<MeData|null>(null);

  const formatValue = (value: unknown) => (
    value !== null && typeof value === "object"
      ? JSON.stringify(value)
      : String(value ?? "")
  );

  async function loadMe(): Promise<void> {
    setMsg("Pobieram...");
    const res = await tryFetch<MeData>({
      paths: ENDPOINTS.me,
      headers: authHeaders(token)
    });
    if (res.ok){
      setData(res.data);
      setMsg("Gotowe.");
    } else {
      setMsg("❌ "+(detailFrom(res.data)||"Błąd"));
    }
  }

  return (
    <section className="card">
      <h1>Profil użytkownika</h1>
      <div className="inline">
        <button className="btn" onClick={loadMe}>Pobierz profil</button>
        <span className="muted">{msg}</span>
      </div>
      {data && (
        <div className="item" style={{marginTop:8}}>
          <div className="kv">
            {Object.entries(data).map(([k,v])=>(
              <div key={k} style={{display: "contents"}}>
                <div>{k}</div>
                <div>{formatValue(v)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/* ========================= GARAGE (backend + fallback) ========================= */
const carsKey = "ag_cars";
const getCarsLocal = ():GarageVehicle[] => readLocalArray<GarageVehicle>(carsKey);
const setCarsLocal = (arr:GarageVehicle[]) => localStorage.setItem(carsKey, JSON.stringify(arr));
const backendUnavailable = (status?: number) => !status || status===404 || status===501;

function GarageSection() {
  const { token, setToken } = useAuth();
  const [cars,setCars]=useState<GarageVehicle[]>([]);
  const [form,setForm]=useState<GarageVehicleForm>({});
  const [msg,setMsg]=useState("");
  const [useLocal,setUseLocal]=useState(false);
  const [loading,setLoading]=useState(false);

  const applyVehicleMapping = (vehicle: Vehicle): GarageVehicle => ({
  ...vehicle,
  brand: vehicle.brand ?? vehicle.make,
  reg: vehicle.reg ?? vehicle.registration,
  odo: vehicle.odo ?? vehicle.mileage_km,
  inspection: vehicle.inspection ?? vehicle.inspection_date,
  ocUntil: vehicle.ocUntil ?? vehicle.insurance_date,
});

  const load = useCallback(async () => {
    setLoading(true); setMsg("Pobieram pojazdy...");
    const res = await listVehicles(token);
    if (res.ok && Array.isArray(res.data)) {
      setCars(res.data.map(applyVehicleMapping)); setUseLocal(false); setMsg("Gotowe.");
    } else if (res.status === 401) {
      setToken(null);
      setCars(getCarsLocal()); setUseLocal(true);
      setMsg("Sesja wygasła — zaloguj się ponownie. Pokazuję lokalne.");
    } else if (backendUnavailable(res.status)) {
      setCars(getCarsLocal()); setUseLocal(true);
      setMsg("Brak /vehicles — tryb lokalny (demo).");
    } else {
      setMsg("❌ " + (detailFrom(res.data) || "Błąd pobierania"));
    }
    setLoading(false);
  }, [token, setToken]);

  useEffect(() => {
    void load();
  }, [load]);

  async function add(): Promise<void> {
    if (!form.reg && !form.vin && !form.brand) {
      setMsg("Podaj min. rejestrację / VIN / markę."); return;
    }
    if (!isValidVIN(form.vin)) {
      setMsg("VIN niepoprawny (17 znaków, bez liter I, O, Q)."); return;
    }

    if (useLocal) {
      const next=[...cars, { ...form, id: String(Date.now()) }];
      setCarsLocal(next); setCars(next); setForm({}); setMsg("Dodano lokalnie.");
      return;
    }
    setMsg("Dodaję pojazd...");
    const payload = toCreateVehicleInput(form);
    const res = await createVehicle(payload, token);
    if (res.ok) { setMsg("✅ Dodano."); setForm({}); await load(); }
    else if (res.status===401) { setToken(null); setMsg("Sesja wygasła — zaloguj się ponownie."); }
    else setMsg("❌ " + (detailFrom(res.data) || "Błąd dodawania"));
  }

  async function remove(id?: string): Promise<void> {
    if (!id) return;
    if (useLocal) {
      const next=cars.filter(c=>c.id!==id);
      setCarsLocal(next); setCars(next); return;
    }
    setMsg("Usuwam...");
    const res = await deleteVehicle(id, token);
    if (res.ok) { setMsg("Usunięto."); await load(); }
    else if (res.status===401) { setToken(null); setMsg("Sesja wygasła — zaloguj się ponownie."); }
    else setMsg("❌ " + (detailFrom(res.data) || "Błąd usuwania"));
  }

  return (
    <section className="card">
      <h1>Garaż i dane o samochodzie</h1>
      <p className="muted">{useLocal ? "Tryb lokalny (demo)" : "Połączono z backendem"}</p>

      <div className="card">
        <h2>Dodaj pojazd</h2>
        <div className="row three">
          <label>Rejestracja
            <input value={form.reg||""} onChange={e=>setForm(f=>({...f,reg:e.target.value}))}/>
          </label>
          <label>VIN
            <input value={form.vin||""} maxLength={17} onChange={e=>setForm(f=>({...f,vin:e.target.value}))}/>
          </label>
          <label>Marka
            <input value={form.brand||""} onChange={e=>setForm(f=>({...f,brand:e.target.value}))}/>
          </label>
        </div>
        <div className="row three">
          <label>Model
            <input value={form.model||""} onChange={e=>setForm(f=>({...f,model:e.target.value}))}/>
          </label>
          <label>Rok
            <input value={String(form.year||"")} onChange={e=>setForm(f=>({...f,year:e.target.value}))}/>
          </label>
          <label>Przebieg
            <input value={String(form.odo||"")} onChange={e=>setForm(f=>({...f,odo:e.target.value}))}/>
          </label>
        </div>
        <div className="row two">
          <label>Przegląd do
            <input type="date" value={form.inspection||""} onChange={e=>setForm(f=>({...f,inspection:e.target.value}))}/>
          </label>
          <label>OC do
            <input type="date" value={form.ocUntil||""} onChange={e=>setForm(f=>({...f,ocUntil:e.target.value}))}/>
          </label>
        </div>
        <div className="inline">
          <button className="btn green" onClick={add} disabled={loading}>Dodaj do garażu</button>
          <span className="muted">{msg}</span>
        </div>
      </div>

      <div className="card">
        <h2>Twoje pojazdy</h2>
        <div className="list">
          {cars.length===0 && <div className="muted">{loading ? "Ładowanie..." : "Brak pojazdów"}</div>}
          {cars.map(c=>(
            <div key={c.id ?? `${c.vin}-${c.reg}`} className="item">
              <div className="inline" style={{justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <strong>{c.brand||"-"} {c.model||""}</strong> <span className="badge">{c.reg||"—"}</span>
                </div>
                <button className="btn warn" onClick={()=>remove(String(c.id))}>Usuń</button>
              </div>
              <div className="kv" style={{marginTop:8}}>
                <div>Rok</div><div>{c.year||"—"}</div>
                <div>VIN</div><div>{c.vin || "—"}</div>
                <div>Przebieg</div><div>{c.odo ? `${c.odo} km` : "—"}</div>
                <div>Przegląd do</div><div>{c.inspection||"—"}</div>
                <div>OC do</div><div>{c.ocUntil||"—"}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========================= POLISY (backend + fallback) ========================= */
// const polKey = "ag_policies";
// const getPolLocal = ():PolicyLoose[] => readLocalArray<PolicyLoose>(polKey);
// const setPolLocal = (arr:PolicyLoose[]) => localStorage.setItem(polKey, JSON.stringify(arr));

/* ========================= POLISY – LINK DO NOWEGO MODUŁU ========================= */
function PolisyFullModule() {
  const { token, isAuthed } = useAuth();

  // --- stan dla listy polis ---
  const [polisy, setPolisy] = useState<Polisa[]>([]);
  const [loadingPolisy, setLoadingPolisy] = useState(true);

  // --- stan dla uploadu PDF / OCR ---
  const [file, setFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [ocrText, setOcrText] = useState<string>("");
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);

  // ===========================
  //  POBIERANIE POLIS Z BACKENDU
  // ===========================
  const fetchPolisy = async (authToken: string | null) => {
    setLoadingPolisy(true);
    try {
      if (!authToken) {
        console.warn("Brak tokenu – użytkownik nie jest zalogowany.");
        setPolisy([]);
        setLoadingPolisy(false);
        return;
      }

      console.log("🔑 Token w /polisy (z AuthProvider):", authToken);

      const res = await fetch("https://api.autoguardian.pl/pobierz-polisy", {
        method: "GET",
        headers: {
          ...authHeaders(authToken),
        },
      });

      const data = await res.json();

      if (res.status === 401) {
        console.warn("401 przy pobieraniu polis – sesja wygasła.");
        alert("Sesja wygasła lub brak autoryzacji. Zaloguj się ponownie.");
        setPolisy([]);
        setLoadingPolisy(false);
        return;
      }

      if (!res.ok) {
        console.error("Błąd pobierania polis:", data);
        alert("Błąd pobierania polis: " + (data.detail || "Nieznany błąd"));
        setPolisy([]);
        return;
      }

      setPolisy(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Błąd połączenia z API (pobierz-polisy):", error);
      alert("Nie udało się pobrać polis.");
      setPolisy([]);
    } finally {
      setLoadingPolisy(false);
    }
  };

  useEffect(() => {
    fetchPolisy(token);
  }, [token]);

  // ===========================
  //  UPLOAD PDF + OCR + ZAPIS
  // ===========================
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    setOcrText("");
    setExtracted(null);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Wybierz plik PDF");
      return;
    }
    if (!token) {
      alert("Brak tokenu. Zaloguj się ponownie.");
      return;
    }

    setUploadLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // 1) OCR – wysyłamy PDF na backend
      const ocrRes = await fetch("https://api.autoguardian.pl/upload-pdf", {
        method: "POST",
        headers: {
          ...authHeaders(token),
        },
        body: formData,
      });

      const ocrData = await ocrRes.json();

      if (ocrRes.status === 401) {
        alert("Sesja wygasła lub brak autoryzacji. Zaloguj się ponownie.");
        return;
      }

      if (!ocrRes.ok) {
        console.error("Błąd OCR:", ocrData);
        alert(
          "Błąd podczas przetwarzania PDF: " +
            (ocrData.detail || "Nieznany błąd")
        );
        return;
      }

      const extractedData: ExtractedData | null =
        (ocrData.extracted as ExtractedData) || null;

      setOcrText(ocrData.ocr_text || ocrData.raw_text || "");
      setExtracted(extractedData);

      console.log("✅ Wynik OCR:", ocrData);

      // 2) ZAPIS POLISY – wysyłamy wyodrębnione dane do /zapisz-polise
      if (!extractedData) {
        alert("Brak wyodrębnionych danych z PDF – nie można zapisać polisy.");
        return;
      }

      const saveRes = await fetch("https://api.autoguardian.pl/zapisz-polise", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(token),
        },
        body: JSON.stringify({ data: extractedData }),
      });

      const saveData = await saveRes.json();

      if (saveRes.status === 401) {
        alert("Sesja wygasła lub brak autoryzacji przy zapisie polisy.");
        return;
      }

      if (!saveRes.ok) {
        console.error("Błąd zapisu polisy:", saveData);
        alert(
          "Błąd zapisu polisy: " +
            (saveData.detail || "Nieznany błąd podczas zapisu")
        );
        return;
      }

      alert("Polisa została zapisana w bazie.");

      setFile(null);
      setOcrText("");
      setExtracted(null);

      await fetchPolisy(token);
    } catch (error) {
      console.error("Błąd podczas uploadu PDF / zapisu polisy:", error);
      alert("Nie udało się przetworzyć pliku lub zapisać polisy.");
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Sekcja: Dodaj polisę z PDF (OCR) */}
      <section className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
        <h1 className="text-2xl font-bold mb-2">Dodaj polisę</h1>
        <p className="text-sm text-slate-300 mb-4">
          Możesz dodać nową polisę z pliku PDF (OCR). Po przetworzeniu pliku
          zapisujemy polisę w bazie i odświeżamy listę poniżej.
        </p>

        {!isAuthed ? (
          <div className="rounded bg-slate-800 p-4 text-sm text-slate-300">
            Musisz być zalogowany, aby dodać polisę z PDF.
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="text-sm"
              />
              <button
                onClick={handleUpload}
                disabled={!file || uploadLoading}
                className="px-4 py-2 rounded bg-blue-600 disabled:bg-blue-900 text-white text-sm"
              >
                {uploadLoading ? "Przetwarzanie..." : "Wyślij i przetwórz"}
              </button>
            </div>

            {/* Podgląd wyodrębnionych danych */}
            {extracted && (
              <div className="mt-4 text-sm bg-slate-800 rounded p-3 max-h-64 overflow-auto">
                <h2 className="font-semibold mb-2">
                  Podgląd danych z PDF (extracted):
                </h2>
                <pre className="whitespace-pre-wrap break-words">
                  {JSON.stringify(extracted, null, 2)}
                </pre>
              </div>
            )}

            {/* Wynik OCR (raw) */}
            {ocrText && (
              <div className="mt-4 text-xs bg-slate-800 rounded p-3 max-h-64 overflow-auto">
                <h2 className="font-semibold mb-2">Wynik OCR (raw):</h2>
                <pre className="whitespace-pre-wrap break-words">
                  {ocrText}
                </pre>
              </div>
            )}
          </>
        )}

        <div className="mt-4 text-xs text-slate-400">
          <p>
            Dane z OCR możesz później wykorzystać do porównań polis i
            przypomnień o końcu okresu ubezpieczenia.
          </p>
        </div>
      </section>

      {/* Sekcja: Lista polis */}
      <section className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
        <h2 className="text-xl font-bold mb-2">Twoje polisy</h2>
        <p className="text-sm text-slate-300 mb-4">
          Lista polis pobrana z backendu. Wyświetlamy podstawowe informacje;
          później rozbudujemy widok o szczegóły i status wygasania.
        </p>

        {!isAuthed ? (
          <div className="rounded bg-slate-800 p-4 text-sm text-slate-300">
            Musisz być zalogowany, aby zobaczyć swoje polisy.
          </div>
        ) : loadingPolisy ? (
          <div className="rounded bg-slate-800 p-4 text-sm text-slate-300">
            Ładowanie polis...
          </div>
        ) : polisy.length === 0 ? (
          <div className="rounded bg-slate-800 p-4 text-sm text-slate-400">
            Brak zapisanych polis w bazie.
          </div>
        ) : (
          <ul className="space-y-3 text-sm">
            {polisy.map((p) => {
              const coverageLabel = Array.isArray(p.coverage)
                ? p.coverage.join(", ")
                : p.coverage || "brak danych";

              const status = getPolicyStatus(p.valid_from, p.valid_to);

              const badgeBase =
                "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold";
              const badgeColor =
                status.type === "active"
                  ? "bg-green-600 text-white"
                  : status.type === "expiring_soon"
                  ? "bg-yellow-400 text-black"
                  : status.type === "expired"
                  ? "bg-red-600 text-white"
                  : status.type === "not_started"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-600 text-white";

              return (
                <li
                  key={p.id}
                  className="p-4 rounded bg-slate-800 border border-slate-700 flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-base">
                      {p.number || "(brak numeru polisy)"}{" "}
                      <span className="text-xs text-slate-400 ml-2">
                        ID: {p.id}
                      </span>
                    </div>
                    <span className={`${badgeBase} ${badgeColor}`}>
                      {status.label}
                    </span>
                  </div>

                  <div className="text-slate-200">
                    Ubezpieczyciel:{" "}
                    <span className="font-medium">
                      {p.insurer || "brak danych"}
                    </span>
                  </div>

                  <div className="text-slate-200">
                    Składka:{" "}
                    <span className="font-medium">
                      {p.premium != null ? `${p.premium} zł` : "brak danych"}
                    </span>
                  </div>

                  <div className="text-slate-200 text-sm">
                    Okres:{" "}
                    <span className="font-medium">
                      {p.valid_from || "?"} {" → "} {p.valid_to || "?"}
                    </span>
                  </div>

                  <div className="text-slate-200 text-sm">
                    Udział własny:{" "}
                    <span className="font-medium">
                      {p.deductible != null ? p.deductible : "brak danych"}
                    </span>
                  </div>

                  <div className="text-slate-200 text-sm">
                    Zakres:{" "}
                    <span className="font-medium">{coverageLabel}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function PolisySection() {
  // opakowanie tylko po to, żeby pasowało do układu onepage
  return (
    <section className="card" style={{ padding: 0, border: "none", background: "transparent" }}>
      <PolisyFullModule />
    </section>
  );
}


/* ========================= UPLOAD PDF ========================= */
function UploadSection() {
  const { token } = useAuth();
  const [file,setFile]=useState<File|null>(null);
  const [msg,setMsg]=useState("");
  const [raw,setRaw]=useState<OcrExtract|null>(null);
  const [mapped,setMapped]=useState<MappedPolicyPreview>({...EMPTY_MAPPED_POLICY});

  const stringifyOrEmpty = (value: unknown): string => (
    value === undefined || value === null ? "" : String(value)
  );

  const toDateInput = (value?: string): string => (
    value ? value.slice(0, 10) : ""
  );

  async function send(): Promise<void> {
    if (!file) return alert("Wybierz PDF");
    setMsg("Wysyłam...");
    const fd = new FormData();
    fd.append("file", file);

    const res = await tryFetch<UploadResponse>({
      paths: ENDPOINTS.uploadPdf,
      method:"POST",
      headers: authHeaders(token), // NIE ustawiaj Content-Type przy FormData
      body: fd
    });

    if (!res.ok){
      setMsg("❌ "+(detailFrom(res.data) || "Błąd OCR"));
      return;
    }

    const ext = pickOcrExtract(res.data);
    if (!ext) {
      setRaw(null);
      setMapped({ ...EMPTY_MAPPED_POLICY });
      const fallback = detailFrom(res.data) ?? "Brak danych OCR.";
      setMsg(`❌ ${fallback}`);
      return;
    }
    setRaw(ext);
    const normalized = normalizePolicy(ext);
    const coverage = Array.isArray(normalized.coverage)
      ? normalized.coverage.join(", ")
      : stringifyOrEmpty(normalized.coverage);
    setMapped({
      number: stringifyOrEmpty(ext.policy_number ?? normalized.number),
      insurer: stringifyOrEmpty(normalized.insurer),
      premium: stringifyOrEmpty(normalized.premium),
      valid_from: toDateInput(normalized.valid_from),
      valid_to: toDateInput(normalized.valid_to),
      deductible: stringifyOrEmpty(normalized.deductible),
      coverage,
    });
    setMsg("Przetwarzanie OK.");
  }

  async function save(): Promise<void> {
    if (!raw) return;
    setMsg("Zapisuję do bazy...");
    const res = await tryFetch<SavePolicyResponse>({
      paths: ENDPOINTS.zapiszPolise,
      method:"POST",
      headers:{ "Content-Type":"application/json", ...authHeaders(token) },
      body: JSON.stringify({ data: raw })
    });
    setMsg(res.ok ? "✅ Zapisano polisę." : "❌ "+(detailFrom(res.data) || "Błąd zapisu"));
  }

  return (
    <section className="card">
      <h1>Upload PDF z polisy → OCR → Zapis</h1>
      <div className="inline">
        <input
          type="file"
          accept="application/pdf"
          onChange={e=>setFile(e.target.files?.[0]||null)}
        />
        <button className="btn primary" onClick={send}>Wyślij i przetwórz</button>
        <button className="btn green" onClick={save} disabled={!raw}>Zapisz wyodrębnione</button>
        <span className="muted">{msg}</span>
      </div>

      <h2>Wynik OCR (raw)</h2>
      <code className="block">{raw ? JSON.stringify(raw,null,2) : ""}</code>

      <h2>Mapowanie (preview)</h2>
      <div className="row three">
        <label>Nr polisy<input readOnly value={mapped.number||""}/></label>
        <label>Ubezpieczyciel<input readOnly value={mapped.insurer||""}/></label>
        <label>Składka<input readOnly value={mapped.premium||""}/></label>
      </div>
      <div className="row three">
        <label>Od<input readOnly value={mapped.valid_from||""}/></label>
        <label>Do<input readOnly value={mapped.valid_to||""}/></label>
        <label>Udział własny<input readOnly value={mapped.deductible||""}/></label>
      </div>
      <label>Zakres<textarea readOnly rows={3} value={mapped.coverage||""}/></label>
    </section>
  );
}
