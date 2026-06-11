"use client";

import { useEffect, useState } from "react";

const KEY = "exchange_wallet_user_id";

export function useActiveUser() {
  const [userId, setUserIdState] = useState("");

  useEffect(() => {
    setUserIdState(window.localStorage.getItem(KEY) ?? "");
  }, []);

  function setUserId(value: string) {
    setUserIdState(value);
    window.localStorage.setItem(KEY, value);
  }

  return { userId, setUserId, hasUser: Boolean(userId) };
}
