'use client';

import * as PopoverPrimitive from '@radix-ui/react-popover';
import { type ComponentPropsWithoutRef, forwardRef } from 'react';

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<typeof PopoverPrimitive.Trigger>
>((props, ref) => <PopoverPrimitive.Trigger ref={ref} {...props} suppressHydrationWarning />);
PopoverTrigger.displayName = PopoverPrimitive.Trigger.displayName;

// Unstyled here: the column panel passes rdt-column-panel, which shares the
// menu surface, so a panel of form controls (which a role="menu" may not
// contain) looks like the menus around it.
const PopoverContent = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={className}
      {...props}
      suppressHydrationWarning
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverContent, PopoverTrigger };
