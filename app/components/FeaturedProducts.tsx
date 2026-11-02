"use client";

import Link from "next/link";
import { TransitionEvent, useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Box, KeyRound } from "lucide-react";

type Product = { id:string; title:string; slug:string; category:"tool"|"key"|"coiz"; description:string; cover_image_url:string|null; price_vnd:number; discount_percent:number; tags:string[]; stock_count:number|null; is_featured:boolean };
const money = (n:number) => n === 0 ? "Miễn phí" : `${new Intl.NumberFormat("vi-VN").format(n)} ₫`;

export default function FeaturedProducts() {
  const [products,setProducts]=useState<Product[]>([]);
  const [loaded,setLoaded]=useState(false);
  const [active,setActive]=useState(false);
  const [slide,setSlide]=useState(0);
  const [transitionEnabled,setTransitionEnabled]=useState(true);
  const [itemsPerView,setItemsPerView]=useState(3);
  const sectionRef=useRef<HTMLDivElement>(null);

  useEffect(()=>{let mounted=true;fetch("/api/products",{cache:"no-store"}).then(r=>r.json()).then(d=>{if(mounted&&d.success)setProducts((d.data as Product[]).filter(p=>p.is_featured))}).catch(()=>{}).finally(()=>{if(mounted)setLoaded(true)});return()=>{mounted=false}},[]);
  useEffect(()=>{const node=sectionRef.current;if(!node)return;const observer=new IntersectionObserver(([entry])=>setActive(entry.isIntersecting),{rootMargin:"100px"});observer.observe(node);return()=>observer.disconnect()},[loaded,products.length]);
  useEffect(()=>{const media=window.matchMedia("(min-width: 768px)");const update=()=>setItemsPerView(media.matches?3:1);update();media.addEventListener("change",update);return()=>media.removeEventListener("change",update)},[]);
  useEffect(()=>{setSlide(0);setTransitionEnabled(true)},[itemsPerView]);
  const canSlide=products.length>itemsPerView;
  const trackProducts=canSlide?[...products,...products.slice(0,itemsPerView)]:products;
  useEffect(()=>{if(!active||!canSlide)return;const timer=window.setInterval(()=>setSlide(current=>current>=products.length-1?products.length:current+1),5000);return()=>window.clearInterval(timer)},[active,canSlide,products.length]);

  function handleTrackTransitionEnd(event:TransitionEvent<HTMLDivElement>){
    if(event.target!==event.currentTarget||!canSlide||slide!==products.length)return;
    setTransitionEnabled(false);
    setSlide(0);
    window.requestAnimationFrame(()=>window.requestAnimationFrame(()=>setTransitionEnabled(true)));
  }

  if(!loaded||products.length===0)return <div className="grid gap-5 md:grid-cols-3">{[
    {title:"Tool số",cat:"tool",desc:"Công cụ số gọn gàng, mô tả rõ ràng và có hướng dẫn sử dụng.",icon:Box,color:"bg-[#3BA7F2]"},
    {title:"Key bản quyền",cat:"key",desc:"Chọn thời hạn phù hợp, kiểm tra trạng thái ngay tại GumballZ.",icon:KeyRound,color:"bg-[#7FE7D6]"},
    {title:"Coiz",cat:"coiz",desc:"Nạp Coiz và theo dõi giao dịch qua trang thanh toán quen thuộc.",icon:ArrowUpRight,color:"bg-[#7FE7D6]"},
  ].map(x=><Link key={x.cat} href={x.cat==="coiz"?"/store/coiz":`/store?category=${x.cat}`} className="neo-card flex min-h-52 flex-col bg-white p-6 transition hover:-translate-y-1"><span className={`grid size-12 place-items-center border-2 border-black ${x.color} shadow-[3px_3px_0_#111217]`}><x.icon size={21}/></span><h3 className="mt-5 text-xl font-black">{x.title}</h3><p className="mt-2 text-sm leading-6 text-slate-700">{x.desc}</p><span className="mt-auto pt-5 text-sm font-black">Khám phá <ArrowUpRight size={15} className="inline"/></span></Link>)}</div>;

  return <div ref={sectionRef} className="relative overflow-hidden" aria-roledescription="carousel" aria-label="Sản phẩm nổi bật">
    <div onTransitionEnd={handleTrackTransitionEnd} className={`flex ${transitionEnabled?"transition-transform duration-1000 ease-in-out":""} motion-reduce:transition-none`} style={{transform:`translateX(-${slide*100/itemsPerView}%)`}}>
      {trackProducts.map((p,index)=><div key={`${index}-${p.id}`} className="w-full shrink-0 px-1 md:w-1/3"><Link href={`/store/${p.slug}`} className="neo-card flex h-full flex-col overflow-hidden bg-white transition hover:-translate-y-1">
          <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden border-b-[3px] border-black bg-[#E8F6FF]">{p.cover_image_url?<img src={p.cover_image_url} alt="" width={720} height={405} loading="lazy" className="size-full object-cover"/>:<div className="grid size-full place-items-center bg-[#7FE7D6]"><span className="text-5xl font-black">GZ</span></div>}{p.discount_percent>0&&<span className="absolute right-3 top-3 border-2 border-black bg-[#ffb7b7] px-2.5 py-1 text-xs font-black shadow-[2px_2px_0_#111217]">-{p.discount_percent}%</span>}</div>
          <div className="flex grow flex-col p-5"><div className="flex items-center justify-between gap-2"><span className="neo-badge">{p.category}</span><span className="text-xs font-black uppercase">Bán chạy</span></div><h3 className="mt-4 line-clamp-2 min-h-14 text-xl font-black">{p.title}</h3><p className="mt-2 line-clamp-3 min-h-[72px] text-sm leading-6 text-slate-700">{p.description}</p><div className="mt-auto flex items-center justify-between gap-3 pt-5"><div className="flex flex-wrap items-center gap-2">{p.discount_percent>0&&<del className="text-xs font-bold text-red-600">{money(p.price_vnd)}</del>}<b className="rounded-lg bg-[#E8F6FF] px-3 py-1 text-lg font-black text-[#0B3D91]">{money(p.discount_percent>0?Math.round(p.price_vnd*(100-p.discount_percent)/100):p.price_vnd)}</b>{p.discount_percent>0&&<span className="rounded bg-red-100 px-2 py-1 text-xs font-black text-red-700">-{p.discount_percent}%</span>}</div><span className="inline-flex items-center gap-1 text-sm font-black">Xem <ArrowUpRight size={16}/></span></div></div>
        </Link></div>)}
    </div>
    <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 z-10 w-1.5 bg-[#E8F6FF]"/>
    {canSlide&&<div className="mt-5 flex items-center justify-center gap-2" aria-label="Select featured products">{products.map((product,index)=><button key={product.id} type="button" onClick={()=>setSlide(index)} aria-label={`Show products starting at ${index+1}`} aria-current={(slide%products.length)===index?"true":undefined} className={`h-2.5 rounded-full border border-black transition-all ${(slide%products.length)===index?"w-8 bg-[#3BA7F2]":"w-2.5 bg-white"}`}/>)}</div>}
  </div>;
}
