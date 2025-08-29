import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface SignupConfirmationEmailProps {
  supabase_url: string
  email_action_type: string
  redirect_to: string
  token_hash: string
  token: string
  user_email: string
}

export const SignupConfirmationEmail = ({
  token,
  supabase_url,
  email_action_type,
  redirect_to,
  token_hash,
  user_email,
}: SignupConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Confirmez votre inscription à TVA Analysis Pro</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🎉 Bienvenue sur TVA Analysis Pro !</Heading>
        
        <Text style={text}>
          Bonjour,
        </Text>
        
        <Text style={text}>
          Merci de vous être inscrit(e) sur TVA Analysis Pro. Pour activer votre compte et commencer à analyser vos données TVA Amazon, veuillez confirmer votre adresse email.
        </Text>

        <Section style={buttonContainer}>
          <Link
            href={`${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`}
            style={button}
          >
            ✅ Confirmer mon email
          </Link>
        </Section>

        <Text style={text}>
          Ou copiez-collez ce lien dans votre navigateur :
        </Text>
        <Text style={linkText}>
          {`${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`}
        </Text>

        <Text style={text}>
          Une fois votre email confirmé, vous pourrez :
        </Text>
        <Text style={text}>
          • 📊 Analyser vos rapports TVA Amazon
          • 🔍 Détecter automatiquement les erreurs TVA
          • 📈 Générer des tableaux de bord détaillés
          • 💼 Gérer vos clients (pour les cabinets comptables)
        </Text>

        <Text style={footerText}>
          Si vous n'avez pas créé de compte, vous pouvez ignorer cet email en toute sécurité.
        </Text>

        <Text style={footer}>
          TVA Analysis Pro - Votre assistant TVA pour Amazon FBA
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupConfirmationEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const h1 = {
  color: '#333',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
  padding: '0 40px',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#007ee6',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 32px',
}

const linkText = {
  color: '#007ee6',
  fontSize: '14px',
  margin: '16px 0',
  padding: '0 40px',
  wordBreak: 'break-all' as const,
}

const footerText = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '32px 0 16px',
  padding: '0 40px',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '32px 0',
}