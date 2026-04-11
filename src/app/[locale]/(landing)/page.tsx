"use client";

import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from 'next-intl';

const CREEM_SINGLE_PRODUCT_ID =
  process.env.NEXT_PUBLIC_CREEM_PRODUCT_ID_SINGLE || "prod_28agLy2oWWjgUOe6hHnHKD";

const CREEM_10PACK_PRODUCT_ID =
  process.env.NEXT_PUBLIC_CREEM_PRODUCT_ID_10PACK || "prod_2g1c2h6Qn4x8b2XHQX3E4F";

export default function Home() {
  const t = useTranslations('landing');

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            animaker.dev
          </span>
          <div className="flex items-center gap-6">
            <a href="#pricing" className="text-sm text-gray-400 hover:text-white transition">{t('nav.pricing')}</a>
            <a href="#examples" className="text-sm text-gray-400 hover:text-white transition">{t('nav.examples')}</a>
            <Link href="/sign-in" className="text-sm bg-white text-black px-4 py-2 rounded-full font-medium hover:bg-gray-200 transition">
              {t('nav.getStarted')}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-6 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm">
            {t('hero.badge')}
          </div>
          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
            {t('hero.title')}
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              {t('hero.titleHighlight')}
            </span>
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            {t('hero.description')}
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/create" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3.5 rounded-full font-medium text-lg hover:opacity-90 transition">
              {t('hero.tryNow')}
            </Link>
            <a href="#examples" className="border border-white/20 text-white px-8 py-3.5 rounded-full font-medium text-lg hover:bg-white/5 transition">
              {t('hero.seeExamples')}
            </a>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">{t('howItWorks.title')}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: t('howItWorks.step1.title'), desc: t('howItWorks.step1.desc') },
              { step: "02", title: t('howItWorks.step2.title'), desc: t('howItWorks.step2.desc') },
              { step: "03", title: t('howItWorks.step3.title'), desc: t('howItWorks.step3.desc') },
            ].map((item) => (
              <div key={item.step} className="text-center p-8 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-4xl font-bold text-purple-400 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Examples - Before/After */}
      <section id="examples" className="py-20 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">{t('examples.title')}</h2>
          <p className="text-gray-400 text-center mb-16">{t('examples.subtitle')}</p>

          {/* Desktop: Hover Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { before: "https://pub-6870195e15d044f2944fc59f9ee569df.r2.dev/demos/before1.jpg", after: "https://pub-6870195e15d044f2944fc59f9ee569df.r2.dev/demos/after1.mp4", label: "Coffee Morning" },
              { before: "https://pub-6870195e15d044f2944fc59f9ee569df.r2.dev/demos/before2.jpg", after: "https://pub-6870195e15d044f2944fc59f9ee569df.r2.dev/demos/after2.mp4", label: "Cozy Vibes" },
              { before: "https://pub-6870195e15d044f2944fc59f9ee569df.r2.dev/demos/before3.jpg", after: "https://pub-6870195e15d044f2944fc59f9ee569df.r2.dev/demos/after3.mp4", label: "Study Break" },
            ].map((demo) => (
              <div key={demo.label} className="group">
                <div className="aspect-[9/16] rounded-2xl overflow-hidden relative bg-white/5 border border-white/10">
                  <Image
                    src={demo.before}
                    alt={`${demo.label} - before`}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500 group-hover:opacity-0"
                  />
                  <video
                    src={demo.after}
                    className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full transition-opacity duration-500 group-hover:opacity-0">
                    📷 Before
                  </div>
                  <div className="absolute top-3 left-3 bg-purple-500/80 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                    🎬 After
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <span className="text-sm font-medium">{demo.label}</span>
                  </div>
                </div>
                <p className="text-center text-gray-500 text-xs mt-3">{t('examples.hover')}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">{t('pricing.title')}</h2>
          <p className="text-gray-400 text-center mb-16">{t('pricing.subtitle')}</p>
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {[
              {
                name: t('pricing.single.name'),
                price: t('pricing.single.price'),
                desc: t('pricing.single.desc'),
                features: ["Up to 30s video", "Download & share", "Commercial use"],
                popular: false,
                productId: CREEM_SINGLE_PRODUCT_ID
              },
              {
                name: t('pricing.pack.name'),
                price: t('pricing.pack.price'),
                priceNote: t('pricing.pack.save'),
                desc: t('pricing.pack.desc'),
                features: ["Up to 30s video", "Download & share", "Commercial use", "Priority queue"],
                popular: true,
                productId: CREEM_10PACK_PRODUCT_ID
              },
            ].map((plan) => (
              <div key={plan.name} className={`relative p-8 rounded-2xl border ${plan.popular ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 bg-white/5'}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-xs px-3 py-1 rounded-full">
                    {t('pricing.pack.badge')}
                  </div>
                )}
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.priceNote && <span className="text-sm text-green-400">{plan.priceNote}</span>}
                </div>
                <p className="text-gray-400 text-sm mb-6">{plan.desc}</p>
                <ul className="space-y-2 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                      <span className="text-green-400">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href={`/api/payment/creem/checkout?product=${plan.productId}`} className={`block text-center py-3 rounded-full font-medium transition ${plan.popular ? 'bg-purple-500 text-white hover:bg-purple-600' : 'bg-purple-400/80 text-white hover:bg-purple-400'}`}>
                  Get Credits
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">{t('faq.title')}</h2>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="mb-8 pb-8 border-b border-white/5">
              <h3 className="text-lg font-semibold mb-2">{t(`faq.items.${i}.q`)}</h3>
              <p className="text-gray-400">{t(`faq.items.${i}.a`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <span className="text-sm text-gray-500">{t('footer.copyright')}</span>
          <div className="flex flex-col items-center gap-2 sm:items-end">
            <div className="flex gap-6 text-sm text-gray-500">
              <a href="/terms" className="hover:text-white transition">{t('footer.terms')}</a>
              <a href="/privacy" className="hover:text-white transition">{t('footer.privacy')}</a>
              <a href="mailto:support@animaker.dev" className="hover:text-white transition">{t('footer.contact')}</a>
            </div>
            <span className="text-xs text-gray-600">support@animaker.dev</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
