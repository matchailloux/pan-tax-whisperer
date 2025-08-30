// Edge Function — Import CSV Amazon -> staging -> ingestion ventes
// Auth required via Authorization: Bearer <JWT>
// - Detects delimiter ; , or \t
// - Maps Amazon headers (FR/EN variants)
// - Normalizes EU/US numbers, dates
// - Batch inserts into stg_amz_transactions
// - Calls RPC: ingest_ventes_replace(upload_id)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { parse } from 'https://deno.land/std@0.224.0/csv/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin'
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env');
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

function detectDelimiter(sample: string): string {
  const first = sample.split(/\r?\n/).slice(0, 5).join('\n');
  const counts = {
    ';': (first.match(/;/g) || []).length,
    ',': (first.match(/,/g) || []).length,
    '\t': (first.match(/\t/g) || []).length,
  } as const;
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] || ',';
}

function parseNumberEUUS(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  let s = String(raw).trim();
  if (!s) return null;
  s = s.replace(/\s+/g, '');
  if (s.match(/^\d{1,3}(\.\d{3})+,\d+$/)) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (s.match(/^\d{1,3}(,\d{3})+\.\d+$/)) {
    s = s.replace(/,/g, '');
  } else if (s.includes(',') && !s.includes('.')) {
    s = s.replace(',', '.');
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function toISODate(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  if (!s) return null;
  const m1 = s.match(/^(\d{2})[\/.\-](\d{2})[\/.\-](\d{4})$/);
  if (m1) {
    const [, dd, mm, yyyy] = m1;
    return `${yyyy}-${mm}-${dd}T00:00:00Z`;
  }
  if (s.match(/^\d{4}-\d{2}-\d{2}/)) {
    return s.length <= 10 ? `${s}T00:00:00Z` : s;
  }
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString();
  return null;
}

const HEADER_ALIASES: Record<string, string[]> = {
  TAXABLE_JURISDICTION: ['TAXABLE_JURISDICTION', 'JURISDICTION', 'COUNTRY', 'PAYS', 'DESTINATION_COUNTRY'],
  TRANSACTION_CURRENCY_CODE: ['TRANSACTION_CURRENCY_CODE', 'CURRENCY', 'DEVISE', 'CURRENCY_CODE'],
  TOTAL_ACTIVITY_VALUE_AMT_VAT_INCL: [
    'TOTAL_ACTIVITY_VALUE_AMT_VAT_INCL', 'AMT_VAT_INCL', 'GROSS_AMOUNT', 'TTC', 'TOTAL_TTC', 'AMOUNT_GROSS'
  ],
  TOTAL_ACTIVITY_VALUE_VAT_AMT: [
    'TOTAL_ACTIVITY_VALUE_VAT_AMT', 'VAT_AMOUNT', 'TAX_AMOUNT', 'TVA', 'MONTANT_TVA', 'AMOUNT_VAT'
  ],
  TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL: [
    'TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL', 'AMT_VAT_EXCL', 'NET_AMOUNT', 'HT', 'TOTAL_HT', 'AMOUNT_NET'
  ],
  TRANSACTION_DEPART_DATE: [
    'TRANSACTION_DEPART_DATE', 'TRANSACTION_DATE', 'DATE', 'DATE_OPERATION', 'PURCHASE_DATE', 'ORDER_DATE'
  ],
  TRANSACTION_TYPE: [
    'TRANSACTION_TYPE', 'TYPE', 'OP_TYPE', 'EVENT_TYPE', 'SALES_OR_REFUND'
  ],
  PRICE_OF_ITEMS_VAT_RATE_PERCENT: [
    'PRICE_OF_ITEMS_VAT_RATE_PERCENT', 'VAT_RATE_PERCENT', 'TAUX_TVA', 'TVA_%'
  ],
};

function buildHeaderIndex(headerRow: string[]): Record<string, number | null> {
  const idx: Record<string, number | null> = {};
  for (const canonical of Object.keys(HEADER_ALIASES)) {
    idx[canonical] = null;
    for (const alias of HEADER_ALIASES[canonical]) {
      const found = headerRow.findIndex(h => h && h.trim().toUpperCase() === alias.toUpperCase());
      if (found >= 0) { idx[canonical] = found; break; }
    }
  }
  return idx;
}

function getCol(row: string[], idx: number | null): string | null {
  if (idx === null) return null;
  return row[idx] !== undefined && row[idx] !== null ? String(row[idx]) : null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ ok: false, message: 'Use POST with multipart/form-data' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const auth = req.headers.get('authorization') || req.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ ok: false, message: 'Missing Authorization Bearer token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const jwt = auth.substring('Bearer '.length).trim();

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
    if (userErr || !userData?.user?.id) {
      return new Response(JSON.stringify({ ok: false, message: 'Invalid user token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userId = userData.user.id;

    // memberships has business_id in our schema
    const { data: orgRes, error: orgErr } = await supabaseAdmin
      .from('memberships')
      .select('business_id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (orgErr || !orgRes?.business_id) {
      return new Response(JSON.stringify({ ok: false, message: 'No organization found for user' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const organization_id = orgRes.business_id as string;

    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) {
      return new Response(JSON.stringify({ ok: false, message: 'No file provided. Expect form-data "file"' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const buf = await file.arrayBuffer();
    let text = new TextDecoder('utf-8').decode(buf);
    text = text.replace(/^\uFEFF/, '');

    const delimiter = detectDelimiter(text);
    const parsed = await parse(text, {
      separator: delimiter as ',' | ';' | '\t',
      skipFirstRow: false,
    }) as string[][];

    if (!parsed?.length) {
      return new Response(JSON.stringify({ ok: false, message: 'Empty CSV' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const header = parsed[0].map(h => String(h || '').trim());
    const idx = buildHeaderIndex(header);

    if (idx.TRANSACTION_DEPART_DATE === null || idx.TAXABLE_JURISDICTION === null || idx.TRANSACTION_TYPE === null) {
      return new Response(JSON.stringify({ ok: false, message: 'Required columns missing (need TRANSACTION_DEPART_DATE, TAXABLE_JURISDICTION, TRANSACTION_TYPE)' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const upload_id = crypto.randomUUID();
    const rows: any[] = [];
    let skipped = 0;

    for (let i = 1; i < parsed.length; i++) {
      const row = parsed[i];
      if (!row || row.length === 0 || row.every(v => String(v || '').trim() === '')) continue;

      const country = (getCol(row, idx.TAXABLE_JURISDICTION) || 'UNKNOWN').toUpperCase();
      const currency = (getCol(row, idx.TRANSACTION_CURRENCY_CODE) || 'EUR').toUpperCase();
      const typeRaw = (getCol(row, idx.TRANSACTION_TYPE) || 'SALE').toUpperCase().trim();
      const type = (typeRaw === 'REFUND' || typeRaw === 'RETURN') ? typeRaw : (typeRaw === 'SALES' || typeRaw === 'SALE' ? 'SALES' : 'SALES');
      const dateISO = toISODate(getCol(row, idx.TRANSACTION_DEPART_DATE));
      if (!dateISO) { skipped++; continue; }

      const amt_excl = parseNumberEUUS(getCol(row, idx.TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL));
      const amt_tax  = parseNumberEUUS(getCol(row, idx.TOTAL_ACTIVITY_VALUE_VAT_AMT));
      const amt_incl = parseNumberEUUS(getCol(row, idx.TOTAL_ACTIVITY_VALUE_AMT_VAT_INCL)) ?? ((amt_excl ?? 0) + (amt_tax ?? 0));
      const vat_rate = parseNumberEUUS(getCol(row, idx.PRICE_OF_ITEMS_VAT_RATE_PERCENT));

      rows.push({
        organization_id,
        client_account_id: null,
        upload_id,
        TRANSACTION_DEPART_DATE: dateISO,
        TAXABLE_JURISDICTION: country,
        TRANSACTION_CURRENCY_CODE: currency,
        TRANSACTION_TYPE: type,
        TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL: amt_excl,
        TOTAL_ACTIVITY_VALUE_VAT_AMT: amt_tax,
        TOTAL_ACTIVITY_VALUE_AMT_VAT_INCL: amt_incl,
        PRICE_OF_ITEMS_VAT_RATE_PERCENT: vat_rate,
        created_at: new Date().toISOString(),
      });
    }

    let inserted = 0;
    const chunk = 1000;
    for (let i = 0; i < rows.length; i += chunk) {
      const slice = rows.slice(i, i + chunk);
      const { error } = await supabaseAdmin.from('stg_amz_transactions').insert(slice, { returning: 'minimal' });
      if (error) {
        console.error('Insert staging error', error);
        return new Response(JSON.stringify({ ok: false, message: `Staging insert failed: ${error.message}` }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      inserted += slice.length;
    }

    const { error: rpcErr } = await supabaseAdmin.rpc('ingest_ventes_replace', { p_upload_id: upload_id });
    if (rpcErr) {
      console.error('RPC ingest error', rpcErr);
      return new Response(JSON.stringify({ ok: false, message: `ingest_ventes_replace failed: ${rpcErr.message}`, upload_id }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ ok: true, upload_id, inserted, skipped }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error('import-ventes-csv error', e);
    const message = (e as any)?.message ?? String(e);
    return new Response(JSON.stringify({ ok: false, message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});