"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { supabase } from "@/app/utils/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { setMessage("Không thể đăng nhập. Hãy kiểm tra email và mật khẩu rồi thử lại."); return; }
    const next = new URLSearchParams(location.search).get("next");
    const destination = next ? new URL(next, location.origin) : null;
    const validNext = destination?.origin === location.origin ? destination.pathname + destination.search + destination.hash : null;
    if (validNext && !validNext.startsWith("/admin")) { location.assign(validNext); return; }
    const adminCheck = await fetch("/api/admin/session", { headers: { Authorization: `Bearer ${data.session?.access_token || ""}` }, cache: "no-store" });
    location.assign(adminCheck.ok ? "/admin" : "/account");
  }

  return <main className="grid min-h-[85vh] place-items-center bg-[#fffdf5] px-5 py-28 text-[#111217]"><div className="grid w-full max-w-5xl overflow-hidden border-[3px] border-black bg-white shadow-[8px_8px_0_#111217] md:grid-cols-[.9fr_1.1fr]">
    <aside className="flex flex-col justify-between border-b-[3px] border-black bg-[#ffe600] p-7 sm:p-10 md:border-b-0 md:border-r-[3px]"><Link href="/" className="text-lg font-black">GUMBALLZ HUB</Link><div className="py-8"><span className="grid size-14 place-items-center border-[3px] border-black bg-white shadow-[4px_4px_0_#111217]"><LockKeyhole size={24}/></span><p className="mt-7 text-xs font-black tracking-[.2em]">KHU VỰC THÀNH VIÊN</p><h1 className="mt-3 text-4xl font-black uppercase leading-[.98] tracking-[-.05em] sm:text-5xl">Đăng nhập<br/>tài khoản</h1><p className="mt-4 max-w-sm text-sm font-semibold leading-6">Tiếp tục thanh toán đơn hàng và quản lý sản phẩm số đã mua.</p></div><Link href="/store" className="inline-flex w-fit items-center gap-2 text-sm font-black underline decoration-2 underline-offset-4">Khám phá cửa hàng <ArrowRight size={16}/></Link></aside>
    <section className="p-6 sm:p-10"><p className="text-xs font-black tracking-widest">CHÀO MỪNG TRỞ LẠI</p><h2 className="mt-2 text-2xl font-black sm:text-3xl">Đăng nhập</h2><p className="mt-2 text-sm font-medium leading-6 text-slate-600">Nhập thông tin tài khoản GumballZ Hub của bạn.</p>
      <form onSubmit={submit} className="mt-7 space-y-5"><label className="block text-sm font-extrabold">Email<div className="mt-2 flex h-12 items-center gap-3 border-2 border-black bg-[#fffdf5] px-3 focus-within:bg-[#dffbff]"><Mail size={17}/><input required type="email" autoComplete="email" value={email} onChange={event=>setEmail(event.target.value)} className="min-w-0 flex-1 bg-transparent outline-none" placeholder="you@example.com"/></div></label>
        <label className="block text-sm font-extrabold">Mật khẩu<input required type="password" autoComplete="current-password" value={password} onChange={event=>setPassword(event.target.value)} className="neo-field mt-2" placeholder="Nhập mật khẩu"/></label>
        {message&&<p role="alert" className="border-2 border-black bg-[#ffdbdf] p-3 text-sm font-bold">{message}</p>}
        <button disabled={busy} className="neo-button w-full">{busy?"Đang đăng nhập…":"Đăng nhập"}<ArrowRight size={17}/></button>
      </form>
      <div className="mt-6 border-t-2 border-dashed border-black pt-5 text-center"><p className="text-sm font-semibold text-slate-600">Bạn chưa có tài khoản?</p><Link href="/register" onClick={(event)=>{const next=new URLSearchParams(window.location.search).get("next");if(next)event.currentTarget.href=`/register?next=${encodeURIComponent(next)}`}} className="neo-button-secondary mt-3 w-full">Tạo tài khoản mới</Link></div>
      <p className="mt-6 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500"><ShieldCheck size={15}/> Thông tin đăng nhập được bảo vệ.</p>
    </section>
  </div></main>;
}
