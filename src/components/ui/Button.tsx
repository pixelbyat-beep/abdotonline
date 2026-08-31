import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'solid' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  /** Pill shape (rounded-full) instead of the default rounded-btn corners — used for hero/marketing CTAs. */
  pill?: boolean
  /** Cyan ambient glow shadow, matching the reference design's primary CTA treatment. */
  glow?: boolean
}

const variantClasses: Record<Variant, string> = {
  solid: 'bg-accent text-black hover:bg-accent-dark font-semibold',
  outline: 'border border-border text-text-primary hover:border-accent hover:text-accent bg-transparent',
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated',
  danger: 'bg-danger text-white hover:bg-red-600',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'solid', size = 'md', fullWidth, pill, glow, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
          pill ? 'rounded-full' : 'rounded-btn',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          glow && variant === 'solid' && 'shadow-[0_0_20px_rgba(25,217,242,0.35)] hover:shadow-[0_0_30px_rgba(25,217,242,0.55)]',
          className,
        )}
        {...props}
      >
        {children}
      </button>
    )
  },
)
Button.displayName = 'Button'
