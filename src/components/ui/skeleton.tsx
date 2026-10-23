import { cx } from '../../lib/cx.ts';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('rdt-skeleton', className)} {...props} />;
}
