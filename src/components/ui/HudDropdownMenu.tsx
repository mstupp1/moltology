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
        'z-[99995] min-w-[168px] p-1 bg-[#050a0c]/95 backdrop-blur-md',
        'border border-cyan-900/70 shadow-[0_8px_30px_rgba(0,0,0,0.85),0_0_12px_rgba(0,195,255,0.12)]',
        'font-sans text-xs text-[#dfe3e3] chamfer-corner',
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
      'flex items-center gap-2 px-2.5 py-1.5 text-xs cursor-pointer select-none outline-none',
      'transition-colors rounded-none border-none',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
      destructive
        ? 'text-red-400 data-[highlighted]:bg-red-950/60 data-[highlighted]:text-red-200'
        : 'text-gray-300 data-[highlighted]:bg-cyan-950/60 data-[highlighted]:text-cyan-200',
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
    className={cn('my-1 h-px bg-cyan-900/50', className)}
    {...props}
  />
))
HudDropdownMenuSeparator.displayName = 'HudDropdownMenuSeparator'
