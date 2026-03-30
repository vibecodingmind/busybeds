import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import prisma from '@/lib/prisma';
import { getBlogPost, getRecentPosts, BLOG_POSTS } from '@/lib/blogPosts';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://busybeds.com';

interface Props { params: { slug: string } }

export async function generateStaticParams() {
  return BLOG_POSTS.map(p => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getBlogPost(params.slug);
  if (!post) return { title: 'Not Found — BusyBeds' };
  return {
    title: `${post.title} | BusyBeds Blog`,
    description: post.excerpt,
    keywords: post.tags,
    authors: [{ name: post.author }],
    alternates: { canonical: `${APP_URL}/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      url: `${APP_URL}/blog/${post.slug}`,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author],
      tags: post.tags,
      images: [{ url: post.coverImage, width: 1200, height: 630, alt: post.title }],
      siteName: 'BusyBeds',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const post = getBlogPost(params.slug);
  if (!post) notFound();

  const recent = getRecentPosts(4).filter(p => p.slug !== post.slug).slice(0, 3);

  // Fetch related hotels from DB if post has a city/country
  let relatedHotels: Array<{ name: string; slug: string; city: string; discountPercent: number; coverImage: string | null }> = [];
  if (post.relatedCity || post.relatedCountry) {
    relatedHotels = await prisma.hotel.findMany({
      where: {
        status: 'active',
        ...(post.relatedCity ? { city: { contains: post.relatedCity, mode: 'insensitive' } } : {}),
        ...(post.relatedCountry ? { country: { contains: post.relatedCountry, mode: 'insensitive' } } : {}),
      },
      select: { name: true, slug: true, city: true, discountPercent: true, coverImage: true },
      orderBy: [{ isFeatured: 'desc' }, { avgRating: 'desc' }],
      take: 4,
    }).catch(() => []);
  }

  // JSON-LD BlogPosting structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage,
    url: `${APP_URL}/blog/${post.slug}`,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { '@type': 'Organization', name: post.author, url: APP_URL },
    publisher: {
      '@type': 'Organization',
      name: 'BusyBeds',
      url: APP_URL,
      logo: { '@type': 'ImageObject', url: `${APP_URL}/logo-dark.svg` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${APP_URL}/blog/${post.slug}` },
    keywords: post.tags.join(', '),
    articleSection: post.category,
    wordCount: post.content.replace(/<[^>]+>/g, '').split(/\s+/).length,
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: APP_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${APP_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: `${APP_URL}/blog/${post.slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div className="min-h-screen" style={{ background: '#F7F8FA' }}>
        <Navbar />

        {/* Hero image */}
        <div className="relative h-72 sm:h-96 w-full">
          <Image src={post.coverImage} alt={post.title} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/70" />
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-8 max-w-3xl mx-auto">
            <nav className="flex items-center gap-2 text-white/70 text-xs mb-3">
              <Link href="/" className="hover:text-white">Home</Link>
              <span>/</span>
              <Link href="/blog" className="hover:text-white">Blog</Link>
              <span>/</span>
              <span className="text-white/50 truncate">{post.title}</span>
            </nav>
            <span className="inline-block text-xs font-bold text-teal-300 uppercase tracking-wider mb-2">{post.category}</span>
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">{post.title}</h1>
          </div>
        </div>

        {/* Meta bar */}
        <div className="bg-white border-b border-gray-100 px-4 py-3">
          <div className="max-w-3xl mx-auto flex flex-wrap items-center gap-4 text-xs text-gray-500">
            <span className="font-semibold text-gray-700">{post.author}</span>
            <span>·</span>
            <span>{new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            <span>·</span>
            <span>{post.readMinutes} min read</span>
            <div className="flex flex-wrap gap-1.5 ml-auto">
              {post.tags.slice(0, 3).map(tag => (
                <span key={tag} className="px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">{tag}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Article content */}
          <article className="lg:col-span-2">
            <p className="text-gray-600 text-base leading-relaxed mb-6 font-medium border-l-4 border-teal-500 pl-4">{post.excerpt}</p>
            <div
              className="prose prose-gray max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-h2:text-xl prose-h2:mt-8 prose-h3:text-lg prose-h3:mt-6 prose-p:leading-relaxed prose-p:text-gray-600 prose-li:text-gray-600 prose-strong:text-gray-800"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Tags */}
            <div className="mt-10 pt-6 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Tags</p>
              <div className="flex flex-wrap gap-2">
                {post.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600 font-medium">{tag}</span>
                ))}
              </div>
            </div>

            {/* Social share */}
            <div className="mt-8 p-5 bg-white rounded-2xl border border-gray-100">
              <p className="text-sm font-bold text-gray-700 mb-3">Share this guide</p>
              <div className="flex flex-wrap gap-2">
                <a href={`https://wa.me/?text=${encodeURIComponent(post.title + ' ' + APP_URL + '/blog/' + post.slug)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white text-xs font-semibold rounded-xl hover:bg-green-600 transition-colors">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </a>
                <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(APP_URL + '/blog/' + post.slug)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-black text-white text-xs font-semibold rounded-xl hover:bg-gray-800 transition-colors">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.738l7.726-8.83L1.254 2.25H8.08l4.261 5.636zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  Twitter/X
                </a>
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(APP_URL + '/blog/' + post.slug)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  Facebook
                </a>
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="space-y-6">

            {/* Related hotels CTA */}
            {relatedHotels.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-5 pt-5 pb-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Hotels in {post.relatedCity || post.relatedCountry}
                  </p>
                  <div className="space-y-3">
                    {relatedHotels.map(h => (
                      <Link key={h.slug} href={`/hotels/${h.slug}`}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                          {h.coverImage
                            ? <img src={h.coverImage} alt={h.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-lg">🏨</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-teal-700">{h.name}</p>
                          <p className="text-xs text-green-600 font-bold">{h.discountPercent}% off</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="px-5 pb-5">
                  <Link href={`/locations/${(post.relatedCountry || '').toLowerCase().replace(/\s+/g,'-')}${post.relatedCity ? '/' + post.relatedCity.toLowerCase().replace(/\s+/g,'-') : ''}`}
                    className="block w-full text-center py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #1A3C5E, #0E7C7B)' }}>
                    View All Hotels →
                  </Link>
                </div>
              </div>
            )}

            {/* Membership CTA */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
              <div className="text-3xl mb-3">🎫</div>
              <h3 className="font-bold text-gray-900 text-sm mb-2">Get Exclusive Hotel Discounts</h3>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Join BusyBeds and save up to 30% on hotels across East Africa with verified discount coupons.
              </p>
              <Link href="/subscribe"
                className="block py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #1A3C5E, #0E7C7B)' }}>
                Get Membership
              </Link>
            </div>

            {/* Recent posts */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">More Guides</p>
              <div className="space-y-4">
                {recent.map(p => (
                  <Link key={p.slug} href={`/blog/${p.slug}`} className="flex gap-3 group">
                    <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0">
                      <img src={p.coverImage} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-800 leading-snug group-hover:text-teal-700 transition-colors line-clamp-2">{p.title}</p>
                      <p className="text-xs text-gray-400 mt-1">{p.readMinutes} min read</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

          </aside>
        </div>
      </div>
    </>
  );
}
