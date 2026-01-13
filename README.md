# SharkIN - AI-Powered LinkedIn Content Creator

## 🦈 Hvad er SharkIN?

SharkIN hjælper LinkedIn creators med at skabe engagerende content ved hjælp af AI.

**Features:**
- 🪝 **Hook & Intro Studio** - Generer hooks til dine posts.
- ✍️ **Ghostwriter Workspace** - Skriv posts i din stil.
- 💬 **Comment Copilot** - Smarte kommentarer.

---

## 🚀 Quick Start

### 1. Setup Database (KØR FØRST!)

Gå til din Supabase Dashboard og kør denne SQL:

```sql
-- Opret users tabel
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  subscription_status TEXT DEFAULT 'trial',
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  
  default_language TEXT DEFAULT 'da',
  default_tone TEXT DEFAULT 'professional',
  
  monthly_credits_used INT DEFAULT 0,
  monthly_credits_limit INT DEFAULT 100
);

-- Opret generated_hooks tabel
CREATE TABLE generated_hooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  input_text TEXT NOT NULL,
  language TEXT NOT NULL,
  tone TEXT NOT NULL,
  target_audience TEXT,
  
  hooks JSONB NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_generated_hooks_user ON generated_hooks(user_id);

-- Function til credits
CREATE OR REPLACE FUNCTION increment_credits(user_id UUID, amount INT)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET monthly_credits_used = monthly_credits_used + amount
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_hooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own hooks" ON generated_hooks
  FOR ALL USING (auth.uid() = user_id);
```

### 2. Deploy til Vercel

1. Push kode til GitHub
2. Gå til https://vercel.com
3. Import dit GitHub repo
4. Tilføj Environment Variables (se .env.local)
5. Deploy!

### 3. Test din app

1. Gå til din app URL
2. Opret bruger
3. Test Hook Generator

---

## 🔑 Environment Variables

Disse er allerede sat i `.env.local` - skal også tilføjes i Vercel:

```
NEXT_PUBLIC_SUPABASE_URL=din-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=din-anon-key
SUPABASE_SERVICE_ROLE_KEY=din-service-role-key
ANTHROPIC_API_KEY=din-anthropic-key
NEXT_PUBLIC_APP_URL=din-app-url
```

---

## 📁 Projekt Struktur

```
sharkin-app/
├── app/
│   ├── page.tsx              # Forside
│   ├── login/page.tsx        # Login/signup
│   ├── dashboard/page.tsx    # Dashboard
│   ├── hooks/page.tsx        # Hook Generator
│   └── api/
│       └── generate/
│           └── hooks/route.ts  # API til hook generation
├── .env.local                # Dine API keys (IKKE commit!)
└── package.json              # Dependencies
```

---

## 🛠️ Udvikling Lokalt

```bash
npm install
npm run dev
```

Åbn http://localhost:3000

---

## 🆘 Support

Hvis noget ikke virker:
1. Check at database-tabeller er oprettet
2. Check at alle environment variables er sat
3. Check browser console for fejl (F12 → Console)
4. Check Vercel deployment logs

---

## 📝 Næste Steps

- [ ] Tilføj Ghostwriter Workspace
- [ ] Tilføj Comment Copilot
- [ ] Integrer Stripe betalinger
- [ ] Tilføj analytics
- [ ] Custom domain

---

**Lavet med ❤️ og 🦈**
