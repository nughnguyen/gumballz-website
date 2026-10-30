"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Mail, UserPlus } from "lucide-react";
import { supabase } from "@/app/utils/supabaseClient";

function safeDestination(next: string | null) {
  if (!next) return "/account";
  const target = new URL(next, window.location.origin);
  return target.origin === window.location.origin ? `${target.pathname}${target.search}${target.hash}` : "/account";
}

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setMessage(""); setSuccess(false);
    if (password.length < 8) { setMessage("Mật khẩu cần có ít nhất 8 ký tự."); return; }
    if (password !== confirmPassword) { setMessage("Mật khẩu xác nhận chưa khớp."); return; }
    setBusy(true);
    const next = new URLSearchParams(window.location.search).get("next");
    const callback = new URL("/login", window.location.origin);
    if (next) callback.searchParams.set("next", safeDestination(next));
    const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: callback.toString() } });
    setBusy(false);
    if (error) { setMessage(error.message); return; }
    if (data.session) { window.location.assign(safeDestination(next)); return; }
    setSuccess(true);
    setMessage("Tài khoản đã được tạo. Hãy mở email để xác nhận, sau đó đăng nhập.");
  }

  return <main className="grid min-h-[85vh] place-items-center bg-[#fffdf5] px-5 py-28 text-[#111217]"><div className="grid w-full max-w-5xl overflow-hidden border-[3px] border-black bg-white shadow-[8px_8px_0_#111217] md:grid-cols-[.9fr_1.1fr]">
    <aside className="flex flex-col justify-between border-b-[3px] border-black bg-[#00d9f5] p-7 sm:p-10 md:border-b-0 md:border-r-[3px]"><Link href="/" className="text-lg font-black">GUMBALLZ HUB</Link><div className="py-8"><span className="grid size-14 place-items-center border-[3px] border-black bg-white shadow-[4px_4px_0_#111217]"><UserPlus size={24}/></span><p className="mt-7 text-xs font-black tracking-[.2em]">BẮT ĐẦU TẠI ĐÂY</p><h1 className="mt-3 text-4xl font-black uppercase leading-[.98] tracking-[-.05em] sm:text-5xl">Tạo tài khoản<br/>mới</h1><p className="mt-4 max-w-sm text-sm font-semibold leading-6">Một tài khoản để theo dõi đơn hàng, nhận sản phẩm và quản lý số dư ví.</p></div><Link href="/store" className="inline-flex w-fit items-center gap-2 text-sm font-black underline decoration-2 underline-offset-4">Xem cửa hàng <ArrowRight size={16}/></Link></aside>
    <section className="p-6 sm:p-10"><p className="text-xs font-black tracking-widest">THÀNH VIÊN GUMBALLZ</p><h2 className="mt-2 text-2xl font-black sm:text-3xl">Đăng ký</h2><p className="mt-2 text-sm font-medium leading-6 text-slate-600">Tạo tài khoản bằng email của bạn. Không cần đăng ký để nạp Coiz Discord hoặc xu Minecraft.</p>
      <form onSubmit={submit} className="mt-7 space-y-4"><label className="block text-sm font-extrabold">Email<div className="mt-2 flex h-12 items-center gap-3 border-2 border-black bg-[#fffdf5] px-3 focus-within:bg-[#dffbff]"><Mail size={17}/><input required type="email" autoComplete="email" value={email} onChange={event=>setEmail(event.target.value)} className="min-w-0 flex-1 bg-transparent outline-none" placeholder="you@example.com"/></div></label>
        <label className="block text-sm font-extrabold">Mật khẩu<input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={event=>setPassword(event.target.value)} className="neo-field mt-2" placeholder="Ít nhất 8 ký tự"/></label>
        <label className="block text-sm font-extrabold">Xác nhận mật khẩu<input required minLength={8} type="password" autoComplete="new-password" value={confirmPassword} onChange={event=>setConfirmPassword(event.target.value)} className="neo-field mt-2" placeholder="Nhập lại mật khẩu"/></label>
        {message&&<p role={success?"status":"alert"} className={`flex items-start gap-2 border-2 border-black p-3 text-sm font-bold ${success?"bg-[#d5ffdf]":"bg-[#ffdbdf]"}`}>{success&&<CheckCircle2 size={17} className="shrink-0"/>}{message}</p>}
        <button disabled={busy} className="neo-button w-full">{busy?"Đang tạo tài khoản…":"Tạo tài khoản"}<ArrowRight size={17}/></button>
      </form>
      <div className="mt-6 border-t-2 border-dashed border-black pt-5 text-center"><p className="text-sm font-semibold text-slate-600">Bạn đã có tài khoản?</p><Link href="/login" onClick={(event)=>{const next=new URLSearchParams(window.location.search).get("next");if(next)event.currentTarget.href=`/login?next=${encodeURIComponent(next)}`}} className="neo-button-secondary mt-3 w-full">Đăng nhập</Link></div>
    </section>
  </div></main>;
}
