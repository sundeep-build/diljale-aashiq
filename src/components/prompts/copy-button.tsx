"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "../icons";
import { cx } from "@/lib/utils";

export function CopyButton({
  text,
  label = "Copy prompt",
  variant = "solid",
  className,
}: {
  text: string;
  label?: string;
  /** solid for the main prompt, ghost for the small secondary copies */
  variant?: "solid" | "ghost";
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(id);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // clipboard blocked (insecure origin, permissions) — the text is still
      // selectable in the block above, so fail quietly
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition active:scale-95",
        copied
          ? "bg-emerald-500/15 text-emerald-300"
          : variant === "solid"
            ? "bg-white text-zinc-950 shadow-[0_8px_24px_-10px_rgb(255_255_255/0.5)] hover:bg-zinc-200"
            : "bg-white/[0.05] text-zinc-300 ring-1 ring-white/10 hover:bg-white/10 hover:text-white",
        className,
      )}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      <span aria-live="polite">{copied ? "Copied" : label}</span>
    </button>
  );
}
