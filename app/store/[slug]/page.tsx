"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Check, Download, Eye, ExternalLink, LoaderCircle, X } from "lucide-react";
import { supabase } from "@/app/utils/supabaseClient";

type Product = { id:string; title:string; slug:string; category:"tool"|"key"|"coiz"; description:string; cover_image_url:string|null; demo_url:string|null; price_vnd:number; key_duration_days:number|null; stock_count:number|null; tags:string[]; highlights:string[]; is_featured:boolean; view_count:number; download_count:number };
const money=(n:number)=>n===0?"Miễn phí":`${new Intl.NumberFormat("vi-VN").format(n)} ₫`;
const currency=(n:number)=>`${new Intl.NumberFormat("vi-VN").format(n)} ₫`;

export default function ProductDetailPage({ params }: { params: Promise<{ slug:string }> }) {
  const router=useRouter();const searchParams=useSearchParams();
  const [product,setProduct]=useState<Product|null>(null);const [loading,setLoading]=useState(true);
  const [showPaymentOptions,setShowPaymentOptions]=useState(false);const [walletBalance,setWalletBalance]=useState(0);const [busy,setBusy]=useState(false);const [notice,setNotice]=useState("");
  const checkoutHandled=useRef(false);

  useEffect(()=>{let active=true;void params.then(({slug})=>fetch(`/api/products/${encodeURIComponent(slug)}`,{cache:"no-store"}).then(r=>r.json()).then(result=>{if(active&&result.success)setProduct(result.data)}).catch(()=>{}).finally(()=>{if(active)setLoading(false)}));return()=>{active=false}},[params]);

  const checkout=useCallback(async(p:Product,paymentMethod:"wallet"|"banking")=>{
    setNotice("");setBusy(true);
    try{
      const {data:sessionData}=await supabase.auth.getSession();
      if(!sessionData.session){router.push(`/login?next=${encodeURIComponent(`/store/${p.slug}?checkout=1`)}`);return}
      const accessToken=sessionData.session.access_token;
      const response=await fetch("/api/products/checkout",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${accessToken}`},body:JSON.stringify({productId:p.id,paymentMethod})});
      const order=await response.json();
      if(!response.ok||!order.success){setNotice(order.error||"Không thể tạo đơn hàng.");return}
      setShowPaymentOptions(false);
      if(order.paidWithWallet||order.free){
        if(order.category==="key"){
          const check=await fetch(`/api/check-transaction?id=${encodeURIComponent(order.id)}`,{headers:{Authorization:`Bearer ${accessToken}`},cache:"no-store"});
          const issued=await check.json();
          if(issued.success&&issued.key){router.push(`/keys/claim?key=${encodeURIComponent(issued.key)}`);return}
        }
        router.push("/account");return;
      }
      const expiry=Math.floor(Date.now()/1000)+600;
      router.push(`/payment?amount=${order.amount}&content=${encodeURIComponent(order.content)}&method=Banking&expiry=${expiry}&txId=${order.id}`);
    }catch{setNotice("Máy chủ chưa phản hồi. Vui lòng thử lại.")}finally{setBusy(false)}
  },[router]);

  const openPaymentOptions=useCallback(async(p:Product)=>{
    setNotice("");
    if(p.category==="coiz"){router.push("/store/coiz");return}
    if(p.price_vnd===0){await checkout(p,"banking");return}
    setBusy(true);
    try{
      const {data:sessionData}=await supabase.auth.getSession();
      if(!sessionData.session){router.push(`/login?next=${encodeURIComponent(`/store/${p.slug}?checkout=1`)}`);return}
      setShowPaymentOptions(true);
      const response=await fetch("/api/wallet",{headers:{Authorization:`Bearer ${sessionData.session.access_token}`},cache:"no-store"});
      const wallet=await response.json();
      if(!response.ok||!wallet.success){setNotice(wallet.error||"Không tải được số dư ví.");return}
      setWalletBalance(Number(wallet.balance)||0);
    }catch{setNotice("Không tải được số dư ví.")}finally{setBusy(false)}
  },[checkout,router]);

  useEffect(()=>{
    if(!loading&&product&&searchParams.get("checkout")==="1"&&!checkoutHandled.current){checkoutHandled.current=true;void openPaymentOptions(product)}
  },[loading,openPaymentOptions,product,searchParams]);

  if(loading)return <main className="min-h-screen bg-[#E8F6FF] px-5 pt-32"><div className="mx-auto max-w-5xl animate-pulse rounded-2xl border-2 border-[#0B3D91]/15 bg-white p-8"><div className="h-72 rounded-xl bg-[#E8F6FF]"/><div className="mt-6 h-8 w-2/3 rounded bg-[#E8F6FF]"/></div></main>;
  if(!product)return <main className="min-h-screen bg-[#E8F6FF] px-5 pt-32"><div className="mx-auto max-w-5xl rounded-2xl bg-white p-8 text-center"><h1 className="text-3xl font-black text-[#0B3D91]">Không tìm thấy sản phẩm</h1><Link href="/store" className="mt-5 inline-flex items-center gap-2 font-bold text-[#0B3D91] underline"><ArrowLeft size={17}/> Về cửa hàng</Link></div></main>;
  const inStock=product.stock_count===null||product.stock_count>0;

  return <main className="min-h-screen bg-[#E8F6FF] px-5 pb-20 pt-32 text-[#12304f] md:px-10"><div className="mx-auto max-w-6xl">
    <Link href="/store" className="inline-flex items-center gap-2 text-sm font-extrabold text-[#0B3D91] hover:underline"><ArrowLeft size={16}/> Cửa hàng</Link>
    <div className="mt-6 grid overflow-hidden rounded-3xl border border-[#0B3D91]/15 bg-white shadow-[0_18px_60px_rgba(11,61,145,.12)] md:grid-cols-[1fr_1fr]">
      <div className="min-h-72 bg-[#7FE7D6]/35">{product.cover_image_url?<img src={product.cover_image_url} alt={product.title} className="size-full min-h-72 object-cover"/>:<div className="grid min-h-72 place-items-center text-7xl font-black text-[#0B3D91]">GZ</div>}</div>
      <section className="flex flex-col p-6 sm:p-9">
        <div className="flex flex-wrap gap-2"><span className="rounded-full bg-[#E8F6FF] px-3 py-1 text-xs font-black uppercase text-[#0B3D91]">{product.category}</span>{product.is_featured&&<span className="rounded-full bg-[#7FE7D6]/40 px-3 py-1 text-xs font-black text-[#0B3D91]">Nổi bật</span>}</div>
        <h1 className="mt-4 text-3xl font-black leading-tight text-[#0B3D91] sm:text-4xl">{product.title}</h1>
        <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">{product.description}</p>
        <div className="mt-5 flex flex-wrap gap-2">{(product.tags||[]).map(tag=><span key={tag} className="rounded-full border border-[#3BA7F2]/25 bg-[#E8F6FF] px-3 py-1 text-xs font-semibold">{tag}</span>)}</div>
        <div className="mt-6 grid grid-cols-2 gap-3"><div className="flex items-center gap-2 rounded-xl bg-[#E8F6FF] p-3 text-sm font-bold text-[#0B3D91]"><Eye size={17} className="text-[#3BA7F2]"/>{(product.view_count||0).toLocaleString("vi-VN")} lượt xem</div><div className="flex items-center gap-2 rounded-xl bg-[#E8F6FF] p-3 text-sm font-bold text-[#0B3D91]"><Download size={17} className="text-[#3BA7F2]"/>{(product.download_count||0).toLocaleString("vi-VN")} lượt tải</div></div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6"><div><strong className="inline-block rounded-xl bg-[#7FE7D6]/45 px-4 py-2 text-2xl font-black text-[#0B3D91]">{money(product.price_vnd)}</strong>{product.category==="key"&&product.key_duration_days&&<p className="mt-1 text-xs text-slate-500">Thời hạn {product.key_duration_days} ngày</p>}</div><span className={`rounded-full px-3 py-1 text-xs font-black ${inStock?"bg-[#7FE7D6]/50 text-[#0B3D91]":"bg-rose-100 text-rose-800"}`}>{inStock?"Còn hàng":"Hết hàng"}</span></div>
        {notice&&<p role="status" className="mt-4 rounded-xl bg-[#E8F6FF] p-3 text-sm font-semibold text-[#0B3D91]">{notice}</p>}
        <div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={()=>void openPaymentOptions(product)} disabled={!inStock||busy} className={`inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B3D91] px-5 py-3 font-black text-white shadow-lg shadow-[#0B3D91]/20 hover:bg-[#092f70] disabled:cursor-not-allowed disabled:opacity-50`}>{busy?<><LoaderCircle className="animate-spin" size={17}/> Đang chuẩn bị…</>:product.price_vnd===0?"Nhận sản phẩm":"Mua ngay"}<ArrowUpRight size={17}/></button>{product.demo_url&&<a href={product.demo_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-[#3BA7F2]/30 px-4 py-3 text-sm font-bold text-[#0B3D91]"><ExternalLink size={16}/> Xem demo</a>}</div>
      </section>
    </div>
    {product.highlights?.length>0&&<section className="mt-5 rounded-2xl border border-[#0B3D91]/10 bg-white p-6"><h2 className="text-lg font-black text-[#0B3D91]">Điểm nổi bật</h2><ul className="mt-4 grid gap-3 sm:grid-cols-2">{product.highlights.map((item,index)=><li key={index} className="flex gap-2 text-sm"><Check size={17} className="shrink-0 text-[#3BA7F2]"/>{item}</li>)}</ul></section>}
  </div>
  {showPaymentOptions&&<div className="fixed inset-0 z-[100] grid place-items-center bg-[#0B3D91]/45 p-4" role="dialog" aria-modal="true" aria-labelledby="product-payment-title"><section className="w-full max-w-md rounded-2xl border border-[#0B3D91]/15 bg-white p-6 shadow-[0_20px_70px_rgba(11,61,145,.3)]"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-widest text-[#3BA7F2]">Thanh toán</p><h2 id="product-payment-title" className="mt-1 text-2xl font-black text-[#0B3D91]">Chọn cách thanh toán</h2></div><button type="button" onClick={()=>setShowPaymentOptions(false)} aria-label="Đóng" className="rounded-lg p-2 text-slate-500 hover:bg-[#E8F6FF]"><X size={19}/></button></div><p className="mt-4 font-bold">{product.title} · {money(product.price_vnd)}</p><p className="mt-3 rounded-xl bg-[#E8F6FF] p-3 text-sm font-bold text-[#0B3D91]">Số dư ví hiện tại: {currency(walletBalance)}</p>{walletBalance<product.price_vnd&&<p className="mt-2 text-sm font-semibold text-rose-700">Ví còn thiếu {money(product.price_vnd-walletBalance)}.</p>}{notice&&<p role="status" className="mt-3 rounded-xl bg-[#E8F6FF] p-3 text-sm font-semibold text-[#0B3D91]">{notice}</p>}<button type="button" onClick={()=>void checkout(product,"wallet")} disabled={walletBalance<product.price_vnd||busy} className="neo-button mt-5 w-full disabled:cursor-not-allowed disabled:opacity-50">{busy?<><LoaderCircle size={17} className="animate-spin"/> Đang xử lý…</>:"Thanh toán bằng ví"}</button><button type="button" onClick={()=>void checkout(product,"banking")} disabled={busy} className="neo-button-secondary mt-3 w-full">Chuyển khoản ngân hàng</button><button type="button" onClick={()=>setShowPaymentOptions(false)} disabled={busy} className="mt-4 w-full text-sm font-bold text-slate-500 underline">Để sau</button></section></div>}
  </main>;
}
