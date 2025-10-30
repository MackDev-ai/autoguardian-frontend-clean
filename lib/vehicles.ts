// src/lib/vehicles.ts
import { tryFetch, type TryFetchResult } from './api';

/* =====================
   Typy danych pojazdu
   ===================== */
export interface Vehicle {
  id?: string | number;

  // podstawowe pola (zgodne z backendem)
  make?: string; // marka
  model?: string;
  year?: number | string;
  vin?: string;

  // pola backendowe
  registration?: string; // numer rejestracyjny
  mileage_km?: number | string; // przebieg
  inspection_date?: string; // data przeglądu
  insurance_date?: string; // data ważności OC

  // aliasy frontendowe (do wyświetlania)
  brand?: string; // alternatywna nazwa marki (FE)
  plate?: string; // alias do registration
  reg?: string; // alias do registration
  odo?: number | string; // alias do mileage_km
  inspection?: string; // alias do inspection_date
  ocUntil?: string; // alias do insurance_date

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
