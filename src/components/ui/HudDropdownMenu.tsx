import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import React from 'react'
import { cn } from '@/lib/utils'

export const HudDropdownMenu = DropdownMenuPrimitive.Root
export const HudDropdownMenuTrigger = DropdownMenuPrimitive.Trigger
export const HudDropdownMenuPortal = DropdownMenuPrimitive.Portal

export interface HudDropdownMenuContentProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> {}

export const HudDropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  HudDropdownMenuContentProps
>(({ className, sideOffset = 4, collisionPadding = 8, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      collisionPadding={collisionPadding}
      className={cn(
        'z-[99995] min-w-[180px] p-1 bg-surface-2/95 backdrop-blur-md',
        'border border-line rounded-card shadow-menu',
        'font-sans text-sm text-ink',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
HudDropdownMenuContent.displayName = 'HudDropdownMenuContent'

export interface HudDropdownMenuItemProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> {
  destructive?: boolean
}

export const HudDropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  HudDropdownMenuItemProps
>(({ className, destructive = false, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      'flex items-center gap-2 min-h-[34px] px-2.5 text-sm cursor-pointer select-none outline-none',
      'transition-colors rounded-control border-none',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
      destructive
        ? 'text-crimson-text data-[highlighted]:bg-crimson-soft'
        : 'text-ink data-[highlighted]:bg-surface-3',
      className
    )}
    {...props}
  />
))
HudDropdownMenuItem.displayName = 'HudDropdownMenuItem'

export const HudDropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn('my-1 h-px bg-line-subtle', className)}
    {...props}
  />
))
HudDropdownMenuSeparator.displayName = 'HudDropdownMenuSeparator'
