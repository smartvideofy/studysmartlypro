import { useEffect } from 'react';

const SITEMAP_URL = 'https://app.getstudily.com/functions/v1/generate-sitemap';

export default function SitemapRedirect() {
  useEffect(() => {
    window.location.replace(SITEMAP_URL);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground">Redirecting to sitemap...</p>
    </div>
  );
}
