"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import { Footer } from "./Footer";

export default function SiteChrome({children}:{children:React.ReactNode}){
  const admin=usePathname().startsWith("/admin");
  return <><div className={admin?"hidden":"contents"}><Navbar/></div>{children}{!admin&&<Footer/>}</>;
}
