"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Box, Gamepad2, LayoutDashboard, LogOut, Menu, Package, ShieldCheck, X, KeyRound } from "lucide-react";
import { supabase } from "@/app/utils/supabaseClient";

const links = [
  { href: "/admin", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/admin/products", label: "Sản phẩm", icon: Package },
  { href: "/admin/downloads", label: "Tài nguyên tải", icon: Box },
  { href: "/admin/game-accounts", label: "Tài khoản game", icon: Gamepad2 },
  { href: "/admin/keys", label: "Quản lý key", icon: KeyRound },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { location.assign("/login?next=/admin"); return; }
      const response = await fetch("/api/admin/session", { headers: { Authorization: `Bearer ${data.session.access_token}` }, cache: "no-store" });
      if (!response.ok) { location.assign("/account"); return; }
      const { data: userData } = await supabase.auth.getUser();
      if (active) { setEmail(userData.user?.email || ""); setReady(true); }
    })();
    return () => { active = false; };
  }, []);

  async function logout() { await supabase.auth.signOut(); location.assign("/login"); }
  const sidebar = <><div className="p-4 pb-0"><Link href="/" className="flex min-h-11 items-center justify-center gap-2 border-[3px] border-black bg-[#7FE7D6] px-3 text-sm font-black shadow-[3px_3px_0_#111217] transition hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"><ArrowLeft size={16}/> Quay về website</Link></div><div className="flex items-center justify-between gap-3 px-5 py-5"><Link href="/admin" className="flex items-center gap-3"><span className="grid size-10 place-items-center border-[3px] border-black bg-white font-black shadow-[3px_3px_0_#111217]">G</span><span className="font-black">GumballZ <span className="text-xs">ADMIN</span></span></Link><button type="button" aria-label="Đóng menu admin" className="grid size-9 place-items-center border-2 border-black bg-[#3BA7F2] md:hidden" onClick={()=>setOpen(false)}><X size={18}/></button></div>
    <div className="mx-4 border-[2px] border-black bg-[#E8F6FF] p-3"><p className="text-[10px] font-black tracking-widest">ĐANG ĐĂNG NHẬP</p><p className="mt-1 break-all text-sm font-bold">{email}</p></div>
    <nav aria-label="Điều hướng Admin" className="mt-5 space-y-2 px-3">{links.map(({href,label,icon:Icon})=><Link key={href} href={href} onClick={()=>setOpen(false)} aria-current={path===href?"page":undefined} className={`flex min-h-12 items-center gap-3 border-2 px-3 py-2 text-sm font-black transition ${path===href?"border-black bg-[#7FE7D6] shadow-[3px_3px_0_#111217]":"border-transparent hover:border-black hover:bg-[#E8F6FF]"}`}><Icon size={18}/><span className="min-w-0 break-words">{label}</span></Link>)}</nav>
    <div className="mt-auto space-y-2 border-t-[3px] border-black p-3"><button type="button" onClick={logout} className="flex min-h-11 w-full items-center gap-3 border-2 border-transparent px-3 text-left text-sm font-bold hover:border-black hover:bg-[#ffdddd]"><LogOut size={17}/> Đăng xuất</button></div></>;

  if (!ready) return <div className="grid min-h-screen place-items-center bg-[#fffdf5]"><div className="neo-card bg-white px-6 py-5 font-black">Đang xác thực phiên Admin…</div></div>;
  return <div className="admin-shell min-h-screen md:flex"><aside className="admin-sidebar sticky top-0 hidden h-screen w-64 shrink-0 flex-col self-start md:flex">{sidebar}</aside>{open&&<div className="fixed inset-0 z-[70] flex md:hidden"><button type="button" aria-label="Đóng menu" className="absolute inset-0 bg-black/40" onClick={()=>setOpen(false)}/><aside className="admin-sidebar relative flex h-full max-h-screen w-[min(19rem,85vw)] flex-col overflow-y-auto">{sidebar}</aside></div>}<div className="min-w-0 flex-1"><header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b-[3px] border-black bg-white px-4 sm:px-6"><button type="button" aria-label="Mở menu Admin" className="grid size-10 shrink-0 place-items-center border-2 border-black bg-[#3BA7F2] md:hidden" onClick={()=>setOpen(true)}><Menu size={19}/></button><div className="min-w-0"><p className="text-[10px] font-black tracking-widest">GUMBALLZ HUB / ADMIN</p><p className="truncate text-sm font-bold">{links.find(item=>item.href===path)?.label||"Chi tiết"}</p></div><span className="inline-flex shrink-0 items-center gap-2 border-2 border-black bg-[#7FE7D6] px-2 py-1 text-[10px] font-black sm:px-3 sm:text-xs"><ShieldCheck size={15}/> ĐÃ XÁC THỰC</span></header><main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-9">{children}</main></div></div>;
}
