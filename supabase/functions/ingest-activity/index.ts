import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export default async function handler(req: Request): Promise<Response> {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting activity ingestion request');
    
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!jwt) {
      console.error('No JWT token provided');
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    // Client utilisateur pour vérifier appartenance (RLS)
    const supa = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: { headers: { Authorization: `Bearer ${jwt}` } }
      }
    );

    // Vérifier que l'utilisateur a une organisation INDIVIDUAL
    const { data: orgs, error: orgErr } = await supa
      .from('memberships')
      .select('business_id, businesses!inner(type)')
      .eq('businesses.type', 'INDIVIDUAL')
      .limit(1);

    if (orgErr || !orgs?.length) {
      console.error('User not authorized or not individual:', orgErr);
      return new Response('Forbidden - Individual access required', { 
        status: 403, 
        headers: corsHeaders 
      });
    }

    const businessId = orgs[0].business_id as string;
    console.log('Authorized business ID:', businessId);

    // Parse form-data
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return new Response('Bad Request - multipart/form-data required', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    const form = await req.formData();
    const file = form.get('file') as File | null;
    
    if (!file) {
      return new Response('File required', { status: 400, headers: corsHeaders });
    }

    // Validation de sécurité
    if (file.size > 50 * 1024 * 1024) { // 50MB
      return new Response('File too large', { status: 413, headers: corsHeaders });
    }

    if (!/csv|plain|text/.test(file.type)) {
      return new Response('Invalid mime type - CSV required', { 
        status: 415, 
        headers: corsHeaders 
      });
    }

    console.log('File validation passed:', { 
      name: file.name, 
      size: file.size, 
      type: file.type 
    });

    // Parse CSV côté edge (sécurisé)
    const csv = await file.text();
    const lines = csv.trim().split('\n');
    
    if (lines.length < 2) {
      return new Response('CSV file must have at least header and one data row', {
        status: 400,
        headers: corsHeaders
      });
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const dataRows = lines.slice(1);

    console.log('CSV headers:', headers);
    console.log('Data rows count:', dataRows.length);

    // Validation des colonnes requises
    const requiredColumns = [
      'TRANSACTION_DEPART_DATE',
      'TAXABLE_JURISDICTION',
      'TRANSACTION_CURRENCY_CODE',
      'TRANSACTION_TYPE',
      'TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL',
      'TOTAL_ACTIVITY_VALUE_VAT_AMT',
      'TOTAL_ACTIVITY_VALUE_AMT_VAT_INCL'
    ];

    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    if (missingColumns.length > 0) {
      return new Response(`Missing required columns: ${missingColumns.join(', ')}`, {
        status: 400,
        headers: corsHeaders
      });
    }

    const uploadId = crypto.randomUUID();
    console.log('Generated upload ID:', uploadId);

    // Mapper les données vers le format staging
    const mappedRows = dataRows.map((line, index) => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};
      
      headers.forEach((header, i) => {
        row[header] = values[i] || null;
      });

      // Validation et conversion de base
      const transactionDate = row['TRANSACTION_DEPART_DATE'];
      const jurisdiction = row['TAXABLE_JURISDICTION'];
      const currency = row['TRANSACTION_CURRENCY_CODE'];
      const type = row['TRANSACTION_TYPE'];

      if (!transactionDate || !jurisdiction || !currency || !type) {
        console.warn(`Row ${index + 2} missing required data:`, {
          transactionDate, jurisdiction, currency, type
        });
      }

      return {
        upload_id: uploadId,
        business_id: businessId,
        client_account_id: null, // NULL pour INDIVIDUAL
        TRANSACTION_DEPART_DATE: transactionDate,
        TAXABLE_JURISDICTION: jurisdiction,
        TRANSACTION_CURRENCY_CODE: currency,
        TRANSACTION_TYPE: type,
        TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL: parseFloat(row['TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL']) || 0,
        TOTAL_ACTIVITY_VALUE_VAT_AMT: parseFloat(row['TOTAL_ACTIVITY_VALUE_VAT_AMT']) || 0,
        TOTAL_ACTIVITY_VALUE_AMT_VAT_INCL: parseFloat(row['TOTAL_ACTIVITY_VALUE_AMT_VAT_INCL']) || 0
      };
    }).filter(row => row.TRANSACTION_DEPART_DATE); // Filtrer les lignes invalides

    console.log('Mapped rows count:', mappedRows.length);

    // Client admin (service role) pour écrire et ingérer
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log('Inserting staging data...');

    // Insert batch en staging
    const { error: insertErr } = await admin
      .from('stg_amz_transactions')
      .insert(mappedRows);

    if (insertErr) {
      console.error('Staging insert error:', insertErr);
      return new Response(`Staging error: ${insertErr.message}`, { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    console.log('Staging data inserted successfully');

    // Créer les fonctions de traitement maintenant
    console.log('Creating ingestion functions...');
    
    const ingestFunctionSQL = `
      CREATE OR REPLACE FUNCTION ingest_activity_replace(p_upload_id uuid)
      RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
      BEGIN
        DELETE FROM activity_events_v1 WHERE upload_id = p_upload_id;

        INSERT INTO activity_events_v1(
          business_id, client_account_id, upload_id, event_ts, event_date, country, currency,
          type, sign, amount_net, amount_tax, amount_gross, vat_rate, vat_rate_pct, amount_bucket
        )
        WITH src AS (
          SELECT
            s.business_id,
            s.client_account_id,
            s.upload_id,
            s.TRANSACTION_DEPART_DATE::timestamptz as event_ts,
            COALESCE(NULLIF(UPPER(TRIM(s.TAXABLE_JURISDICTION)), ''), 'UNKNOWN') as country,
            UPPER(s.TRANSACTION_CURRENCY_CODE) as currency,
            CASE WHEN UPPER(s.TRANSACTION_TYPE)='REFUND' THEN 'REFUND' ELSE 'SALES' END as type,
            CASE WHEN UPPER(s.TRANSACTION_TYPE)='REFUND' THEN -1 ELSE 1 END as sign,
            COALESCE(s.TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL, 0) as amt_excl,
            COALESCE(s.TOTAL_ACTIVITY_VALUE_VAT_AMT, 0) as amt_vat,
            COALESCE(s.TOTAL_ACTIVITY_VALUE_AMT_VAT_INCL,
                     COALESCE(s.TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL,0) + COALESCE(s.TOTAL_ACTIVITY_VALUE_VAT_AMT,0)) as amt_incl
          FROM stg_amz_transactions s
          WHERE s.upload_id = p_upload_id
        ),
        calc AS (
          SELECT
            business_id, client_account_id, upload_id, event_ts, country, currency, type, sign,
            (amt_excl * sign)::numeric(18,6) as amount_net,
            (amt_vat * sign)::numeric(18,6) as amount_tax,
            (amt_incl * sign)::numeric(18,6) as amount_gross,
            CASE WHEN amt_excl <> 0 THEN (amt_vat / NULLIF(amt_excl,0))::numeric(9,6) ELSE 0::numeric(9,6) END as vat_rate
          FROM src
        )
        SELECT
          business_id, client_account_id, upload_id, event_ts, event_ts::date as event_date, 
          country, currency, type, sign, amount_net, amount_tax, amount_gross, vat_rate,
          ROUND(vat_rate * 100, 2) as vat_rate_pct,
          CASE
            WHEN ABS(amount_gross) < 20   THEN '[0–20)'
            WHEN ABS(amount_gross) < 50   THEN '[20–50)'
            WHEN ABS(amount_gross) < 100  THEN '[50–100)'
            WHEN ABS(amount_gross) < 250  THEN '[100–250)'
            WHEN ABS(amount_gross) < 500  THEN '[250–500)'
            WHEN ABS(amount_gross) < 1000 THEN '[500–1000)'
            ELSE '[1000+]'
          END as amount_bucket
        FROM calc;
      END;
      $$;
    `;

    const { error: fnErr } = await admin.rpc('exec', { query: ingestFunctionSQL });
    if (fnErr) {
      console.warn('Function creation warning (may already exist):', fnErr.message);
    }

    console.log('Calling ingestion function...');

    // Lancer ingestion (replace pour état exact)
    const { error: rpcErr } = await admin.rpc('ingest_activity_replace', { 
      p_upload_id: uploadId 
    });

    if (rpcErr) {
      console.error('Ingestion RPC error:', rpcErr);
      return new Response(`Ingest error: ${rpcErr.message}`, { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    console.log('Ingestion completed successfully');

    // Purger le staging (optionnel - garder pour debug)
    console.log('Cleaning staging data...');
    await admin.from('stg_amz_transactions').delete().eq('upload_id', uploadId);

    console.log('Activity ingestion completed successfully');

    return new Response(JSON.stringify({ 
      ok: true, 
      upload_id: uploadId,
      rows_processed: mappedRows.length
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'content-type': 'application/json' } 
    });

  } catch (error) {
    console.error('Server error in activity ingestion:', error);
    return new Response(`Server error: ${error}`, { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}