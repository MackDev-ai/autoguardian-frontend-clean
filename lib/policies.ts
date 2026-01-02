// src/lib/policies.ts
import { tryFetch, type TryFetchResult } from "./api";

export type ISODate = string; // "YYYY-MM-DD"
export type PolicyType = "OC" | "AC" | "NNW" | "ASS";

export interface PolicyOut {
  id: number;
  user_id: number;
  vehicle_id: number;
  policy_type: PolicyType;

  insurer: string;
  policy_number: string;

  start_date: ISODate;
  end_date: ISODate;

  premium_total?: number | null;
  premium_installments_json?: any | null;

  coverage_json: any; // list/dict
  deductible?: number | null;
  exclusions: any;
  documents: any;

  raw_text?: string | null;

  created_at?: string;
  updated_at?: string;
}

export interface PolicyCreate {
  vehicle_id: number;
  policy_type: PolicyType;

  insurer: string;
  policy_number: string;
  start_date: ISODate;
  end_date: ISODate;

  premium_total?: number | null;
  premium_installments_json?: any | null;

  coverage_json?: any; // jeśli brak -> backend domyślnie []
  deductible?: number | null;

  exclusions?: any; // jeśli brak -> backend domyślnie []
  documents?: any;  // jeśli brak -> backend domyślnie []
  raw_text?: string | null;
}

// auth jest po cookies (ag_token), więc to jest kluczowe:
const withCreds = { credentials: "include" as const };

/**
 * GET /policies
 */
export async function listPolicies(): Promise<TryFetchResult<PolicyOut[]>> {
  return tryFetch<PolicyOut[]>({
    paths: "/policies",
    ...withCreds,
  });
}

/**
 * POST /policies
 */
export async function createPolicy(
  body: PolicyCreate
): Promise<TryFetchResult<PolicyOut>> {
  return tryFetch<PolicyOut>({
    paths: "/policies",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    ...withCreds,
  });
}

/**
 * DELETE /policies/{id}
 * (UWAGA: backend musi mieć taki endpoint; jeśli jeszcze nie masz – nie używaj)
 */
export async function deletePolicy(
  id: number
): Promise<TryFetchResult<{ success?: boolean; detail?: string }>> {
  return tryFetch<{ success?: boolean; detail?: string }>({
    paths: `/policies/${id}`,
    method: "DELETE",
    ...withCreds,
  });
}

/**
 * Helper: jeśli masz jeszcze UI na starych polach (number/valid_from/premium),
 * to możesz tymczasowo mapować.
 */
export function toLegacyPolicyView(p: PolicyOut) {
  return {
    id: String(p.id),
    number: p.policy_number,
    insurer: p.insurer,
    premium: p.premium_total,
    valid_from: p.start_date,
    valid_to: p.end_date,
    deductible: p.deductible,
    coverage: p.coverage_json,
  };
}
