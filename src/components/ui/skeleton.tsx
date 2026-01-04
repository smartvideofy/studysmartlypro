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
        "rounded-xl border border-border/40 bg-card/50 p-5",
        className
      )}
      {...props}
    >
      <Skeleton className="w-11 h-11 rounded-xl mb-3" />
      <Skeleton className="h-7 w-16 mb-2" />
      <Skeleton className="h-4 w-20" />
    </div>
  );
}

function SkeletonQuickAction({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/40 bg-card/50 p-5 flex flex-col items-center",
        className
      )}
      {...props}
    >
      <Skeleton className="w-14 h-14 rounded-2xl mb-3" />
      <Skeleton className="h-4 w-20" />
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

export { 
  Skeleton, 
  SkeletonCard, 
  SkeletonStatCard, 
  SkeletonQuickAction, 
  SkeletonMaterialItem,
  SkeletonReviewItem,
  SkeletonWelcome,
  SkeletonProgressChart
};
