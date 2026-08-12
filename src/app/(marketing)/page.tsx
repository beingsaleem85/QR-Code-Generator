import { AnalyticsPreview } from "@/components/marketing/AnalyticsPreview";
import { CtaBanner } from "@/components/marketing/CtaBanner";
import { FaqTeaser } from "@/components/marketing/FaqTeaser";
import { FeatureCards } from "@/components/marketing/FeatureCards";
import { GeneratorTeaser } from "@/components/marketing/GeneratorTeaser";
import { Hero } from "@/components/marketing/Hero";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { QrTypeGrid } from "@/components/marketing/QrTypeGrid";
import { StaticVsDynamic } from "@/components/marketing/StaticVsDynamic";
import { TrustStrip } from "@/components/marketing/TrustStrip";
import { UseCases } from "@/components/marketing/UseCases";

export default function Home() {
  return (
    <>
      <Hero />
      <GeneratorTeaser />
      <TrustStrip />
      <StaticVsDynamic />
      <FeatureCards />
      <QrTypeGrid />
      <HowItWorks />
      <UseCases />
      <AnalyticsPreview />
      <FaqTeaser />
      <CtaBanner />
    </>
  );
}
