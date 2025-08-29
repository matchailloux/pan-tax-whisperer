import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parse } from "https://deno.land/std@0.224.0/csv/parse.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

// ---- helpers ----
function toNumber(v: string | number | null | undefined): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return v;
  let s = v.toString().trim();
  if (!s) return 0;
  
  // Remove spaces (thousands separators)
  s = s.replace(/\s+/g, "");
  
  // Handle different decimal formats
  // "1.234,56" (European) -> "1234.56"
  if (s.match(/\.\d{3},\d{1,2}$/)) {
    s = s.replace(/\./g, "").replace(",", ".");
  }
  // "1,234.56" (US) -> "1234.56"  
  else if (s.match(/,\d{3}\.\d{1,2}$/)) {
    s = s.replace(/,/g, "");
  }
  // Simple comma as decimal "123,45" -> "123.45"
  else if (s.includes(",") && !s.includes(".")) {
    s = s.replace(",", ".");
  }
  
  const n = Number(s);
  if (Number.isNaN(n)) throw new Error(`Invalid number: "${v}"`);
  return n;
}

function toISODate(s: string): string {
  const t = (s || "").trim();
  if (!t) throw new Error("Empty date");
  
  // Handle DD/MM/YYYY format with slashes
  const dmy = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    const [_, dd, mm, yyyy] = dmy;
    return new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd))).toISOString();
  }
  
  // Handle DD-MM-YYYY format with dashes
  const dmyDash = t.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dmyDash) {
    const [_, dd, mm, yyyy] = dmyDash;
    return new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd))).toISOString();
  }
  
  // Handle MM/DD/YYYY format 
  const mdy = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy && Number(mdy[1]) > 12) { // Assume DD/MM if first number > 12
    const [_, dd, mm, yyyy] = mdy;
    return new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd))).toISOString();
  }
  
  // Try parsing as ISO or other standard formats
  const dt = new Date(t);
  if (isNaN(dt.getTime())) throw new Error(`Invalid date: "${s}"`);
  return dt.toISOString();
}

function normUpper(s: string | null | undefined, fallback = "UNKNOWN"): string {
  const v = (s ?? "").toString().trim().toUpperCase();
  return v || fallback;
}

function normType(s: string | null | undefined): "SALES" | "REFUND" {
  const v = (s ?? "").toString().trim().toUpperCase();
  if (v.includes("REFUND") || v.includes("RETURN") || v === "R" || v === "CREDIT") return "REFUND";
  return "SALES";
}

// Map canonicals -> list of header synonyms (lowercased, spaces/underscores ignored)
const SYNONYMS: Record<string, string[]> = {
  TAXABLE_JURISDICTION: [
    "taxable_jurisdiction","juridiction","jurisdiction","country","pays","tax_jurisdiction","destination_country","ship_country"
  ],
  TRANSACTION_CURRENCY_CODE: [
    "transaction_currency_code","currency","devise","curr","currency_code"
  ],
  TOTAL_ACTIVITY_VALUE_AMT_VAT_INCL: [
    "total_activity_value_amt_vat_incl","ttc","gross","amount_gross","total_gross","price_gross","montant_ttc"
  ],
  TOTAL_ACTIVITY_VALUE_VAT_AMT: [
    "total_activity_value_vat_amt","vat","tax","amount_vat","vat_amount","tax_amount","montant_tva","tva"
  ],
  TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL: [
    "total_activity_value_amt_vat_excl","ht","net","amount_net","price_net","montant_ht"
  ],
  TRANSACTION_DEPART_DATE: [
    "transaction_depart_date","date","transaction_date","order_date","purchase_date","event_date","date_operation"
  ],
  TRANSACTION_TYPE: [
    "transaction_type","type","operation","event_type","order_type","sales_or_refund"
  ],
};

// build a map from normalized header token -> actual header
function normalizeHeaderToken(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function resolveHeader(headers: string[], candidates: string[]): string | null {
  const set = new Map(headers.map(h => [normalizeHeaderToken(h), h]));
  for (const c of candidates) {
    const key = normalizeHeaderToken(c);
    if (set.has(key)) return set.get(key)!;
  }
  // also try startsWith / includes heuristics
  for (const h of headers) {
    const tok = normalizeHeaderToken(h);
    if (candidates.some(c => tok.includes(normalizeHeaderToken(c)))) return h;
  }
  return null;
}

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting CSV import request');
    
    // 0) Auth utilisateur pour récupérer business_id
    const jwt = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!jwt) {
      console.log('No JWT token provided');
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    // client utilisateur (RLS) pour vérifier appartenance
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supa = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${jwt}` } } });

    const { data: memberships, error: orgErr } = await supa
      .from("memberships")
      .select("business_id")
      .limit(1);
    
    if (orgErr || !memberships?.length) {
      console.log('Failed to get user memberships:', orgErr);
      return new Response("Forbidden", { status: 403, headers: corsHeaders });
    }
    
    const business_id = memberships[0].business_id as string;
    console.log('User business_id:', business_id);

    // 1) Parse form-data
    const ct = req.headers.get("content-type") || "";
    if (!ct.includes("multipart/form-data")) {
      return new Response("Bad Request (multipart required)", { status: 400, headers: corsHeaders });
    }
    
    const form = await req.formData();
    const file = form.get("file") as File | null;
    let upload_id = (form.get("upload_id") as string) || crypto.randomUUID();
    const client_account_id_raw = form.get("client_account_id") as string | null;
    const client_account_id = client_account_id_raw && client_account_id_raw !== "null" ? client_account_id_raw : null;

    if (!file) {
      return new Response("file required", { status: 400, headers: corsHeaders });
    }
    if (file.size > 50 * 1024 * 1024) {
      return new Response("file too large", { status: 413, headers: corsHeaders });
    }
    if (!/csv|plain|text/.test(file.type)) {
      return new Response("invalid mime", { status: 415, headers: corsHeaders });
    }

    console.log('Processing file:', file.name, 'size:', file.size);

    // 2) Lecture CSV
    const text = await file.text();

    // parse with header inference
    const records = parse(text, { skipFirstRow: false }) as string[][];
    if (!records.length) {
      return new Response("empty csv", { status: 400, headers: corsHeaders });
    }

    const rawHeaders = records[0].map(h => h?.trim());
    const rows = records.slice(1);

    console.log('CSV headers:', rawHeaders);
    console.log('Data rows:', rows.length);

    // 3) Résolution des en-têtes pour chaque champ canonical
    const headerMap: Record<keyof CanonicalRow | 
      "TAXABLE_JURISDICTION"|
      "TRANSACTION_CURRENCY_CODE"|
      "TOTAL_ACTIVITY_VALUE_AMT_VAT_INCL"|
      "TOTAL_ACTIVITY_VALUE_VAT_AMT"|
      "TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL"|
      "TRANSACTION_DEPART_DATE"|
      "TRANSACTION_TYPE", string | null> = {
      TAXABLE_JURISDICTION: resolveHeader(rawHeaders, [ "TAXABLE_JURISDICTION", ...SYNONYMS.TAXABLE_JURISDICTION ]),
      TRANSACTION_CURRENCY_CODE: resolveHeader(rawHeaders, [ "TRANSACTION_CURRENCY_CODE", ...SYNONYMS.TRANSACTION_CURRENCY_CODE ]),
      TOTAL_ACTIVITY_VALUE_AMT_VAT_INCL: resolveHeader(rawHeaders, [ "TOTAL_ACTIVITY_VALUE_AMT_VAT_INCL", ...SYNONYMS.TOTAL_ACTIVITY_VALUE_AMT_VAT_INCL ]),
      TOTAL_ACTIVITY_VALUE_VAT_AMT: resolveHeader(rawHeaders, [ "TOTAL_ACTIVITY_VALUE_VAT_AMT", ...SYNONYMS.TOTAL_ACTIVITY_VALUE_VAT_AMT ]),
      TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL: resolveHeader(rawHeaders, [ "TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL", ...SYNONYMS.TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL ]),
      TRANSACTION_DEPART_DATE: resolveHeader(rawHeaders, [ "TRANSACTION_DEPART_DATE", ...SYNONYMS.TRANSACTION_DEPART_DATE ]),
      TRANSACTION_TYPE: resolveHeader(rawHeaders, [ "TRANSACTION_TYPE", ...SYNONYMS.TRANSACTION_TYPE ]),
    };

    console.log('Header mapping:', headerMap);

    // Vérifier colonnes essentielles
    const missing = Object.entries(headerMap).filter(([_, v]) => !v).map(([k]) => k);
    if (missing.length) {
      console.log('Missing required columns:', missing);
      return new Response(
        JSON.stringify({ ok: false, error: "missing_columns", details: missing }),
        { status: 422, headers: { ...corsHeaders, "content-type": "application/json" } }
      );
    }

    // 4) Transformation → lignes canoniques
    const hdrIndex = new Map(rawHeaders.map((h, i) => [h!, i]));
    const toVal = (row: string[], headerName: string | null) => {
      if (!headerName) return "";
      const idx = hdrIndex.get(headerName);
      return idx === undefined ? "" : (row[idx] ?? "").toString();
    };

    const canonRows: CanonicalRow[] = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.every(c => (c ?? "").toString().trim() === "")) continue; // skip empty lines

      try {
        const country = normUpper(toVal(r, headerMap.TAXABLE_JURISDICTION), "UNKNOWN");
        const currency = normUpper(toVal(r, headerMap.TRANSACTION_CURRENCY_CODE), "EUR");
        const gross = toNumber(toVal(r, headerMap.TOTAL_ACTIVITY_VALUE_AMT_VAT_INCL));
        const vat = toNumber(toVal(r, headerMap.TOTAL_ACTIVITY_VALUE_VAT_AMT));
        const net = toNumber(toVal(r, headerMap.TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL));
        const dateISO = toISODate(toVal(r, headerMap.TRANSACTION_DEPART_DATE));
        const type = normType(toVal(r, headerMap.TRANSACTION_TYPE));

        canonRows.push({
          business_id,
          client_account_id,
          upload_id,
          TAXABLE_JURISDICTION: country,
          TRANSACTION_CURRENCY_CODE: currency,
          TOTAL_ACTIVITY_VALUE_AMT_VAT_INCL: gross,
          TOTAL_ACTIVITY_VALUE_VAT_AMT: vat,
          TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL: net,
          TRANSACTION_DEPART_DATE: dateISO,
          TRANSACTION_TYPE: type
        });
      } catch (e) {
        console.error(`Error parsing row ${i + 2}:`, e);
        return new Response(
          JSON.stringify({ ok: false, error: "row_parse_error", line: i + 2, message: String(e) }),
          { status: 422, headers: { ...corsHeaders, "content-type": "application/json" } }
        );
      }
    }

    if (!canonRows.length) {
      return new Response(JSON.stringify({ ok: false, error: "no_rows" }), {
        status: 422, headers: { ...corsHeaders, "content-type": "application/json" }
      });
    }

    console.log(`Parsed ${canonRows.length} valid rows`);

    // 5) Insert batch en staging via service role (chunks)
    const admin = createClient(url, service);
    const chunkSize = 1000;
    let inserted = 0;
    
    for (let i = 0; i < canonRows.length; i += chunkSize) {
      const chunk = canonRows.slice(i, i + chunkSize).map(c => ({
        business_id: c.business_id,
        client_account_id: c.client_account_id,
        upload_id: c.upload_id,
        taxable_jurisdiction: c.TAXABLE_JURISDICTION,
        transaction_currency_code: c.TRANSACTION_CURRENCY_CODE,
        total_activity_value_amt_vat_incl: c.TOTAL_ACTIVITY_VALUE_AMT_VAT_INCL,
        total_activity_value_vat_amt: c.TOTAL_ACTIVITY_VALUE_VAT_AMT,
        total_activity_value_amt_vat_excl: c.TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL,
        transaction_depart_date: c.TRANSACTION_DEPART_DATE,
        transaction_type: c.TRANSACTION_TYPE
      }));

      const { error: insErr, count } = await admin
        .from("stg_amz_transactions")
        .insert(chunk, { count: "exact" });

      if (insErr) {
        console.error('Staging insert error:', insErr);
        return new Response(
          JSON.stringify({ ok: false, error: "staging_insert_failed", message: insErr.message }),
          { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } }
        );
      }
      inserted += count ?? chunk.length;
    }

    console.log(`Inserted ${inserted} rows into staging`);

    // 6) Lancer l'ingestion (replace pour état exact)
    const { error: rpcErr } = await admin.rpc("ingest_activity_replace", { p_upload_id: upload_id });
    if (rpcErr) {
      console.error('Ingestion error:', rpcErr);
      return new Response(
        JSON.stringify({ ok: false, error: "ingest_failed", message: rpcErr.message }),
        { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } }
      );
    }

    console.log('Activity ingestion completed successfully');

    return new Response(JSON.stringify({ ok: true, upload_id, inserted }), {
      status: 200, headers: { ...corsHeaders, "content-type": "application/json" }
    });

  } catch (e) {
    console.error('Unexpected error:', e);
    return new Response(JSON.stringify({ ok: false, error: "server_error", message: String(e) }), {
      status: 500, headers: { ...corsHeaders, "content-type": "application/json" }
    });
  }
});