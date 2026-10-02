"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Copy } from "lucide-react";
import type { PromptAction } from "@/lib/prompts";

/** Salin teks ke clipboard; fallback textarea buat browser yang menolak Clipboard API. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  }
}

/** Salin prompt + toast "tersalin". Dipakai bareng oleh ActionButtons dan ActionMenu. */
function useCopyPrompt() {
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
      setCopiedId(null);
    }, 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const copy = async (action: PromptAction) => {
    const ok = await copyText(action.prompt);
    setCopiedId(ok ? action.id : null);
    setToast({
      ok,
      text: ok ? "Prompt tersalin — paste ke Hermes" : "Gagal menyalin prompt",
    });
  };

  const toastEl = toast && (
    <div
      role="status"
      className={`fixed bottom-20 left-1/2 z-30 -translate-x-1/2 rounded px-4 py-2 text-sm text-white shadow-lg md:bottom-6 ${
        toast.ok ? "bg-gray-900" : "bg-red-700"
      }`}
    >
      {toast.text}
    </div>
  );

  return { copy, copiedId, toastEl };
}

/**
 * Tombol aksi per record: klik menyalin prompt ke clipboard buat di-paste
 * ke Hermes. Tidak ada call ke Hermes atau Supabase dari sini.
 */
export default function ActionButtons({ actions }: { actions: PromptAction[] }) {
  const { copy, copiedId, toastEl } = useCopyPrompt();

  if (actions.length === 0) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            title={action.prompt}
            onClick={(e) => {
              // Tombol sering ada di dalam row/card yang bisa di-klik buat expand.
              e.stopPropagation();
              copy(action);
            }}
            className="inline-flex items-center gap-1.5 rounded border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-800 hover:bg-gray-50"
          >
            {copiedId === action.id ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
            {action.label}
          </button>
        ))}
      </div>
      {toastEl}
    </>
  );
}

/**
 * Versi ringkas buat baris tabel: satu tombol "Prompt" yang membuka daftar aksi.
 * Menu pakai posisi fixed supaya tidak terpotong wrapper tabel yang overflow-x-auto.
 */
export function ActionMenu({ actions }: { actions: PromptAction[] }) {
  const { copy, copiedId, toastEl } = useCopyPrompt();
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!pos) return;
    const close = () => setPos(null);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("click", close);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [pos]);

  if (actions.length === 0) return null;

  const toggle = (e: React.MouseEvent) => {
    // Row biasanya bisa di-klik buat expand; menu tidak boleh ikut memicu itu.
    e.stopPropagation();
    if (pos) return setPos(null);
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={pos !== null}
        className="inline-flex items-center gap-1.5 rounded border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-800 hover:bg-gray-50"
      >
        <Copy size={14} aria-hidden />
        Prompt
        <ChevronDown size={14} aria-hidden />
      </button>
      {pos && (
        <ul
          role="menu"
          style={{ top: pos.top, right: pos.right }}
          className="fixed z-30 w-48 rounded border border-gray-200 bg-white py-1 shadow-lg"
        >
          {actions.map((action) => (
            <li key={action.id} role="none">
              <button
                type="button"
                role="menuitem"
                title={action.prompt}
                onClick={(e) => {
                  e.stopPropagation();
                  copy(action);
                  setPos(null);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-gray-800 hover:bg-gray-50"
              >
                {copiedId === action.id ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
                {action.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      {toastEl}
    </>
  );
}
