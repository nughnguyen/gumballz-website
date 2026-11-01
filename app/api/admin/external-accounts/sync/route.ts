import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { serverSupabase } from "@/app/utils/supabaseServer";
import { requireAdmin } from "@/app/utils/adminAuth";
import { checkRateLimit, rateLimitResponse } from "@/app/utils/rateLimit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const categoryUrls = [
  "https://shoptyseisei.net/tai-khoan/acc-duoi-1m",
  "https://shoptyseisei.net/tai-khoan/acc-free-fire",
  "https://shoptyseisei.net/tai-khoan/acc-ff-7m-den-15m",
  "https://shoptyseisei.net/tai-khoan/acc-sieu-pham-tren-15m",
];

function decodeHtml(value: string) {
  return value.replace(/<br\s*\/?\s*>/gi, " · ").replace(/<[^>]*>/g, " ").replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n))).replace(/&#x([\da-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16))).replace(/\s+/g, " ").trim();
}

function productImage(block: string) {
  const nonProduct = /logo|brand|avatar|favicon|payment|bank|qr|zalo|facebook|messenger|icon|related|recommend|suggest|advert|promo/i;
  for (const match of block.matchAll(/<img\b([^>]*)>/gi)) {
    const attributes = match[1];
    const source = attributes.match(/(?:src|data-src|data-original|data-lazy-src)=["'](https:\/\/[^"']+)["']/i)?.[1];
    if (!source || nonProduct.test(`${attributes} ${source}`)) continue;
    return source;
  }
  return null;
}

function tier(price: number) {
  if (price < 2_000_000) return "under_2m";
  if (price < 7_000_000) return "2m_7m";
  if (price <= 15_000_000) return "7m_15m";
  return "super";
}

function parseListings(html: string, markup: number) {
  const output: Array<{ source_account_id:string; source_url:string; title:string; description:string; image_url:string|null; original_price_vnd:number; markup_vnd:number; price_vnd:number; price_tier:string }> = [];
  for (const card of html.matchAll(/<article\s+class=["']account-card["']>([\s\S]*?)<\/article>/gi)) {
    const block = card[1];
    const href = block.match(/href=["'](https?:\/\/shoptyseisei\.net\/tai-khoan\/thong-tin\/(\d+))["']/i);
    const image = productImage(block);
    const priceText = block.match(/class=["']account-price["'][^>]*>([\s\S]*?)<\//i)?.[1] || "";
    const price = Number(decodeHtml(priceText).replace(/\D/g, ""));
    if (!href || !price || !Number.isSafeInteger(price)) continue;
    const id = href[2];
    output.push({ source_account_id:id, source_url:href[1], title:`Tài khoản #${id}`, description:"", image_url:image, original_price_vnd:price, markup_vnd:markup, price_vnd:price+markup, price_tier:tier(price) });
  }
  return output;
}

export async function POST(request: Request) {
  const isCron = Boolean(process.env.CRON_SECRET) && request.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
  if (!isCron && !(await requireAdmin(request))) return NextResponse.json({ success:false, error:"Unauthorized" }, { status:401 });
  if (!isCron) {
    const rate = await checkRateLimit(request, "tyseisei-sync", 1, 60);
    if (!rate.allowed) return rateLimitResponse(rate);
  }
  const body = await request.json().catch(() => null);
  const categoryId = typeof body?.categoryId === "string" ? body.categoryId : "";
  if (!/^[0-9a-f-]{36}$/i.test(categoryId)) return NextResponse.json({ success:false, error:"Chọn danh mục trước khi đồng bộ." }, { status:400 });
  const { data: category, error: categoryError } = await serverSupabase.from("external_game_account_categories").select("id,title,source,markup_vnd").eq("id",categoryId).maybeSingle();
  if (categoryError || !category) return NextResponse.json({ success:false, error:"Không tìm thấy danh mục." }, { status:404 });
  const categoryMarkup = Number(category.markup_vnd);
  const fetchPage=async(url:string)=>{const response=await fetch(url,{cache:"no-store",signal:AbortSignal.timeout(20000),headers:{"User-Agent":"GumballzAuthorizedCatalogSync/1.0"}});if(!response.ok)throw new Error(`source_http_${response.status}`);return response.text()};
  let pages:string[]=[];
  try {
    const firstPages=await Promise.all(categoryUrls.map(fetchPage));
    pages.push(...firstPages);
    const moreUrls:string[]=[];
    for(let index=0;index<categoryUrls.length;index++){
      const pageNumbers=[...firstPages[index].matchAll(/[?&]page=(\d+)/g)].map(match=>Number(match[1]));
      const lastPage=Math.min(30,Math.max(1,...pageNumbers));
      for(let page=2;page<=lastPage;page++)moreUrls.push(`${categoryUrls[index]}?page=${page}`);
    }
    for(let start=0;start<moreUrls.length;start+=5)pages.push(...await Promise.all(moreUrls.slice(start,start+5).map(fetchPage)));
  } catch {
    return NextResponse.json({success:false,error:"Không tải đủ danh mục từ nguồn; dữ liệu shop chưa bị thay đổi."},{status:502});
  }
  const listings = [...new Map(pages.flatMap(page => parseListings(page,categoryMarkup)).map(item => [item.source_account_id,item])).values()];
  if (!listings.length) return NextResponse.json({ success:false, error:"Không đọc được danh sách acc từ các trang nguồn." }, { status:502 });

  const ids = listings.map(item => item.source_account_id);
  const { data: existing, error: lookupError } = await serverSupabase.from("external_game_accounts").select("source_account_id,status").eq("category_id",categoryId).eq("source",category.source).in("source_account_id",ids);
  if (lookupError) return NextResponse.json({ success:false, error:"Chưa có bảng đồng bộ. Hãy chạy migration trước." }, { status:503 });
  const statuses = new Map((existing||[]).map(row => [row.source_account_id,row.status]));
  const generation = randomUUID();
  const timestamp = new Date().toISOString();
  const rows = listings.map(item => ({ ...item, category_id:categoryId, source:category.source, markup_vnd:categoryMarkup, price_vnd:item.original_price_vnd+categoryMarkup, sync_generation:generation, last_seen_at:timestamp, updated_at:timestamp, is_active:!['reserved','sold'].includes(statuses.get(item.source_account_id)||''), ...(statuses.has(item.source_account_id) ? { status:['reserved','sold'].includes(statuses.get(item.source_account_id)||'') ? statuses.get(item.source_account_id) : 'active' } : {}) }));
  const { error: saveError } = await serverSupabase.from("external_game_accounts").upsert(rows,{onConflict:"category_id,source,source_account_id"});
  if (saveError) return NextResponse.json({ success:false, error:"Không lưu được danh sách acc." }, { status:503 });
  const { error: staleError } = await serverSupabase.from("external_game_accounts").update({is_active:false,status:"unavailable",updated_at:timestamp}).eq("category_id",categoryId).eq("status","active").neq("sync_generation",generation);
  if (staleError) return NextResponse.json({ success:false, error:"Đã nhập danh sách nhưng không cập nhật được acc đã hết khỏi nguồn." }, { status:503 });
  return NextResponse.json({success:true, imported:listings.length, markup_vnd:categoryMarkup, synced_at:timestamp});
}
