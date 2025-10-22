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

type ProfileData = Record<string, unknown>;

type GarageVehicle = Vehicle & {
  brand?: string;
  reg?: string;
  inspection?: string;
  ocUntil?: string;
  odo?: number | string;
};

type GarageVehicleForm = Partial<GarageVehicle>;

type PolicyWithLegacyDates = Policy & {
  from?: string;
  to?: string;
};

interface PolicyListEnvelope {
  items?: PolicyWithLegacyDates[];
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

interface OcrExtractedPolicy extends PolicyWithLegacyDates {
  policy_number?: string;
  coverage?: string[] | string;
  [key: string]: unknown;
}

type UploadResponse = OcrExtractedPolicy & {
  extracted?: OcrExtractedPolicy;
};

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

function policyPeriod(policy: PolicyWithLegacyDates): { from?: string; to?: string } {
  return {
    from: policy.valid_from ?? policy.from,
    to: policy.valid_to ?? policy.to,
  };
}

function normalizePolicy(policy: PolicyWithLegacyDates): PolicyWithLegacyDates {
  const { from, to } = policyPeriod(policy);
  return {
    ...policy,
    valid_from: from,
    valid_to: to,
  };
}

function extractPolicies(payload: unknown): PolicyWithLegacyDates[] {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is PolicyWithLegacyDates => typeof item === "object" && item !== null).map(normalizePolicy);
  }
  if (payload && typeof payload === "object") {
    const { items } = payload as PolicyListEnvelope;
    if (Array.isArray(items)) {
      return items
        .filter((item): item is PolicyWithLegacyDates => typeof item === "object" && item !== null)
        .map(normalizePolicy);
    }
  }
  return [];
}

function formatPolicyPeriod(policy: PolicyWithLegacyDates): string {
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
          {(["auth","profile","garage","polisy","upload"] as TabKey[]).map(t => (
            <button
              key={t}
              className={`tab ${tab===t?"active":""}`}
              onClick={()=>setTab(t)}
            >
              {t==="auth" ? "Auth (Log/Rej)"
               : t==="profile" ? "Profil"
               : t==="garage" ? "Garaż"
               : t==="polisy" ? "Polisy"
               : "Upload PDF"}
            </button>
          ))}
          <div className="right inline">
            <span className="badge">{isAuthed ? "Zalogowany" : "Niezalogowany"}</span>
            {isAuthed && (
              <button className="btn ghost" onClick={()=>setToken(null)}>
                Wyloguj
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="wrap">
        {tab==="auth" && <AuthSection onSuccess={()=>setTab("profile")} />}
        {tab==="profile" && <ProfileSection />}
        {tab==="garage" && <GarageSection />}
        {tab==="polisy" && <PolisySection />}
        {tab==="upload" && <UploadSection />}
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

  async function handleLogin(){
    setLoginMsg("Logowanie...");
    const res = await tryFetch({
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
      setLoginMsg("❌ " + (res.data?.detail || "Nie udało się zalogować"));
    }
  }

  async function handleRegister(){
    setRegMsg("Rejestruję...");
    const res = await tryFetch({
      paths: ENDPOINTS.register,
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ email: regEmail, password: regPass })
    });
    if (res.ok) setRegMsg("✅ Rejestracja OK — możesz się zalogować.");
    else setRegMsg("❌ " + (res.data?.detail || "Błąd rejestracji"));
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
  const [data,setData]=useState<ProfileData|null>(null);

  const formatValue = (value: unknown) => (
    value !== null && typeof value === "object"
      ? JSON.stringify(value)
      : String(value ?? "")
  );

  async function loadMe(){
    setMsg("Pobieram...");
    const res = await tryFetch<ProfileData>({
      paths: ENDPOINTS.me,
      headers: { ...authHeaders(token) }
    });
    if (res.ok){
      setData(res.data);
      setMsg("Gotowe.");
    } else {
      setMsg("❌ "+(res.data?.detail||"Błąd"));
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
    reg: vehicle.reg ?? vehicle.plate,
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
      setMsg("❌ " + (res.data?.detail || "Błąd pobierania"));
    }
    setLoading(false);
  }, [token, setToken]);

  useEffect(() => {
    void load();
  }, [load]);

  async function add(){
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
    const payload: Vehicle = {
      ...form,
      make: form.brand ?? form.make,
      plate: form.reg ?? form.plate,
    };
    const res = await createVehicle(payload, token);
    if (res.ok) { setMsg("✅ Dodano."); setForm({}); await load(); }
    else if (res.status===401) { setToken(null); setMsg("Sesja wygasła — zaloguj się ponownie."); }
    else setMsg("❌ " + (res.data?.detail || "Błąd dodawania"));
  }

  async function remove(id?: string){
    if (!id) return;
    if (useLocal) {
      const next=cars.filter(c=>c.id!==id);
      setCarsLocal(next); setCars(next); return;
    }
    setMsg("Usuwam...");
    const res = await deleteVehicle(id, token);
    if (res.ok) { setMsg("Usunięto."); await load(); }
    else if (res.status===401) { setToken(null); setMsg("Sesja wygasła — zaloguj się ponownie."); }
    else setMsg("❌ " + (res.data?.detail || "Błąd usuwania"));
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
const getPolLocal = ():PolicyWithLegacyDates[] => readLocalArray<PolicyWithLegacyDates>(polKey);
const setPolLocal = (arr:PolicyWithLegacyDates[]) => localStorage.setItem(polKey, JSON.stringify(arr));

function PolisySection() {
  const { token, setToken } = useAuth();
  const [msg,setMsg]=useState("");
  const [backendList,setBackendList]=useState<PolicyWithLegacyDates[]>([]);
  const [local,setLocal]=useState<PolicyWithLegacyDates[]>(getPolLocal());
  const [form,setForm]=useState<PolicyWithLegacyDates>({});
  const [useLocal,setUseLocal]=useState(false);
  const [loading,setLoading]=useState(false);
  const formPeriod = policyPeriod(form);

  async function load(){
    setLoading(true); setMsg("Pobieram...");
    const res = await listPolicies(token);
    if (res.ok) {
      const items = extractPolicies(res.data);
      setBackendList(items); setUseLocal(false); setMsg("Gotowe.");
    } else if (res.status===401) {
      setToken(null); setUseLocal(true); setMsg("Sesja wygasła — zaloguj się ponownie. Pokazuję lokalne.");
    } else if (backendUnavailable(res.status)) {
      setUseLocal(true); setMsg("Brak endpointu — tryb lokalny (demo).");
    } else {
      setMsg("❌ " + (res.data?.detail || "Błąd pobierania"));
    }
    setLoading(false);
  }

  async function add() {
    const { from: valid_from, to: valid_to } = formPeriod;

    if (!isDateRangeValid(valid_from, valid_to)) {
      setMsg("Zakres dat jest niepoprawny (Od musi ≤ Do)."); return;
    }
    if (!isNonNegativeNumberLike(form.premium)) {
      setMsg("Składka musi być liczbą ≥ 0."); return;
    }
    if (!isNonNegativeNumberLike(form.deductible)) {
      setMsg("Udział własny musi być liczbą ≥ 0."); return;
    }

    const payload: Policy = {
      number: form.number,
      insurer: form.insurer,
      premium: form.premium ? Number(form.premium) : undefined,
      valid_from: valid_from ?? undefined,
      valid_to: valid_to ?? undefined,
      deductible: form.deductible ? Number(form.deductible) : undefined,
      coverage: Array.isArray(form.coverage)
        ? form.coverage
        : typeof form.coverage === "string"
          ? form.coverage.split(/,|;|\n/).map(s=>s.trim()).filter(Boolean)
          : undefined
    };

    if (useLocal) {
      const next=[...local, { ...payload, id: String(Date.now()) }];
      setPolLocal(next); setLocal(next); setMsg("Dodano lokalnie."); setForm({});
      return;
    }

    setMsg("Zapisuję...");
    const res = await createPolicy(payload, token);
    if (res.ok) { setMsg("✅ Zapisano."); setForm({}); await load(); }
    else if (res.status===401) { setToken(null); setMsg("Sesja wygasła — zaloguj się ponownie."); }
    else setMsg("❌ " + (res.data?.detail || "Błąd zapisu"));
  }

  async function remove(p: PolicyWithLegacyDates) {
    if (useLocal) {
      const next = local.filter(x => x.id !== p.id);
      setPolLocal(next); setLocal(next);
      return;
    }
    if (!p.id) return;
    setMsg("Usuwam...");
    const res = await deletePolicy(String(p.id), token);
    if (res.ok) { setMsg("Usunięto."); await load(); }
    else if (res.status===401) { setToken(null); setMsg("Sesja wygasła — zaloguj się ponownie."); }
    else setMsg("❌ " + (res.data?.detail || "Błąd usuwania"));
  }

  return (
    <section className="card">
      <h1>Polisy</h1>
      <div className="inline">
        <button className="btn" onClick={load}>Pobierz polisy</button>
        <span className="muted">{msg}</span>
      </div>

      {!useLocal && (
        <div className="list" style={{marginTop:10}}>
          {backendList.length===0 && <div className="muted">{loading ? "Ładowanie..." : "Brak polis w bazie"}</div>}
          {backendList.map((p,i)=>(
            <div key={p.id ?? i} className="item">
              <div className="inline" style={{justifyContent:"space-between",alignItems:"center"}}>
                <div><strong>{p.number || "Polisa"}</strong> <span className="badge">{p.insurer||"—"}</span></div>
                <button className="btn warn" onClick={()=>remove(p)}>Usuń</button>
              </div>
              <div className="kv" style={{marginTop:8}}>
                <div>Okres</div><div>{formatPolicyPeriod(p)}</div>
                <div>Składka</div><div>{p.premium ?? "—"}</div>
                <div>Udział własny</div><div>{p.deductible ?? "—"}</div>
                <div>Zakres</div><div>{Array.isArray(p.coverage)? p.coverage.join(", "): (p.coverage??"—")}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {useLocal && (
        <div className="card">
          <h2>Polisy (lokalne – demo)</h2>
          <div className="list" style={{marginTop:10}}>
            {local.length===0 && <div className="muted">Brak lokalnych polis</div>}
            {local.map(p=>(
              <div key={p.id} className="item">
                <div className="inline" style={{justifyContent:"space-between",alignItems:"center"}}>
                  <div><strong>{p.number||"-"}</strong> <span className="badge">{p.insurer||"—"}</span></div>
                  <button className="btn warn" onClick={()=>remove(p)}>Usuń</button>
                </div>
                <div className="kv" style={{marginTop:8}}>
                  <div>Okres</div><div>{formatPolicyPeriod(p)}</div>
                  <div>Składka</div><div>{p.premium||"—"}</div>
                  <div>Udział własny</div><div>{p.deductible||"—"}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h2>Dodaj polisę</h2>
        <div className="row three">
          <label>Nr polisy
            <input value={form.number||""} onChange={e=>setForm(f=>({...f,number:e.target.value}))}/>
          </label>
          <label>Ubezpieczyciel
            <input value={form.insurer||""} onChange={e=>setForm(f=>({...f,insurer:e.target.value}))}/>
          </label>
          <label>Składka
            <input value={String(form.premium||"")} onChange={e=>setForm(f=>({...f,premium:e.target.value}))}/>
          </label>
        </div>
        <div className="row three">
          <label>Od
            <input
              type="date"
              value={formPeriod.from || ""}
              onChange={e=>setForm(f=>({...f, valid_from:e.target.value}))}
            />
          </label>
          <label>Do
            <input
              type="date"
              value={formPeriod.to || ""}
              onChange={e=>setForm(f=>({...f, valid_to:e.target.value}))}
            />
          </label>
          <label>Udział własny
            <input value={String(form.deductible||"")} onChange={e=>setForm(f=>({...f,deductible:e.target.value}))}/>
          </label>
        </div>
        <div className="inline">
          <button className="btn green" onClick={add}>Zapisz</button>
        </div>
      </div>
    </section>
  );
}

/* ========================= UPLOAD PDF ========================= */
function UploadSection() {
  const { token } = useAuth();
  const [file,setFile]=useState<File|null>(null);
  const [msg,setMsg]=useState("");
  const [raw,setRaw]=useState<OcrExtractedPolicy|null>(null);
  const [mapped,setMapped]=useState<MappedPolicyPreview>({...EMPTY_MAPPED_POLICY});

  const stringifyOrEmpty = (value: unknown): string => (
    value === undefined || value === null ? "" : String(value)
  );

  const toDateInput = (value?: string): string => (
    value ? value.slice(0, 10) : ""
  );

  async function send(){
    if (!file) return alert("Wybierz PDF");
    setMsg("Wysyłam...");
    const fd = new FormData();
    fd.append("file", file);

    const res = await tryFetch<UploadResponse>({
      paths: ENDPOINTS.uploadPdf,
      method:"POST",
      headers:{ ...authHeaders(token) }, // NIE ustawiaj Content-Type przy FormData
      body: fd
    });

    if (!res.ok){
      setMsg("❌ "+(res.data?.detail || "Błąd OCR"));
      return;
    }

    const data = res.data ?? {};
    const ext = (data.extracted ?? data) as OcrExtractedPolicy;
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

  async function save(){
    if (!raw) return;
    setMsg("Zapisuję do bazy...");
    const res = await tryFetch({
      paths: ENDPOINTS.zapiszPolise,
      method:"POST",
      headers:{ "Content-Type":"application/json", ...authHeaders(token) },
      body: JSON.stringify({ data: raw })
    });
    setMsg(res.ok ? "✅ Zapisano polisę." : "❌ "+(res.data?.detail || "Błąd zapisu"));
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
