import { RadioProvider } from "@/components/radio-provider";

/**
 * The radio and /prompts share this layout, and with it one RadioProvider.
 * Next keeps a layout mounted across client-side navigation between the pages
 * under it, so the song that was playing on the radio keeps playing while the
 * visitor browses prompts — and is still there when they come back.
 *
 * A route group: "(station)" adds nothing to any URL.
 */
export default function StationLayout({ children }: { children: React.ReactNode }) {
  return <RadioProvider>{children}</RadioProvider>;
}
