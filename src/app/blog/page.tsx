import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import { BLOG_POSTS, BLOG_CATEGORIES } from '@/lib/blogPosts';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://busybeds.com';

export const metadata: Metadata = {
  title: 'Travel Guides & Hotel Tips — BusyBeds Blog',
  description: 'Discover the best hotels in East Africa, travel tips, destination guides, and how to save on every hotel stay with BusyBeds exclusive discount coupons.',
  keywords: ['hotel travel guides', 'East Africa hotels', 'hotel deals blog', 'Nairobi hotels', 'Tanzania safari lodges', 'Zanzibar hotels', 'BusyBeds'],
  alternates: { canonical: `${APP_URL}/blog` },
  openGraph: {
    title: 'Travel Guides & Hotel Tips — BusyBeds Blog',
    description: 'Destination guides, hotel tips, and deals across East Africa and beyond.',
    type: 'website',
    url: `${APP_URL}/blog`,
    images: [{ url: BLOG_POSTS[0].coverImage, width: 1200, height: 630, alt: 'BusyBeds Travel Blog' }],
  },
};

// JSON-LD for Blog listing
const blogJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'BusyBeds Travel Blog',
  url: `${APP_URL}/blog`,
  description: 'Hotel discount guides, destination tips, and travel advice for East Africa.',
  publisher: {
    '@type': 'Organization',
    name: 'BusyBeds',
    url: APP_URL,
    logo: { '@type': 'ImageObject', url: `${APP_URL}/logo-dark.svg` },
  },
  blogPost: BLOG_POSTS.map(p => ({
    '@type': 'BlogPosting',
    headline: p.title,
    url: `${APP_URL}/blog/${p.slug}`,
    datePublished: p.publishedAt,
    dateModified: p.updatedAt,
    image: p.coverImage,
    description: p.excerpt,
    author: { '@type': 'Organization', name: p.author },
  })),
};

const sorted = [...BLOG_POSTS].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
const featured = sorted[0];
const rest = sorted.slice(1);

export default function BlogPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }} />
      <div className="min-h-screen" style={{ background: '#F7F8FA' }}>
        <Navbar />

        {/* Hero */}
        <div style={{ background: 'linear-gradient(135deg, #1A3C5E 0%, #0E5C5B 60%, #0E7C7B 100%)' }} className="px-4 py-14">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-white/60 text-sm font-semibold uppercase tracking-widest mb-3">BusyBeds Blog</p>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">
              Travel Guides & Hotel Deals
            </h1>
            <p className="text-white/75 text-base max-w-xl mx-auto">
              Destination guides, insider hotel tips, and how to save on every stay across East Africa and beyond.
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-12">

          {/* Featured post */}
          <Link href={`/blog/${featured.slug}`} className="block mb-12 group">
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="md:flex">
                <div className="md:w-1/2 relative h-64 md:h-auto">
                  <Image src={featured.coverImage} alt={featured.title} fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-xs font-bold text-gray-700 px-3 py-1 rounded-full">
                    ✨ Featured
                  </span>
                </div>
                <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-center">
                  <span className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-2">{featured.category}</span>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 group-hover:text-teal-700 transition-colors leading-snug">
                    {featured.title}
                  </h2>
                  <p className="text-gray-500 text-sm leading-relaxed mb-4">{featured.excerpt}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>{featured.author}</span>
                    <span>·</span>
                    <span>{new Date(featured.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    <span>·</span>
                    <span>{featured.readMinutes} min read</span>
                  </div>
                  <div className="mt-4">
                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-teal-600 group-hover:gap-2.5 transition-all">
                      Read guide
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2 mb-8">
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-900 text-white">All</span>
            {BLOG_CATEGORIES.map(cat => (
              <span key={cat} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-gray-600 border border-gray-200 hover:border-gray-400 cursor-pointer transition-colors">
                {cat}
              </span>
            ))}
          </div>

          {/* Post grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map(post => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
                <article className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all h-full flex flex-col">
                  <div className="relative h-44 overflow-hidden">
                    <Image src={post.coverImage} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <span className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-2">{post.category}</span>
                    <h3 className="font-bold text-gray-900 text-base leading-snug mb-2 group-hover:text-teal-700 transition-colors flex-1">
                      {post.title}
                    </h3>
                    <p className="text-gray-500 text-xs leading-relaxed mb-4 line-clamp-3">{post.excerpt}</p>
                    <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-50">
                      <span>{new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span>{post.readMinutes} min read</span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-16 text-center bg-white rounded-2xl border border-gray-100 p-10">
            <div className="text-4xl mb-4">🏨</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Ready to Save on Your Next Hotel?</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
              Join thousands of travellers saving up to 30% on hotels across East Africa. Get your BusyBeds membership and start unlocking exclusive discount coupons today.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/subscribe" className="px-6 py-3 rounded-xl text-white text-sm font-bold transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #1A3C5E, #0E7C7B)' }}>
                Get Membership
              </Link>
              <Link href="/hotels" className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors">
                Browse Hotels
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
