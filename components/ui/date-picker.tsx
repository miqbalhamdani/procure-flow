"use client";

import { format } from "date-fns";
import { IconCalendarMonth } from "@tabler/icons-react";
import { useState } from "react";

import { Button } from "@/components/shadcn-ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn-ui/popover";
import { cn } from "@/lib/utils";

import { Calendar } from "./calendar";

function parseDateValue(value?: string | null) {
  if (!value) return undefined;

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;

  return new Date(year, month - 1, day);
}

function formatDateValue(date?: Date) {
  return date ? format(date, "yyyy-MM-dd") : "";
}

interface DatePickerProps {
  id: string;
  value?: string | null;
  onChange: (value: string) => void;
  hasError?: boolean;
  errorId?: string;
  placeholder?: string;
  clearLabel?: string;
  disabled?: boolean;
  triggerClassName?: string;
}

export function DatePicker({
  id,
  value,
  onChange,
  hasError = false,
  errorId,
  placeholder = "Pick a date",
  clearLabel = "Clear date",
  disabled = false,
  triggerClassName,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selectedDate = parseDateValue(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : undefined}
          data-empty={!value}
          className={cn(
            "w-full justify-start text-left font-normal data-[empty=true]:text-muted-foreground",
            hasError && "ring-error/40 focus-visible:ring-error/40",
            triggerClassName,
          )}
        >
          <IconCalendarMonth data-icon="inline-start" />
          {selectedDate ? format(selectedDate, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          captionLayout="dropdown"
          selected={selectedDate}
          defaultMonth={selectedDate}
          autoFocus
          onSelect={(date) => {
            onChange(formatDateValue(date));
            setOpen(false);
          }}
        />
        {value && (
          <div className="px-3 pb-3">
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              disabled={disabled}
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              {clearLabel}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
