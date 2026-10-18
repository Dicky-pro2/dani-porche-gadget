import { Link } from 'react-router-dom'
import { Container } from '../components/common/Container'

export function NotFoundPage() {
  return <Container><div className="empty-state not-found"><h1>Page not found</h1><p>Sorry, we couldn't find that page.</p><Link className="button button-primary" to="/">BACK TO HOME</Link></div></Container>
}
