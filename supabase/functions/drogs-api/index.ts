import { createHandler } from './handler.mjs';
import { createSupabaseStore } from './store.mjs';

const keys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}');
const serverKey = keys.default || Deno.env.get('DROGS_SUPABASE_SERVER_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const store = createSupabaseStore(Deno.env.get('SUPABASE_URL'), serverKey);
Deno.serve(createHandler(store, { allowedOrigin: Deno.env.get('DROGS_ALLOWED_ORIGIN') || 'https://jkgbafa.github.io' }));
