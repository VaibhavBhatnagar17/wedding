/* ═══════════════════════════════════════════════════════════════════════════
   Connect the guest portal to your Supabase project.

   1. Create a free project at https://supabase.com
   2. SQL Editor → paste and run supabase/schema.sql
   3. Project Settings → API → copy "Project URL" and the "anon public" key
   4. Paste them below and commit.

   The anon key is safe to publish. The schema gives it no table access at
   all — it can only call the five functions in schema.sql, and the guest
   lookup returns a single row for a phone number the caller already knows.

   Leave these blank and the portal runs on the sample guests in js/data.js,
   so you can try it before signing up.
   ═══════════════════════════════════════════════════════════════════════════ */
window.W = window.W || {};

window.W.config = {
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',

  /* Shown to guests who can't find themselves in the list. */
  helpName: 'Vaibhav',
  helpPhone: '+919649364280',

  /* Set to your live URL once deployed; used for share links. */
  siteUrl: ''
};
