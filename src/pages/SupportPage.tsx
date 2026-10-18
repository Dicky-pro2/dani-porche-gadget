import { Mail, MessageCircle, ShoppingBag } from 'lucide-react'
import { Container } from '../components/common/Container'
import { siteConfig } from '../constants/siteConfig'

export function SupportPage() {
  return (
    <>
      <section className="page-hero"><Container><div className="breadcrumb">Home <span>/</span> Support</div><div className="page-heading"><div className="section-kicker">We're here to help</div><h1>Let's talk tech.</h1><p>Have a question about a product, availability, or how to order? Get in touch and the shop can help.</p></div></Container></section>
      <Container><div className="support-grid">
        <article className="support-card"><MessageCircle size={20} /><h3>WhatsApp the shop</h3><p>Ask a product question and confirm current pricing and availability directly.</p><a className="text-link" href="https://wa.me/?text=Hello%2C%20I%27d%20like%20some%20help%20with%20a%20product." target="_blank" rel="noreferrer">START A CONVERSATION ↗</a></article>
        <article className="support-card"><Mail size={20} /><h3>Send an email</h3><p>Contact details shown here are a prototype placeholder and will be replaced before launch.</p><a className="text-link" href={`mailto:${siteConfig.contactEmail}`}>EMAIL THE SHOP ↗</a></article>
        <article className="support-card"><ShoppingBag size={20} /><h3>How ordering works</h3><p>Send an enquiry on WhatsApp. Your order is only confirmed when the shop replies to you directly.</p></article>
      </div></Container>
    </>
  )
}
