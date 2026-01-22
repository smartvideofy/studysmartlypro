const SITE_URL = "https://studysmartlypro.lovable.app";

interface ArticleJsonLdProps {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified: string;
  author?: string;
  image?: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

export const createArticleJsonLd = ({
  title,
  description,
  url,
  datePublished,
  dateModified,
  author = "Studily Team",
  image,
}: ArticleJsonLdProps) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  headline: title,
  description: description,
  image: image || `${SITE_URL}/og-image.png`,
  author: {
    "@type": "Organization",
    name: author,
    url: SITE_URL,
  },
  publisher: {
    "@type": "Organization",
    name: "Studily",
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/favicon.png`,
    },
  },
  datePublished,
  dateModified,
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": `${SITE_URL}${url}`,
  },
});

export const createFAQPageJsonLd = (faqs: FAQItem[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
});

export const createBreadcrumbJsonLd = (items: BreadcrumbItem[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: `${SITE_URL}${item.url}`,
  })),
});

export const createOrganizationJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Studily",
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.png`,
  description: "AI-powered study companion for flashcards, notes, and smart learning tools.",
  sameAs: [
    "https://twitter.com/studily",
  ],
});

export const createWebSiteJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Studily",
  url: SITE_URL,
  description: "AI-powered study companion for flashcards, notes, and smart learning tools.",
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/help?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
});

export const createHelpCenterJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Help Center",
  description: "Get help with Studily - search our knowledge base, browse FAQs, or contact support.",
  url: `${SITE_URL}/help`,
  isPartOf: {
    "@type": "WebSite",
    name: "Studily",
    url: SITE_URL,
  },
});
