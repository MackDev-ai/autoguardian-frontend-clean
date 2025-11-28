"use client";
import Link from "next/link";
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
  listPolicies,
  createPolicy,
  deletePolicy,
  type Policy,
} from "../../lib/policies";

/* ==== VALIDATORS ==== */
import {
  isValidVIN,
  isDateRangeValid,
  isNonNegativeNumberLike,
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

interface PolicyListEnvelope {
  items?: PolicyLoose[];
}

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

function extractPolicies(payload: unknown): PolicyLoose[] {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is PolicyLoose => typeof item === "object" && item !== null).map(normalizePolicy);
  }
  if (payload && typeof payload === "object") {
    const { items } = payload as PolicyListEnvelope;
    if (Array.isArray(items)) {
      return items
        .filter((item): item is PolicyLoose => typeof item === "object" && item !== null)
        .map(normalizePolicy);
    }
  }
  return [];
}

function formatPolicyPeriod(policy: PolicyLoose): string {
  const { from, to } = policyPeriod(policy);
  const safeFrom = from && from.length > 0 ? from : "—";
  const safeTo = to && to.length > 0 ? to : "—";
  return `${safeFrom} → ${safeTo}`;
}

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
const polKey = "ag_policies";
const getPolLocal = ():PolicyLoose[] => readLocalArray<PolicyLoose>(polKey);
const setPolLocal = (arr:PolicyLoose[]) => localStorage.setItem(polKey, JSON.stringify(arr));

/* ========================= POLISY – LINK DO NOWEGO MODUŁU ========================= */
function PolisySection() {
  return (
    <section className="card">
      <h1>Polisy</h1>
      <p className="muted">
        Moduł polis znajduje się teraz na osobnej stronie. Tam możesz:
        dodać polisę z PDF (OCR), zapisać ją w bazie i zobaczyć listę wszystkich
        polis wraz ze statusem ważności.
      </p>

      <div style={{ marginTop: 16 }}>
        <Link href="/polisy">
          <button className="btn primary">
            Przejdź do modułu polis
          </button>
        </Link>
      </div>

      <p className="muted" style={{ marginTop: 12 }}>
        Uwaga: ten ekran służy tylko jako skrót. Pełna funkcjonalność jest pod
        adresem <code>/polisy</code>.
      </p>
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
