import { Link } from 'react-router-dom'
import { Container } from '../components/common/Container'

export function NotFoundPage() {
  return <Container><div className="empty-state" style={{ margin: '70px auto' }}><h1 style={{ font: '700 30px var(--font-display)', color: '#243b2b' }}>Page not found</h1><p>Sorry, we couldn't find that page.</p><Link className="button button-primary" style={{ marginTop: 18 }} to="/">BACK TO HOME</Link></div></Container>
}
