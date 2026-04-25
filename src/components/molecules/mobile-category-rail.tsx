import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { categoryPath } from "@/constants/routes";
import { cn } from "@/lib/utils";
import type { CategoryChipDto } from "@/types/discovery";

type MobileCategoryRailProps = {
  categories: CategoryChipDto[];
  activeCategoryId?: string | null;
  loading?: boolean;
  skeletonCount?: number;
  className?: string;
};

export function MobileCategoryRail({
  categories,
  activeCategoryId,
  loading,
  skeletonCount = 6,
  className,
}: MobileCategoryRailProps) {
  if (loading) {
    return (
      <div className={cn("no-scrollbar -mx-1 flex gap-4 overflow-x-auto px-1 pb-2 pt-1", className)}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div key={i} className="flex w-18 shrink-0 flex-col items-center gap-2">
            <Skeleton className="size-18 rounded-full" />
            <Skeleton className="h-3 w-14 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("no-scrollbar -mx-1 flex gap-4 overflow-x-auto px-1 pb-2 pt-1", className)}>
      {categories.map((category) => {
        const active = activeCategoryId === category.id;
        return (
          <Link
            key={category.id}
            to={categoryPath(category.id)}
            className="flex w-18 shrink-0 flex-col items-center gap-2">
            <div
              className={cn(
                "size-18 rounded-full border bg-white p-0.5 shadow-sm ring-1 ring-black/5 transition-colors",
                active ? "border-border" : "border-transparent",
              )}>
              <div className="bg-muted relative size-full overflow-hidden rounded-full">
                {category.imageUrl ? (
                  <img
                    src={category.imageUrl}
                    alt=""
                    className="size-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="text-muted-foreground flex size-full items-center justify-center text-lg font-bold">
                    {category.name.slice(0, 1)}
                  </div>
                )}
              </div>
            </div>
            <span
              className={cn(
                "text-foreground max-w-full truncate text-center text-[11px] font-semibold leading-tight",
                active && "font-bold",
              )}>
              {category.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
