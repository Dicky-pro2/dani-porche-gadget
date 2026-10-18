import { Headphones, PackageCheck, Sparkles } from 'lucide-react'
import { Container } from '../common/Container'

const reasons = [
  { icon: Sparkles, title: 'Thoughtful selection', text: 'A considered range of useful devices and accessories for everyday life.' },
  { icon: Headphones, title: 'Here to help', text: 'Get in touch to ask questions and find the right option for your needs.' },
  { icon: PackageCheck, title: 'Easy to enquire', text: 'Start a conversation on WhatsApp. The shop will confirm details with you directly.' },
]

export function TrustSection() {
  return (
    <section className="section">
      <Container>
        <div className="section-heading"><div><div className="section-kicker">A better way to shop tech</div><h2>Helpful, from hello.</h2></div></div>
        <div className="trust-grid">{reasons.map(({ icon: Icon, title, text }) => <article className="trust-card" key={title}><div className="trust-icon"><Icon size={18} /></div><h3>{title}</h3><p>{text}</p></article>)}</div>
      </Container>
    </section>
  )
}
