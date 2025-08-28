import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, CheckCircle, ArrowRight, Star } from "lucide-react";
import SEOHead from "@/components/SEOHead";

const Landing2 = () => {
  const companies = [
    { name: "Transistor", logo: "T" },
    { name: "Tuple", logo: "TU" },
    { name: "StaticKit", logo: "SK" },
    { name: "Mirage", logo: "M" },
    { name: "Laravel", logo: "L" },
    { name: "Statamic", logo: "S" }
  ];

  const features = [
    {
      title: "Payroll",
      description: "Keep track of everyone's salaries and whether or not they've been paid. Direct deposit not supported.",
      icon: "💰"
    },
    {
      title: "Claim expenses",
      description: "All of your receipts organized into one place, as long as you don't mind typing in the data by hand.",
      icon: "📋"
    },
    {
      title: "VAT handling",
      description: "We only sell our software to companies who don't deal with VAT at all, so technically we do all the VAT stuff they need.",
      icon: "📊"
    },
    {
      title: "Reporting",
      description: "Easily export your data into an Excel spreadsheet where you can do whatever the hell you want with it.",
      icon: "📈"
    }
  ];

  const testimonials = [
    {
      name: "Sheryl Berge",
      role: "CEO at Lynch LLC",
      content: "TaxPal is so easy to use I can't help but wonder if it's really doing the things the government expects me to do.",
      rating: 5
    },
    {
      name: "Amy Hahn",
      role: "Director at Velocity Industries", 
      content: "I'm trying to get a hold of someone in support, I'm in a lot of trouble right now and they are saying it has something to do with my books. Please get back to me right away.",
      rating: 5
    },
    {
      name: "Leland Kiehn",
      role: "Founder of Kiehn and Sons",
      content: "The best part about TaxPal is every time I pay my employees, my bank balance doesn't go down like it used to. Looking forward to spending this extra cash when I figure out why my card is being declined.",
      rating: 5
    }
  ];

  const pricing = [
    {
      name: "Starter",
      price: "19",
      description: "Good for anyone who is self-employed and just getting started.",
      features: [
        "Send 10 quotes and invoices",
        "Connect up to 2 bank accounts",
        "Track up to 15 expenses per month",
        "Manual payroll support",
        "Export up to 3 reports"
      ]
    },
    {
      name: "Small business",
      price: "39",
      description: "Perfect for small / medium sized businesses.",
      features: [
        "Send 25 quotes and invoices",
        "Connect up to 5 bank accounts", 
        "Track up to 50 expenses per month",
        "Automated payroll support",
        "Export up to 12 reports",
        "Bulk reconcile transactions",
        "Track in multiple currencies"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "59",
      description: "For even the biggest enterprise companies.",
      features: [
        "Send unlimited quotes and invoices",
        "Connect up to 15 bank accounts",
        "Track up to 200 expenses per month", 
        "Automated payroll support",
        "Export up to 25 reports, including TPS"
      ]
    }
  ];

  return (
    <>
      <SEOHead 
        title="TaxPal - Accounting made simple for small businesses"
        description="Most bookkeeping software is accurate, but hard to use. We make the opposite trade-off, and hope you don't get audited."
        keywords="accounting, bookkeeping, small business, payroll, expenses"
      />
      
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">T</span>
                </div>
                <span className="text-xl font-bold">TaxPal</span>
              </div>
              
              <nav className="hidden md:flex items-center space-x-8">
                <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
                <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
                <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              </nav>
              
              <div className="flex items-center space-x-4">
                <Button variant="ghost">Sign in</Button>
                <Button>Get started today</Button>
              </div>
            </div>
          </div>
        </header>

        <main>
          {/* Hero Section */}
          <section className="py-20 lg:py-32">
            <div className="container mx-auto px-4 text-center">
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-6">
                Accounting{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  made simple
                </span>
                <br />
                for small businesses.
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Most bookkeeping software is accurate, but hard to use. We make the opposite 
                trade-off, and hope you don't get audited.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                <Button size="lg" className="group">
                  Get 6 months free
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button variant="outline" size="lg" className="group">
                  <Play className="mr-2 h-4 w-4" />
                  Watch video
                </Button>
              </div>
              
              {/* Companies */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-8">Trusted by these six companies so far</p>
                <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
                  {companies.map((company) => (
                    <div key={company.name} className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                        <span className="text-xs font-medium">{company.logo}</span>
                      </div>
                      <span className="text-sm font-medium">{company.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="py-20 bg-gradient-subtle">
            <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                  Everything you need to run your books.
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Well everything you need if you aren't that picky about minor details like tax compliance.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {features.map((feature) => (
                  <Card key={feature.title} className="p-6 text-center">
                    <div className="text-4xl mb-4">{feature.icon}</div>
                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Testimonials */}
          <section id="testimonials" className="py-20">
            <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                  Loved by businesses worldwide.
                </h2>
                <p className="text-xl text-muted-foreground">
                  Our software is so simple that people can't help but fall in love with it.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {testimonials.map((testimonial, index) => (
                  <Card key={index} className="p-6">
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4">"{testimonial.content}"</p>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section id="pricing" className="py-20 bg-gradient-subtle">
            <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                  Simple pricing, for everyone.
                </h2>
                <p className="text-xl text-muted-foreground">
                  It doesn't matter what size your business is, our software won't work well for you.
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {pricing.map((plan) => (
                  <Card key={plan.name} className={`p-8 relative ${plan.popular ? 'border-primary shadow-glow' : ''}`}>
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                          Most popular
                        </span>
                      </div>
                    )}
                    
                    <div className="text-center mb-8">
                      <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                      <div className="mb-4">
                        <span className="text-4xl font-bold">${plan.price}</span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                      <p className="text-muted-foreground">{plan.description}</p>
                    </div>
                    
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      className="w-full" 
                      variant={plan.popular ? "default" : "outline"}
                    >
                      Get started
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-20">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Get started today
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                It's time to take control of your books. Buy our software so we can buy more food.
              </p>
              <Button size="lg">
                Get 6 months free
              </Button>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-border py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-2 mb-4 md:mb-0">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">T</span>
                </div>
                <span className="text-xl font-bold">TaxPal</span>
              </div>
              
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <a href="#" className="hover:text-foreground transition-colors">Privacy policy</a>
                <a href="#" className="hover:text-foreground transition-colors">Terms of service</a>
                <a href="/" className="hover:text-foreground transition-colors">← Back to Landing 1</a>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
              <p>&copy; 2024 TaxPal. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Landing2;