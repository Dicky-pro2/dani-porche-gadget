import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { siteConfig, siteOrigin } from "../../constants/siteConfig";
import { useProduct } from "../../hooks/useProduct";

const defaultDescription =
  "Thoughtfully selected smartphones, gadgets, and everyday tech from Dani Porshe Gadget.";

function setMeta(attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(
    `meta[${attribute}="${key}"]`,
  );
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.append(element);
  }
  element.content = content;
}

export function RouteMetadata() {
  const { pathname } = useLocation();
  const productMatch = pathname.match(/^\/products\/([^/]+)$/);
  const productSlug = productMatch ? decodeURIComponent(productMatch[1]) : "";
  const { product } = useProduct(productSlug);

  useEffect(() => {
    const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
    const isPrivateStorePage = [
      "/cart",
      "/checkout",
      "/order/confirmation",
    ].includes(pathname);
    const pages: Record<string, { title: string; description: string }> = {
      "/": { title: "Tech that moves you", description: defaultDescription },
      "/shop": {
        title: "Shop electronics & gadgets",
        description:
          "Browse smartphones, audio, laptops, smartwatches, and accessories from Dani Porshe Gadget.",
      },
      "/cart": {
        title: "Your shopping cart",
        description: "Review your selected products before secure checkout.",
      },
      "/checkout": {
        title: "Secure checkout",
        description:
          "Enter delivery details and complete payment securely through Paystack.",
      },
      "/order/confirmation": {
        title: "Order status",
        description:
          "Check the verified payment status and details for your order.",
      },
      "/about": {
        title: "About us",
        description:
          "Learn about Dani Porshe Gadget and our thoughtful approach to choosing everyday technology.",
      },
      "/support": {
        title: "Support & contact",
        description:
          "Contact Dani Porshe Gadget with product questions or order support.",
      },
    };
    const page = isAdmin
      ? {
          title: "Admin",
          description: "Store administration for Dani Porshe Gadget.",
        }
      : product
        ? { title: product.name, description: product.description }
        : (pages[pathname] ?? {
            title: "Page not found",
            description:
              "The requested Dani Porshe Gadget page could not be found.",
          });
    const title = `${page.title} | ${siteConfig.name}`;
    const canonicalPath = product ? `/products/${product.slug}` : pathname;
    const canonicalUrl = `${siteOrigin}${canonicalPath}`;

    document.title = title;
    setMeta("name", "description", page.description);
    setMeta(
      "name",
      "robots",
      isAdmin || isPrivateStorePage ? "noindex, nofollow" : "index, follow",
    );
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", page.description);
    setMeta("property", "og:url", canonicalUrl);
    setMeta("property", "og:image", `${siteOrigin}/apple-touch-icon.png`);
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", page.description);

    let canonical = document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.append(canonical);
    }
    canonical.href = canonicalUrl;
  }, [pathname, product]);

  return null;
}
