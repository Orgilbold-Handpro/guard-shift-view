import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Site, Guard } from "./ScheduleBoard";

type Props = {
  site: Site;
  days: Date[];
  assignmentsBySiteDate: Map<string, Guard[]>;
  onEditCell: (siteId: string, date: string, guardId?: string) => void;
};

export default function MobileSiteCard({ site, days, assignmentsBySiteDate, onEditCell }: Props) {
  return (
    <Card className="p-4">
      <div className="mb-3">
        <div className="font-medium">{site.name}</div>
      </div>
      <div className="space-y-2">
        {days.map((d) => {
          const dateKey = format(d, "yyyy-MM-dd");
          const isToday = dateKey === format(new Date(), "yyyy-MM-dd");
          const isWeekend = d.getDay() === 0 || d.getDay() === 6;
          const guards = assignmentsBySiteDate.get(`${site.id}_${dateKey}`) || [];

          return (
            <div
              key={dateKey}
              className={cn(
                "flex items-center justify-between border rounded-lg px-3 py-2",
                isToday && "ring-1 ring-primary/20",
                isWeekend && "bg-muted/50"
              )}
            >
              <div className="text-sm">
                <div className="font-medium">{format(d, "yyyy.MM.dd")}</div>
                <div className="text-xs text-muted-foreground">{format(d, "EEE")}</div>
              </div>
              <div className="max-w-[55%] flex-shrink-0">
                <div className="flex flex-col items-end gap-1">
                  {Array.from({ length: site.capacity ?? 1 }).map((_, i) => {
                    const g = guards[i];
                    return g ? (
                      <Button key={g.id} variant="link" size="sm" className="px-0" onClick={() => onEditCell(site.id, dateKey, g.id)} title={g.name}>
                        {g.name}
                      </Button>
                    ) : (
                      <Button key={`empty-${i}`} variant="destructive" size="sm" onClick={() => onEditCell(site.id, dateKey)}>
                        Хоосон
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
