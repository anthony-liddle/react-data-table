'use client';

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { type ComponentPropsWithoutRef, type ComponentRef, forwardRef } from 'react';

import { cx } from '../../lib/cx.ts';
import { Check } from '../icon.tsx';

const CheckboxRoot = CheckboxPrimitive.Root;
const CheckboxIndicator = CheckboxPrimitive.Indicator;

const Checkbox = forwardRef<
  ComponentRef<typeof CheckboxPrimitive.Root>,
  ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxRoot ref={ref} className={cx('rdt-checkbox', className)} {...props}>
    <CheckboxIndicator className="rdt-checkbox__indicator">
      <Check className="rdt-checkbox__icon" />
    </CheckboxIndicator>
  </CheckboxRoot>
));

Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
