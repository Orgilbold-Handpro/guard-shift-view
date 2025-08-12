import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MobileSiteCard from "./MobileSiteCard";
import AssignGuardDialog from "./AssignGuardDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { CalendarIcon, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { addDays, eachDayOfInterval, format, isWithinInterval } from "date-fns";

// Types
export type Site = { id: string; name: string; tagIndex: number };
export type Guard = { id: string; name: string; phone?: string };
export type AssignmentStatus = "assigned" | "free" | "off" | "leave";
export type Assignment = {
  guardId: string;
  date: string; // YYYY-MM-DD
  status: AssignmentStatus;
  siteId?: string; // present when assigned
};

// Helpers
const toKey = (d: Date) => format(d, "yyyy-MM-dd");

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
  assigned: "bg-[hsl(var(--status-assigned))] text-[hsl(var(--brand-contrast))]",
  free: "bg-[hsl(var(--status-free))] text-[hsl(var(--brand-contrast))]",
  off: "bg-[hsl(var(--status-off))] text-[hsl(var(--foreground))]",
  leave: "bg-[hsl(var(--status-leave))] text-[hsl(var(--brand-contrast))]",
} as const;

// Mock data (in real app fetched from backend)
const SITES: Site[] = [
  { id: "vega1", name: "Вега Сити1", tagIndex: 1 },
  { id: "vega2", name: "Вега Сити2", tagIndex: 2 },
  { id: "хан1", name: "Хан-Хиллс1", tagIndex: 3 },
  { id: "хан2", name: "Хан-Хиллс2", tagIndex: 4 },
  { id: "зайсан", name: "Зайсан", tagIndex: 5 },
  { id: "кристал", name: "Кристал", tagIndex: 6 },
  { id: "aca", name: "ACA", tagIndex: 7 },
];

const GUARDS: Guard[] = [
  { id: "g1", name: "Баярсайхан" },
  { id: "g2", name: "Билгүүн" },
  { id: "g3", name: "Пүрэвсүрэн" },
  { id: "g4", name: "Нямдорж" },
  { id: "g5", name: "Төгс-Эрдэнэ" },
  { id: "g6", name: "Сод-Өлзий" },
  { id: "g7", name: "Амгалан" },
  { id: "g8", name: "Сэргэлэн" },
  { id: "g9", name: "Ганбаатар" },
  { id: "g10", name: "Ариунболд" },
  { id: "g11", name: "Гантулга" },
  { id: "g12", name: "Бехчулун" },
];

function makeMockAssignments(start: Date, end: Date): Assignment[] {
  const days = eachDayOfInterval({ start, end });
  const assignments: Assignment[] = [];
  for (const d of days) {
    for (const guard of GUARDS) {
      const dice = (guard.id.charCodeAt(1) + d.getDate()) % 10;
      if (dice < 2) {
        assignments.push({ guardId: guard.id, date: toKey(d), status: "off" });
      } else if (dice === 9) {
        assignments.push({ guardId: guard.id, date: toKey(d), status: "leave" });
      } else if (dice < 6) {
        const site = SITES[(d.getDate() + parseInt(guard.id.replace("g", ""))) % SITES.length];
        assignments.push({ guardId: guard.id, date: toKey(d), status: "assigned", siteId: site.id });
      } else {
        assignments.push({ guardId: guard.id, date: toKey(d), status: "free" });
      }
    }
  }
  return assignments;
}

export default function ScheduleBoard() {
  const isMobile = useIsMobile();
  const [range, setRange] = useState<{ from: Date; to: Date } | undefined>({
    from: new Date(2025, 7, 12), // Aug is 7 index
    to: new Date(2025, 7, 21),
  });
  const [query, setQuery] = useState("");
const [statusFilter, setStatusFilter] = useState<"all" | "free" | "off">("all");
  const [siteFilter, setSiteFilter] = useState<string>("all");

  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    const start = range?.from ?? new Date();
    const end = range?.to ?? addDays(start, 6);
    return makeMockAssignments(start, end);
  });

  useEffect(() => {
    const start = range?.from ?? new Date();
    const end = range?.to ?? addDays(start, 6);
    setAssignments(makeMockAssignments(start, end));
  }, [range]);

  const days = useMemo(() => {
    const start = range?.from ?? new Date();
    const end = range?.to ?? addDays(start, 6);
    return eachDayOfInterval({ start, end });
  }, [range]);

  const assignmentsByKey = useMemo(() => {
    const map = new Map<string, Assignment>();
    for (const a of assignments) {
      map.set(`${a.guardId}_${a.date}`, a);
    }
    return map;
  }, [assignments]);

  const guardMap = useMemo(() => {
    const m = new Map<string, Guard>();
    for (const g of GUARDS) m.set(g.id, g);
    return m;
  }, []);

  const assignmentsBySiteDate = useMemo(() => {
    const m = new Map<string, Guard[]>();
    for (const a of assignments) {
      if (a.status === "assigned" && a.siteId) {
        const key = `${a.siteId}_${a.date}`;
        const g = guardMap.get(a.guardId);
        if (g) {
          if (!m.has(key)) m.set(key, []);
          m.get(key)!.push(g);
        }
      }
    }
    return m;
  }, [assignments, guardMap]);

  const filteredSites = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = SITES.filter((s) => s.name.toLowerCase().includes(q));

    if (siteFilter !== "all") {
      list = list.filter((s) => s.id === siteFilter);
    }

    return list;
  }, [query, siteFilter]);

  // Editing dialog state
  const [editCell, setEditCell] = useState<{ siteId: string; date: string; guardId?: string } | null>(null);
  const isEditOpen = !!editCell;
  const handleOpenEdit = (siteId: string, date: string, guardId?: string) => setEditCell({ siteId, date, guardId });
  const handleCloseEdit = () => setEditCell(null);
  const handleSaveAssignment = (newGuardId: string | null) => {
    if (!editCell) return;
    const { siteId, date } = editCell;
    setAssignments((prev) => {
      const next = prev.map((a) => ({ ...a }));
      for (const a of next) {
        if (a.date === date && a.status === "assigned" && a.siteId === siteId && a.guardId !== newGuardId) {
          a.status = "free";
          delete a.siteId;
        }
      }
      if (newGuardId) {
        const idx = next.findIndex((a) => a.guardId === newGuardId && a.date === date);
        if (idx >= 0) next[idx] = { ...next[idx], status: "assigned", siteId };
        else next.push({ guardId: newGuardId, date, status: "assigned", siteId });
      }
      return next;
    });
    setEditCell(null);
  };

  // SEO runtime tags
  useEffect(() => {
    document.title = "Ажлын хуваарь • Хамгаалагчид";
    const desc = "Менежерүүд хамгаалагчдын ажлын хуваарь, чөлөөтэй болон амралтын өдрүүдийг хурдан шалгана.";
    const m = document.querySelector('meta[name="description"]');
    if (m) m.setAttribute("content", desc);
    else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content = desc;
      document.head.appendChild(meta);
    }
    const canonicalHref = window.location.origin + "/";
    let link: HTMLLinkElement | null = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = canonicalHref;
  }, []);

  return (
    <section className="w-full space-y-6 animate-fade-in">
      <header className="rounded-xl p-6 border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Хамгаалагчдын ажлын хуваарь</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="size-4" />
                  {range?.from ? (
                    <span>
                      {format(range.from, "yyyy.MM.dd")} – {format(range?.to ?? range.from, "yyyy.MM.dd")}
                    </span>
                  ) : (
                    <span>Хугацаа сонгох</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar mode="range" selected={range as any} onSelect={(r: any) => setRange(r)} numberOfMonths={2} />
              </PopoverContent>
            </Popover>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Өмнөх 7 хоног"
              onClick={() => {
                const start = range?.from ?? new Date();
                setRange({ from: addDays(start, -7), to: addDays(start, -1) });
              }}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                const today = new Date();
                setRange({ from: today, to: addDays(today, 6) });
              }}
            >
              Өнөөдрөөс 7
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Дараах 7 хоног"
              onClick={() => {
                const ref = range?.to ?? new Date();
                setRange({ from: addDays(ref, 1), to: addDays(ref, 7) });
              }}
            >
              <ChevronRight className="size-4" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                <Input className="pl-8 w-48" placeholder="Хотхоны нэрээр хайх" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <Select value={siteFilter} onValueChange={(v) => setSiteFilter(v)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Хотхон" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Бүх хотхон</SelectItem>
                  {SITES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <TabsList>
              <TabsTrigger value="all">Бүгд</TabsTrigger>
              <TabsTrigger value="free">Чөлөөтэй</TabsTrigger>
              <TabsTrigger value="off">Амралт</TabsTrigger>
              
            </TabsList>
          </Tabs>
        </div>
      </header>

      {/* Content */}
      {isMobile ? (
        <div className="space-y-3">
          {filteredSites.map((s) => (
            <MobileSiteCard key={s.id} site={s} days={days} assignmentsBySiteDate={assignmentsBySiteDate} onEditCell={handleOpenEdit} />
          ))}
        </div>
      ) : (
        <Card className="overflow-auto">
          <div className="min-w-[900px]">
            <div className="grid" style={{ gridTemplateColumns: `240px repeat(${days.length}, minmax(120px, 1fr))` }}>
              {/* Header row */}
              <div className="sticky left-0 top-0 z-20 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b p-3 font-medium">Хотхон</div>
              {days.map((d) => {
                const isToday = toKey(d) === toKey(new Date());
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                const dayKey = toKey(d);
                return (
                  <div
                    key={dayKey}
                    className={cn(
                      "sticky top-0 z-10 border-b p-3 text-sm font-medium text-muted-foreground bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60",
                      isWeekend && "bg-muted/50",
                      isToday && "ring-1 ring-primary/20"
                    )}
                  >
                    <div>{format(d, "yyyy.MM.dd")}</div>
                    <div className="text-xs">{format(d, "EEE", { locale: undefined })}</div>
                  </div>
                );
              })}

              {/* Rows */}
              {filteredSites.map((s, idx) => (
                <SiteRow key={s.id} idx={idx + 1} site={s} days={days} assignmentsBySiteDate={assignmentsBySiteDate} onEditCell={handleOpenEdit} />
              ))}
            </div>
          </div>
        </Card>
      )}

      <AssignGuardDialog
        open={isEditOpen}
        onOpenChange={(o) => (o ? null : handleCloseEdit())}
        guards={GUARDS}
        currentGuardId={editCell?.guardId}
        onSave={handleSaveAssignment}
      />
    </section>
  );
}


function SiteRow({
  idx,
  site,
  days,
  assignmentsBySiteDate,
  onEditCell,
}: {
  idx: number;
  site: Site;
  days: Date[];
  assignmentsBySiteDate: Map<string, Guard[]>;
  onEditCell: (siteId: string, date: string, guardId?: string) => void;
}) {
  return (
    <>
      <div className={cn("sticky left-0 z-10 border-r p-3 font-medium bg-background")}> 
        <div className="truncate">
          <span className="text-muted-foreground mr-2 tabular-nums">{idx}.</span>
          {site.name}
        </div>
      </div>
      {days.map((d) => {
        const key = `${site.id}_${toKey(d)}`;
        const guards = assignmentsBySiteDate.get(key) || [];
        const isToday = toKey(d) === toKey(new Date());
        let content: React.ReactNode = (
          <Button variant="destructive" size="sm" onClick={() => onEditCell(site.id, toKey(d))}>
            Хоосон
          </Button>
        );
        if (guards.length > 0) {
          content = (
            <div className="flex flex-col items-center gap-1">
              {guards.map((g) => (
                <Button key={g.id} variant="link" size="sm" className="px-0" onClick={() => onEditCell(site.id, toKey(d), g.id)} title={g.name}>
                  {g.name}
                </Button>
              ))}
            </div>
          );
        }
        return (
          <div
            key={key}
            className={cn(
              "border-b p-2 min-h-[44px] flex items-center justify-center transition-colors",
              "hover:bg-accent/30",
              isToday && "ring-1 ring-primary/10"
            )}
          >
            {content}
          </div>
        );
      })}
    </>
  );
}
