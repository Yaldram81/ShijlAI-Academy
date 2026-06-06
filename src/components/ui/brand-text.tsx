'use client'

import { cn } from '@/lib/utils'

/**
 * Renders "ShijlAI Academy" with proper custom fonts:
 * - "Shijl" → Script MT Bold
 * - "AI" → Latin Modern Roman
 * - "Academy" → Latin Modern Roman
 *
 * Usage:
 *   <ShijlAIBrand />                       → "ShijlAI Academy" in brand fonts
 *   <ShijlAIBrand showAcademy={false} />   → "ShijlAI" only
 *   <ShijlAIBrand className="text-2xl" />
 *   <ShijlAIBrand accent="gradient" />     → with emerald gradient on "Shijl"
 */
interface ShijlAIBrandProps {
  /** Whether to show "Academy" after "ShijlAI". Default: true */
  showAcademy?: boolean
  /** Additional CSS classes for the outer wrapper */
  className?: string
  /** Style variant */
  variant?: 'default' | 'gradient' | 'nav' | 'compact' | 'light'
  /** HTML element to render as. Default: 'span' */
  as?: 'span' | 'h1' | 'div' | 'p'
}

export function ShijlAIBrand({
  showAcademy = true,
  className,
  variant = 'default',
  as: Component = 'span',
}: ShijlAIBrandProps) {
  const shijlFont = "[font-family:'ScriptMTBold',cursive]"
  const lmrFont = "[font-family:'LatinModernRoman',serif]"

  const sizeClass = variant === 'nav'
    ? 'text-[15px]'
    : variant === 'compact'
      ? 'text-[13px]'
      : 'text-[17px]'

  const shijlClass = variant === 'gradient'
    ? cn(shijlFont, 'font-bold bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent')
    : variant === 'light'
      ? cn(shijlFont, 'font-bold text-white')
      : cn(shijlFont, 'font-bold text-foreground')

  const aiClass = variant === 'gradient'
    ? cn(lmrFont, 'bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent')
    : variant === 'light'
      ? cn(lmrFont, 'text-white')
      : cn(lmrFont, 'text-foreground')

  const academyClass = variant === 'gradient'
    ? cn(lmrFont, 'text-[11px] font-semibold uppercase tracking-widest text-primary ml-1')
    : variant === 'light'
      ? cn(lmrFont, 'text-[11px] font-semibold uppercase tracking-widest text-white/90 ml-1')
      : cn(lmrFont, 'text-[11px] font-semibold uppercase tracking-widest text-primary ml-1')

  return (
    <Component className={cn('inline-flex items-baseline', sizeClass, className)}>
      <span className={shijlClass}>Shijl</span>
      <span className={aiClass}>AI</span>
      {showAcademy && (
        <span className={academyClass}>Academy</span>
      )}
    </Component>
  )
}

/**
 * Renders "ShijlAI" with proper custom fonts (no "Academy"):
 * - "Shijl" → Script MT Bold
 * - "AI" → Latin Modern Roman
 *
 * Use this for inline text like "Ask ShijlAI", "ShijlAI Hub", etc.
 */
interface ShijlAITextProps {
  /** Additional CSS classes */
  className?: string
  /** Whether to apply gradient styling */
  gradient?: boolean
}

export function ShijlAIText({ className, gradient = false }: ShijlAITextProps) {
  const shijlFont = "[font-family:'ScriptMTBold',cursive]"
  const lmrFont = "[font-family:'LatinModernRoman',serif]"

  const shijlClass = gradient
    ? cn(shijlFont, 'font-bold bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent')
    : cn(shijlFont, 'font-bold text-inherit')

  const aiClass = gradient
    ? cn(lmrFont, 'bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent')
    : cn(lmrFont, 'text-inherit')

  return (
    <span className={cn('inline', className)}>
      <span className={shijlClass}>Shijl</span>
      <span className={aiClass}>AI</span>
    </span>
  )
}
