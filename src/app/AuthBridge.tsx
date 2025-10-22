"use client";

import { useEffect } from "react";
import { setUnauthorizedHandler } from "../../lib/api";
import { useAuth } from "../../context/AuthProvider";

export default function AuthBridge() {
  const { setToken } = useAuth();

  useEffect(() => {
    setUnauthorizedHandler(() => setToken(null));
  }, [setToken]);

  return null;
}
