"use client";
import { useEffect, useState } from "react";
import { Clock3, Sparkles } from "lucide-react";

type Transaction={username:string;amount:number;title:string;created_at:string};
const money=(amount:number)=>`${new Intl.NumberFormat("vi-VN").format(amount)} \u20ab`;
export default function RecentSales(){
 const [transactions,setTransactions]=useState<Transaction[]>([]);
 useEffect(()=>{let active=true;const load=()=>fetch("/api/products/recent-sales",{cache:"no-store"}).then(r=>r.json()).then(result=>{if(active&&result.success)setTransactions(result.data||[])}).catch(()=>{});void load();const timer=window.setInterval(load,20000);return()=>{active=false;window.clearInterval(timer)}},[]);
 if(!transactions.length)return null;
 return <aside aria-label="Lịch sử giao dịch gần đây" className="mt-6 flex min-w-0 items-center gap-3 overflow-hidden rounded-2xl border border-[#3BA7F2]/20 bg-white/90 px-3 py-3 shadow-sm sm:px-4"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#7FE7D6]/50 text-[#0B3D91]"><Sparkles size={17}/></span><div className="min-w-0 flex-1"><p className="text-[10px] font-black uppercase tracking-[.14em] text-[#0B3D91]">Giao d&#7883;ch th&#224;nh c&#244;ng g&#7847;n &#273;&#226;y</p><div className="sales-marquee mt-1 overflow-hidden"><div className="sales-marquee-track flex w-max">{[0,1].map(copy=><div key={copy} aria-hidden={copy===1} className="sales-marquee-group flex shrink-0 items-center">{transactions.map((item,index)=><span key={`${copy}-${item.created_at}-${index}`} className="flex shrink-0 items-center gap-2 rounded-lg bg-[#E8F6FF] px-3 py-2 text-[11px] text-slate-600"><Clock3 size={12} className="shrink-0 text-[#3BA7F2]"/><b className="shrink-0 text-[#0B3D91]">{item.username}</b><span className="max-w-36 truncate">{item.title}</span><b className="shrink-0 text-[#0B3D91]">{money(item.amount)}</b><time className="shrink-0 tabular-nums" dateTime={item.created_at}>{new Date(item.created_at).toLocaleString("vi-VN",{day:"2-digit",month:"2-digit",year:"2-digit",hour:"2-digit",minute:"2-digit"})}</time></span>)}</div>)}</div></div></div></aside>;
}
