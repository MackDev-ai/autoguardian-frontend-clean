// lib/vehicles.ts (polisy)
import { tryFetch, type TryFetchResult, ENDPOINTS } from './api';

export type ISODate = string; // np. "2025-10-22"

export interface Policy {
  id?: string;
  number?: string;
  insurer?: string;
  premium?: number | string;
  valid_from?: ISODate;
  valid_to?: ISODate;
  deductible?: number | string;
  coverage?: string[] | string;
}

export type CreatePolicyInput = Omit<Policy, 'id'>;

function authHeader(token?: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Pobierz listę polis.
 */
export async function listPolicies(
  token?: string | null
): Promise<TryFetchResult<Policy[]>> {
  return tryFetch<Policy[]>({
    paths: ENDPOINTS.polisyList, // ['/pobierz-polisy', '/polisy']
    headers: {
      ...authHeader(token),
    },
  });
}

/**
 * Utwórz nową polisę.
 */
export async function createPolicy(
  body: CreatePolicyInput,
  token?: string | null
): Promise<TryFetchResult<Policy>> {
  return tryFetch<Policy>({
    paths: ENDPOINTS.zapiszPolise, // ['/zapisz-polise', '/polisy']
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(token),
    },
    body: JSON.stringify(body),
  });
}

/**
 * Usuń polisę po id.
 * Zwracamy generyczny kształt, bo backend może zwrócić różne payloady.
 */
export async function deletePolicy(
  id: string,
  token?: string | null
): Promise<TryFetchResult<Record<string, unknown>>> {
  return tryFetch<Record<string, unknown>>({
    paths: `/polisy/${id}`,
    method: 'DELETE',
    headers: {
      ...authHeader(token),
    },
  });
}
