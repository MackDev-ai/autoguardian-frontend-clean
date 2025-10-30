// src/lib/vehicles.ts
import { tryFetch, type TryFetchResult } from './api';

/* =====================
   Typy danych pojazdu
   ===================== */
export interface Vehicle {
  id?: string | number;

  /** Nazwa producenta pojazdu (backend: make) */
  make?: string;

  /** Nazwa modelu pojazdu (backend: model) */
  model?: string;

  /** Numer rejestracyjny (backend: registration) */
  plate?: string;   // alias lokalny
  reg?: string;     // alias lokalny

  /** Alternatywna nazwa producenta (frontend alias dla make) */
  brand?: string;   // alias lokalny

  /** Rok produkcji */
  year?: number | string;

  /** Numer VIN */
  vin?: string;

  /** Przebieg (backend: mileage_km) */
  odo?: number | string;

  /** Data następnego przeglądu technicznego (backend: inspection_date) */
  inspection?: string;

  /** Data ważności polisy OC (backend: insurance_date) */
  ocUntil?: string;

  created_at?: string;
  updated_at?: string;

  [key: string]: unknown;
}

/** Dane potrzebne do utworzenia nowego pojazdu */
export type CreateVehicleInput = Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>;

/* =====================
   Funkcje pomocnicze
   ===================== */
function authHeader(token?: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/* =====================
   Lista pojazdów
   ===================== */
export type VehicleListResponse = Vehicle[] | (Record<string, unknown> & { detail?: string });

export async function listVehicles(
  token?: string | null
): Promise<TryFetchResult<VehicleListResponse>> {
  return tryFetch<VehicleListResponse>({
    paths: ['/vehicles'],
    headers: { ...authHeader(token) },
  });
}

/* =====================
   Tworzenie pojazdu
   ===================== */
export async function createVehicle(
  body: CreateVehicleInput,
  token?: string | null
): Promise<TryFetchResult<Vehicle>> {
  // 🔁 MAPOWANIE front → backend
  const payload = {
    // Marka: brand (frontend) → make (backend)
    make: body.brand ?? body.make ?? '',

    // Model: bez zmian
    model: body.model ?? '',

    // Rejestracja: reg / plate (frontend) → registration (backend)
    registration: body.reg ?? body.plate ?? '',

    // Rok produkcji
    year: body.year ? Number(body.year) : null,

    // VIN
    vin: body.vin ?? '',

    // Przebieg: odo (frontend) → mileage_km (backend)
    mileage_km: body.odo ? Number(body.odo) : 0,

    // Daty: inspection / ocUntil → inspection_date / insurance_date
    inspection_date: body.inspection || null,
    insurance_date: body.ocUntil || null,
  };

  // 🚀 Wysyłka do backendu
  return tryFetch<Vehicle>({
    paths: ['/vehicles'],
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader(token) },
    body: JSON.stringify(payload),
  });
}

/* =====================
   Usuwanie pojazdu
   ===================== */
export async function deleteVehicle(
  id: string,
  token?: string | null
): Promise<TryFetchResult<Record<string, unknown>>> {
  return tryFetch<Record<string, unknown>>({
    paths: `/vehicles/${id}`,
    method: 'DELETE',
    headers: { ...authHeader(token) },
  });
}
