"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Clock3, RefreshCw, X, Trash2 } from "lucide-react";
import { supabase } from "@/app/utils/supabaseClient";

type ManualPayment = {
  id: string;
  user_id: string | null;
  amount: number;
  description: string | null;
  status: string;
  metadata: { type?: string; product_title?: string; category?: string; duration_days?: number; playerName?: string; payment_account?: { bankId?: string; account?: string; name?: string; automatic?: boolean; note?: string } };
  created_at: string;
};

const money = (value: number) => `${new Intl.NumberFormat("vi-VN").format(value)}₫`;
const when = (value: string) => new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

export default function ManualPaymentQueue() {
  const [orders, setOrders] = useState<ManualPayment[]>([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    setError("");
    try {
      const { data } = await supabase.auth.getSession();
      const response = await fetch("/api/admin/manual-payments", {
        headers: { Authorization: `Bearer ${data.session?.access_token || ""}` },
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Không tải được các đơn chờ duyệt.");
      setOrders(result.data || []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không tải được các đơn chờ duyệt.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function decide(order: ManualPayment, decision: "approve" | "reject" | "delete") {
    const actionText = decision === "approve" ? "approve or restore and fulfill" : decision === "reject" ? "reject" : "permanently delete";
    if (!window.confirm(`Xác nhận ${actionText} đơn ${order.description || order.id}? Hãy đối chiếu tiền vào tài khoản ngân hàng trước khi duyệt.`)) return;
    setBusyId(order.id);
    setError("");
    try {
      const { data } = await supabase.auth.getSession();
      const response = await fetch("/api/admin/manual-payments", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${data.session?.access_token || ""}`, "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: order.id, decision }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Không cập nhật được đơn.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không cập nhật được đơn.");
    } finally {
      setBusyId("");
    }
  }

  return <section className="neo-card overflow-hidden bg-white">
    <header className="flex flex-wrap items-end justify-between gap-3 border-b-[3px] border-black bg-[#fff2a8] p-5 sm:p-7">
      <div><p className="text-xs font-black tracking-widest">THANH TOÁN THỦ CÔNG</p><h2 className="mt-1 text-2xl font-black">Đơn chờ Admin duyệt</h2><p className="mt-1 text-sm font-semibold">Chỉ duyệt sau khi đã xác nhận tiền thực nhận trong sao kê.</p></div>
      <div className="flex items-center gap-3"><span className="neo-badge">{orders.length} yêu cầu</span><button type="button" onClick={() => void load()} disabled={refreshing} className="neo-button-secondary"><RefreshCw size={15} className={refreshing ? "animate-spin" : ""}/> Làm mới</button></div>
    </header>
    {error && <p role="alert" className="m-5 border-2 border-red-700 bg-red-100 p-3 text-sm font-bold text-red-900">{error}</p>}
    {orders.length ? <ul className="divide-y-2 divide-black/15">{orders.map((order) => {
      const kind = order.metadata.product_title || (order.metadata.type === "wallet_topup" ? "Nạp ví" : order.metadata.type === "key" ? `License key ${order.metadata.category || ""} · ${order.metadata.duration_days || ""} ngày` : order.metadata.type || "Chuyển khoản");
      return <li key={order.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div className="min-w-0"><p className="break-words font-black">{kind} <span className="ml-1 border-2 border-black px-2 py-0.5 text-[10px]">{order.status === "failed" ? "ĐÃ TỪ CHỐI" : "CHỜ DUYỆT"}</span></p><p className="mt-1 break-all font-mono text-xs font-bold">Mã giao dịch/nội dung chuyển khoản: {order.description || "—"} · User: {order.user_id || "Khách"}</p><p className="mt-1 text-xs font-semibold">Ngân hàng: {order.metadata.payment_account?.bankId || "Chưa lưu"} · Số tài khoản: {order.metadata.payment_account?.account || "Chưa lưu"} · Chủ TK: {order.metadata.payment_account?.name || "—"}</p><p className="mt-1 text-xs font-semibold">{order.metadata.payment_account?.automatic === false ? "Đối chiếu thủ công" : "Tự động"}{order.metadata.payment_account?.note ? ` · ${order.metadata.payment_account.note}` : ""}</p><p className="mt-1 text-xs font-semibold text-slate-500">{when(order.created_at)} · ID {order.id}</p></div>
        <div className="flex shrink-0 flex-wrap items-center gap-2"><strong className="mr-2 text-lg font-black">{money(order.amount)}</strong><button type="button" disabled={!!busyId} onClick={() => void decide(order, "approve")} className="neo-button min-h-10 bg-[#50f080] px-3 py-2 text-sm disabled:opacity-50">{busyId === order.id ? "Đang xử lý…" : <><Check size={15}/> Duyệt đơn</>}</button><button type="button" disabled={!!busyId} onClick={() => void decide(order, "reject")} className="neo-button-secondary min-h-10 px-3 py-2 text-sm disabled:opacity-50"><X size={15}/> Từ chối</button><button type="button" disabled={!!busyId} onClick={() => void decide(order, "delete")} className="neo-button-secondary min-h-10 px-3 py-2 text-sm disabled:opacity-50"><Trash2 size={15}/> Xóa</button></div>
      </li>;
    })}</ul> : !refreshing && !error ? <p className="p-6 text-sm font-semibold text-slate-600">Chưa có yêu cầu thanh toán thủ công.</p> : null}
  </section>;
}
