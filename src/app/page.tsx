"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  type PolicyOut,
  type PolicyCreate,
  type PolicyType,
} from "../../lib/policies";

/* ==== VALIDATORS ==== */
import { isValidVIN } from "../../lib/validators";

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

type ExtractedValue = string | number | boolean | null | undefined| string[]| Record<string, unknown>;

type ExtractedData = {
  policy_number?: string;
  insurer?: string;
  premium?: string | number;
  valid_from?: string;
  valid_to?: string;
  start_date?: string;
  end_date?: string;
  deductible?: string | number;
  coverage?: string[] | string;
  scope?: string;
  [key: string]: ExtractedValue;
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

function getPolicyStatus(validFrom?: string | null, validTo?: string | null): PolicyStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const from = parseDate(validFrom);
  const to = parseDate(validTo);

  if (!from && !to) return { type: "unknown", label: "Brak danych o okresie" };

  if (from && from.getTime() > today.getTime()) {
    return {
      type: "not_started",
      label: `Jeszcze nieaktywna (start ${from.toLocaleDateString("pl-PL")})`,
    };
  }

  if (to && to.getTime() < today.getTime()) {
    return { type: "expired", label: `Wygasła ${to.toLocaleDateString("pl-PL")}` };
  }

  if (to) {
    const diffMs = to.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (daysLeft <= 7) {
      return { type: "expiring_soon", label: `Wygasa za ${daysLeft} dni`, daysLeft };
    }
    return { type: "active", label: `Aktywna (do ${to.toLocaleDateString("pl-PL")})`, daysLeft };
  }

  return { type: "active", label: "Aktywna (brak daty końca)" };
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

type UploadResponse = { extracted?: ExtractedData; detail?: string } | ExtractedData;

function pickExtracted(payload: unknown): ExtractedData | null {
  if (!isRecord(payload)) return null;
  if ("extracted" in payload) {
    const v = (payload as { extracted?: unknown }).extracted;
    return isRecord(v) ? (v as ExtractedData) : null;
  }
  return payload as ExtractedData;
}

function toCreateVehicleInput(form: GarageVehicleForm): CreateVehicleInput {
  const base = {
    ...form,
    make: form.brand ?? (form as any).make,
    plate: form.reg ?? (form as any).plate,
    registration: form.reg ?? (form as any).registration,
  };

  const { id, created_at, updated_at, ...rest } = base as any;
  void id;
  void created_at;
  void updated_at;

  // backend VehicleIn ma: make, model, registration, year?, vin? ...
  return {
    make: rest.make,
    model: rest.model ?? "",
    registration: rest.registration ?? rest.plate ?? "",
    year: rest.year ? Number(rest.year) : undefined,
    vin: rest.vin ?? undefined,
    mileage_km: rest.odo ? Number(rest.odo) : undefined,
    inspection_date: rest.inspection ?? undefined,
    insurance_date: rest.ocUntil ?? undefined,
  };
}

/* ========================= PAGE ROOT ========================= */
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
            <span className="badge">{isAuthed ? "Zalogowany" : "Niezalogowany"}</span>
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
type LoginResponse = { access_token?: string; detail?: string };
type RegisterResponse = { detail?: string };

function AuthSection({ onSuccess }: { onSuccess?: () => void }) {
  const { setToken } = useAuth();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPass, setRegPass] = useState("");
  const [loginMsg, setLoginMsg] = useState("");
  const [regMsg, setRegMsg] = useState("");

  async function handleLogin(): Promise<void> {
    setLoginMsg("Logowanie...");
    const res = await tryFetch<LoginResponse>({
      paths: ENDPOINTS.login,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: loginEmail, password: loginPass }),
      credentials: "include",
    });

    if (res.ok && res.data?.access_token) {
      setToken(res.data.access_token); // u Ciebie token jest też w cookie, ale to nie przeszkadza
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
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: regEmail, password: regPass }),
      credentials: "include",
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
          <label>
            Email
            <input value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
          </label>
          <label>
            Hasło
            <input
              type="password"
              value={loginPass}
              onChange={(e) => setLoginPass(e.target.value)}
            />
          </label>
          <div className="inline">
            <button className="btn primary" onClick={handleLogin}>
              Zaloguj
            </button>
            <span className="muted">{loginMsg}</span>
          </div>
        </div>

        <div className="card">
          <h2>Rejestracja</h2>
          <label>
            Email
            <input value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
          </label>
          <label>
            Hasło
            <input
              type="password"
              value={regPass}
              onChange={(e) => setRegPass(e.target.value)}
            />
          </label>
          <div className="inline">
            <button className="btn green" onClick={handleRegister}>
              Utwórz konto
            </button>
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
  const [msg, setMsg] = useState("");
  const [data, setData] = useState<MeData | null>(null);

  const formatValue = (value: unknown) =>
    value !== null && typeof value === "object" ? JSON.stringify(value) : String(value ?? "");

  async function loadMe(): Promise<void> {
    setMsg("Pobieram...");
    const res = await tryFetch<MeData>({
      paths: ENDPOINTS.me,
      headers: authHeaders(token),
      credentials: "include",
    });

    if (res.ok) {
      setData(res.data);
      setMsg("Gotowe.");
    } else {
      setMsg("❌ " + (detailFrom(res.data) || "Błąd"));
    }
  }

  return (
    <section className="card">
      <h1>Profil użytkownika</h1>
      <div className="inline">
        <button className="btn" onClick={loadMe}>
          Pobierz profil
        </button>
        <span className="muted">{msg}</span>
      </div>
      {data && (
        <div className="item" style={{ marginTop: 8 }}>
          <div className="kv">
            {Object.entries(data).map(([k, v]) => (
              <div key={k} style={{ display: "contents" }}>
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

/* ========================= GARAGE ========================= */
const carsKey = "ag_cars";
const getCarsLocal = (): GarageVehicle[] => {
  const raw = localStorage.getItem(carsKey);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as GarageVehicle[]) : [];
  } catch {
    return [];
  }
};
const setCarsLocal = (arr: GarageVehicle[]) => localStorage.setItem(carsKey, JSON.stringify(arr));
const backendUnavailable = (status?: number) => !status || status === 404 || status === 501;

function GarageSection() {
  const { token, setToken } = useAuth();
  const [cars, setCars] = useState<GarageVehicle[]>([]);
  const [form, setForm] = useState<GarageVehicleForm>({});
  const [msg, setMsg] = useState("");
  const [useLocal, setUseLocal] = useState(false);
  const [loading, setLoading] = useState(false);

  const applyVehicleMapping = (vehicle: Vehicle): GarageVehicle => ({
    ...vehicle,
    brand: (vehicle as any).brand ?? vehicle.make,
    reg: (vehicle as any).reg ?? (vehicle as any).registration,
    odo: (vehicle as any).odo ?? (vehicle as any).mileage_km,
    inspection: (vehicle as any).inspection ?? (vehicle as any).inspection_date,
    ocUntil: (vehicle as any).ocUntil ?? (vehicle as any).insurance_date,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setMsg("Pobieram pojazdy...");

    const res = await listVehicles(token);
    if (res.ok && Array.isArray(res.data)) {
      setCars(res.data.map(applyVehicleMapping));
      setUseLocal(false);
      setMsg("Gotowe.");
    } else if (res.status === 401) {
      setToken(null);
      setCars(getCarsLocal());
      setUseLocal(true);
      setMsg("Sesja wygasła — zaloguj się ponownie. Pokazuję lokalne.");
    } else if (backendUnavailable(res.status)) {
      setCars(getCarsLocal());
      setUseLocal(true);
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
    if (!form.reg && !form.vin && !form.brand && !form.make) {
      setMsg("Podaj min. rejestrację / VIN / markę.");
      return;
    }

    // VIN walidujemy tylko jeśli user go podał
    if (form.vin && !isValidVIN(form.vin)) {
      setMsg("VIN niepoprawny (17 znaków, bez liter I, O, Q).");
      return;
    }

    if (useLocal) {
      const next = [...cars, { ...form, id: String(Date.now()) } as any];
      setCarsLocal(next);
      setCars(next);
      setForm({});
      setMsg("Dodano lokalnie.");
      return;
    }

    setMsg("Dodaję pojazd...");
    const payload = toCreateVehicleInput(form);
    const res = await createVehicle(payload, token);

    if (res.ok) {
      setMsg("✅ Dodano.");
      setForm({});
      await load();
    } else if (res.status === 401) {
      setToken(null);
      setMsg("Sesja wygasła — zaloguj się ponownie.");
    } else {
      setMsg("❌ " + (detailFrom(res.data) || "Błąd dodawania"));
    }
  }

  async function remove(id?: string): Promise<void> {
    if (!id) return;

    if (useLocal) {
      const next = cars.filter((c) => String(c.id) !== String(id));
      setCarsLocal(next);
      setCars(next);
      return;
    }

    setMsg("Usuwam...");
    const res = await deleteVehicle(id, token);

    if (res.ok) {
      setMsg("Usunięto.");
      await load();
    } else if (res.status === 401) {
      setToken(null);
      setMsg("Sesja wygasła — zaloguj się ponownie.");
    } else {
      setMsg("❌ " + (detailFrom(res.data) || "Błąd usuwania"));
    }
  }

  return (
    <section className="card">
      <h1>Garaż i dane o samochodzie</h1>
      <p className="muted">{useLocal ? "Tryb lokalny (demo)" : "Połączono z backendem"}</p>

      <div className="card">
        <h2>Dodaj pojazd</h2>

        <div className="row three">
          <label>
            Rejestracja
            <input value={form.reg || ""} onChange={(e) => setForm((f) => ({ ...f, reg: e.target.value }))} />
          </label>
          <label>
            VIN
            <input
              value={form.vin || ""}
              maxLength={17}
              onChange={(e) => setForm((f) => ({ ...f, vin: e.target.value }))}
            />
          </label>
          <label>
            Marka
            <input value={form.brand || ""} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} />
          </label>
        </div>

        <div className="row three">
          <label>
            Model
            <input value={form.model || ""} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} />
          </label>
          <label>
            Rok
            <input value={String(form.year || "")} onChange={(e) => setForm((f) => ({ ...f, year: e.target.value as any }))} />
          </label>
          <label>
            Przebieg
            <input value={String(form.odo || "")} onChange={(e) => setForm((f) => ({ ...f, odo: e.target.value }))} />
          </label>
        </div>

        <div className="row two">
          <label>
            Przegląd do
            <input
              type="date"
              value={form.inspection || ""}
              onChange={(e) => setForm((f) => ({ ...f, inspection: e.target.value }))}
            />
          </label>
          <label>
            OC do
            <input
              type="date"
              value={form.ocUntil || ""}
              onChange={(e) => setForm((f) => ({ ...f, ocUntil: e.target.value }))}
            />
          </label>
        </div>

        <div className="inline">
          <button className="btn green" onClick={add} disabled={loading}>
            Dodaj do garażu
          </button>
          <span className="muted">{msg}</span>
        </div>
      </div>

      <div className="card">
        <h2>Twoje pojazdy</h2>
        <div className="list">
          {cars.length === 0 && (
            <div className="muted">{loading ? "Ładowanie..." : "Brak pojazdów"}</div>
          )}
          {cars.map((c) => (
            <div key={String(c.id ?? `${c.vin}-${c.reg}`)} className="item">
              <div className="inline" style={{ justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong>
                    {c.brand || c.make || "-"} {c.model || ""}
                  </strong>{" "}
                  <span className="badge">{c.reg || (c as any).registration || "—"}</span>
                </div>
                <button className="btn warn" onClick={() => remove(String(c.id))}>
                  Usuń
                </button>
              </div>
              <div className="kv" style={{ marginTop: 8 }}>
                <div>Rok</div><div>{(c as any).year || "—"}</div>
                <div>VIN</div><div>{(c as any).vin || "—"}</div>
                <div>Przebieg</div><div>{c.odo ? `${c.odo} km` : "—"}</div>
                <div>Przegląd do</div><div>{c.inspection || "—"}</div>
                <div>OC do</div><div>{c.ocUntil || "—"}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========================= POLISY ========================= */
function PolisySection() {
  return (
    <section className="card" style={{ padding: 0, border: "none", background: "transparent" }}>
      <PolisyFullModule />
    </section>
  );
}

function PolisyFullModule() {
  const { token, isAuthed } = useAuth();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState<number | "">("");

  const [policyType, setPolicyType] = useState<PolicyType>("OC");

  const [polisy, setPolisy] = useState<PolicyOut[]>([]);
  const [loadingPolisy, setLoadingPolisy] = useState(true);

  const [file, setFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [ocrText, setOcrText] = useState<string>("");
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);

  const loadVehicles = useCallback(async () => {
    if (!token) return;
    const res = await listVehicles(token);
    if (res.ok && Array.isArray(res.data)) {
      setVehicles(res.data);
      if (res.data.length > 0 && vehicleId === "") {
        const maybeId = Number((res.data[0] as any).id);
        if (!Number.isNaN(maybeId)) setVehicleId(maybeId);
      }
    }
  }, [token, vehicleId]);

  const loadPolicies = useCallback(async () => {
    setLoadingPolisy(true);
    const res = await listPolicies();
    if (res.ok && Array.isArray(res.data)) {
      setPolisy(res.data);
    } else {
      console.error("Błąd listPolicies:", res);
      setPolisy([]);
    }
    setLoadingPolisy(false);
  }, []);

  useEffect(() => {
    if (isAuthed) {
      void loadVehicles();
      void loadPolicies();
    } else {
      setVehicles([]);
      setPolisy([]);
    }
  }, [isAuthed, loadVehicles, loadPolicies]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    setOcrText("");
    setExtracted(null);
  };

  const handleUploadAndSave = async () => {
    if (!file) return alert("Wybierz plik PDF");
    if (!token) return alert("Brak tokenu. Zaloguj się ponownie.");
    if (vehicleId === "") return alert("Wybierz pojazd (wymagane).");

    setUploadLoading(true);

    try {
      // 1) OCR
      const formData = new FormData();
      formData.append("file", file);

      const ocrRes = await fetch("https://api.autoguardian.pl/upload-pdf", {
        method: "POST",
        headers: { ...authHeaders(token) },
        credentials: "include",
        body: formData,
      });

      const ocrData = await ocrRes.json();

      if (ocrRes.status === 401) {
        alert("Sesja wygasła. Zaloguj się ponownie.");
        return;
      }
      if (!ocrRes.ok) {
        console.error("Błąd OCR:", ocrData);
        alert("Błąd OCR: " + (ocrData.detail || "Nieznany błąd"));
        return;
      }

      const extractedData = pickExtracted(ocrData);
      setExtracted(extractedData);
      setOcrText((ocrData as any).ocr_text || (ocrData as any).raw_text || "");

      if (!extractedData) {
        alert("Brak extracted — nie zapisuję.");
        return;
      }

      // 2) map OCR -> PolicyCreate
      const policy_number = String(extractedData.policy_number ?? "");
      const insurer = String(extractedData.insurer ?? "");
      const start_date = String(extractedData.valid_from ?? extractedData.start_date ?? "");
      const end_date = String(extractedData.valid_to ?? extractedData.end_date ?? "");

      const premiumRaw = extractedData.premium;
      const premium_total =
        premiumRaw === null || premiumRaw === undefined || premiumRaw === ""
          ? null
          : Number(premiumRaw);

      if (!policy_number || !insurer || !start_date || !end_date) {
        alert("Brakuje pól wymaganych (policy_number/insurer/start_date/end_date).");
        return;
      }

      const payload: PolicyCreate = {
        vehicle_id: Number(vehicleId),
        policy_type: policyType,
        insurer,
        policy_number,
        start_date,
        end_date,
        premium_total: Number.isFinite(premium_total as any) ? premium_total : null,
        coverage_json: (extractedData.coverage as any) ?? [],
        exclusions: [],
        documents: [],
        raw_text: ocrText || null,
      };

      const saveRes = await createPolicy(payload);

      if (!saveRes.ok) {
        console.error("Błąd createPolicy:", saveRes.data);
        alert("Błąd zapisu polisy: " + (detailFrom(saveRes.data) || "Nieznany błąd"));
        return;
      }

      alert("✅ Polisa zapisana w bazie.");
      setFile(null);
      setOcrText("");
      setExtracted(null);

      await loadPolicies();
    } catch (e) {
      console.error("Błąd upload/save:", e);
      alert("Nie udało się przetworzyć pliku lub zapisać polisy.");
    } finally {
      setUploadLoading(false);
    }
  };

  const renderCoverage = (coverage: any) => {
    if (Array.isArray(coverage)) return coverage.join(", ");
    if (coverage && typeof coverage === "object") return JSON.stringify(coverage);
    return coverage ? String(coverage) : "brak danych";
  };

  const vehiclesOptions = useMemo(() => {
    return vehicles.map((v: any) => ({
      id: Number(v.id),
      label: `${v.make ?? ""} ${v.model ?? ""} · ${v.registration ?? ""}`.trim(),
    }));
  }, [vehicles]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <section className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
        <h1 className="text-2xl font-bold mb-2">Dodaj polisę</h1>
        <p className="text-sm text-slate-300 mb-4">Upload PDF → OCR → zapis do bazy (POST /policies)</p>

        {!isAuthed ? (
          <div className="rounded bg-slate-800 p-4 text-sm text-slate-300">
            Musisz być zalogowany, aby dodać polisę z PDF.
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end mb-3">
              <label className="text-sm text-slate-300">
                Pojazd (wymagane)
                <select
                  className="ml-2 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-100"
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value ? Number(e.target.value) : "")}
                >
                  {vehiclesOptions.length === 0 ? (
                    <option value="">Brak pojazdów (dodaj w Garażu)</option>
                  ) : (
                    <>
                      <option value="">Wybierz pojazd…</option>
                      {vehiclesOptions.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.label}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </label>

              <label className="text-sm text-slate-300">
                Typ polisy
                <select
                  className="ml-2 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-100"
                  value={policyType}
                  onChange={(e) => setPolicyType(e.target.value as PolicyType)}
                >
                  <option value="OC">OC</option>
                  <option value="AC">AC</option>
                  <option value="NNW">NNW</option>
                  <option value="ASS">ASS</option>
                </select>
              </label>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input type="file" accept="application/pdf" onChange={handleFileChange} className="text-sm" />
              <button
                onClick={handleUploadAndSave}
                disabled={!file || uploadLoading}
                className="px-4 py-2 rounded bg-blue-600 disabled:bg-blue-900 text-white text-sm"
              >
                {uploadLoading ? "Przetwarzanie..." : "Wyślij i zapisz"}
              </button>
            </div>

            {extracted && (
              <div className="mt-4 text-sm bg-slate-800 rounded p-3 max-h-64 overflow-auto">
                <h2 className="font-semibold mb-2">Podgląd extracted:</h2>
                <pre className="whitespace-pre-wrap break-words">{JSON.stringify(extracted, null, 2)}</pre>
              </div>
            )}

            {ocrText && (
              <div className="mt-4 text-xs bg-slate-800 rounded p-3 max-h-64 overflow-auto">
                <h2 className="font-semibold mb-2">Wynik OCR (raw):</h2>
                <pre className="whitespace-pre-wrap break-words">{ocrText}</pre>
              </div>
            )}
          </>
        )}
      </section>

      <section className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
        <h2 className="text-xl font-bold mb-2">Twoje polisy</h2>

        {!isAuthed ? (
          <div className="rounded bg-slate-800 p-4 text-sm text-slate-300">Musisz być zalogowany.</div>
        ) : loadingPolisy ? (
          <div className="rounded bg-slate-800 p-4 text-sm text-slate-300">Ładowanie polis...</div>
        ) : polisy.length === 0 ? (
          <div className="rounded bg-slate-800 p-4 text-sm text-slate-400">Brak zapisanych polis w bazie.</div>
        ) : (
          <ul className="space-y-3 text-sm">
            {polisy.map((p) => {
              const status = getPolicyStatus(p.start_date, p.end_date);

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
                <li key={p.id} className="p-4 rounded bg-slate-800 border border-slate-700 flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-base">
                      {p.policy_number || "(brak numeru polisy)"}
                      <span className="text-xs text-slate-400 ml-2">
                        ID: {p.id} · {p.policy_type} · Vehicle: {p.vehicle_id}
                      </span>
                    </div>
                    <span className={`${badgeBase} ${badgeColor}`}>{status.label}</span>
                  </div>

                  <div className="text-slate-200">
                    Ubezpieczyciel: <span className="font-medium">{p.insurer || "brak danych"}</span>
                  </div>

                  <div className="text-slate-200">
                    Składka:{" "}
                    <span className="font-medium">
                      {p.premium_total != null ? `${p.premium_total} zł` : "brak danych"}
                    </span>
                  </div>

                  <div className="text-slate-200 text-sm">
                    Okres: <span className="font-medium">{p.start_date} → {p.end_date}</span>
                  </div>

                  <div className="text-slate-200 text-sm">
                    Udział własny:{" "}
                    <span className="font-medium">{p.deductible != null ? p.deductible : "brak danych"}</span>
                  </div>

                  <div className="text-slate-200 text-sm">
                    Zakres: <span className="font-medium">{renderCoverage(p.coverage_json)}</span>
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

/* ========================= UPLOAD SECTION ========================= */
/**
 * Ten moduł zostawiłem, ale zrobiłem go zgodnego z /policies.
 * Możesz go później usunąć (bo PolisyFullModule już ma upload+zapis).
 */
function UploadSection() {
  const { token, isAuthed } = useAuth();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState<number | "">("");
  const [policyType, setPolicyType] = useState<PolicyType>("OC");

  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState("");
  const [raw, setRaw] = useState<ExtractedData | null>(null);

  const loadVehicles = useCallback(async () => {
    if (!token) return;
    const res = await listVehicles(token);
    if (res.ok && Array.isArray(res.data)) {
      setVehicles(res.data);
      if (res.data.length > 0 && vehicleId === "") {
        const maybeId = Number((res.data[0] as any).id);
        if (!Number.isNaN(maybeId)) setVehicleId(maybeId);
      }
    }
  }, [token, vehicleId]);

  useEffect(() => {
    if (isAuthed) void loadVehicles();
  }, [isAuthed, loadVehicles]);

  async function send(): Promise<void> {
    if (!file) return alert("Wybierz PDF");
    if (!token) return alert("Zaloguj się ponownie.");
    setMsg("Wysyłam...");

    const fd = new FormData();
    fd.append("file", file);

    const res = await tryFetch<UploadResponse>({
      paths: ENDPOINTS.uploadPdf,
      method: "POST",
      headers: authHeaders(token),
      body: fd,
      credentials: "include",
    });

    if (!res.ok) {
      setMsg("❌ " + (detailFrom(res.data) || "Błąd OCR"));
      return;
    }

    const extracted = pickExtracted(res.data);
    if (!extracted) {
      setRaw(null);
      setMsg("❌ Brak danych OCR.");
      return;
    }

    setRaw(extracted);
    setMsg("✅ OCR OK (możesz zapisać).");
  }

  async function save(): Promise<void> {
    if (!raw) return;
    if (vehicleId === "") return alert("Wybierz pojazd (wymagane).");

    const policy_number = String(raw.policy_number ?? "");
    const insurer = String(raw.insurer ?? "");
    const start_date = String(raw.valid_from ?? raw.start_date ?? "");
    const end_date = String(raw.valid_to ?? raw.end_date ?? "");
    const premiumRaw = raw.premium;

    const premium_total =
      premiumRaw === null || premiumRaw === undefined || premiumRaw === ""
        ? null
        : Number(premiumRaw);

    if (!policy_number || !insurer || !start_date || !end_date) {
      alert("Brakuje pól wymaganych (policy_number/insurer/start_date/end_date).");
      return;
    }

    setMsg("Zapisuję do bazy...");

    const payload: PolicyCreate = {
      vehicle_id: Number(vehicleId),
      policy_type: policyType,
      insurer,
      policy_number,
      start_date,
      end_date,
      premium_total: Number.isFinite(premium_total as any) ? premium_total : null,
      coverage_json: (raw.coverage as any) ?? [],
      exclusions: [],
      documents: [],
      raw_text: null,
    };

    const res = await createPolicy(payload);
    setMsg(res.ok ? "✅ Zapisano polisę." : "❌ " + (detailFrom(res.data) || "Błąd zapisu"));
  }

  return (
    <section className="card">
      <h1>Upload PDF z polisy → OCR → Zapis</h1>

      {!isAuthed ? (
        <div className="muted">Musisz być zalogowany.</div>
      ) : (
        <>
          <div className="row two">
            <label>
              Pojazd (wymagane)
              <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value ? Number(e.target.value) : "")}>
                {vehicles.length === 0 ? (
                  <option value="">Brak pojazdów (dodaj w Garażu)</option>
                ) : (
                  <>
                    <option value="">Wybierz pojazd…</option>
                    {vehicles.map((v: any) => (
                      <option key={v.id} value={Number(v.id)}>
                        {v.make} {v.model} · {v.registration}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </label>

            <label>
              Typ polisy
              <select value={policyType} onChange={(e) => setPolicyType(e.target.value as PolicyType)}>
                <option value="OC">OC</option>
                <option value="AC">AC</option>
                <option value="NNW">NNW</option>
                <option value="ASS">ASS</option>
              </select>
            </label>
          </div>

          <div className="inline">
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <button className="btn primary" onClick={send}>
              Wyślij i przetwórz
            </button>
            <button className="btn green" onClick={save} disabled={!raw}>
              Zapisz wyodrębnione
            </button>
            <span className="muted">{msg}</span>
          </div>

          <h2>Wynik OCR (raw)</h2>
          <code className="block">{raw ? JSON.stringify(raw, null, 2) : ""}</code>
        </>
      )}
    </section>
  );
}
