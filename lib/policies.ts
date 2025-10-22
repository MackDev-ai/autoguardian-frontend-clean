// lib/policies.ts
import { tryFetch } from "./api";

export type Policy = {
  id?: string;
  number?: string;
  insurer?: string;
  premium?: number | string;
  valid_from?: string;  // ISO
  valid_to?: string;    // ISO
  deductible?: number | string;
  coverage?: string[] | string;
};

export async function listPolicies(token?: string | null) {
  return await tryFetch<Policy[]>({
    paths: ["/pobierz-polisy","/polisy"],  // fallback
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  });
}

export async function createPolicy(body: Policy, token?: string | null) {
  return await tryFetch<Policy>({
    paths: ["/polisy", "/zapisz-polise"], // prefer POST /polisy
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body),
  });
}

export async function deletePolicy(id: string, token?: string | null) {
  return await tryFetch({
    paths: `/polisy/${id}`,
    method: "DELETE",
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
}
