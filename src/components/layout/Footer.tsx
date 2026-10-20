import { Link } from "react-router-dom";
import { routes } from "../../constants/routes";
import { Container } from "../common/Container";
import { BrandLogo } from "../common/BrandLogo";
import {
  isContactEmailConfigured,
  isWhatsAppConfigured,
  siteConfig,
} from "../../constants/siteConfig";
import { createGeneralWhatsAppUrl } from "../../services/whatsappService";

export function Footer() {
  return (
    <footer className="site-footer">
      <Container>
        <div className="footer-grid">
          <div className="footer-brand">
            <BrandLogo />
            <p>
              Thoughtfully selected tech and everyday essentials. Find your next
              favourite thing with us.
            </p>
          </div>
          <div>
            <h2 className="footer-heading">Explore</h2>
            <div className="footer-links">
              <Link to={routes.shop}>Shop all</Link>
              <Link to={routes.categories}>Categories</Link>
              <Link to={routes.about}>Our story</Link>
            </div>
          </div>
          <div>
            <h2 className="footer-heading">Help</h2>
            <div className="footer-links">
              <Link to={routes.support}>Contact & support</Link>
              <Link to={routes.support}>Ordering information</Link>
              <Link to={routes.support}>Privacy & policies</Link>
            </div>
          </div>
          <div>
            <h2 className="footer-heading">Get in touch</h2>
            <div className="footer-links">
              {isContactEmailConfigured() && (
                <a href={`mailto:${siteConfig.contactEmail}`}>
                  Contact the shop
                </a>
              )}
              {!isContactEmailConfigured() && import.meta.env.DEV && (
                <span aria-disabled="true">Email not set</span>
              )}
              {isWhatsAppConfigured() && (
                <a
                  href={createGeneralWhatsAppUrl(
                    "Hello, I'd like to ask about your products.",
                  )}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp enquiry
                </a>
              )}
              {!isWhatsAppConfigured() && import.meta.env.DEV && (
                <span aria-disabled="true">WhatsApp number not set</span>
              )}
              <span>WhatsApp is an enquiry and does not confirm an order.</span>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {siteConfig.name}
          </span>
          <span>
            Current prices and availability are shown on product pages.
          </span>
        </div>
      </Container>
    </footer>
  );
}
