# Supabase backend (OJT Monitoring)

## Register user (admin)

User registration from the admin portal uses the **`register-user`** Edge Function. It:

1. Verifies the caller is signed in and has the `admin` role
2. Creates the Auth user via the Admin API (`email_confirm: true`)
3. Inserts the linked row in `public.profiles` with status `active`
4. Rolls back the Auth user if the profile insert fails

### Setup

1. **Apply the migration** (RLS + `is_admin()` helper):

   ```bash
   supabase db push
   ```

   Or run `migrations/20250620000000_admin_user_management.sql` in the Supabase SQL Editor.

2. **Deploy the Edge Function**:

   ```bash
   supabase functions deploy register-user
   ```

   `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically when deployed on Supabase.

3. **Seed roles** if needed: `seed/roles.sql`

### Local testing

```bash
supabase start
supabase functions serve register-user --env-file supabase/.env.local
```

Create `supabase/.env.local` with your service role key (never commit this file):

```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```
