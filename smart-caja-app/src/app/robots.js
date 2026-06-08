export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.cajasmart.com.ar';
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/login',
        '/register',
        '/dashboard',
        '/pos',
        '/inventory',
        '/sales',
        '/branches',
        '/customers',
        '/installments',
        '/shifts',
        '/analytics',
        '/settings',
        '/billing'
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
