import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'
import { Link } from 'react-router-dom'

type Props = PropsWithChildren<{
  to?: string
  variant?: 'primary' | 'light' | 'link'
  className?: string
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>['onClick']
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type']
}>

export function Button({ children, to, variant = 'primary', className = '', onClick, type = 'button' }: Props) {
  const classes = `button button-${variant} ${className}`
  return to ? <Link className={classes} to={to}>{children}</Link> : <button className={classes} type={type} onClick={onClick}>{children}</button>
}
