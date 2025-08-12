import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import React, { useState, useEffect } from "react";
import type { Guard } from "./ScheduleBoard";

export default function AssignGuardDialog({
  open,
  onOpenChange,
  guards,
  currentGuardId,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guards: Guard[];
  currentGuardId?: string;
  onSave: (guardId: string | null) => void;
}) {
  const [value, setValue] = useState<string | undefined>(currentGuardId);

  useEffect(() => setValue(currentGuardId), [currentGuardId, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Хамгаалагч сонгох</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={value} onValueChange={setValue}>
            <SelectTrigger>
              <SelectValue placeholder="Хамгаалагч сонгох" />
            </SelectTrigger>
            <SelectContent>
              {guards.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Болих
          </Button>
          <Button variant="destructive" onClick={() => onSave(null)}>
            Хоосон болгох
          </Button>
          <Button onClick={() => onSave(value || null)} disabled={!value}>
            Хадгалах
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
