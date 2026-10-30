"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/app/utils/supabaseClient";

const items = [{ label: "Trang chủ", href: "/" }, { label: "Cửa hàng", href: "/store" }, { label: "Key", href: "/keys" }, { label: "Tài liệu", href: "/docs" }];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [account, setAccount] = useState("/login");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    async function updateSession(session: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]) {
      if (!active) return;
      setAccount(session ? "/account" : "/login");
      if (!session) { setIsAdmin(false); return; }
      const response = await fetch("/api/admin/session", { headers: { Authorization: `Bearer ${session.access_token}` }, cache: "no-store" });
      if (active) setIsAdmin(response.ok);
    }
    void supabase.auth.getSession().then(({ data }) => updateSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { void updateSession(session); });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  const isActive = (href: string) => pathname === href || (href === "/store" && pathname.startsWith("/store"));
  const closeMenu = () => setOpen(false);
  return <header className="fixed left-1/2 top-3 z-50 w-[calc(100%-1.5rem)] max-w-7xl -translate-x-1/2 sm:top-4 sm:w-[calc(100%-2rem)]">
    <nav aria-label="Điều hướng chính" className="flex min-h-16 items-center justify-between gap-3 border-[3px] border-black bg-white px-3 shadow-[5px_5px_0_#111217] sm:px-5">
      <Link href="/" className="flex shrink-0 items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"><span aria-hidden="true" className="grid size-9 place-items-center border-2 border-black bg-[#ffe600] text-sm font-black shadow-[2px_2px_0_#111217]">G</span><span translate="no" className="text-sm font-black tracking-tight sm:text-base">GumballZ<span className="text-[#087d92]">Hub</span></span></Link>
      <div className="hidden items-center gap-1 md:flex">{items.map(item=><Link key={item.href} href={item.href} aria-current={isActive(item.href)?"page":undefined} className={`border-2 px-3 py-2 text-[13px] font-black transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black ${isActive(item.href)?"border-black bg-[#ffe600] shadow-[2px_2px_0_#111217]":"border-transparent hover:border-black hover:bg-[#dffbff]"}`}>{item.label}</Link>)}</div>
      <div className="hidden items-center gap-2 md:flex"><Link href={account} className="neo-button-secondary !px-3 !py-2 text-[13px]">Tài khoản <ArrowUpRight size={15}/></Link>{isAdmin&&<Link href="/admin" className="neo-button !px-3 !py-2 text-[13px]" aria-label="Mở trang Admin"><ShieldCheck size={15}/> Admin</Link>}</div>
      <button type="button" aria-label={open?"Đóng menu":"Mở menu"} aria-expanded={open} onClick={()=>setOpen(!open)} className="grid size-10 place-items-center border-2 border-black bg-[#00d9f5] shadow-[2px_2px_0_#111217] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black md:hidden">{open?<X size={20}/>:<Menu size={20}/>}</button>
    </nav>
    {open&&<div className="mt-2 border-[3px] border-black bg-white p-3 shadow-[5px_5px_0_#111217] md:hidden"><div className="flex flex-col">{items.map(item=><Link key={item.href} href={item.href} onClick={closeMenu} aria-current={isActive(item.href)?"page":undefined} className={`flex min-h-11 items-center border-2 px-3 py-2 text-sm font-black ${isActive(item.href)?"border-black bg-[#ffe600]":"border-transparent hover:border-black hover:bg-[#dffbff]"}`}>{item.label}</Link>)}<Link href={account} onClick={closeMenu} className="mt-2 flex min-h-11 items-center justify-between border-[3px] border-black bg-white px-4 py-2 text-sm font-black shadow-[3px_3px_0_#111217]">Tài khoản <ArrowUpRight size={16}/></Link>{isAdmin&&<Link href="/admin" onClick={closeMenu} className="mt-2 flex min-h-11 items-center justify-between border-[3px] border-black bg-[#50f080] px-4 py-2 text-sm font-black shadow-[3px_3px_0_#111217]">Mở trang Admin <ShieldCheck size={16}/></Link>}</div></div>}
  </header>;
}
