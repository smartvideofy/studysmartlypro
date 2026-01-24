import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted/60",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:animate-[shimmer_2s_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
        className
      )}
      {...props}
    />
  );
}

function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/40 bg-card/50 p-5 space-y-4",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3">
        <Skeleton className="w-11 h-11 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

function SkeletonStatCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/40 bg-card/50 p-4 md:p-5",
        className
      )}
      {...props}
    >
      <Skeleton className="w-10 h-10 md:w-11 md:h-11 rounded-xl mb-2 md:mb-3" />
      <Skeleton className="h-6 md:h-7 w-14 md:w-16 mb-1 md:mb-2" />
      <Skeleton className="h-3 md:h-4 w-16 md:w-20" />
    </div>
  );
}

function SkeletonQuickAction({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/40 bg-card/50 p-4 md:p-5 flex flex-col items-center min-h-[100px] md:min-h-[120px]",
        className
      )}
      {...props}
    >
      <Skeleton className="w-12 h-12 md:w-14 md:h-14 rounded-2xl mb-2 md:mb-3" />
      <Skeleton className="h-3 md:h-4 w-16 md:w-20" />
    </div>
  );
}

function SkeletonMaterialItem({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "p-4 rounded-xl bg-secondary/20 space-y-3",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
        <Skeleton className="w-8 h-8 rounded-lg" />
      </div>
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

function SkeletonReviewItem({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 p-3 rounded-xl bg-secondary/20",
        className
      )}
      {...props}
    >
      <Skeleton className="w-10 h-10 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="w-8 h-8 rounded-lg" />
    </div>
  );
}

function SkeletonWelcome({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/40 bg-card/50 p-6 md:p-8 space-y-4",
        className
      )}
      {...props}
    >
      <Skeleton className="h-6 w-28 rounded-full" />
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96 max-w-full" />
      <div className="flex gap-3 pt-2">
        <Skeleton className="h-11 w-36 rounded-xl" />
        <Skeleton className="h-11 w-40 rounded-xl" />
      </div>
    </div>
  );
}

function SkeletonProgressChart({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "grid grid-cols-7 gap-2",
        className
      )}
      {...props}
    >
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          <Skeleton className="w-full h-24 rounded-xl" />
          <Skeleton className="h-3 w-6" />
        </div>
      ))}
    </div>
  );
}

function SkeletonMaterialCard({ className, viewMode = "grid", ...props }: React.HTMLAttributes<HTMLDivElement> & { viewMode?: "grid" | "list" }) {
  if (viewMode === "list") {
    return (
      <div
        className={cn(
          "flex items-center gap-4 p-4 rounded-xl border border-border/40 bg-card/50",
          className
        )}
        {...props}
      >
        <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="w-8 h-8 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-border/40 bg-card/50 overflow-hidden",
        className
      )}
      {...props}
    >
      <div className="h-32 relative">
        <Skeleton className="absolute inset-0 rounded-none" />
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
    </div>
  );
}

function SkeletonDeckCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/40 bg-card/50 overflow-hidden",
        className
      )}
      {...props}
    >
      {/* Top gradient bar */}
      <Skeleton className="h-1 w-full rounded-none" />
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="w-8 h-8 rounded-lg" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center gap-3 pt-2">
          <Skeleton className="h-9 flex-1 rounded-lg" />
          <Skeleton className="h-9 flex-1 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function SkeletonFlashcardStat({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/40 bg-card/50 p-3 md:p-4 flex items-center gap-3",
        className
      )}
      {...props}
    >
      <Skeleton className="w-9 h-9 md:w-10 md:h-10 rounded-xl" />
      <div className="space-y-1.5 md:space-y-2">
        <Skeleton className="h-5 md:h-6 w-10 md:w-12" />
        <Skeleton className="h-3 w-16 md:w-20" />
      </div>
    </div>
  );
}

function SkeletonGroupCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/40 bg-card/50 p-5 space-y-4",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-20 rounded-lg" />
      </div>
    </div>
  );
}

function SkeletonProgressStat({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/40 bg-card/50 p-4 flex items-center gap-3",
        className
      )}
      {...props}
    >
      <Skeleton className="w-10 h-10 rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-12" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

function SkeletonAchievement({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/40 bg-card/50 p-4 space-y-3",
        className
      )}
      {...props}
    >
      <Skeleton className="w-12 h-12 rounded-xl" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-3 w-full" />
    </div>
  );
}

function SkeletonHelpCategory({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/40 bg-card/50 p-4 flex items-center gap-4",
        className
      )}
      {...props}
    >
      <Skeleton className="w-12 h-12 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-40" />
      </div>
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

function SkeletonFlashcardRow({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/40 bg-card/50 p-4 flex items-start gap-4",
        className
      )}
      {...props}
    >
      <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
      <div className="flex-1 grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
      <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
    </div>
  );
}

export { 
  Skeleton, 
  SkeletonCard, 
  SkeletonStatCard, 
  SkeletonQuickAction, 
  SkeletonMaterialItem,
  SkeletonReviewItem,
  SkeletonWelcome,
  SkeletonProgressChart,
  SkeletonMaterialCard,
  SkeletonDeckCard,
  SkeletonFlashcardStat,
  SkeletonGroupCard,
  SkeletonProgressStat,
  SkeletonAchievement,
  SkeletonHelpCategory,
  SkeletonFlashcardRow
};
