import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

export const SEOHead = ({ 
  title = "SellCount - Gestion TVA Amazon FBA PAN EU", 
  description = "Automatisez votre gestion TVA Amazon FBA avec SellCount. Ventilation automatique par pays et régime : Local, Intracommunautaire, OSS. Conformité EU garantie.",
  keywords = "TVA, Amazon FBA, PAN EU, OSS, ventilation TVA, gestion fiscale, intracommunautaire, e-commerce",
  image = "/lovable-uploads/009eac41-2480-4bc8-8474-44714c138d3f.png",
  url = window.location.href,
  type = "website"
}: SEOHeadProps) => {
  
  useEffect(() => {
    // Set document title
    document.title = title;

    // Set or update meta tags
    const setMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      
      meta.content = content;
    };

    // Basic meta tags
    setMetaTag('description', description);
    setMetaTag('keywords', keywords);
    setMetaTag('robots', 'index, follow');
    setMetaTag('author', 'SellCount');
    setMetaTag('viewport', 'width=device-width, initial-scale=1.0');

    // Open Graph meta tags
    setMetaTag('og:type', type, true);
    setMetaTag('og:title', title, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:image', image, true);
    setMetaTag('og:url', url, true);
    setMetaTag('og:site_name', 'SellCount', true);

    // Twitter Card meta tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', image);

    // Additional meta tags for better SEO
    setMetaTag('language', 'fr-FR');
    setMetaTag('coverage', 'Worldwide');
    setMetaTag('distribution', 'Global');
    setMetaTag('rating', 'General');

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;

  }, [title, description, keywords, image, url, type]);

  return null; // This component doesn't render anything
};

export default SEOHead;