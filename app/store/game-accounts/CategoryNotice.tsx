"use client";
import { useEffect, useState } from "react";
import { Info, X } from "lucide-react";

type Kind = "mystery" | "individual" | "community";
type Notice = { title: string; body: string; is_enabled: boolean };
export default function CategoryNotice({ type }: { type: Kind }) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let active = true;
    const hiddenKey = `gz-account-notice-until-${type}`;
    const closedKey = `gz-account-notice-closed-${type}`;
    if (sessionStorage.getItem(closedKey) === "1" || Number(localStorage.getItem(hiddenKey) || 0) > Date.now()) return;
    void fetch(`/api/game-accounts/notices?type=${type}`, { cache: "no-store" }).then(r => r.json()).then(result => {
      if (active && result.success && result.data?.is_enabled && result.data.body?.trim()) { setNotice(result.data); setOpen(true); }
    }).catch(() => {});
    return () => { active = false; };
  }, [type]);
  function close() { sessionStorage.setItem(`gz-account-notice-closed-${type}`, "1"); setOpen(false); }
  function hideTwoHours() { localStorage.setItem(`gz-account-notice-until-${type}`, String(Date.now() + 2 * 60 * 60 * 1000)); setOpen(false); }
  if (!open || !notice) return null;
  return <div className="fixed inset-0 z-[120] grid place-items-center bg-[#0B3D91]/55 p-4" role="dialog" aria-modal="true" aria-labelledby="account-category-notice-title"><section className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border-2 border-[#0B3D91]/15 bg-white p-5 shadow-2xl sm:p-7"><div className="flex items-start justify-between gap-4"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#7FE7D6]/45 text-[#0B3D91]"><Info size={20}/></span><div><p className="text-xs font-black uppercase tracking-widest text-[#3BA7F2]">Thông tin danh mục</p><h2 id="account-category-notice-title" className="mt-1 text-xl font-black text-[#0B3D91]">{notice.title}</h2></div></div><button type="button" onClick={close} aria-label="Đóng thông báo" className="rounded-lg p-2 hover:bg-[#E8F6FF]"><X size={19}/></button></div><div className="mt-4 whitespace-pre-line break-words text-sm leading-6 text-slate-700">{notice.body}</div><div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={close} className="neo-button-secondary">Đóng</button><button type="button" onClick={hideTwoHours} className="neo-button">Ẩn trong 2 tiếng</button></div></section></div>;
}
