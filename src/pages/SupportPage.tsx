import { Mail, MessageCircle, ShoppingBag } from 'lucide-react'
import { Container } from '../components/common/Container'
import { isContactEmailConfigured, isWhatsAppConfigured, siteConfig } from '../constants/siteConfig'
import { createGeneralWhatsAppUrl } from '../services/whatsappService'

export function SupportPage() {
  return (
    <>
      <section className="page-hero"><Container><div className="breadcrumb">Home <span>/</span> Support</div><div className="page-heading"><div className="section-kicker">We're here to help</div><h1>Let's talk tech.</h1><p>Have a question about a product, availability, or how to order? Get in touch and the shop can help.</p></div></Container></section>
      <Container><div className="support-grid">
        <article className="support-card"><MessageCircle size={20} /><h3>WhatsApp the shop</h3><p>Ask a product question and confirm current pricing and availability directly.</p>
          {isWhatsAppConfigured() && <a className="text-link" href={createGeneralWhatsAppUrl("Hello, I'd like some help with a product.")} target="_blank" rel="noreferrer">START A CONVERSATION ↗</a>}
          {!isWhatsAppConfigured() && import.meta.env.DEV && <button className="text-link contact-disabled" type="button" disabled>WhatsApp number not set</button>}
        </article>
        <article className="support-card"><Mail size={20} /><h3>Send an email</h3><p>Contact the shop for questions about products and ordering.</p>
          {isContactEmailConfigured() && <a className="text-link" href={`mailto:${siteConfig.contactEmail}`}>EMAIL THE SHOP ↗</a>}
          {!isContactEmailConfigured() && import.meta.env.DEV && <button className="text-link contact-disabled" type="button" disabled>Email not set</button>}
        </article>
        <article className="support-card"><ShoppingBag size={20} /><h3>How ordering works</h3><p>WhatsApp is an enquiry and does not confirm an order. Your order is confirmed when the shop replies to you directly.</p></article>
      </div></Container>
    </>
  )
}
