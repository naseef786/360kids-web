"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { request, RequestError } from "@/lib/client-api";
import { MutationForm } from "./mutations";

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
  const router = useRouter();
  useEffect(() => {
    const controller = new AbortController();
    let running = false, previous: string|undefined, revoked = false;
    async function refresh() {
      if(running || revoked || document.visibilityState === "hidden") return;
      running = true;
      try {
        const feed = await request<{unread:number;total:number}>("/notifications?page=1&pageSize=1","GET",undefined,undefined,controller.signal);
        if(controller.signal.aborted) return;
        setUnread(feed.unread);
        setUnavailable(false);
        const signature = `${feed.total}:${feed.unread}`;
        if(previous !== undefined && signature !== previous) router.refresh();
        previous = signature;
      } catch(error) {
        if(!controller.signal.aborted) {
          setUnavailable(true);
          if(error instanceof RequestError && [401,403].includes(error.status)) {
            setUnread(null);
            revoked = true;
            router.refresh();
          }
        }
      } finally { running = false; }
    }
    void refresh();
    const interval = setInterval(() => void refresh(),30000);
    const focus = () => void refresh();
    window.addEventListener("focus",focus);
    document.addEventListener("visibilitychange",focus);
    return () => { controller.abort(); clearInterval(interval); window.removeEventListener("focus",focus); document.removeEventListener("visibilitychange",focus); };
  },[router]);
  return <Link className="text-link" href={href} aria-label={`${label}${unread === null ? "" : `, ${unread}`}${unavailable ? `, ${unavailableLabel}` : ""}`}>
    {label}{unread !== null && unread > 0 ? ` (${unread})` : ""}{unavailable ? ` · ${retryLabel}` : ""}
  </Link>;
}

export function MarkNotificationsRead({ids,label,pendingLabel,successMessage}:{ids?:string[];label:string;pendingLabel:string;successMessage:string}) {
  return <MutationForm label={label} pendingLabel={pendingLabel} successMessage={successMessage} submit={() => request("/notifications/read","POST",ids ? {ids} : {all:true})}><></></MutationForm>;
}
