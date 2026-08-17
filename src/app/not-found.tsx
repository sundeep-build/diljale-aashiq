import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative z-10 grid min-h-dvh place-items-center bg-[radial-gradient(120%_80%_at_50%_-10%,#3a0f26_0%,#150a11_45%,#0a0508_100%)] px-6 text-center">
      <div>
        <p className="font-deva text-6xl font-bold text-rose neon-text">खो गया</p>
        <h1 className="mt-4 font-display text-2xl font-extrabold">
          Ye page bhi chhod ke chala gaya
        </h1>
        <p className="mt-2 text-sm text-muted">
          Link toota hua hai, ya dedication mit gaya.
        </p>
        <Link
          href="/"
          className="mt-7 inline-block rounded-full bg-rose px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_30px_-10px_var(--color-rose)]"
        >
          Wapas station pe
        </Link>
      </div>
    </main>
  );
}
