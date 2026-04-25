import { Award, Clock, Leaf, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { icon: Leaf, title: "100% Fresh", subtitle: "Never frozen" },
  { icon: ShieldCheck, title: "Hygienically", subtitle: "Processed" },
  { icon: Clock, title: "On-Time", subtitle: "Delivery" },
  { icon: Award, title: "Best quality", subtitle: "Sourced with care" },
] as const;

export function HomeTrustStrip({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-2 sm:grid-cols-4", className)}>
      {items.map(({ icon: Icon, title, subtitle }) => (
        <div
          key={title}
          className="bg-primary/6 border-primary/10 flex flex-col gap-1 rounded-2xl border px-2.5 py-3 text-center shadow-sm">
          <Icon className="text-primary mx-auto size-6" strokeWidth={1.75} aria-hidden />
          <p className="text-foreground text-[11px] font-semibold leading-tight">{title}</p>
          <p className="text-muted-foreground text-[10px] leading-tight">{subtitle}</p>
        </div>
      ))}
    </div>
  );
}
