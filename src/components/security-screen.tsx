"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchJson, RequestError } from "@/lib/http";
import type { MfaEnrollment, MfaStatus } from "@/lib/mfa-handler";
import type { Locale } from "@/lib/i18n";
import { securityCopy } from "@/lib/security-copy";

export function SecurityScreen({next,locale}:{next:string;locale:Locale}) {
  const copy = securityCopy[locale], router = useRouter();
  const [status,setStatus] = useState<MfaStatus | null>(null);
  const [enrollment,setEnrollment] = useState<MfaEnrollment | null>(null);
  const [factorId,setFactorId] = useState("");
  const [show,setShow] = useState(false), [busy,setBusy] = useState(false), [error,setError] = useState("");
  const lock = useRef(false);
  const call = <T,>(body:object,signal?:AbortSignal) => fetchJson<T>("/api/auth/mfa",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),signal});
  useEffect(() => {
    const controller = new AbortController();
    call<MfaStatus>({action:"status"},controller.signal).then(value => {
      setStatus(value); setFactorId(value.factors[0]?.id ?? "");
    }).catch(() => { if (!controller.signal.aborted) setError(copy.unavailable); });
    return () => controller.abort();
  },[copy.unavailable]);
  async function perform(action:() => Promise<void>) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try { await action(); } catch (e) { setError(locale === "en" && e instanceof RequestError ? e.message : copy.unavailable); }
    finally { lock.current = false; setBusy(false); }
  }
  async function reload() {
    const value = await call<MfaStatus>({action:"status"});
    setStatus(value); setFactorId(value.factors[0]?.id ?? "");
  }
  async function verify(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget, code = String(new FormData(form).get("code") ?? "");
    await perform(async () => {
      const result = await call<{next:string}>({action:"verify",factorId:enrollment?.factorId ?? factorId,code,next});
      form.reset(); setEnrollment(null); setShow(false);
      router.replace(result.next); router.refresh();
    });
  }
  return <section className="panel form-stack" aria-busy={busy}>
    {error && <div className="notice error" role="alert"><p>{error}</p><button type="button" className="btn outline" disabled={busy} onClick={() => void perform(reload)}>{copy.retry}</button>{" "}<Link href={`/login?next=${encodeURIComponent(`/account/security?next=${encodeURIComponent(next)}`)}`}>{copy.signin}</Link></div>}
    {!status && !error && <p role="status">{copy.loading}</p>}
    {status?.verified ? <><p className="notice success" role="status">{copy.verified}</p><Link className="btn" href={next}>{copy.next}</Link></> : status && <>
      {enrollment && <div className="form-stack">
        <p>{copy.setup}</p>
        {/* Render trusted Auth QR data as an image, never inject SVG into the DOM. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={enrollment.qrCode} alt={copy.qr} width={220} height={220} style={{maxWidth:"100%",height:"auto"}} />
        <label>{copy.secret}<input type={show ? "text" : "password"} readOnly value={enrollment.secret} autoComplete="off" spellCheck={false} dir="ltr" /></label>
        <button type="button" className="btn outline" onClick={() => setShow(!show)}>{show ? copy.hide : copy.show}</button>
      </div>}
      {(enrollment || status.factors.length > 0) && <form onSubmit={verify} className="form-stack">
        {!enrollment && status.factors.length > 1 && <label>{copy.choose}<select value={factorId} onChange={e => setFactorId(e.target.value)} disabled={busy}>{status.factors.map((f,i) => <option key={f.id} value={f.id}>{copy.choose} {i+1}</option>)}</select></label>}
        <label>{copy.code}<input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required disabled={busy} dir="ltr" /></label>
        <button className="btn" disabled={busy}>{busy ? copy.pending : copy.submit}</button>
      </form>}
      {!enrollment && status.pending.length > 0 && <p>{copy.unfinished}</p>}
      {(enrollment ? [{id:enrollment.factorId}] : status.pending).map(f => <button key={f.id} type="button" className="btn outline" disabled={busy} onClick={() => void perform(async () => {
        await call({action:"cancel-enrollment",factorId:f.id}); setEnrollment(null); setShow(false); await reload();
      })}>{copy.cancel}</button>)}
      {!enrollment && status.canEnroll && <button className="btn" disabled={busy} onClick={() => void perform(async () => {setEnrollment(await call<MfaEnrollment>({action:"enroll"}));})}>{copy.enroll}</button>}
      {!enrollment && !status.canEnroll && !status.factors.length && !status.pending.length && <p className="notice">{copy.other}</p>}
    </>}
  </section>;
}
