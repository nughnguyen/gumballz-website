"use client";

import { useEffect, useState } from "react";
import { Clock3, Sparkles } from "lucide-react";

type Sale={title:string;created_at:string};
export default function RecentSales(){
  const [sales,setSales]=useState<Sale[]>([]);
  useEffect(()=>{let active=true;fetch("/api/products/recent-sales",{cache:"no-store"}).then(r=>r.json()).then(result=>{if(active&&result.success)setSales(result.data||[])}).catch(()=>{});return()=>{active=false}},[]);
  if(!sales.length)return null;
  return <aside aria-label="Lịch sử mua hàng gần đây" className="mt-6 flex items-center gap-3 overflow-hidden rounded-2xl border border-[#3BA7F2]/20 bg-white/85 px-4 py-3 shadow-sm"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#7FE7D6]/50 text-[#0B3D91]"><Sparkles size={17}/></span><div className="min-w-0 flex-1"><p className="text-[10px] font-black uppercase tracking-[.14em] text-[#0B3D91]">Giao dịch gần đây</p><div className="mt-1 flex gap-4 overflow-x-auto">{sales.map((sale,index)=><span key={`${sale.created_at}-${index}`} className="flex shrink-0 items-center gap-1.5 text-xs text-slate-600"><Clock3 size={12} className="text-[#3BA7F2]"/><b className="max-w-36 truncate text-slate-800">{sale.title}</b><time dateTime={sale.created_at}>{new Date(sale.created_at).toLocaleDateString("vi-VN",{day:"2-digit",month:"2-digit"})}</time></span>)}</div></div></aside>;
}
