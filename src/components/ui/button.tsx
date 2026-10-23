'use client';

import * as React from 'react';

import { cx } from '../../lib/cx.ts';

// The internal button the pagination renders: a small icon button, either
// borderless (ghost) or outlined. Styled by the rdt-button block.
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant: 'ghost' | 'outline';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, ...props }, ref) => (
    <button
      ref={ref}
      className={cx('rdt-button', `rdt-button--${variant}`, className)}
      {...props}
    />
  )
);
Button.displayName = 'Button';
