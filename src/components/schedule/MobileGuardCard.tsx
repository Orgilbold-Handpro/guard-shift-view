import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Guard, Assignment } from "./ScheduleBoard";

const siteColorClass = (i: number) => {
  const map = [
    "bg-[hsl(var(--tag-1))]",
    "bg-[hsl(var(--tag-2))]",
    "bg-[hsl(var(--tag-3))]",
    "bg-[hsl(var(--tag-4))]",
    "bg-[hsl(var(--tag-5))]",
    "bg-[hsl(var(--tag-6))]",
    "bg-[hsl(var(--tag-7))]",
    "bg-[hsl(var(--tag-8))]",
  ];
  return map[(i - 1) % map.length];
};

const statusBg = {
  assigned: "",
  free: "bg-[hsl(var(--status-free))] text-[hsl(var(--brand-contrast))]",
  off: "bg-[hsl(var(--status-off))] text-[hsl(var(--foreground))]",
  leave: "bg-[hsl(var(--status-leave))] text-[hsl(var(--brand-contrast))]",
} as const;

export default function MobileGuardCard({
  guard,
  days,
  assignmentsByKey,
}: {
  guard: Guard;
  days: Date[];
  assignmentsByKey: Map<string, Assignment>;
}) {
  return (
    <Card className="p-4">
      <div className="mb-3">
        <div className="font-medium">{guard.name}</div>
        {guard.phone && <div className="text-xs text-muted-foreground">{guard.phone}</div>}
      </div>
      <div className="space-y-2">
        {days.map((d) => {
          const dateKey = format(d, "yyyy-MM-dd");
          const a = assignmentsByKey.get(`${guard.id}_${dateKey}`);
          let content: React.ReactNode = <span className="text-muted-foreground">—</span>;

          if (a?.status === "assigned" && a.siteId) {
            const siteTagIndex = parseInt(a.siteId.replace(/[^0-9]/g, "")) || 1;
            content = (
              <div className="inline-flex items-center text-sm">
                <span className={cn("inline-block size-2 rounded-full mr-2", siteColorClass(siteTagIndex))} />
                <span className="truncate" title={a.siteId}>{a.siteId}</span>
              </div>
            );
          } else if (a?.status === "free") {
            content = <Badge className={statusBg.free}>Чөлөөтэй</Badge>;
          } else if (a?.status === "off") {
            content = <Badge variant="secondary" className={statusBg.off}>Амралт</Badge>;
          } else if (a?.status === "leave") {
            content = <Badge className={statusBg.leave}>Чөлөө</Badge>;
          }

          return (
            <div key={dateKey} className="flex items-center justify-between border rounded-lg px-3 py-2">
              <div className="text-sm">
                <div className="font-medium">{format(d, "yyyy.MM.dd")}</div>
                <div className="text-xs text-muted-foreground">{format(d, "EEE")}</div>
              </div>
              <div className="max-w-[55%] flex-shrink-0">{content}</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
