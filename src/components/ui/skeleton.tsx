import { cn } from '../../lib/shadcn-utils.ts';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-stone-200 dark:bg-stone-700', className)}
      {...props}
    />
  );
}
