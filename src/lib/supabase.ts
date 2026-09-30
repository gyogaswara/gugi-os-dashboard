/**
 * Supabase client untuk Gugi OS Dashboard.
 *
 * File ini membuat satu instance Supabase client (singleton) yang dipakai
 * di seluruh app untuk query data, terutama tabel `cron_jobs`.
 *
 * Kredensial dibaca dari environment variables (lihat `.env.local.example`):
 * - NEXT_PUBLIC_SUPABASE_URL      : URL project Supabase
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY : anon (public) key project Supabase
 *
 * Prefix `NEXT_PUBLIC_` membuat nilai ini ikut ter-bundle ke browser,
 * jadi JANGAN pernah isi dengan service role key.
 */
import { createClient } from "@supabase/supabase-js";

// Diakses langsung (bukan lewat process.env[name]) supaya Next.js bisa
// meng-inline nilainya saat build untuk kode client-side.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    "Missing env variable NEXT_PUBLIC_SUPABASE_URL. Isi di .env.local (lihat .env.local.example).",
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    "Missing env variable NEXT_PUBLIC_SUPABASE_ANON_KEY. Isi di .env.local (lihat .env.local.example).",
  );
}

/** Instance Supabase client yang di-share di seluruh app. */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
