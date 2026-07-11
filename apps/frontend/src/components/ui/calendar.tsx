import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/shared/lib/utils";

function Calendar({ className, classNames, ...props }: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays
      navLayout="around"
      className={cn("p-3", className)}
      classNames={{
        caption_label: "text-sm font-semibold text-foreground",
        weekday: "text-muted-foreground text-xs font-medium uppercase tracking-wide",
        ...classNames,
      }}
      components={{
        Chevron: ({ className, orientation, ...chevronProps }) => {
          const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
          return <Icon className={cn("size-4 text-foreground/80", className)} {...chevronProps} />;
        },
      }}
      {...props}
    />
  );
}

export { Calendar };
