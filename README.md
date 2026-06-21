# OJT Monitoring System

Web admin portal and mobile app for monitoring On-the-Job Training (OJT). Built with **React**, **Ionic**, and **Supabase** (PostgreSQL, Auth, RLS).

| App | Folder | Purpose |
|-----|--------|---------|
| Admin web | `admin-web/` | Admin dashboard (users, students, school years) |
| Mobile app | `mobile-app/` | Student, coordinator, and supervisor mobile UI |
| Backend | `supabase/` | Migrations, seeds, Edge Functions |

---

## Prerequisites

Install these before cloning:

| Tool | Version | Notes |
|------|---------|--------|
| **Git** | 2.40+ | Clone the repository |
| **Node.js** | **20.x or 22.x LTS** recommended | Required for both apps. Node 18+ may work; use LTS for fewer issues |
| **npm** | **10+** (bundled with Node) | Package manager |
| **Supabase project** | Hosted (free tier OK) | [supabase.com](https://supabase.com) — create a project |
| **Supabase CLI** | Optional | Only if you use `supabase db push` or local Edge Functions |

**Optional (mobile on a physical device):**

- Phone and PC on the **same Wi‑Fi**
- For native builds later: Android Studio and/or Xcode, plus [Capacitor](https://capacitorjs.com/) tooling

Check versions:

```bash
git --version
node --version    # expect v20.x or v22.x
npm --version     # expect 10.x
```

---

## 1. Clone the repository

```bash
git clone <your-repo-url> OJT-Monitoring-System
cd OJT-Monitoring-System
```

---

## 2. Supabase project setup

You need a Supabase project with your database tables (`profiles`, `roles`, `school_years`, etc.). If the database already exists in your team’s Supabase project, skip to **Database scripts** below.

### Get API credentials

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project  
2. Go to **Project Settings → API**  
3. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

Never commit real keys. Use `.env.local` files (gitignored).

---

## 3. Database setup (migrations & seeds)

Apply backend logic in this order. You can use **either** migrations (CLI) **or** paste SQL in the **SQL Editor**.

### Option A — Supabase CLI (recommended if installed)

```bash
# Link your project (one time)
cd supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Apply all migrations
supabase db push
```

Migrations in this repo (applied in timestamp order):

| File | Purpose |
|------|---------|
| `migrations/20250620000000_admin_user_management.sql` | Admin helpers, profile RLS, register user RPC |
| `migrations/20250621000000_student_coordinator_assignments.sql` | Student–coordinator assignments |
| `migrations/20250622000000_school_years_admin.sql` | School years RLS for admin |
| `migrations/20250623000000_coordinator_read_assigned_students.sql` | Coordinators can read assigned student profiles |
| `migrations/20250623000001_get_coordinator_assigned_students.sql` | RPC for coordinator student list |

### Option B — SQL Editor (no CLI)

In Supabase → **SQL Editor**, run each file **in order**:

1. `supabase/seed/roles.sql` — roles: admin, coordinator, student, supervisor  
2. `supabase/migrations/20250620000000_admin_user_management.sql`  
3. `supabase/seed/register-user-function.sql` — full admin RPC + RLS (use if Add User fails)  
4. `supabase/migrations/20250621000000_student_coordinator_assignments.sql`  
   - Or: `supabase/seed/student-coordinator-assignments.sql` (standalone copy)  
5. `supabase/migrations/20250622000000_school_years_admin.sql`  
6. `supabase/migrations/20250623000000_coordinator_read_assigned_students.sql`  
7. `supabase/migrations/20250623000001_get_coordinator_assigned_students.sql`  
   - Or: `supabase/seed/coordinator-read-assigned-students.sql` + `supabase/seed/get-coordinator-assigned-students.sql`

### Create the first admin user

1. **Authentication → Users → Add user**  
   - Email: e.g. `admin@school.edu`  
   - Password: your choice  
   - Enable **Auto confirm user**

2. Run `supabase/seed/admin-bootstrap.sql` in the SQL Editor  
   - Replace `admin@school.edu` and name placeholders with your admin email/name

3. Sign in to the admin web with that email and password.

More backend details: [`supabase/README.md`](supabase/README.md)

### Optional: Register-user Edge Function

The admin **Add user** flow can use the `register-user` Edge Function:

```bash
cd supabase
supabase functions deploy register-user
```

If the function is not deployed, the app falls back to a database RPC (requires `register-user-function.sql`).

---

## 4. Admin web setup

```bash
cd admin-web
npm install
```

### Environment variables

```bash
# Windows (PowerShell)
copy .env.example .env.local

# macOS / Linux
cp .env.example .env.local
```

Edit `admin-web/.env.local`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

### Run (development)

```bash
npm run dev
```

Open the URL shown in the terminal (default **http://localhost:5173**).

### Other scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |

### Admin web stack (from `package.json`)

- React 19, TypeScript 6, Vite 8  
- React Router 7  
- `@supabase/supabase-js` 2.x  

---

## 5. Mobile app setup

```bash
cd mobile-app
npm install
```

### Environment variables

```bash
# Windows (PowerShell)
copy .env.example .env.local

# macOS / Linux
cp .env.example .env.local
```

Use the **same** Supabase URL and anon key as admin-web:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

### Run in browser (development)

```bash
npm run dev
```

Default: **http://localhost:5173** (if admin-web is already on 5173, Vite uses **5174**).

### Run on a physical phone (same Wi‑Fi)

```bash
npm run dev:mobile
```

1. Note your PC’s LAN IP (e.g. `192.168.1.10`) and the port Vite prints  
2. On your phone’s browser: `http://192.168.1.10:5173`  
3. Log in as **student**, **coordinator**, or **supervisor** (not admin — admin is redirected)

### Other scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |
| `npm run test.unit` | Unit tests (Vitest) |

### Mobile stack (from `package.json`)

- Ionic React 8, Capacitor 8  
- React 19, React Router 5  
- Vite 5, TypeScript 5.9  
- `@supabase/supabase-js` 2.x  

---

## 6. Fresh clone checklist

Use this order after cloning:

- [ ] Node.js 20+ and npm installed  
- [ ] Supabase project created; URL + anon key copied  
- [ ] Database: run migrations/seeds (section 3)  
- [ ] First admin: Auth user + `admin-bootstrap.sql`  
- [ ] `admin-web`: `npm install` → `.env.local` → `npm run dev`  
- [ ] `mobile-app`: `npm install` → `.env.local` → `npm run dev` or `npm run dev:mobile`  
- [ ] Admin: add school year, users, enroll students to coordinators  
- [ ] Mobile: log in as coordinator → **Quick actions → Student list**  

---

## 7. Project structure

```
OJT-Monitoring-System/
├── admin-web/          # Vite + React admin dashboard
│   ├── .env.example
│   └── src/
├── mobile-app/         # Ionic + Capacitor mobile app
│   ├── .env.example
│   └── src/
├── supabase/
│   ├── migrations/     # Versioned SQL migrations
│   ├── seed/           # SQL scripts for SQL Editor
│   ├── functions/      # Edge Functions (register-user)
│   └── README.md
└── README.md           # This file
```

---

## 8. Troubleshooting

| Issue | What to try |
|-------|-------------|
| Blank login / Supabase errors | Check `.env.local` exists and values match Dashboard → API |
| Admin “not recognized as admin” | Run `register-user-function.sql`, sign out/in; verify `profiles.role_id` = admin |
| Add user / RLS errors | Run `supabase/seed/register-user-function.sql` in SQL Editor |
| Coordinator sees no assigned students | Run `coordinator-read-assigned-students.sql` and `get-coordinator-assigned-students.sql` |
| Mobile can’t reach dev server | Use `npm run dev:mobile`, same Wi‑Fi, allow firewall for Node/Vite |
| Port already in use | Stop the other app or use the alternate port Vite suggests (e.g. 5174) |
| `Could not find the function` | Run the matching migration/seed in Supabase SQL Editor, wait ~10s, refresh |

---

## 9. Security notes

- Do **not** commit `.env.local`, service role keys, or real anon keys in public repos  
- `.env.example` files should only contain placeholders  
- Service role key is for server/Edge Functions only — never put it in frontend env files  

---

## License

See repository license (if applicable).
