"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { request, RequestError } from "@/lib/client-api";
import { MutationForm } from "./mutations";
import { foregroundRefresh } from "@/lib/foreground-refresh";

export function NotificationLink({
  href,
  label,
  unavailableLabel,
  retryLabel,
}: {
  href: string;
  label: string;
  unavailableLabel: string;
  retryLabel: string;
}) {
  const [unread,setUnread] = useState<number|null>(null);
  const [unavailable,setUnavailable] = useState(false);
  const retry = useRef<(() => void) | null>(null);
  const router = useRouter();
  useEffect(() => {
    let previous: string | undefined;
    const poller = foregroundRefresh({
      load: (signal) => request<{
        unread: number;
        total: number;
        items: { id: string; sequence: string }[];
      }>("/notifications?page=1&pageSize=1", "GET", undefined, undefined, signal),
      isActive: () => navigator.onLine && document.visibilityState !== "hidden",
      onData: (feed) => {
        setUnread(feed.unread);
        setUnavailable(false);
        const signature = `${feed.items[0]?.id ?? ""}:${feed.items[0]?.sequence ?? ""}:${feed.total}:${feed.unread}`;
        if(previous !== undefined && signature !== previous) router.refresh();
        previous = signature;
      },
      onError: (error) => {
        setUnavailable(true);
        if(error instanceof RequestError && [401,403].includes(error.status)) {
          setUnread(null);
          router.refresh();
          return false;
        }
        return true;
      },
    });
    const refresh = () => void poller.refresh();
    const offline = () => { setUnavailable(true); refresh(); };
    retry.current = refresh;
    void refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    window.addEventListener("offline", offline);
    window.addEventListener("notifications:changed", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      retry.current = null;
      poller.stop();
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
      window.removeEventListener("offline", offline);
      window.removeEventListener("notifications:changed", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  },[router]);
  return <div className="notification-controls">
    <Link className="text-link" href={href} aria-label={`${label}${unread === null ? "" : `, ${unread}`}`}>
      {label}{unread !== null && unread > 0 ? ` (${unread})` : ""}
    </Link>
    {unavailable && <>
      <span role="status" className="fine-print">{unavailableLabel}</span>
      <button type="button" className="text-link" onClick={() => retry.current?.()}>{retryLabel}</button>
    </>}
  </div>;
}

export function MarkNotificationsRead({ids,label,pendingLabel,successMessage}:{ids?:string[];label:string;pendingLabel:string;successMessage:string}) {
  return <MutationForm label={label} pendingLabel={pendingLabel} successMessage={successMessage} submit={() => request("/notifications/read","POST",ids ? {ids} : {all:true})} onSuccess={() => { window.dispatchEvent(new Event("notifications:changed")); }}><></></MutationForm>;
}
