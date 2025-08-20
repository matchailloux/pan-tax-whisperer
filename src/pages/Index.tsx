import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import UploadSection from "@/components/UploadSection";
import Pricing from "@/components/Pricing";
import Footer from "@/components/Footer";

const Index = () => {
  return (
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
  );
};

export default Index;
