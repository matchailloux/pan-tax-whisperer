import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parse } from "https://deno.land/std@0.224.0/csv/parse.ts";

type CanonicalRow = {
  business_id: string;
  client_account_id: string | null;
  upload_id: string;
  TAXABLE_JURISDICTION: string;
  TRANSACTION_CURRENCY_CODE: string;
  TOTAL_ACTIVITY_VALUE_AMT_VAT_INCL: number;
  TOTAL_ACTIVITY_VALUE_VAT_AMT: number;
  TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL: number;
  TRANSACTION_DEPART_DATE: string; // ISO
  TRANSACTION_TYPE: "SALES" | "REFUND";
};

const SYNONYMS: Record<string, string[]> = {
  TAXABLE_JURISDICTION: ["taxable_jurisdiction","juridiction","jurisdiction","country","pays","tax_jurisdiction","destination_country","ship_country"],
  TRANSACTION_CURRENCY_CODE: ["transaction_currency_code","currency","devise","curr","currency_code"],
  TOTAL_ACTIVITY_VALUE_AMT_VAT_INCL: ["total_activity_value_amt_vat_incl","ttc","gross","amount_gross","total_gross","price_gross","montant_ttc"],
  TOTAL_ACTIVITY_VALUE_VAT_AMT: ["total_activity_value_vat_amt","vat","tax","amount_vat","vat_amount","tax_amount","montant_tva","tva"],
  TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL: ["total_activity_value_amt_vat_excl","ht","net","amount_net","price_net","montant_ht"],
  TRANSACTION_DEPART_DATE: ["transaction_depart_date","date","transaction_date","order_date","purchase_date","event_date","date_operation","activity_period"],
  TRANSACTION_TYPE: ["transaction_type","type","operation","event_type","order_type","sales_or_refund"]
};

const normTok = (s:string)=> s.toLowerCase().replace(/[^a-z0-9]/g,"");
function resolveHeader(headers:string[], candidates:string[]):string|null{
  const map = new Map(headers.map(h=>[normTok(h),h]));
  for (const c of candidates) { const k = normTok(c); if (map.has(k)) return map.get(k)!; }
  // heuristique "includes"
  for (const h of headers) { const t = normTok(h); if (candidates.some(c=>t.includes(normTok(c)))) return h; }
  return null;
}
function normUpper(s:unknown, fallback="UNKNOWN"){ const v=(s??"").toString().trim().toUpperCase(); return v||fallback; }
function normType(s:unknown):"SALES"|"REFUND"{
  const v=(s??"").toString().trim().toUpperCase();
  if (v.includes("REFUND")||v.includes("RETURN")||v==="R"||v==="CREDIT") return "REFUND";
  return "SALES";
}
function toISODate(s:unknown){
  const t=(s??"").toString().trim();
  if (!t) throw new Error("Empty date");
  // DD/MM/YYYY
  const m=t.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m){ const [,dd,mm,yyyy]=m; return new Date(Date.UTC(+yyyy,+mm-1,+dd)).toISOString(); }
  const d=new Date(t);
  if (isNaN(d.getTime())) throw new Error(`Invalid date: "${t}"`);
  return d.toISOString();
}
function toNumber(v:unknown){
  if (v===null||v===undefined) return 0;
  if (typeof v==="number") return v;
  let s=v.toString().trim();
  if (!s) return 0;
  // supprimer espaces milliers
  s=s.replace(/\s+/g,"");
  // formats EU "1.234,56" => "1234.56"
  if (/\.\d{3},\d{1,2}$/.test(s)) s=s.replace(/\./g,"").replace(",",".");
  else if (s.includes(",") && !s.includes(".")) s=s.replace(",",".");
  const n=Number(s);
  if (Number.isNaN(n)) throw new Error(`Invalid number: "${v}"`);
  return n;
}
function detectDelimiter(sample:string){
  const first = sample.split(/\r?\n/)[0] || "";
  const counts = { comma:(first.match(/,/g)||[]).length, semicolon:(first.match(/;/g)||[]).length, tab:(first.match(/\t/g)||[]).length };
  if (counts.semicolon > counts.comma && counts.semicolon >= counts.tab) return ";";
  if (counts.tab >= counts.comma && counts.tab >= counts.semicolon) return "\t";
  return ","; // défaut
}

export default async function handler(req: Request): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  } as const;

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try{
    // Auth
    const jwt = req.headers.get("Authorization")?.replace("Bearer ","");
    if (!jwt) return new Response("Unauthorized",{status:401, headers: corsHeaders});
    const url=Deno.env.get("SUPABASE_URL")!;
    const anon=Deno.env.get("SUPABASE_ANON_KEY")!;
    const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supa = createClient(url, anon, { global:{ headers:{ Authorization:`Bearer ${jwt}` } } });

    // Organisation
    const { data:orgs, error:orgErr } = await supa.from("memberships").select("business_id").limit(1);
    if (orgErr || !orgs?.length) return new Response("Forbidden",{status:403, headers: corsHeaders});
    const business_id = orgs[0].business_id as string;

    // Form-data
    const ct = req.headers.get("content-type")||"";
    if (!ct.includes("multipart/form-data")) return new Response("Bad Request (multipart required)",{status:400, headers: corsHeaders});
    const form = await req.formData();
    const file = form.get("file") as File | null;
    let upload_id = (form.get("upload_id") as string) || crypto.randomUUID();
    const client_account_id_raw = form.get("client_account_id") as string | null;
    const client_account_id = client_account_id_raw && client_account_id_raw !== "null" ? client_account_id_raw : null;

    if (!file) return new Response("file required",{status:400, headers: corsHeaders});
    if (file.size > 100 * 1024 * 1024) return new Response("file too large",{status:413, headers: corsHeaders});

    // Lancer le traitement en arrière-plan pour nettoyer + ingérer
    EdgeRuntime.waitUntil((async () => {
      try {
        // Lecture & délimiteur
        let text = await file.text();
        text = text.replace(/^\uFEFF/,""); // BOM
        const delimiter = detectDelimiter(text);

        // Parse (auto delimiter)
        const records = parse(text, { skipFirstRow:false, separator: delimiter }) as string[][];
        if (!records.length) { console.log('empty csv'); return; }
        const rawHeaders = records[0].map(h=>h?.trim());
        const rows = records.slice(1);

        // Header mapping
        const headerMap = {
          TAXABLE_JURISDICTION: resolveHeader(rawHeaders, ["TAXABLE_JURISDICTION", ...SYNONYMS.TAXABLE_JURISDICTION]),
          TRANSACTION_CURRENCY_CODE: resolveHeader(rawHeaders, ["TRANSACTION_CURRENCY_CODE", ...SYNONYMS.TRANSACTION_CURRENCY_CODE]),
          TOTAL_ACTIVITY_VALUE_AMT_VAT_INCL: resolveHeader(rawHeaders, ["TOTAL_ACTIVITY_VALUE_AMT_VAT_INCL", ...SYNONYMS.TOTAL_ACTIVITY_VALUE_AMT_VAT_INCL]),
          TOTAL_ACTIVITY_VALUE_VAT_AMT: resolveHeader(rawHeaders, ["TOTAL_ACTIVITY_VALUE_VAT_AMT", ...SYNONYMS.TOTAL_ACTIVITY_VALUE_VAT_AMT]),
          TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL: resolveHeader(rawHeaders, ["TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL", ...SYNONYMS.TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL]),
          TRANSACTION_DEPART_DATE: resolveHeader(rawHeaders, ["TRANSACTION_DEPART_DATE", ...SYNONYMS.TRANSACTION_DEPART_DATE]),
          TRANSACTION_TYPE: resolveHeader(rawHeaders, ["TRANSACTION_TYPE", ...SYNONYMS.TRANSACTION_TYPE]),
        } as const;

        const missing = Object.entries(headerMap).filter(([_,v])=>!v).map(([k])=>k);
        if (missing.length){
          console.warn('missing_columns', missing);
          return;
        }

        const idx = new Map(rawHeaders.map((h,i)=>[h!,i]));
        const val = (row:string[], key:string|null)=> {
          if (!key) return "";
          const i = idx.get(key);
          return i===undefined ? "" : (row[i] ?? "");
        };

        // Transformer toutes les lignes mais SANS interrompre au 1er défaut
        const good: CanonicalRow[] = [];
        const errors: { line:number; message:string }[] = [];

        for (let i=0;i<rows.length;i++){
          const r = rows[i];
          try{
            if (!r || r.every(c => (c??"").toString().trim()==="")) continue; // skip vide

            const country  = normUpper(val(r, headerMap.TAXABLE_JURISDICTION), "UNKNOWN");
            const currency = normUpper(val(r, headerMap.TRANSACTION_CURRENCY_CODE), "EUR");
            const gross    = toNumber(val(r, headerMap.TOTAL_ACTIVITY_VALUE_AMT_VAT_INCL));
            const vat      = toNumber(val(r, headerMap.TOTAL_ACTIVITY_VALUE_VAT_AMT));
            const net      = toNumber(val(r, headerMap.TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL));
            const dateISO  = toISODate(val(r, headerMap.TRANSACTION_DEPART_DATE));
            const type     = normType(val(r, headerMap.TRANSACTION_TYPE));

            good.push({
              business_id, client_account_id, upload_id,
              TAXABLE_JURISDICTION: country,
              TRANSACTION_CURRENCY_CODE: currency,
              TOTAL_ACTIVITY_VALUE_AMT_VAT_INCL: Math.abs(gross),
              TOTAL_ACTIVITY_VALUE_VAT_AMT: Math.abs(vat),
              TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL: Math.abs(net),
              TRANSACTION_DEPART_DATE: dateISO,
              TRANSACTION_TYPE: type
            });
          } catch(e){
            errors.push({ line: i+2, message: String(e) });
          }
        }

        if (!good.length){
          console.warn('no_valid_rows', { upload_id, errors_count: errors.length });
          return;
        }

        // Insert en staging via service role (par lots)
        const admin = createClient(url, service);
        const chunkSize = 2000;
        let inserted = 0;

        for (let i=0;i<good.length;i+=chunkSize){
          const chunk = good.slice(i, i+chunkSize);
          const payload = chunk.map(c=>({
            business_id: c.business_id,
            client_account_id: c.client_account_id,
            upload_id: c.upload_id,
            TAXABLE_JURISDICTION: c.TAXABLE_JURISDICTION,
            TRANSACTION_CURRENCY_CODE: c.TRANSACTION_CURRENCY_CODE,
            TOTAL_ACTIVITY_VALUE_AMT_VAT_INCL: c.TOTAL_ACTIVITY_VALUE_AMT_VAT_INCL,
            TOTAL_ACTIVITY_VALUE_VAT_AMT: c.TOTAL_ACTIVITY_VALUE_VAT_AMT,
            TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL: c.TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL,
            TRANSACTION_DEPART_DATE: c.TRANSACTION_DEPART_DATE,
            TRANSACTION_TYPE: c.TRANSACTION_TYPE
          }));

          const { error:insErr } = await admin.from("stg_amz_transactions").insert(payload);
          if (insErr){
            console.error('staging_insert_failed', insErr.message);
          } else {
            inserted += payload.length;
          }
        }

        // Ingestion
        const { error:rpcErr } = await admin.rpc("ingest_activity_replace", { p_upload_id: upload_id });
        if (rpcErr){ console.error('ingest_activity_failed', rpcErr.message); }

        const { error:ventesRpcErr } = await admin.rpc("ingest_ventes_replace", { p_upload_id: upload_id });
        if (ventesRpcErr){ console.error('ingest_ventes_failed', ventesRpcErr.message); }

        console.log('processing_done', { upload_id, inserted, errors: errors.length });
      } catch (e) {
        console.error('background_processing_error', e);
      }
    })());

    // Réponse immédiate
    return new Response(JSON.stringify({ ok:true, upload_id, accepted:true, received_bytes: file.size }), {
      status:202, headers:{ ...corsHeaders, "content-type":"application/json" }
    });

  }catch(e){
    return new Response(JSON.stringify({ ok:false, error:"server_error", message:String(e) }), {
      status:500, headers:{ ...corsHeaders, "content-type":"application/json" }
    });
  }
}