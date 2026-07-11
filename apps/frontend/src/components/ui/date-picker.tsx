import { CalendarIcon, X } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/shared/lib/utils";

function parseYmd(value: string): Date | undefined {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;

  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function toYmd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplay(value: string): string {
  const date = parseYmd(value);
  if (!date) return value;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type DatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
};

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  disabled,
  id,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [month, setMonth] = React.useState<Date>(() => new Date());
  const selected = React.useMemo(() => (value ? parseYmd(value) : undefined), [value]);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setMonth(selected ?? new Date());
    }
    setOpen(nextOpen);
  }

  return (
    <div className={cn("relative", className)}>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "h-9 w-full justify-start gap-2 border-input bg-transparent px-3 font-normal shadow-xs dark:bg-input/30",
              !value && "text-muted-foreground",
              value && "pr-9",
            )}
          >
            <CalendarIcon className="size-4 shrink-0 text-indigo-300" />
            <span className="truncate">{value ? formatDisplay(value) : placeholder}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto border-white/10 bg-card/95 p-0 shadow-2xl shadow-black/30"
          align="start"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <Calendar
            mode="single"
            month={month}
            onMonthChange={setMonth}
            selected={selected}
            onSelect={(date) => {
              onChange(date ? toYmd(date) : "");
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>

      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-1/2 right-1.5 size-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={() => onChange("")}
          aria-label="Clear date"
        >
          <X className="size-3.5" />
        </Button>
      ) : null}
    </div>
  );
}
