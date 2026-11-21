"use client";
import { MutationForm } from "./mutations";
import { request } from "@/lib/client-api";
import type { ServiceCopy } from "@/lib/service-copy";
export type ContentPage = { slug: string; title: string; body: string; published: boolean; version: number };
export type Ticket = {id:string;topic:string;message:string;reply:string;status:string;created_at:string};
export type ContactSubmission = {id:string;name:string;email:string;topic:string;message:string;status:string;email_status:string;email_attempts:number;email_accepted_at:string|null;ack_status:string|null;ack_attempts:number|null;ack_accepted_at:string|null;created_at:string};
export function ContactStatusForm({item}:{item:ContactSubmission}) {
  return <MutationForm label="Update status" successMessage="Contact status updated." submit={d=>request(`/admin/contact-submissions/${item.id}`,"PUT",{status:d.get("status")})}>
    <label>Status<select name="status" defaultValue={item.status}>{["open","in_progress","resolved"].map(status=><option key={status} value={status}>{status.replace("_"," ")}</option>)}</select></label>
  </MutationForm>;
}
export function SupportForm({ ticket, copy }: { ticket?: Ticket; copy: ServiceCopy["support"] }) {
  return <MutationForm reset={!ticket} label={ticket ? copy.saveResponse : copy.submitRequest} pendingLabel={copy.saving} successMessage={copy.saved} submit={d => ticket
    ? request(`/support/${ticket.id}`,"PUT",{status:d.get("status"),reply:d.get("reply")})
    : request("/support","POST",{topic:d.get("topic"),message:d.get("message")})}>
    {ticket ? <><label>{copy.status}<select name="status" defaultValue={ticket.status}>{(["open","in_progress","resolved"] as const).map(s=><option key={s} value={s}>{copy.statuses[s]}</option>)}</select></label><label>{copy.reply}<textarea name="reply" required maxLength={4000} defaultValue={ticket.reply}/></label></> : <><label>{copy.topic}<select name="topic">{Object.entries(copy.topics).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label>{copy.message}<textarea name="message" required minLength={10} maxLength={4000}/></label></>}
  </MutationForm>;
}
export function ContentForm({ slug, page }: {slug:string;page:ContentPage|null}) {
  return <MutationForm label="Save page" submit={d=>request(`/manage/content/${slug}`,"PUT",{title:d.get("title"),body:d.get("body"),published:d.get("published")==="true",version:page?.version ?? 0})}>
    <label>Page title<input name="title" required maxLength={200} defaultValue={page?.title ?? ""}/></label>
    <label>Approved content<textarea name="body" required maxLength={12000} rows={14} defaultValue={page?.body ?? ""}/></label>
    <label>Visibility<select name="published" defaultValue={String(page?.published ?? false)}><option value="false">Draft</option><option value="true">Published</option></select></label>
  </MutationForm>;
}
