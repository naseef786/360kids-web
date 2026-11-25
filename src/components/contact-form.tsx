"use client";
import { MutationForm } from "./mutations";
import { request } from "@/lib/client-api";
import type { Locale } from "@/lib/i18n";
import Link from "next/link";

export function ContactForm({locale}:{locale:Locale}) {
  const ar=locale==="ar";
  return <MutationForm
    reset
    className="form-stack contact-form"
    label={ar?"إرسال الرسالة":"Send message"}
    pendingLabel={ar?"جارٍ الإرسال…":"Sending…"}
    successMessage={ar?"تم استلام رسالتك. سيتواصل معك فريقنا عبر البريد الإلكتروني.":"Your message has been received. Our team will reply by email."}
    submit={async(data,key)=>request("/contact","POST",{
      name:String(data.get("name")??""),
      email:String(data.get("email")??""),
      topic:String(data.get("topic")??""),
      message:String(data.get("message")??""),
      website:String(data.get("website")??""),
    },key)}>
    <div className="contact-form-row">
      <label>{ar?"الاسم":"Your name"}<input name="name" autoComplete="name" required minLength={2} maxLength={120} placeholder={ar?"اسمك":"Your full name"}/></label>
      <label>{ar?"البريد الإلكتروني":"Email address"}<input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@example.com"/></label>
    </div>
    <label>{ar?"الموضوع":"Topic"}<select name="topic" required>
      <option value="general">{ar?"استفسار عام":"General enquiry"}</option>
      <option value="booking">{ar?"الحجوزات":"Booking"}</option>
      <option value="provider">{ar?"الشراكات":"Partnership"}</option>
      <option value="account">{ar?"الحساب":"Account"}</option>
    </select></label>
    <label>{ar?"رسالتك":"Your message"}<textarea name="message" required minLength={10} maxLength={4000} rows={6} placeholder={ar?"كيف يمكننا مساعدتك؟":"Tell us a little about your question..."}/></label>
    <div className="contact-website" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
    <p className="fine-print">{ar?"نستخدم بريدك الإلكتروني للرد. يرجى عدم إرسال تفاصيل الأطفال أو بيانات الدفع هنا.":"We use your email to reply. Please do not include children’s details or payment information."} <Link href="/privacy">{ar?"سياسة الخصوصية":"Privacy policy"}</Link></p>
  </MutationForm>;
}
