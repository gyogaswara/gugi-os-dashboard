# Prompt Hermes — Patch status `error` di agent_executions

Paste blok di bawah ini ke Telegram Hermes. Alurnya 2 langkah: Hermes SELECT dulu,
tunggu lo balas "approve", baru UPDATE.

Latar belakang: `/tasks` nampilin success rate 89% dengan 0 error, padahal ada
execution yang delivery-nya gagal (INBOX thread 11681, CNT-PUB thread 11345) tapi
tercatat `status='ok'`. Setelah patch, success rate harusnya turun jadi sekitar 82% (23/28)
dan Errors jadi 2.

```
Hermes, ada data integrity issue di Supabase (project njjbmuhljbrnidrqrvqd), tabel agent_executions. Kerjakan 4 step di bawah, dan STOP di titik yang gue tandai.

CONTEXT
Dashboard Gugi OS nampilin success rate 89% dan 0 error, padahal ada execution yang delivery-nya gagal. Hipotesis gue: kamu isi status='ok' begitu cron fire sukses, walau delivery gagal dan error_message terisi. Semantik yang bener: kalau error_message IS NOT NULL, status harus 'error'.

STEP 1 — SELECT (read-only)
Via Management API, jalanin:
  SELECT id, agent_name, raw_cron_code, status, started_at, error_message
  FROM agent_executions
  WHERE error_message IS NOT NULL AND status = 'ok'
  ORDER BY started_at DESC;
Plus count semua row per status:
  SELECT status, count(*) FROM agent_executions GROUP BY status;
Expected: 2 row yang kena (INBOX "thread_id 11681 not found" dan CNT-PUB "thread_id 11345 not found"). Kalau hasilnya beda dari 2, bilang apa adanya. Tampilkan hasil lengkap ke gue. JANGAN UPDATE apa pun di step ini.

STEP 2 — STOP
Tunggu gue balas "approve". Jangan lanjut sendiri.

STEP 3 — UPDATE (hanya setelah gue approve)
  UPDATE agent_executions
  SET status = 'error'
  WHERE error_message IS NOT NULL AND status = 'ok'
  RETURNING id, raw_cron_code, status;
Laporin jumlah row yang ke-update dan isi RETURNING-nya. Jangan sentuh tabel atau kolom lain.

STEP 4 — DOCUMENT ROOT CAUSE (jelasin aja, jangan ubah apa-apa)
Jawab 3 hal:
 a) Di titik mana tepatnya kamu nentuin kolom status saat nulis ke agent_executions: pas cron fire, atau pas hasil delivery diketahui?
 b) Apakah sync ke Supabase (cron 06:00 WIB atau manual sync) nulis ulang agent_executions dari state lokal kamu? Kalau iya, apakah patch di step 3 bisa ke-overwrite di sync berikutnya, dan apa fix permanen di sumbernya (set status='error' saat delivery gagal)?
 c) Usulan aturan buat Sprint 3 orchestration governance: kapan status boleh 'ok', 'error', 'unknown'.
Jangan ubah logic status kamu sebelum gue approve usulan di (c).
```
