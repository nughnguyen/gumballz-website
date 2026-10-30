"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Check, ClipboardPaste, Copy, KeyRound, Search, ShieldCheck } from "lucide-react";

type KeyResult = { status: "active" | "inactive" | "expired"; type: string; category: string; expiresAt: string; deviceBound: boolean; maxDevices: number };

export default function KeyLookup() {
  const [key, setKey] = useState("");
  const [result, setResult] = useState<KeyResult | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function pasteKey() {
    try { setKey(await navigator.clipboard.readText()); setMessage(""); }
    catch { setMessage("Không đọc được clipboard. Hãy dán key vào ô bên dưới."); }
  }

  async function lookup(event: FormEvent) {
    event.preventDefault(); setBusy(true); setResult(null); setMessage("");
    try {
      const response = await fetch("/api/keys/status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key }), cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.success) { setMessage(payload.error || "Không thể kiểm tra key."); return; }
      setResult(payload.data);
    } catch { setMessage("Máy chủ chưa phản hồi. Vui lòng thử lại sau."); }
    finally { setBusy(false); }
  }

  async function copyKey() {
    try { await navigator.clipboard.writeText(key); setCopied(true); window.setTimeout(() => setCopied(false), 1500); }
    catch { setMessage("Trình duyệt không cho phép sao chép tự động. Hãy chọn và sao chép key thủ công."); }
  }

  const label = result?.status === "active" ? "Đang hoạt động" : result?.status === "expired" ? "Đã hết hạn" : "Chưa kích hoạt";
  return <section className="neo-card bg-[#fff2a8] p-5 sm:p-7" aria-labelledby="key-lookup-title">
    <div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center border-2 border-black bg-[#ffe600] shadow-[3px_3px_0_#111217]"><KeyRound size={21}/></span><div><p className="text-xs font-black uppercase tracking-[.16em]">KEY STATUS</p><h2 id="key-lookup-title" className="mt-1 text-2xl font-black">Kiểm tra key của bạn</h2><p className="mt-1 text-sm text-slate-700">Xem trạng thái và ngày hết hạn an toàn.</p></div></div>
    <form onSubmit={lookup} className="mt-5"><label htmlFor="key-lookup-input" className="mb-2 block text-sm font-extrabold">Mã key</label><div className="flex flex-col gap-3 sm:flex-row"><input id="key-lookup-input" name="key" autoComplete="off" spellCheck={false} value={key} onChange={event => setKey(event.target.value)} placeholder="Dán key của bạn vào đây…" className="neo-field min-w-0 flex-1 font-mono text-sm"/><button type="button" onClick={pasteKey} className="neo-button-secondary shrink-0"><ClipboardPaste size={17}/> Dán từ clipboard</button></div>
      <button type="submit" disabled={busy || !key.trim()} className="neo-button mt-4 w-full sm:w-auto"><Search size={17}/>{busy ? "Đang kiểm tra…" : "Kiểm tra key"}</button>
    </form>
    {message && <p role="status" aria-live="polite" className="mt-4 border-2 border-black bg-white px-4 py-3 text-sm font-bold">{message}</p>}
    {result && <div role="status" aria-live="polite" className="mt-5 border-3 border-black bg-white p-4 shadow-[4px_4px_0_#111217] sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><ShieldCheck className="text-emerald-700"/><b className="text-lg font-black">{label}</b></div><span className="neo-badge">{result.type}</span></div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3"><div><dt className="text-slate-500">Danh mục</dt><dd className="font-extrabold">{result.category === "roblox" ? "Roblox" : "Mod Menu"}</dd></div><div><dt className="text-slate-500">Hết hạn</dt><dd className="font-extrabold">{new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(result.expiresAt))}</dd></div><div><dt className="text-slate-500">Thiết bị</dt><dd className="font-extrabold">{result.deviceBound ? `Đã liên kết · tối đa ${result.maxDevices}` : `Chưa liên kết · tối đa ${result.maxDevices}`}</dd></div></dl>
      <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={copyKey} className="neo-button-secondary">{copied ? <Check size={16}/> : <Copy size={16}/>} {copied ? "Đã sao chép" : "Sao chép key"}</button><Link href={`/docs?article=key-activation`} className="neo-button-secondary">Xem hướng dẫn kích hoạt</Link></div>
    </div>}
  </section>;
}
