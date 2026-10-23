'use client';

import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../../lib/shadcn-utils.ts';

const variants = [
  'default',
  'muted',
  'destructive',
  'ghost',
  'outline',
  'input',
  'highlighted',
] as const;
type tVariant = (typeof variants)[number];

const sizes = ['default', 'sm', 'lg'] as const;
type tSize = (typeof sizes)[number];

// `default` and `highlighted` map onto the shadcn theme tokens so every
// variant works with any shadcn-style theme.
const variantDefs: { [i in tVariant]: string } = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80',
  muted: 'bg-muted hover:bg-muted/80 active:bg-muted/60 text-foreground',
  destructive:
    'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80',
  outline:
    'border border-primary bg-background hover:bg-accent hover:border-primary/80 active:bg-accent/80',
  ghost: 'hover:bg-accent active:bg-accent/80',
  input:
    'border border-input bg-background hover:border-input text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2',
  highlighted: 'bg-accent text-accent-foreground hover:bg-accent/90 active:bg-accent/80',
};

const sizeDefs: { [i in tSize]: string } = {
  default: 'h-[40px]',
  sm: 'h-[32px] px-[12px] [&_svg]:w-[20px]',
  lg: 'h-[48px] text-md',
};

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-[10px] px-[16px] whitespace-nowrap rounded-md text-sm text-primary ring-offset-background transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:w-[24px] [&_svg]:shrink-0',
  {
    variants: {
      variant: variantDefs,
      size: sizeDefs,
      shape: {
        normal: '',
        square: 'aspect-square px-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      shape: 'normal',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  square?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, square = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className, shape: square ? 'square' : 'normal' })
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export type { tSize, tVariant };
export { buttonVariants, sizes, variants };

export default Button;
