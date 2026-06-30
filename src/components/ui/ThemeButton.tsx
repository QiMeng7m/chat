import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ThemeButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ThemeButtonSize = 'sm' | 'md'

export type ThemeButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ThemeButtonVariant
  size?: ThemeButtonSize
  loading?: boolean
  children?: ReactNode
}

function variantClass(variant: ThemeButtonVariant): string {
  switch (variant) {
    case 'secondary':
      return 'btn-secondary'
    case 'ghost':
      return 'btn-ghost'
    case 'danger':
      return 'btn-danger'
    default:
      return 'btn-primary'
  }
}

export default function ThemeButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...rest
}: ThemeButtonProps) {
  const classes = [
    'btn',
    variantClass(variant),
    size === 'sm' ? 'btn-sm' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} className={classes} disabled={disabled || loading} {...rest}>
      {loading ? '处理中…' : children}
    </button>
  )
}
