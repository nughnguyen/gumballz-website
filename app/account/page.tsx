"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/utils/supabaseClient";
import { ArrowUpRight, CreditCard, ExternalLink, LogOut, PackageCheck, ShieldCheck, Wallet } from "lucide-react";

type Purchase = { id: string; amount: number; status: string; metadata: { type?: string; category?: string; duration_days?: number; product_title?: string; manual_review_requested?: boolean; manual_review_status?: string }; created_at: string };
type LedgerEntry = { id: string; amount: number; entry_type: string; description: string | null; created_at: string };
const money = (amount: number) => `${new Intl.NumberFormat("vi-VN").format(amount)}₫`;

export default function AccountPage() {
  const [email, setEmail] = useState("");
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [balance, setBalance] = useState(0);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [amount, setAmount] = useState(50000);
  const [walletMessage, setWalletMessage] = useState("");
  const [walletBusy, setWalletBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { location.assign("/login?next=/account"); return; }
      if (active) setEmail(data.user.email || "");
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) { location.assign("/login?next=/account"); return; }
      const headers = { Authorization: `Bearer ${token}` };
      const [purchasesResponse, walletResponse, adminResponse] = await Promise.all([
        fetch("/api/account/purchases", { headers, cache: "no-store" }),
        fetch("/api/wallet", { headers, cache: "no-store" }),
        fetch("/api/admin/session", { headers, cache: "no-store" }),
      ]);
      const [purchaseData, walletData] = await Promise.all([purchasesResponse.json(), walletResponse.json()]);
      if (active) {
        if (purchaseData.success) setPurchases(purchaseData.data || []);
        if (walletData.success) { setBalance(Number(walletData.balance) || 0); setLedger(walletData.ledger || []); }
        setIsAdmin(adminResponse.ok);
        setReady(true);
      }
    })();
    return () => { active = false; };
  }, []);

  async function signOut() { await supabase.auth.signOut(); location.assign("/"); }

  async function topUp(event: FormEvent) {
    event.preventDefault(); setWalletBusy(true); setWalletMessage("");
    try {
      const { data } = await supabase.auth.getSession();
      const response = await fetch("/api/wallet", { method: "POST", headers: { Authorization: `Bearer ${data.session?.access_token || ""}`, "Content-Type": "application/json" }, body: JSON.stringify({ amount }) });
      const result = await response.json();
      if (!response.ok || !result.success) { setWalletMessage(result.error || "Không tạo được giao dịch nạp ví."); return; }
      location.assign(`/payment?amount=${result.amount}&content=${encodeURIComponent(result.content)}&method=Banking&expiry=${result.expiry}&txId=${encodeURIComponent(result.id)}`);
    } catch { setWalletMessage("Máy chủ chưa phản hồi. Vui lòng thử lại."); }
    finally { setWalletBusy(false); }
  }

  async function download(id: string) {
    const { data } = await supabase.auth.getSession();
    const response = await fetch(`/api/product-download?transactionId=${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${data.session?.access_token || ""}` }, cache: "no-store" });
    const result = await response.json();
    if (result.success && result.url) window.location.assign(result.url); else alert(result.error || "Không thể tải sản phẩm.");
  }

  const manualReviewOrders = purchases.filter((purchase) => purchase.metadata?.manual_review_requested && purchase.status === "pending");
  const purchaseTitle = (purchase: Purchase) => purchase.metadata?.product_title
    || (purchase.metadata?.type === "key" ? `Key ${purchase.metadata.category || "license"} · ${purchase.metadata.duration_days || ""} ngày` : purchase.metadata?.type === "wallet_topup" ? "Nạp tiền vào ví" : "Sản phẩm số");

  return <main className="min-h-screen bg-[#fffdf5] px-5 pb-20 pt-32 text-[#111217] md:px-10"><div className="mx-auto max-w-6xl">
    <header className="flex flex-wrap items-end justify-between gap-5 border-b-[3px] border-black pb-7"><div><p className="text-xs font-black tracking-[.18em]">GUMBALLZ HUB / TÀI KHOẢN</p><h1 className="mt-3 text-4xl font-black uppercase tracking-[-.04em] sm:text-5xl">Tài khoản của bạn</h1><p className="mt-3 break-all text-sm font-semibold text-slate-600">{ready ? `Xin chào, ${email}` : "Đang tải tài khoản…"}</p></div><div className="flex flex-wrap gap-3">{isAdmin && <Link href="/admin" className="neo-button bg-[#7FE7D6]"><ShieldCheck size={17}/> Mở trang Admin <ArrowUpRight size={16}/></Link>}<button type="button" onClick={signOut} className="neo-button-secondary"><LogOut size={16}/> Đăng xuất</button></div></header>

    {manualReviewOrders.length > 0 && <section role="status" aria-live="polite" className="neo-card mt-7 border-[#E8F6FF]0 bg-[#E8F6FF] p-5 sm:p-6"><h2 className="text-lg font-black">Đơn đang chờ Admin duyệt</h2><p className="mt-1 text-sm font-semibold">Bạn đã báo thanh toán bằng ngân hàng chưa hỗ trợ tự động. Admin sẽ kiểm tra giao dịch và cập nhật trạng thái tại đây.</p><ul className="mt-3 divide-y-2 divide-black/20">{manualReviewOrders.map((purchase) => <li key={purchase.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span className="font-bold">{purchaseTitle(purchase)}</span><span className="font-black">{money(purchase.amount)} · Đang chờ duyệt</span></li>)}</ul></section>}
    <section className="mt-7 grid gap-5 lg:grid-cols-[.9fr_1.1fr]"><article className="neo-card bg-[#7FE7D6] p-6 sm:p-8"><div className="flex items-center gap-3"><span className="grid size-12 place-items-center border-[3px] border-black bg-white shadow-[3px_3px_0_#111217]"><Wallet size={22}/></span><div><p className="text-xs font-black tracking-widest">GUMBALLZ WALLET</p><h2 className="text-xl font-black">Số dư ví</h2></div></div><p className="mt-7 break-words text-4xl font-black tabular-nums sm:text-5xl">{money(balance)}</p><p className="mt-2 text-sm font-bold">Số dư chỉ tăng sau khi hệ thống xác nhận thanh toán.</p></article>
      <form onSubmit={topUp} className="neo-card bg-white p-6 sm:p-8"><h2 className="flex items-center gap-2 text-xl font-black"><CreditCard size={20}/> Nạp tiền vào ví</h2><p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Chọn số tiền rồi thanh toán bằng chuyển khoản. Hệ thống cộng số dư tự động sau khi nhận xác nhận.</p><div className="mt-5 flex flex-wrap gap-2">{[50000,100000,200000,500000].map(value=><button key={value} type="button" aria-pressed={amount===value} onClick={()=>setAmount(value)} className={`flex min-h-11 items-center justify-center border-2 border-black px-3 text-sm font-black shadow-[2px_2px_0_#111217] ${amount===value?"bg-[#3BA7F2]":"bg-white hover:bg-[#E8F6FF]"}`}>{money(value)}</button>)}</div><label htmlFor="wallet-amount" className="mt-5 block text-sm font-extrabold">Số tiền khác (bội số 1.000₫)</label><input id="wallet-amount" type="number" min={10000} max={20000000} step={1000} value={amount} onChange={event=>setAmount(Number(event.target.value))} className="neo-field mt-2"/><button type="submit" disabled={walletBusy} className="neo-button mt-4 w-full">{walletBusy?"Đang tạo giao dịch…":"Tiếp tục thanh toán"}<ArrowUpRight size={17}/></button>{walletMessage&&<p role="status" className="mt-3 border-2 border-black bg-[#E8F6FF] p-3 text-sm font-bold">{walletMessage}</p>}</form>
    </section>

    <section className="neo-card mt-6 bg-white p-6 sm:p-8"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-black tracking-widest">WALLET ACTIVITY</p><h2 className="mt-1 text-2xl font-black">Lịch sử ví</h2></div><span className="neo-badge">{ledger.length} giao dịch</span></div>{ledger.length?<ul className="mt-4 divide-y-2 divide-black">{ledger.map(entry=><li key={entry.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div className="min-w-0"><p className="break-words font-black">{entry.description || (entry.entry_type==="topup"?"Nạp tiền vào ví":"Giao dịch ví")}</p><p className="mt-1 text-xs font-semibold text-slate-500">{new Intl.DateTimeFormat("vi-VN",{dateStyle:"medium",timeStyle:"short"}).format(new Date(entry.created_at))}</p></div><b className={`shrink-0 text-lg font-black ${entry.entry_type === "purchase" ? "text-rose-700" : "text-emerald-800"}`}>{entry.entry_type === "purchase" ? "-" : "+"}{money(entry.amount)}</b></li>)}</ul>:<p className="mt-4 border-2 border-dashed border-black p-5 text-sm font-semibold text-slate-600">Chưa có giao dịch trong ví.</p>}</section>

    <section className="neo-card mt-6 bg-white p-6 sm:p-8"><div className="flex items-center gap-3"><PackageCheck/><div><h2 className="text-xl font-black">Giao dịch tài khoản</h2><p className="mt-1 text-sm font-semibold text-slate-600">Đơn mua hàng và nạp ví của tài khoản này.</p></div></div>{purchases.length?<div className="mt-5 divide-y-2 divide-black">{purchases.map(p=><div key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div className="min-w-0"><b className="break-words">{purchaseTitle(p)}</b><p className="mt-1 text-sm text-slate-500">{money(p.amount)} · {p.metadata.manual_review_status==="rejected"?"Yêu cầu bị từ chối":p.metadata.manual_review_requested&&p.status==="pending"?"Đang chờ Admin duyệt":p.status==="success"?"Đã xác nhận thanh toán":p.status==="failed"?"Giao dịch thất bại":"Đang chờ thanh toán"}</p></div>{p.status==="success"&&p.metadata?.type==="product"&&<button type="button" onClick={()=>download(p.id)} className="neo-button-secondary">Tải sản phẩm <ExternalLink size={15}/></button>}</div>)}</div>:<p className="mt-5 border-2 border-dashed border-black p-4 text-sm font-semibold text-slate-500">Bạn chưa có giao dịch tài khoản nào.</p>}</section>
    <section className="mt-6 flex flex-wrap items-center justify-between gap-4 border-[3px] border-black bg-[#E8F6FF] p-6 shadow-[5px_5px_0_#111217]"><div><h2 className="font-black">Khám phá cửa hàng</h2><p className="mt-1 text-sm font-semibold text-slate-600">Công cụ số, license key và dịch vụ Coiz.</p></div><Link href="/store" className="neo-button-secondary">Mở cửa hàng <ArrowUpRight size={16}/></Link></section>
  </div></main>;
}
