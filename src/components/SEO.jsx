import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const DEFAULT_TITLE = 'Kisan Mitra - AI-Powered Smart Farming Companion';
const DEFAULT_DESC = 'Empowering Indian farmers with instant AI crop disease diagnosis, regional outbreak radars, meteorological harvest planning, and live APMC mandi prices.';
const SITE_URL = 'https://kisanmitra.in';
const DEFAULT_OG_IMAGE = `${SITE_URL}/hero-landscape.png`;

export default function SEO({
  title,
  description = DEFAULT_DESC,
  canonicalPath,
  image = DEFAULT_OG_IMAGE,
  type = 'website'
}) {
  const location = useLocation();

  useEffect(() => {
    // 1. Document Title
    const formattedTitle = title ? `${title} | Kisan Mitra` : DEFAULT_TITLE;
    document.title = formattedTitle;

    // 2. Meta Helper
    const setMetaTag = (attrName, attrValue, content) => {
      let el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrValue);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // Standard meta tags
    setMetaTag('name', 'description', description);
    setMetaTag('name', 'author', 'Kisan Mitra Agritech');

    // Canonical link
    const currentPath = canonicalPath || location.pathname;
    const fullCanonical = `${SITE_URL}${currentPath === '/' ? '' : currentPath}`;
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute('href', fullCanonical);

    // Open Graph
    setMetaTag('property', 'og:title', formattedTitle);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:url', fullCanonical);
    setMetaTag('property', 'og:type', type);
    setMetaTag('property', 'og:image', image);
    setMetaTag('property', 'og:site_name', 'Kisan Mitra');

    // Twitter Cards
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', formattedTitle);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', image);
  }, [title, description, canonicalPath, image, type, location.pathname]);

  return null;
}
