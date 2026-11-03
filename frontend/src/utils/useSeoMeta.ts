import { useEffect } from 'react';

export interface SeoMetaOptions {
  title: string;
  description: string;
  url?: string;
  image?: string;
  type?: 'website' | 'article' | 'profile';
  jsonLd?: Record<string, unknown>;
}

export function useSeoMeta({
  title,
  description,
  url,
  image = '/og-image.png',
  type = 'website',
  jsonLd,
}: SeoMetaOptions) {
  useEffect(() => {
    const originalTitle = document.title;
    document.title = title.includes('MentorOS') ? title : `${title} | MentorOS`;

    const setMetaTag = (attr: 'name' | 'property', key: string, content: string) => {
      let meta = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, key);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    setMetaTag('name', 'description', description);
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:type', type);
    setMetaTag('property', 'og:image', image);
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    if (url) {
      setMetaTag('property', 'og:url', url);
    }

    let scriptEl: HTMLScriptElement | null = null;
    if (jsonLd) {
      scriptEl = document.createElement('script');
      scriptEl.type = 'application/ld+json';
      scriptEl.setAttribute('data-dynamic-seo', 'true');
      scriptEl.text = JSON.stringify(jsonLd);
      document.head.appendChild(scriptEl);
    }

    return () => {
      document.title = originalTitle;
      if (scriptEl && scriptEl.parentNode) {
        scriptEl.parentNode.removeChild(scriptEl);
      }
    };
  }, [title, description, url, image, type, jsonLd]);
}
