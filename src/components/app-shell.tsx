"use client";

import { useEffect, useState } from "react";
import AppNav from "@/components/app-nav";

const STORAGE_KEY = "gugi-os:sidebar-open";

/**
 * Pembungkus layout: pegang state sidebar (tampil/sembunyi, di desktop dan tablet)
 * dan geser konten sesuai. Pilihan disimpan di localStorage; di mobile sidebar
 * tidak dipakai (bottom tab bar), jadi state ini tidak berpengaruh di sana.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true);

  // Baca pilihan tersimpan setelah mount supaya render awal server dan client sama.
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "0") setOpen(false);
    } catch {
      // localStorage bisa diblok (private mode); sidebar tetap terbuka.
    }
  }, []);

  const toggle = () =>
    setOpen((current) => {
      const next = !current;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // abaikan: pilihan cuma tidak tersimpan
      }
      return next;
    });

  return (
    <>
      <AppNav open={open} onToggle={toggle} />
      {/* Ruang buat sidebar (md+) dan bottom tab bar (mobile); saat sidebar
          disembunyikan tinggal gutter sempit buat tombol buka. */}
      <div className={`pb-16 md:pb-0 ${open ? "md:pl-52" : "md:pl-14"}`}>{children}</div>
    </>
  );
}
