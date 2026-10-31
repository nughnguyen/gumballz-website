"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Box, KeyRound } from "lucide-react";

type Product = { id:string; title:string; slug:string; category:"tool"|"key"|"coiz"; description:string; cover_image_url:string|null; price_vnd:number; tags:string[]; stock_count:number|null; is_featured:boolean };
const money = (n:number) => n === 0 ? "Miễn phí" : `${new Intl.NumberFormat("vi-VN").format(n)} ₫`;

export default function FeaturedProducts() {
  const [products,setProducts]=useState<Product[]>([]);
  const [loaded,setLoaded]=useState(false);
  useEffect(()=>{let active=true;fetch("/api/products",{cache:"no-store"}).then(r=>r.json()).then(d=>{if(active&&d.success)setProducts((d.data as Product[]).filter(p=>p.is_featured).slice(0,3))}).catch(()=>{}).finally(()=>{if(active)setLoaded(true)});return()=>{active=false}},[]);
  if(!loaded||products.length===0)return <div className="grid gap-5 md:grid-cols-3">{[
    {title:"Tool số",cat:"tool",desc:"Công cụ số gọn gàng, mô tả rõ ràng và có hướng dẫn sử dụng.",icon:Box,color:"bg-[#3BA7F2]"},
    {title:"Key bản quyền",cat:"key",desc:"Chọn thời hạn phù hợp, kiểm tra trạng thái ngay tại GumballZ.",icon:KeyRound,color:"bg-[#7FE7D6]"},
    {title:"Coiz",cat:"coiz",desc:"Nạp Coiz và theo dõi giao dịch qua trang thanh toán quen thuộc.",icon:ArrowUpRight,color:"bg-[#7FE7D6]"},
  ].map(x=><Link key={x.cat} href={x.cat==="coiz"?"/store/coiz":`/store?category=${x.cat}`} className="neo-card flex min-h-52 flex-col bg-white p-6 transition hover:-translate-y-1"><span className={`grid size-12 place-items-center border-2 border-black ${x.color} shadow-[3px_3px_0_#111217]`}><x.icon size={21}/></span><h3 className="mt-5 text-xl font-black">{x.title}</h3><p className="mt-2 text-sm leading-6 text-slate-700">{x.desc}</p><span className="mt-auto pt-5 text-sm font-black">Khám phá <ArrowUpRight size={15} className="inline"/></span></Link>)}</div>;
  return <div className="grid gap-5 md:grid-cols-3">{products.map((p,index)=><Link key={p.id} href={`/store/${p.slug}`} className={`neo-card overflow-hidden bg-white ${index===0?"md:col-span-2":""}`}>
    <div className={`grid ${index===0?"md:grid-cols-[.85fr_1.15fr]":""}`}>
      {p.cover_image_url?<img src={p.cover_image_url} alt="" width={720} height={450} loading="lazy" className="aspect-[16/8] w-full border-b-[3px] border-black object-cover md:aspect-auto md:h-full"/>:<div className={`grid min-h-32 place-items-center border-b-[3px] border-black ${index===0?"md:border-b-0 md:border-r-[3px]":""} ${index===0?"bg-[#3BA7F2]":"bg-[#7FE7D6]"}`}><span className="text-5xl font-black">GZ</span></div>}
      <div className="p-6"><div className="flex items-center justify-between gap-2"><span className="neo-badge">{p.category}</span>{p.is_featured&&<span className="text-xs font-black uppercase">Bán chạy</span>}</div><h3 className="mt-5 text-xl font-black">{p.title}</h3><p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-700">{p.description}</p><div className="mt-5 flex items-center justify-between gap-3"><b className="rounded-lg bg-[#E8F6FF] px-3 py-1 text-lg font-black text-[#0B3D91]">{money(p.price_vnd)}</b><span className="inline-flex items-center gap-1 text-sm font-black">Xem <ArrowUpRight size={16}/></span></div></div>
    </div>
  </Link>)}</div>;
}
