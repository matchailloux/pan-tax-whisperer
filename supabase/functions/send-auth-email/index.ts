import React from 'npm:react@18.3.1'
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { SignupConfirmationEmail } from './_templates/signup-confirmation.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const payload = await req.text()
    const signature = req.headers.get('webhook-signature')
    
    // For development, you might want to skip webhook verification
    // In production, make sure to set up proper webhook secret verification
    
    let webhookData
    try {
      webhookData = JSON.parse(payload)
    } catch (e) {
      console.error('Failed to parse webhook payload:', e)
      return new Response('Invalid JSON payload', { status: 400 })
    }

    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type, site_url },
    } = webhookData

    if (!user?.email) {
      return new Response('No user email found', { status: 400 })
    }

    // Only handle signup confirmations
    if (email_action_type !== 'signup') {
      return new Response('Email type not supported', { status: 400 })
    }

    console.log('Sending signup confirmation email to:', user.email)

    const html = await renderAsync(
      React.createElement(SignupConfirmationEmail, {
        supabase_url: site_url || Deno.env.get('SUPABASE_URL') || '',
        token,
        token_hash,
        redirect_to: redirect_to || site_url || '',
        email_action_type,
        user_email: user.email,
      })
    )

    const { data, error } = await resend.emails.send({
      from: 'TVA Analysis Pro <noreply@resend.dev>',
      to: [user.email],
      subject: '📧 Confirmez votre inscription - TVA Analysis Pro',
      html,
    })

    if (error) {
      console.error('Resend error:', error)
      throw error
    }

    console.log('Email sent successfully:', data)

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (error: any) {
    console.error('Error in send-auth-email function:', error)
    return new Response(
      JSON.stringify({
        error: {
          message: error.message,
          code: error.code || 'UNKNOWN_ERROR',
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    )
  }
})