"use client";

import { useEffect, useState } from "react";
import { Bell, Check, X } from "lucide-react";

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

export function PushNotificationPrompt() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [state, setState] = useState<"hidden" | "ready" | "subscribed" | "blocked" | "saving">("hidden");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return;
    let active = true;
    fetch("/api/push/config", { cache: "no-store" }).then((response) => response.json()).then(async (config) => {
      if (!active || !config.enabled || !config.publicKey) return;
      setPublicKey(config.publicKey);
      const registration = await navigator.serviceWorker.register("/sw.js");
      const existing = await registration.pushManager.getSubscription();
      if (existing) setState("subscribed");
      else if (Notification.permission === "denied") setState("blocked");
      else setState("ready");
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  async function enable() {
    if (!publicKey) return;
    setState("saving");
    setError("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setState("blocked"); return; }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
      const response = await fetch("/api/push/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(subscription.toJSON()) });
      if (!response.ok) throw new Error("Subscription could not be saved");
      setState("subscribed");
    } catch (caught) {
      setState("ready");
      setError(caught instanceof Error ? caught.message : "Notifications could not be enabled");
    }
  }

  if (state === "hidden" || state === "blocked") return null;
  if (state === "subscribed") return <div className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900 shadow-lg dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-100"><Check className="h-4 w-4" /> Notifications on</div>;
  return <div className="fixed bottom-4 right-4 z-40 max-w-xs rounded-2xl border border-slate-300 bg-white p-4 text-slate-900 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"><div className="flex items-start gap-3"><Bell className="mt-0.5 h-5 w-5 text-emerald-600" /><div className="flex-1"><p className="font-bold">Stay updated</p><p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Get messages and booking updates even when the app is closed.</p>{error && <p className="mt-2 text-xs text-red-600 dark:text-red-300">{error}</p>}<button disabled={state === "saving"} onClick={enable} className="mt-3 rounded-xl bg-emerald-700 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60">{state === "saving" ? "Enabling…" : "Enable notifications"}</button></div><button aria-label="Dismiss notification prompt" onClick={() => setState("blocked")} className="text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"><X className="h-4 w-4" /></button></div></div>;
}
