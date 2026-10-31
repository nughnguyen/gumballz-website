"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownToLine, ArrowRight, Box, CircleDollarSign, Clock3, Gamepad2, KeyRound, Package, RefreshCw, Settings2, ShoppingBag, Sparkles, Trash2, Users } from "lucide-react";
import { supabase } from "@/app/utils/supabaseClient";
import ManualPaymentQueue from "@/app/admin/ManualPaymentQueue";

type Transaction = {
  id: string;
  user_id: string | null;
  amount: number;
  status: string;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};
type Stats = {
  metrics: { lifetimeRevenue: number; todayRevenue: number; todayOrders: number; monthRevenue: number; monthOrders: number; paidOrders: number; pendingOrders: number; pendingAmount: number; walletTopups: number; activeProducts: number; customers: number };
  daily: { date: string; revenue: number; orders: number }[];
  recent: Transaction[];
  generatedAt: string;
};

const money = (value: number) => `${new Intl.NumberFormat("vi-VN").format(value)} ₫`;
const dateTime = (value: string) => new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
const statusLabels: Record<string, string> = { success: "Thành công", pending: "Đang chờ", failed: "Thất bại", expired: "Hết hạn", late_payment: "Thanh toán trễ", ignored_code_not_found: "Không tìm thấy mã" };

const sections = [
  { title: "Sản phẩm", desc: "Quản lý tool, key và Coiz", href: "/admin/products", icon: Package, color: "bg-[#3BA7F2]" },
  { title: "Quản lý key", desc: "Tạo key và kiểm soát thời hạn", href: "/admin/keys", icon: KeyRound, color: "bg-[#7FE7D6]" },
  { title: "Cấu hình dịch vụ", desc: "Cập nhật cấu hình từ xa", href: "/admin/mod-config", icon: Settings2, color: "bg-[#7FE7D6]" },
  { title: "Tài nguyên tải", desc: "Quản lý file và đường dẫn tải", href: "/admin/downloads", icon: Box, color: "bg-[#7FE7D6]" },
  { title: "Tài khoản game", desc: "Quản lý acc lẻ, kho túi mù và nhập danh sách acc", href: "/admin/game-accounts", icon: Gamepad2, color: "bg-[#3BA7F2]" },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const loadStats = useCallback(async (background = false) => {
    if (background) setRefreshing(true); else setLoading(true);
    setError("");
    try {
      const { data } = await supabase.auth.getSession();
      const response = await fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${data.session?.access_token || ""}` }, cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Không tải được thống kê.");
      setStats(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được thống kê.");
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    void loadStats();
    const refreshWhenVisible = () => { if (document.visibilityState === "visible") void loadStats(true); };
    const interval = window.setInterval(refreshWhenVisible, 10000);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => { window.clearInterval(interval); document.removeEventListener("visibilitychange", refreshWhenVisible); };
  }, [loadStats]);
  const maxDailyRevenue = useMemo(() => Math.max(1, ...(stats?.daily.map((day) => day.revenue) || [])), [stats]);

  async function deleteTransaction(transaction: Transaction) {
    if (transaction.status === "success") return;
    if (!window.confirm(`Xóa giao dịch ${transaction.description || transaction.id}? Chỉ giao dịch chưa thanh toán mới được xóa.`)) return;
    setDeletingId(transaction.id);
    try {
      const { data } = await supabase.auth.getSession();
      const response = await fetch("/api/admin/transactions", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${data.session?.access_token || ""}`, "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: transaction.id }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Không xóa được giao dịch.");
      await loadStats(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không xóa được giao dịch.");
    } finally {
      setDeletingId("");
    }
  }

  const metrics = stats?.metrics;
  const cards = [
    { label: "Doanh thu hôm nay", value: money(metrics?.todayRevenue || 0), note: `${metrics?.todayOrders || 0} đơn đã thanh toán`, icon: CircleDollarSign, color: "bg-[#7FE7D6]" },
    { label: "Doanh thu tháng này", value: money(metrics?.monthRevenue || 0), note: `${metrics?.monthOrders || 0} đơn đã thanh toán`, icon: ShoppingBag, color: "bg-[#3BA7F2]" },
    { label: "Tổng doanh thu", value: money(metrics?.lifetimeRevenue || 0), note: `${metrics?.paidOrders || 0} đơn thành công`, icon: ArrowDownToLine, color: "bg-[#7FE7D6]" },
    { label: "Đơn chờ thanh toán", value: String(metrics?.pendingOrders || 0), note: `Giá trị đang chờ: ${money(metrics?.pendingAmount || 0)}`, icon: Clock3, color: "bg-[#ffb7d7]" },
  ];

  return <div className="space-y-7">
    <header className="neo-card flex flex-wrap items-end justify-between gap-5 bg-[#7FE7D6] p-6 sm:p-9">
      <div><p className="inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-2 text-xs font-black tracking-widest shadow-[3px_3px_0_#111217]"><Sparkles size={15}/> ADMIN CONTROL ROOM</p><h1 className="mt-5 text-3xl font-black uppercase leading-tight tracking-[-.04em] sm:text-5xl">Tổng quan cửa hàng</h1><p className="mt-3 max-w-2xl text-sm font-semibold leading-6 sm:text-base">Theo dõi doanh thu, đơn hàng và hoạt động kinh doanh tại một nơi.</p></div>
      <button type="button" onClick={() => void loadStats(true)} disabled={refreshing} className="neo-button bg-white"><RefreshCw size={16} className={refreshing ? "animate-spin" : ""}/> Làm mới số liệu</button>
    </header>

    {error && <div role="alert" className="neo-card border-red-700 bg-red-100 p-4 font-bold text-red-900">{error}<button onClick={() => void loadStats()} className="ml-3 underline">Thử lại</button></div>}

    <section aria-label="Chỉ số kinh doanh" className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
      {cards.map(({ label, value, note, icon: Icon, color }) => <article key={label} className="neo-card min-w-0 bg-white p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-sm font-extrabold text-slate-600">{label}</p><p className="mt-3 break-words text-2xl font-black tabular-nums sm:text-3xl">{loading ? "Đang tải…" : value}</p></div><span className={`grid size-11 shrink-0 place-items-center border-[3px] border-black ${color} shadow-[3px_3px_0_#111217]`}><Icon size={19}/></span></div><p className="mt-3 text-xs font-bold text-slate-500">{note}</p></article>)}
    </section>

    <ManualPaymentQueue />

    <section className="grid gap-5 xl:grid-cols-[1.4fr_.8fr]">
      <article className="neo-card min-w-0 bg-white p-5 sm:p-7"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-black tracking-widest">7 NGÀY GẦN NHẤT</p><h2 className="mt-1 text-2xl font-black">Doanh thu theo ngày</h2></div><span className="neo-badge">Chỉ tính đơn thành công</span></div>
        <div className="mt-7 grid h-56 grid-cols-7 items-end gap-2 border-b-2 border-black pb-2 sm:gap-4">{(stats?.daily || Array.from({ length: 7 }, (_, i) => ({ date: new Date(Date.now() - (6 - i) * 86400000).toISOString(), revenue: 0, orders: 0 }))).map((day) => <div key={day.date} className="flex h-full min-w-0 flex-col items-center justify-end gap-2"><span className="max-w-full truncate text-center text-[10px] font-black sm:text-xs">{day.revenue ? new Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 }).format(day.revenue) : "—"}</span><div title={`${money(day.revenue)} · ${day.orders} đơn`} className="w-full max-w-12 border-2 border-black bg-[#3BA7F2] shadow-[2px_2px_0_#111217]" style={{ height: `${Math.max(day.revenue ? 8 : 2, (day.revenue / maxDailyRevenue) * 125)}px` }}/><span className="text-[10px] font-bold sm:text-xs">{new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(new Date(day.date))}</span></div>)}</div>
        <p className="mt-3 text-xs font-semibold text-slate-500">Doanh thu không bao gồm tiền khách nạp vào ví.</p>
      </article>
      <article className="neo-card bg-[#E8F6FF] p-5 sm:p-7"><p className="text-xs font-black tracking-widest">HOẠT ĐỘNG</p><h2 className="mt-1 text-2xl font-black">Cửa hàng</h2><div className="mt-5 space-y-3">{[{ label: "Sản phẩm đang bán", value: metrics?.activeProducts ?? 0, icon: Package }, { label: "Khách có giao dịch", value: metrics?.customers ?? 0, icon: Users }, { label: "Đã nạp vào ví", value: money(metrics?.walletTopups || 0), icon: CircleDollarSign }].map(({ label, value, icon: Icon }) => <div key={label} className="flex items-center justify-between gap-3 border-2 border-black bg-white p-3"><span className="flex min-w-0 items-center gap-2 text-sm font-bold"><Icon size={17} className="shrink-0"/>{label}</span><b className="shrink-0 text-right">{loading ? "…" : value}</b></div>)}</div></article>
    </section>

    <section className="neo-card overflow-hidden bg-white"><div className="flex flex-wrap items-end justify-between gap-3 p-5 sm:p-7"><div><p className="text-xs font-black tracking-widest">GIAO DỊCH MỚI NHẤT</p><h2 className="mt-1 text-2xl font-black">Đơn hàng gần đây</h2></div><span className="neo-badge">{stats?.recent.length || 0} giao dịch</span></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[760px] border-t-[3px] border-black text-left text-sm"><thead className="bg-[#E8F6FF]"><tr>{["Mã / sản phẩm", "Khách hàng", "Thời gian", "Trạng thái", "Số tiền"].map((heading) => <th key={heading} className="px-4 py-3 font-black">{heading}</th>)}<th className="px-4 py-3 font-black">Thao tác</th></tr></thead><tbody>{stats?.recent.map((transaction) => { const title = typeof transaction.metadata?.product_title === "string" ? transaction.metadata.product_title : transaction.metadata?.type === "wallet_topup" ? "Nạp ví" : transaction.description || "Giao dịch"; return <tr key={transaction.id} className="border-t-2 border-black/15"><td className="max-w-64 px-4 py-3"><p className="truncate font-black">{title}</p><p className="text-xs text-slate-500">{transaction.description || transaction.id.slice(0, 8)}</p></td><td className="px-4 py-3 font-mono text-xs">{transaction.user_id ? `${transaction.user_id.slice(0, 8)}…` : "Khách"}</td><td className="whitespace-nowrap px-4 py-3">{dateTime(transaction.created_at)}</td><td className="px-4 py-3"><span className={`inline-flex border-2 border-black px-2 py-1 text-xs font-black ${transaction.status === "success" ? "bg-[#7FE7D6]" : transaction.status === "pending" ? "bg-[#7FE7D6]" : "bg-[#ffb7d7]"}`}>{statusLabels[transaction.status] || transaction.status}</span></td><td className="whitespace-nowrap px-4 py-3 text-right font-black">{money(transaction.amount)}</td><td className="px-4 py-3">{transaction.status !== "success" && <button type="button" onClick={() => void deleteTransaction(transaction)} disabled={!!deletingId} className="neo-button-secondary min-h-9 px-3 py-2 text-xs disabled:opacity-50">{deletingId === transaction.id ? "Đang xóa…" : <><Trash2 size={14}/> Xóa</>}</button>}</td></tr>; })}</tbody></table>
      {loading && <p className="p-6 text-sm font-bold">Đang tải giao dịch…</p>}{!loading && !stats?.recent.length && <p className="p-6 text-sm font-bold">Chưa có giao dịch nào.</p>}</div>
    </section>

    <section><div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-black tracking-widest">QUẢN LÝ</p><h2 className="mt-1 text-2xl font-black">Lối tắt quản trị</h2></div><span className="neo-badge">05 KHU VỰC</span></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{sections.map(({ title, desc, href, icon: Icon, color }) => <Link href={href} key={href} className="neo-card group flex min-h-48 min-w-0 flex-col bg-white p-5 transition hover:-translate-y-1"><span className={`grid size-11 place-items-center border-[3px] border-black ${color} shadow-[3px_3px_0_#111217]`}><Icon size={20}/></span><h3 className="mt-4 break-words text-lg font-black">{title}</h3><p className="mt-1 text-sm font-medium leading-5 text-slate-600">{desc}</p><span className="mt-auto inline-flex items-center gap-2 pt-4 text-sm font-black">Mở quản lý <ArrowRight size={16}/></span></Link>)}</div></section>
  </div>;
}
