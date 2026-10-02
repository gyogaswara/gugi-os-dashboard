"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
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

/**
 * Tombol aksi per record: klik menyalin prompt ke clipboard buat di-paste
 * ke Hermes. Tidak ada call ke Hermes atau Supabase dari sini.
 */
export default function ActionButtons({ actions }: { actions: PromptAction[] }) {
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

  if (actions.length === 0) return null;

  const handleClick = async (action: PromptAction) => {
    const ok = await copyText(action.prompt);
    setCopiedId(ok ? action.id : null);
    setToast({
      ok,
      text: ok ? "Prompt tersalin — paste ke Hermes" : "Gagal menyalin prompt",
    });
  };

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
              handleClick(action);
            }}
            className="inline-flex items-center gap-1.5 rounded border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-800 hover:bg-gray-50"
          >
            {copiedId === action.id ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
            {action.label}
          </button>
        ))}
      </div>
      {toast && (
        <div
          role="status"
          className={`fixed bottom-20 left-1/2 z-30 -translate-x-1/2 rounded px-4 py-2 text-sm text-white shadow-lg md:bottom-6 ${
            toast.ok ? "bg-gray-900" : "bg-red-700"
          }`}
        >
          {toast.text}
        </div>
      )}
    </>
  );
}
