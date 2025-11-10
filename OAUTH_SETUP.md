# Google Drive & Garmin OAuth Setup

Dit document beschrijft hoe je automatische OAuth token refresh instelt voor Google Drive en Garmin API via Supabase Edge Functions.

## 🎯 Wat Dit Oplost

**Zonder deze setup:**
- Google Drive token verloopt elk uur → Gebruiker moet handmatig vernieuwen via pop-up
- Garmin data moet handmatig via CSV geïmporteerd worden

**Met deze setup:**
- ✅ Google Drive tokens worden automatisch vernieuwd (elk 50 minuten)
- ✅ Garmin data kan automatisch gesynchroniseerd worden
- ✅ Geen gebruikersinterventie nodig
- ✅ Werkt perfect op Android PWA

## 📋 Vereisten

- Node.js 18+
- Supabase account (gratis tier is voldoende!)
- Google Cloud Console account
- (Optioneel) Garmin Developer account

## 🚀 Setup Stappen

### 1. Supabase Project Aanmaken

1. Ga naar https://app.supabase.com
2. Klik op "New Project"
3. Vul in:
   - **Project naam:** `bitebudget`
   - **Database wachtwoord:** Genereer sterk wachtwoord (bewaar dit!)
   - **Region:** `Europe West (London)` of `Europe Central (Frankfurt)`
4. Klik "Create new project" → Wacht ~2 minuten

### 2. Supabase Credentials Noteer

1. Ga naar **Project Settings** → **API**
2. Noteer deze waarden:
   - `Project URL` → bijvoorbeeld `https://abcdefgh.supabase.co`
   - `anon public` key → lange string beginnend met `eyJ...`
   - `service_role` key → ⚠️ **Geheim! Bewaar veilig**

### 3. Installeer Supabase CLI

```bash
npm install -g supabase
```

### 4. Login en Koppel Project

```bash
# Login bij Supabase
supabase login

# Koppel je project (vervang YOUR_PROJECT_ID met jouw project ID uit de URL)
supabase link --project-ref YOUR_PROJECT_ID
```

**Tip:** Project ID vind je in de Project URL: `https://[PROJECT_ID].supabase.co`

### 5. Google OAuth Credentials

#### 5.1 Google Cloud Project Aanmaken

1. Ga naar https://console.cloud.google.com/
2. Maak nieuw project: **Klik links-boven** → "New Project"
3. Naam: `BiteBudget` → Create

#### 5.2 Google Drive API Activeren

1. In je nieuwe project, ga naar **APIs & Services** → **Library**
2. Zoek "Google Drive API"
3. Klik **Enable**

#### 5.3 OAuth Consent Screen Configureren

1. Ga naar **APIs & Services** → **OAuth consent screen**
2. Kies **External** → Create
3. Vul in:
   - **App name:** BiteBudget
   - **User support email:** jouw email
   - **Developer contact:** jouw email
4. Klik **Save and Continue**
5. Bij "Scopes" → **Add or Remove Scopes**
   - Zoek en selecteer: `https://www.googleapis.com/auth/drive.file`
   - Save and Continue
6. Bij "Test users" → **Add Users**
   - Voeg je eigen email toe (en eventueel bekenden)
   - Save and Continue

#### 5.4 OAuth Client ID Aanmaken

1. Ga naar **APIs & Services** → **Credentials**
2. Klik **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Naam: `BiteBudget Web`
5. **Authorized redirect URIs** → Add URI:
   - Development: `http://localhost:5173/oauth/google/callback`
   - Production: `https://jouw-domein.com/oauth/google/callback`

   ⚠️ **Belangrijk:** Als je de app via GitHub Pages publiceert, gebruik dan:
   - `https://jouw-gebruikersnaam.github.io/bitebudget/oauth/google/callback`

6. Klik **Create**
7. **Noteer:**
   - **Client ID** (eindigt op `.apps.googleusercontent.com`)
   - **Client Secret** (⚠️ Geheim!)

### 6. Genereer Encryptie Key

Deze key wordt gebruikt om refresh tokens veilig op te slaan.

```bash
# Genereer 256-bit random key
openssl rand -base64 32
```

**Voorbeeld output:** `aB3dE6fG9hJ2kL5mN8pQ1rS4tU7vW0xY=`

⚠️ **Bewaar deze key! Je hebt hem nodig in de volgende stap.**

### 7. Stel Supabase Secrets In

```bash
# OAuth Encryption Key (gebruik de key uit stap 6)
supabase secrets set OAUTH_ENCRYPTION_KEY="jouw-gegenereerde-base64-key"

# Google OAuth Credentials (uit stap 5.4)
supabase secrets set GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
supabase secrets set GOOGLE_CLIENT_SECRET="your-client-secret"

# (Optioneel) Garmin OAuth Credentials
# supabase secrets set GARMIN_CONSUMER_KEY="your-consumer-key"
# supabase secrets set GARMIN_CONSUMER_SECRET="your-consumer-secret"
```

### 8. Deploy Database & Edge Functions

```bash
# Deploy database migrations (creëert oauth_tokens tabel)
supabase db push

# Deploy alle Edge Functions
supabase functions deploy google-oauth-init
supabase functions deploy google-oauth-refresh
supabase functions deploy garmin-oauth-init
supabase functions deploy garmin-oauth-refresh
```

✅ Als alles goed gaat zie je 4x "Deployed successfully"

### 9. Update Client Environment Variables

1. Kopieer `.env.example` naar `.env`:

```bash
cp .env.example .env
```

2. Vul `.env` in met jouw credentials:

```env
# Supabase (uit stap 2)
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google OAuth (Client ID uit stap 5.4)
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com

# Garmin OAuth (optioneel)
VITE_GARMIN_CONSUMER_KEY=your-garmin-consumer-key
```

### 10. Test de Setup

```bash
# Start development server
npm run dev
```

1. Open http://localhost:5173
2. Ga naar **Instellingen** → **Cloud Synchronisatie**
3. Klik **"Verbind met Google Drive"**
4. Je wordt doorgestuurd naar Google
5. Autoriseer de app
6. Je wordt teruggeleid → klaar!

✅ **Success!** Tokens worden nu automatisch vernieuwd elk 50 minuten.

## 📊 Hoe Het Werkt

```
┌─────────────────────────────────────────────────────┐
│ BiteBudget PWA (Client)                             │
│                                                     │
│ 1. User klikt "Verbind Google Drive"                │
│ 2. → Redirect naar Google (Authorization Code Flow)│
└─────────────────┬───────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────┐
│ Google OAuth Server                                 │
│                                                     │
│ 3. User autoriseert app                             │
│ 4. ← Redirect terug met authorization code         │
└─────────────────┬───────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────┐
│ Supabase Edge Function: google-oauth-init           │
│                                                     │
│ 5. Exchange code voor access_token + refresh_token │
│ 6. Encrypt refresh_token (AES-256-GCM)              │
│ 7. Store encrypted token in database                │
│ 8. ← Return access_token to client                 │
└─────────────────┬───────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────┐
│ BiteBudget PWA (Client)                             │
│                                                     │
│ 9. Store access_token locally                       │
│ 10. ⏰ Start timer (refresh elk 50 min)             │
└─────────────────────────────────────────────────────┘

... 50 minuten later ...

┌─────────────────────────────────────────────────────┐
│ BiteBudget PWA (Client)                             │
│                                                     │
│ 11. Timer fires → Call refresh function             │
└─────────────────┬───────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────┐
│ Supabase Edge Function: google-oauth-refresh        │
│                                                     │
│ 12. Get encrypted refresh_token from database       │
│ 13. Decrypt refresh_token                           │
│ 14. Request new access_token from Google            │
│ 15. ← Return new access_token to client            │
└─────────────────┬───────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────┐
│ BiteBudget PWA (Client)                             │
│                                                     │
│ 16. Update stored access_token                      │
│ 17. ✅ Continue using Google Drive seamlessly       │
└─────────────────────────────────────────────────────┘
```

## 🔒 Beveiliging

- ✅ **Refresh tokens** worden **AES-256-GCM encrypted** opgeslagen
- ✅ **Client krijgt NOOIT de refresh token** te zien
- ✅ **Service role key** blijft op server (Edge Functions)
- ✅ **Row Level Security (RLS)** enabled op database
- ✅ **User isolation** via browser fingerprint

## 💰 Kosten

**Supabase gratis tier:**
- 500K Edge Function calls/maand
- Voor 10 gebruikers: ~600-900 calls/maand = **0.18% van limiet**
- Voor 100 gebruikers: ~6K-9K calls/maand = **1.8% van limiet**

**Conclusie:** Gratis tier is **meer dan voldoende** voor jouw gebruik!

## 🐛 Troubleshooting

### "Supabase credentials not configured"

**Oplossing:** Check of `.env` bestand correct is ingevuld:
```bash
cat .env
```

Moet bevatten:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GOOGLE_CLIENT_ID`

### "OAuth callback failed"

**Mogelijke oorzaken:**
1. **Redirect URI niet correct:** Check Google Cloud Console → Credentials → Authorized redirect URIs
2. **Secrets niet gezet:** Run `supabase secrets list` om te checken
3. **Edge Function niet gedeployed:** Run `supabase functions list`

### "No refresh token received"

**Oplossing:** Voeg `prompt=consent` toe aan authorization URL (al gedaan in code).

Als het niet werkt:
1. Revoke access: https://myaccount.google.com/permissions
2. Probeer opnieuw te verbinden

### Edge Function logs bekijken

```bash
# Realtime logs
supabase functions logs google-oauth-refresh --tail

# Laatste 100 logs
supabase functions logs google-oauth-init -n 100
```

### Database inspecteren

```bash
# Open database shell
supabase db remote

# Check oauth_tokens tabel
SELECT user_id, google_access_token_expires_at FROM oauth_tokens;
```

## 📚 Meer Info

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Google OAuth 2.0 Docs](https://developers.google.com/identity/protocols/oauth2)
- [Garmin Connect Developer Docs](https://developer.garmin.com/gc-developer-program/)

## 🎉 Done!

Je hebt nu:
- ✅ Automatische Google Drive token refresh
- ✅ Infrastructuur voor Garmin automatische sync
- ✅ Veilige server-side token management
- ✅ Werkt perfect op alle platforms (Android, iOS, Desktop)

Geen handmatige token vernieuwing meer! 🚀
