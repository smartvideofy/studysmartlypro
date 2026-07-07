import { motion } from "framer-motion";
import { CalendarDays, Clock, Flame, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExamCountdownProps {
  examDate: string | null | undefined;
  className?: string;
}

function daysUntil(date: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

/**
 * Compact urgency badge — shows nothing when the user has no exam date.
 * Ported from the native mobile app so Dashboard parity feels the same.
 */
export function ExamCountdown({ examDate, className }: ExamCountdownProps) {
  const parsed = examDate ? new Date(examDate) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return null;
  const days = daysUntil(parsed);

  let tone: "success" | "warning" | "danger" | "muted" = "success";
  let Icon = CalendarDays;
  let label = "";

  if (days < 0) {
    tone = "muted";
    Icon = CheckCheck;
    const abs = Math.abs(days);
    label = abs === 1 ? "Exam was yesterday" : `Exam was ${abs}d ago`;
  } else if (days === 0) {
    tone = "danger";
    Icon = Flame;
    label = "Exam today";
  } else if (days <= 7) {
    tone = "danger";
    Icon = Flame;
    label = days === 1 ? "Exam tomorrow" : `Exam in ${days}d`;
  } else if (days <= 30) {
    tone = "warning";
    Icon = Clock;
    label = `Exam in ${days}d`;
  } else {
    tone = "success";
    Icon = CalendarDays;
    label = `Exam in ${days}d`;
  }

  const toneClass = {
    success: "bg-success/10 text-success",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    danger: "bg-destructive/10 text-destructive",
    muted: "bg-muted text-muted-foreground",
  }[tone];

  const pulse = days !== null && days >= 0 && days <= 7;

  return (
    <motion.span
      animate={pulse ? { scale: [1, 1.06, 1] } : undefined}
      transition={pulse ? { duration: 1.4, repeat: Infinity } : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        toneClass,
        className,
      )}
      aria-label={label}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </motion.span>
  );
}
