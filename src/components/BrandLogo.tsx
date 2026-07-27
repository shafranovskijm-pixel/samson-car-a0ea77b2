import { useEffect, useState } from "react";

// filippofilip95/car-logos-dataset — thumb 200px, свободный доступ через jsDelivr CDN.
const slug = (brand: string) =>
  brand
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9-]/g, "");

export const brandLogoUrl = (brand: string) =>
  `https://cdn.jsdelivr.net/gh/filippofilip95/car-logos-dataset/logos/thumb/${slug(brand)}.png`;

export function BrandLogo({
  brand,
  logoUrl,
  size = 48,
  className = "",
}: {
  brand: string;
  logoUrl?: string | null;
  size?: number;
  className?: string;
}) {
  // 0: custom logo_url, 1: jsDelivr CDN, 2: initials fallback
  const [stage, setStage] = useState<0 | 1 | 2>(logoUrl ? 0 : 1);

  // если logoUrl появился/сменился — начнём сначала
  useEffect(() => {
    setStage(logoUrl ? 0 : 1);
  }, [logoUrl]);

  if (stage === 2) {
    const initials = brand
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    return (
      <div
        className={`inline-flex items-center justify-center rounded-md bg-white/10 font-bold text-white/80 ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
        aria-label={brand}
      >
        {initials}
      </div>
    );
  }

  const src = stage === 0 ? (logoUrl as string) : brandLogoUrl(brand);
  return (
    <img
      src={src}
      alt={brand}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setStage((s) => (s === 0 ? 1 : 2))}
      className={`object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
