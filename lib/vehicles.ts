// lib/vehicles.ts
import { tryFetch, type TryFetchResult } from './api';

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  plate: string;
  year?: number;
  vin?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateVehicleInput {
  make: string;
  model: string;
  plate: string;
  year?: number;
  vin?: string;
}

function authHeader(token?: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function listVehicles(
  token?: string | null
): Promise<TryFetchResult<Vehicle[]>> {
  return tryFetch<Vehicle[]>({
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
