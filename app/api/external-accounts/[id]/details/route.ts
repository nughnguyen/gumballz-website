import { NextResponse } from "next/server";
import { serverSupabase } from "@/app/utils/supabaseServer";

export const dynamic = "force-dynamic";
const origin = "https://shoptyseisei.net";
const brandAsset = /logo|brand|avatar|favicon|payment|bank|qr|zalo|facebook|messenger|icon|related|recommend|suggest|advert|promo/i;
function decode(value: string) {
  return value.replace(/&amp;/gi,"&").replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&#(\d+);/g,(_,n:string)=>String.fromCodePoint(Number(n))).replace(/&#x([\da-f]+);/gi,(_,n:string)=>String.fromCodePoint(parseInt(n,16)));
}
function stripTags(value:string){return decode(value.replace(/<br\s*\/?\s*>/gi,"\n").replace(/<\/(?:p|li|div|h[1-6])\s*>/gi,"\n").replace(/<[^>]*>/g," ").replace(/&nbsp;|&#160;/gi," ")).split(/\n+/).map(line=>line.replace(/\s+/g," ").trim()).filter(line=>line&&!/(?:thuê|zalo|liên hệ|\blh\b|99\s*năm)/i.test(line)).join("\n").slice(0,3000)}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ success:false, error:"Acc không hợp lệ." }, { status:400 });
  const { data: account } = await serverSupabase.from("external_game_accounts").select("source_url,image_url,source_account_id").eq("id",id).maybeSingle();
  if (!account || !/^https:\/\/shoptyseisei\.net\/tai-khoan\/thong-tin\/\d+\/?$/.test(account.source_url)) return NextResponse.json({ success:false, error:"Không tìm thấy acc." }, { status:404 });
  try {
    const response=await fetch(account.source_url,{cache:"no-store",signal:AbortSignal.timeout(12000),headers:{"User-Agent":"GumballzAuthorizedCatalogSync/1.0"}});
    if(!response.ok) return NextResponse.json({success:false,error:"Chưa tải được chi tiết acc."},{status:502});
    const html=await response.text();
    const detailBlock=html.match(/<(?:div|section)[^>]+class=["'][^"']*(?:account-detail|account-description|product-description|account-info)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|section)>/i)?.[1]||"";
    const description=stripTags(detailBlock);
    // Only inspect the page's main content; remove site chrome and common branded wrappers.
    const galleryBlocks=[...html.matchAll(/<(?:div|section)[^>]+(?:class|id)=["'][^"']*(?:account|product)[^"']*(?:gallery|images|photos)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|section)>/gi)].map(match=>match[1]);
    const productScopes=[detailBlock,...galleryBlocks].filter(Boolean);
    const mainContent=productScopes.length?productScopes.join(" "):html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]||"";
    const productContent=mainContent
      .replace(/<(header|nav|footer|aside)\b[^>]*>[\s\S]*?<\/\1>/gi,"")
      .replace(/<(?:div|section)[^>]+(?:class|id)=["'][^"']*(?:site-header|site-footer|navbar|navigation|brand|logo|social-links|payment-method)[^"']*["'][^>]*>[\s\S]*?<\/(?:div|section)>/gi,"");
    const images:string[]=[];
    if(account.image_url&&!brandAsset.test(account.image_url))images.push(account.image_url);
    for(const match of productContent.matchAll(/<(?:img|source)\b([^>]*)>/gi)){
      const attributes=match[1];
      if(brandAsset.test(attributes))continue;
      const rawValue=attributes.match(/(?:src|data-src|data-original|data-lazy-src)=["']([^"']+)["']/i)?.[1];
      if(!rawValue)continue;
      const raw=decode(rawValue);
      let url:string;
      try{url=new URL(raw,origin).toString()}catch{continue}
      const parsed=new URL(url);
      if(parsed.protocol!=="https:"||brandAsset.test(parsed.href)||!(/\.(?:jpe?g|png|webp|gif)(?:$|\?)/i.test(parsed.href)||/image|upload|account|product|tai-khoan/i.test(parsed.pathname)))continue;
      if(!images.includes(url))images.push(url);
      if(images.length>=20)break;
    }
    return NextResponse.json({success:true,data:{code:account.source_account_id,description,images}},{headers:{"Cache-Control":"private, no-store"}});
  } catch {
    return NextResponse.json({success:false,error:"Không kết nối được để tải ảnh chi tiết acc."},{status:502});
  }
}
