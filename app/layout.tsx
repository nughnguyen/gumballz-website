import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import SiteChrome from "./components/SiteChrome";

const outfit=Outfit({subsets:["latin","latin-ext"],variable:"--font-outfit"});

export const metadata:Metadata={
  title:"GumballZ Hub | Cửa hàng sản phẩm số",
  description:"Mua công cụ số, key bản quyền và Coiz tại GumballZ Hub.",
  icons:{icon:"/logo.png"},
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="vi"><body className={`${outfit.variable} min-h-screen antialiased`}><SiteChrome>{children}</SiteChrome></body></html>;
}
