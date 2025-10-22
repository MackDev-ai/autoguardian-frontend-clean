// lib/vehicles.ts
import { tryFetch, type TryFetchResult } from './api';

export interface Vehicle {
  id?: string | number;
  /**
   * Nazwa producenta pojazdu zwracana przez backend (alias brand).
   */
  make?: string;
  /**
   * Nazwa modelu pojazdu zwracana przez backend.
   */
  model?: string;
  /**
   * Numer rejestracyjny (alias reg/registration).
   */
  plate?: string;
  /**
   * Alternatywna nazwa producenta używana po stronie frontendowej.
   */
  brand?: string;
  /**
   * Alternatywna nazwa rejestracji używana po stronie frontendowej.
   */
  reg?: string;
  year?: number | string;
  vin?: string;
  /**
   * Przechowywany przebieg pojazdu.
   */
  odo?: number | string;
  /**
   * Data następnego przeglądu technicznego.
   */
  inspection?: string;
  /**
   * Data ważności polisy OC.
   */
  ocUntil?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export type CreateVehicleInput = Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>;

function authHeader(token?: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export type VehicleListResponse = Vehicle[] | (Record<string, unknown> & { detail?: string });

export async function listVehicles(
  token?: string | null
): Promise<TryFetchResult<VehicleListResponse>> {
  return tryFetch<VehicleListResponse>({
    paths: ['/vehicles'],
    headers: { ...authHeader(token) },
  });
}

export async function createVehicle(
  body: CreateVehicleInput,
  token?: string | null
): Promise<TryFetchResult<Vehicle>> {
  return tryFetch<Vehicle>({
    paths: ['/vehicles'],
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader(token) },
    body: JSON.stringify(body),
  });
}

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
