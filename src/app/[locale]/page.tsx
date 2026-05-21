import { setRequestLocale } from 'next-intl/server';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import Pricing from '@/components/Pricing';
import Testimonials from '@/components/Testimonials';
import FAQ from '@/components/FAQ';
import Contact from '@/components/Contact';
import { SchemaOrg } from '@/components/SchemaOrg';

type Props = {
  params: { locale: string };
};

export default function HomePage({ params }: Props) {
  setRequestLocale(params.locale);
  return (
    <>
      <SchemaOrg />
      <Hero />
      <Features />
      <Testimonials />
      <Pricing />
      <FAQ />
      <Contact />
    </>
  );
}
