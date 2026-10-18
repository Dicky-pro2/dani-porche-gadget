import type { ReactNode } from 'react'

type Props = { kicker: string; title: string; description?: string; action?: ReactNode }

export function SectionHeading({ kicker, title, description, action }: Props) {
  return (
    <div className="section-heading">
      <div>
        <div className="section-kicker">{kicker}</div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  )
}
