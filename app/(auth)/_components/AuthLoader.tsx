import { ShieldCheck } from "lucide-react";

export function AuthLoader({ label = "Verifying your session" }) {
  return (
    <div
      role="label"
      aria-live="polite"
      aria-busy="true"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-8 px-6"
    >
      <div className="relative flex size-24 items-center justify-center text-primary">
        <div className="absolute inset-2 rounded-full bg-current opacity-10 blur-2xl motion-safe:animate-pulse" />

        <div
          aria-hidden
          className="absolute inset-0 rounded-full border border-border"
        />

        <div
          aria-hidden
          className="absolute inset-0 rounded-full motion-safe:animate-spin animation-duration-[1.6s]"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg 220deg, currentColor 360deg)",
            WebkitMask:
              "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))",
            mask: "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))",
          }}
        />

        <div className="relative flex size-14 items-center justify-center rounded-full border border-border bg-card shadow-sm">
          <ShieldCheck className="size-6" strokeWidth={1.75} />
        </div>
      </div>

      <p className="text-sm font-medium tracking-tight">{label}</p>
    </div>
  );
}
