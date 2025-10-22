// lib/vehicles.ts
import { ENDPOINTS, tryFetch } from "./api";

export type Vehicle = {
  id?: string;
  reg?: string;
  vin?: string;
  brand?: string;
  model?: string;
  year?: number | string;
  odo?: number | string;
  inspection?: string; // ISO date
  ocUntil?: string;    // ISO date
};

export async function listVehicles(token?: string | null) {
  return await tryFetch<Vehicle[]>({
    paths: "/vehicles", // jeśli masz inną ścieżkę, zmień tutaj
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  });
}

export async function createVehicle(body: Vehicle, token?: string | null) {
  return await tryFetch<Vehicle>({
    paths: "/vehicles",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body),
  });
}

export async function deleteVehicle(id: string, token?: string | null) {
  return await tryFetch({
    paths: `/vehicles/${id}`,
    method: "DELETE",
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
}
export async function updateVehicle(id: string, body: Vehicle, token?: string | null) {
  return await tryFetch<Vehicle>({
    paths: `/vehicles/${id}`,
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body),
  });
}