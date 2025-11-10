# Supabase Setup voor BiteBudget

Deze folder bevat de Supabase backend configuratie voor automatische OAuth token refresh (Google Drive en Garmin).

## Vereisten

- Node.js 18+
- Supabase account (gratis tier is voldoende)
- Supabase CLI

## Installatie Supabase CLI

```bash
npm install -g supabase
```

## Setup Stappen

### 1. Maak Supabase Project

1. Ga naar https://app.supabase.com
2. Klik op "New Project"
3. Vul in:
   - Project naam: `bitebudget`
   - Database wachtwoord: (genereer sterk wachtwoord)
   - Region: `Europe West (London)` of `Europe Central (Frankfurt)`
4. Wacht ~2 minuten tot project klaar is

### 2. Noteer Project Credentials

Ga naar **Project Settings** → **API** en noteer:
- `Project URL` → gebruik voor `VITE_SUPABASE_URL`
- `anon public` key → gebruik voor `VITE_SUPABASE_ANON_KEY`
- `service_role` key → gebruik voor Supabase secrets (zie stap 5)

### 3. Login met Supabase CLI

```bash
supabase login
```

### 4. Koppel project

```bash
supabase link --project-ref your-project-id
```

(Project ID vind je in de Project URL: `https://[project-id].supabase.co`)

### 5. Stel Secrets in

De Edge Functions hebben secrets nodig voor OAuth credentials en encryptie.

#### Genereer encryptie key:

```bash
# Genereer 256-bit random key en encode als base64
openssl rand -base64 32
```

#### Stel alle secrets in:

```bash
# OAuth Encryption Key (gebruik gegenereerde key hierboven)
supabase secrets set OAUTH_ENCRYPTION_KEY="your-generated-base64-key"

# Google OAuth Credentials
supabase secrets set GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
supabase secrets set GOOGLE_CLIENT_SECRET="your-client-secret"

# Garmin OAuth Credentials (optioneel)
supabase secrets set GARMIN_CONSUMER_KEY="your-consumer-key"
supabase secrets set GARMIN_CONSUMER_SECRET="your-consumer-secret"
```

**Google OAuth Setup:**
1. Ga naar https://console.cloud.google.com/apis/credentials
2. Maak nieuw OAuth 2.0 Client ID
3. Application type: **Web application**
4. Authorized redirect URIs:
   - `http://localhost:5173/oauth/google/callback` (development)
   - `https://your-domain.com/oauth/google/callback` (production)
5. Noteer Client ID en Client Secret

**Garmin OAuth Setup:**
1. Ga naar https://developer.garmin.com/gc-developer-program/
2. Registreer een nieuwe applicatie
3. Noteer Consumer Key en Consumer Secret

### 6. Deploy Database Migration

```bash
supabase db push
```

Dit creëert de `oauth_tokens` tabel in je database.

### 7. Deploy Edge Functions

```bash
# Deploy alle functions
supabase functions deploy google-oauth-init
supabase functions deploy google-oauth-refresh
supabase functions deploy garmin-oauth-init
supabase functions deploy garmin-oauth-refresh
```

Of deploy alles in één keer:

```bash
supabase functions deploy
```

### 8. Update Client Environment Variables

Maak een `.env` bestand in de root van je project (kopieer `.env.example`):

```bash
cp .env.example .env
```

Vul de waardes in:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
VITE_GARMIN_CONSUMER_KEY=your-garmin-consumer-key
```

### 9. Test de Setup

Start de app:

```bash
npm run dev
```

Test de OAuth flows:
1. Ga naar Settings → Google Drive
2. Klik op "Verbind met Google Drive"
3. Autoriseer de app
4. De tokens worden nu automatisch vernieuwd!

## Architectuur

```
📱 BiteBudget PWA (Client)
  ↓ HTTPS fetch()
🔒 Supabase Edge Functions (Deno)
  ├─ google-oauth-init   (authorization code → tokens)
  ├─ google-oauth-refresh (refresh access token)
  ├─ garmin-oauth-init   (authorization code → tokens)
  └─ garmin-oauth-refresh (refresh access token)
  ↓ Encrypted storage
🗄️ Supabase PostgreSQL
  └─ oauth_tokens table (AES-256-GCM encrypted refresh tokens)
```

## Security

- ✅ Refresh tokens worden AES-256-GCM encrypted opgeslagen
- ✅ Client krijgt alleen access tokens (niet refresh tokens)
- ✅ Service role key blijft op server (Edge Functions)
- ✅ User isolation via browser fingerprint
- ✅ Row Level Security (RLS) enabled op database

## Kosten

Met de **gratis tier** ondersteun je eenvoudig:
- 500K Edge Function calls/maand (genoeg voor 1000+ gebruikers)
- 500 MB database storage
- 2 GB bandwidth/maand

Voor "een aantal bekenden" is dit meer dan voldoende!

## Troubleshooting

### Edge Function errors

View logs:
```bash
supabase functions logs google-oauth-refresh
```

### Database issues

Open database dashboard:
```bash
supabase db remote
```

### Test Edge Function lokaal

```bash
supabase functions serve google-oauth-refresh
```

## Meer Info

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Google OAuth 2.0 Docs](https://developers.google.com/identity/protocols/oauth2)
- [Garmin Connect Developer Docs](https://developer.garmin.com/gc-developer-program/)
