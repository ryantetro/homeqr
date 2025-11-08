import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import AnimatedSection from '@/components/layout/AnimatedSection';
import AnimatedText from '@/components/layout/AnimatedText';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Two Column Layout */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden pt-4 pb-24">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f8f9fa_1px,transparent_1px),linear-gradient(to_bottom,#f8f9fa_1px,transparent_1px)] bg-size-[4rem_4rem] opacity-30" />
        
        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-7xl mx-auto">
            {/* Left Column - Content */}
            <div className="space-y-8 lg:space-y-10">
              {/* Headline */}
              <AnimatedText delay={100}>
                <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-6xl font-bold text-gray-900 leading-[1.1] tracking-tight">
                  Turn every sign into a{' '}
                  <span className="text-blue-600">qualified lead</span>
                </h1>
              </AnimatedText>

              {/* Description */}
              <AnimatedText delay={300}>
                <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-xl">
                  Generate QR codes for your property listings and track every scan, conversion, and lead. 
                  See which properties perform best and turn more signs into sales.
                </p>
              </AnimatedText>

              {/* CTA Buttons */}
              <AnimatedText delay={500}>
                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <Link href="/auth/signup">
                    <Button 
                      size="lg" 
                      variant="primary" 
                      className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                      Get started
                    </Button>
                  </Link>
                  <Link href="https://chrome.google.com/webstore">
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="w-full sm:w-auto px-8 py-3.5 rounded-full border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 font-semibold transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                      Install Extension →
                    </Button>
                  </Link>
                </div>
              </AnimatedText>
            </div>

            {/* Right Column - Dashboard Preview */}
            <AnimatedText delay={400} className="relative hidden lg:block">
              <div className="relative rounded-xl shadow-xl border border-gray-200 overflow-hidden bg-white transform scale-90 transition-transform duration-700 hover:scale-95">
                {/* Browser chrome */}
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 bg-white rounded-md px-3 py-1.5 text-[10px] text-gray-500 text-center mx-4 font-medium">
                    dashboard.homeqr.app
                  </div>
                </div>
                
                {/* Dashboard content */}
                <div className="p-6 bg-white">
                  <div className="space-y-4">
                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 transition-transform duration-300 hover:scale-105">
                        <p className="text-[10px] font-medium text-blue-600 mb-1.5 uppercase tracking-wide">Listings</p>
                        <p className="text-2xl font-bold text-blue-900">12</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4 border border-green-100 transition-transform duration-300 hover:scale-105">
                        <p className="text-[10px] font-medium text-green-600 mb-1.5 uppercase tracking-wide">Scans</p>
                        <p className="text-2xl font-bold text-green-900">1.2k</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4 border border-purple-100 transition-transform duration-300 hover:scale-105">
                        <p className="text-[10px] font-medium text-purple-600 mb-1.5 uppercase tracking-wide">Leads</p>
                        <p className="text-2xl font-bold text-purple-900">47</p>
                      </div>
                    </div>

                    {/* Listing card */}
                    <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm mb-1">123 Main Street</h3>
                          <p className="text-xs text-gray-500">Salt Lake City, UT</p>
                        </div>
                        <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Active</span>
                      </div>
                      <div className="h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                        <span className="text-[10px] text-gray-400 font-medium">Property Image</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            <span>📱</span>
                            <span className="font-medium">124 scans</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span>👥</span>
                            <span className="font-medium">8 leads</span>
                          </span>
                        </div>
                        <div className="w-16 h-16 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                          <span className="text-[10px] text-gray-400 font-medium">QR</span>
                        </div>
                      </div>
                    </div>

                    {/* Chart placeholder */}
                    <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                      <p className="text-xs font-semibold text-gray-700 mb-3">Analytics Overview</p>
                      <div className="h-20 bg-gray-50 rounded-lg flex items-end justify-around gap-1.5 px-2">
                        {[40, 60, 45, 80, 55, 70, 65].map((height, i) => (
                          <div
                            key={i}
                            className="bg-blue-500 rounded-t flex-1 transition-all duration-500 hover:bg-blue-600"
                            style={{ height: `${height}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative gradient blob */}
              <div className="absolute -z-10 -right-20 -top-20 w-[400px] h-[400px] bg-blue-100 rounded-full blur-3xl opacity-20 animate-pulse" />
            </AnimatedText>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-32 px-6 sm:px-8 lg:px-12 xl:px-16 bg-white">
        <div className="container mx-auto max-w-7xl">
          <AnimatedSection className="text-center mb-20 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              Get started in minutes and start capturing leads today
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: '1',
                title: 'Install Extension',
                desc: 'Add the HomeQR Chrome extension to your browser in seconds',
                icon: '🔌',
              },
              {
                step: '2',
                title: 'Generate QR Code',
                desc: 'Visit any Zillow listing and click to generate your QR code instantly',
                icon: '📱',
              },
              {
                step: '3',
                title: 'Print & Display',
                desc: 'Download and print your QR code sticker for yard signs and flyers',
                icon: '🖨️',
              },
              {
                step: '4',
                title: 'Track & Convert',
                desc: 'Monitor scans, capture leads, and see conversion rates in your dashboard',
                icon: '📊',
              },
            ].map((item, index) => (
              <AnimatedSection key={index} delay={index * 100}>
                <Card className="border-gray-200 bg-white hover:shadow-xl transition-all duration-300 text-center">
                  <CardHeader className="pb-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">{item.icon}</span>
                    </div>
                    <div className="text-sm font-semibold text-blue-600 mb-2">Step {item.step}</div>
                    <CardTitle className="text-xl font-semibold mb-3">{item.title}</CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      {item.desc}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 sm:px-8 lg:px-12 xl:px-16 bg-gray-50">
        <div className="container mx-auto max-w-7xl">
          <AnimatedSection className="text-center mb-20 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
              Everything you need to capture more leads
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              Powerful tools designed specifically for real estate professionals
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: '🔗', title: 'Instant QR Generation', desc: 'Create QR codes directly from Zillow listings with our Chrome extension. No manual data entry required.', bgClass: 'bg-blue-100' },
              { icon: '📱', title: 'Smart Lead Capture', desc: 'Each QR scan leads to a conversion-optimized property page with instant contact forms to capture buyer info.', bgClass: 'bg-green-100' },
              { icon: '📊', title: 'Conversion Analytics', desc: 'Track conversion rates, device types, time-of-day patterns, and see which properties generate the most leads.', bgClass: 'bg-purple-100' },
              { icon: '📄', title: 'Printable QR Stickers', desc: 'Download print-ready QR code stickers for yard signs, flyers, and open house materials.', bgClass: 'bg-orange-100' },
              { icon: '🔔', title: 'Instant Notifications', desc: 'Get notified immediately when leads come in so you can respond while interest is highest.', bgClass: 'bg-red-100' },
              { icon: '👥', title: 'Lead Management', desc: 'Organize, filter, and track leads with status management. Export to CSV for your CRM.', bgClass: 'bg-indigo-100' },
            ].map((feature, index) => (
              <AnimatedSection key={index} delay={index * 100}>
                <Card className="border-gray-200 bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                  <CardHeader className="pb-4">
                    <div className={`w-14 h-14 ${feature.bgClass} rounded-xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110`}>
                      <span className="text-3xl">{feature.icon}</span>
                    </div>
                    <CardTitle className="text-xl font-semibold mb-3">{feature.title}</CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.desc}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6 sm:px-8 lg:px-12 xl:px-16 bg-white">
        <div className="container mx-auto max-w-6xl">
          <AnimatedSection className="text-center mb-20 max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">Choose the plan that fits your business</p>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Starter', price: '$29', features: ['Up to 10 listings', '500 QR scans/month', 'Basic analytics'], popular: false },
              { name: 'Pro', price: '$79', features: ['Unlimited listings', 'Unlimited scans', 'Custom branding', 'Lead export + automation'], popular: true },
              { name: 'Team', price: '$299', features: ['Up to 10 agents', 'Shared analytics', 'Priority support'], popular: false },
            ].map((plan, index) => (
              <AnimatedSection key={index} delay={index * 150}>
                <Card className={`${plan.popular ? 'border-2 border-blue-600 bg-blue-50/30 relative shadow-lg' : 'border-gray-200 bg-white hover:shadow-lg'} transition-all duration-300 hover:-translate-y-1`}>
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-bl-xl uppercase tracking-wide">
                      Popular
                    </div>
                  )}
                  <CardHeader className={`pb-6 ${plan.popular ? 'pt-8' : ''}`}>
                    <CardTitle className="text-2xl font-semibold mb-6">{plan.name}</CardTitle>
                    <div className="mb-8">
                      <span className={`text-5xl font-bold ${plan.popular ? 'text-blue-600' : 'text-gray-900'}`}>{plan.price}</span>
                      <span className="text-xl text-gray-600 ml-2">/mo</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-4 text-base text-gray-700 mb-8">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <span className="text-green-500 text-lg">✓</span> 
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href="/auth/signup" className="block">
                      <Button 
                        variant={plan.popular ? 'primary' : 'outline'} 
                        className="w-full py-3 text-base transition-all duration-300 hover:scale-105 active:scale-95"
                      >
                        {plan.name === 'Team' ? 'Book Demo' : plan.name === 'Pro' ? 'Upgrade to Pro' : 'Get Started'}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-6 sm:px-8 lg:px-12 xl:px-16 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800" />
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full blur-3xl opacity-20 animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-size-[4rem_4rem]" />

        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="text-center">
            <AnimatedText delay={100}>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight leading-tight">
                Ready to transform
                <br />
                <span className="bg-linear-to-r from-blue-200 via-white to-blue-200 bg-clip-text text-transparent">
                  your listings?
                </span>
              </h2>
            </AnimatedText>

            <AnimatedText delay={200}>
              <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-2xl mx-auto leading-relaxed">
                Join hundreds of real estate professionals using HomeQR to capture more leads and grow their business.
              </p>
            </AnimatedText>

            <AnimatedText delay={300}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
                <Link href="/auth/signup">
                  <Button 
                    size="lg" 
                    variant="primary" 
                    className="group relative px-8 py-3 text-base font-semibold bg-white text-blue-600 hover:bg-blue-50 transition-all duration-300 hover:scale-105 active:scale-95 shadow-2xl hover:shadow-blue-500/50 rounded-full overflow-hidden"
                  >
                    <span className="relative z-10">Start Free Trial</span>
                    <div className="absolute inset-0 bg-linear-to-r from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="px-8 py-3 text-base font-semibold border-2 border-white text-white bg-white/10 hover:bg-white/20 hover:border-white transition-all duration-300 hover:scale-105 active:scale-95 rounded-full backdrop-blur-sm"
                  >
                    Sign In
                  </Button>
                </Link>
              </div>
            </AnimatedText>

            {/* Trust Indicators */}
            <AnimatedText delay={400}>
              <div className="flex flex-wrap items-center justify-center gap-6 text-white/90 text-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>14-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Cancel anytime</span>
                </div>
              </div>
            </AnimatedText>
          </div>
        </div>
      </section>
    </div>
  );
}
