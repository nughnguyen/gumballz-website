import { Suspense } from "react";
import StoreCatalog from "./StoreCatalog";

export default function StorePage(){return <Suspense fallback={<div className="min-h-screen bg-[#fffdf5] px-5 pb-16 pt-32"><div className="mx-auto max-w-7xl animate-pulse border-[3px] border-black bg-white p-8 shadow-[6px_6px_0_#111217]"><div className="h-10 w-64 bg-[#7FE7D6]"/><div className="mt-6 h-40 bg-slate-100"/></div></div>}><StoreCatalog/></Suspense>}
