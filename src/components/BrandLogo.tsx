import { useState } from "react";

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
  size = 48,
  className = "",
}: {
  brand: string;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const initials = brand
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (failed) {
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
  return (
    <img
      src={brandLogoUrl(brand)}
      alt={brand}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
