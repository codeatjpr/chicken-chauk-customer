import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type ShopCategoryCardProps = {
  to: string;
  name: string;
  imageUrl?: string | null;
  icon: LucideIcon;
  active?: boolean;
  className?: string;
};

/**
 * Desktop “Shop by category” tile (Crave-style gradient card).
 * Used inside `hidden lg:block` on home; mobile uses `MobileCategoryRail` instead.
 */
export function ShopCategoryCard({ to, name, imageUrl, icon: Icon, active = false, className }: ShopCategoryCardProps) {
  return (
    <Link
      to={to}
      className={cn(
        "group relative flex w-[158px] shrink-0 flex-col overflow-hidden rounded-3xl border shadow-sm transition-all lg:w-[168px]",
        "border-[#e8a598]/55 bg-linear-to-b from-[#fffbfb] via-[#fff0ea] to-[#ffd8ce]",
        "hover:-translate-y-1 hover:border-[#d88778]/65 hover:shadow-lg",
        active && "ring-primary/30 border-[#cf7a6c]/80 ring-2",
        className,
      )}>
      {/* Image only — overflow hidden here so photo clips; badge lives below in footer row */}
      <div className="relative z-0 w-full shrink-0">
        <div className="aspect-[1.08] w-full overflow-hidden rounded-t-3xl bg-white/90">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              className="size-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.04]"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="text-primary/35 flex size-full items-center justify-center bg-linear-to-b from-white to-[#ffe8e0] text-3xl font-bold">
              {name.slice(0, 1)}
            </div>
          )}
        </div>
      </div>

      {/* Label band: icon circle centered on the seam (half on image, half on peach) */}
      <div className="relative z-10 flex min-h-17 flex-1 flex-col justify-end px-2 pb-5 pt-7 lg:min-h-18 lg:pb-6 lg:pt-8">
        <div
          className="border-border/45 absolute left-1/2 top-0 z-20 flex size-11.5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-white shadow-[0_4px_16px_-6px_rgba(0,0,0,0.22)] lg:size-12.5"
          aria-hidden>
          <Icon className="size-[1.35rem] text-[#dc2626] lg:size-6" strokeWidth={1.65} />
        </div>
        <p className="relative z-10 text-center text-[0.9375rem] font-bold leading-snug tracking-tight text-neutral-900 lg:text-base">
          {name}
        </p>
      </div>
    </Link>
  );
}
