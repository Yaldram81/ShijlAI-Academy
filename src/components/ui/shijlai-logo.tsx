'use client'

import { cn } from '@/lib/utils'
import Image from 'next/image'

/**
 * ShijlAI Academy — Platform Logo
 *
 * Renders the official logo.png from /public at high quality and high DPI.
 * Uses Next.js <Image> with `unoptimized` to preserve original quality,
 * and explicit width/height for crisp rendering on retina displays.
 *
 * Usage:
 *   <ShijlAILogo />              → default size (36px)
 *   <ShijlAILogo size="sm" />    → 28px
 *   <ShijlAILogo size="lg" />    → 48px
 *   <ShijlAILogo variant="light" />  → (variant preserved for API compat)
 */

interface ShijlAILogoProps {
  /** Size preset */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /** Color variant (preserved for API compatibility — no visual change with raster logo) */
  variant?: 'default' | 'light' | 'monochrome'
  /** Disable animations (preserved for API compatibility) */
  static?: boolean
  /** Additional CSS classes */
  className?: string
}

const sizeMap = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 72,
}

// Render at 3× resolution for crisp high-DPI displays
const DPI_MULTIPLIER = 3

export function ShijlAILogo({
  size = 'md',
  variant = 'default',
  static: _isStatic = false,
  className,
}: ShijlAILogoProps) {
  const px = sizeMap[size]

  // Light variant adds a drop-shadow for visibility on dark/colored backgrounds
  const isLight = variant === 'light'

  return (
    <Image
      src="/logo.png"
      alt="ShijlAI Academy Logo"
      // We provide a large width/height ratio so Next.js Image doesn't constrain it to a square.
      // The actual displayed size is controlled by the style prop below.
      width={px * 5 * DPI_MULTIPLIER} 
      height={px * DPI_MULTIPLIER}
      unoptimized
      priority
      className={cn(
        'shijlai-logo object-contain select-none pointer-events-none',
        isLight && 'drop-shadow-[0_1px_4px_rgba(255,255,255,0.35)] brightness-110',
        className
      )}
      style={{
        height: px,
        width: 'auto', // Allow the logo to maintain its natural horizontal aspect ratio
        minWidth: px, // Ensure it doesn't get too small if it's a square logo
      }}
      draggable={false}
    />
  )
}
