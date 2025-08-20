import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import UploadSection from "@/components/UploadSection";
import Pricing from "@/components/Pricing";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const Index = () => {
  return (
    <>
      <SEOHead 
        title="SellCount - Gestion TVA Amazon FBA PAN EU | Conformité Européenne"
        description="Automatisez votre gestion TVA Amazon FBA avec SellCount. Ventilation automatique par pays et régime : Local B2C/B2B, Intracommunautaire, OSS. Conformité EU garantie, gain de temps 90%."
        keywords="TVA Amazon FBA, PAN EU, OSS, ventilation TVA automatique, gestion fiscale e-commerce, intracommunautaire, conformité européenne"
      />
      
      <div className="min-h-screen">
        <Header />
        <main>
          <Hero />
          <div id="features">
            <Features />
          </div>
          <div id="upload">
            <UploadSection />
          </div>
          <div id="pricing">
            <Pricing />
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
