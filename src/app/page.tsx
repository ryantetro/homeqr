import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Two Column Layout */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden pt-4 pb-24">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f8f9fa_1px,transparent_1px),linear-gradient(to_bottom,#f8f9fa_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30" />
        
        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-7xl mx-auto">
            {/* Left Column - Content */}
            <div className="space-y-8 lg:space-y-10">
              {/* Headline */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-6xl font-bold text-gray-900 leading-[1.1] tracking-tight">
                Streamline your real estate business with{' '}
                <span className="text-blue-600">QR codes</span>
              </h1>

              {/* Description */}
              <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-xl">
                Our Chrome extension and management platform lets you generate QR codes for every property listing, 
                giving buyers instant access to details, pricing, and lead capture — all from a single scan.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Link href="/auth/signup">
                  <Button 
                    size="lg" 
                    variant="primary" 
                    className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 hover:scale-105"
                  >
                    Get started
                  </Button>
                </Link>
                <Link href="https://chrome.google.com/webstore">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="w-full sm:w-auto px-8 py-3.5 rounded-full border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 font-semibold transition-all duration-200 hover:scale-105"
                  >
                    Install Extension →
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Column - Dashboard Preview */}
            <div className="relative hidden lg:block">
              <div className="relative rounded-xl shadow-xl border border-gray-200 overflow-hidden bg-white transform scale-90">
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
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                        <p className="text-[10px] font-medium text-blue-600 mb-1.5 uppercase tracking-wide">Listings</p>
                        <p className="text-2xl font-bold text-blue-900">12</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                        <p className="text-[10px] font-medium text-green-600 mb-1.5 uppercase tracking-wide">Scans</p>
                        <p className="text-2xl font-bold text-green-900">1.2k</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                        <p className="text-[10px] font-medium text-purple-600 mb-1.5 uppercase tracking-wide">Leads</p>
                        <p className="text-2xl font-bold text-purple-900">47</p>
                      </div>
                    </div>

                    {/* Listing card */}
                    <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
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
                            className="bg-blue-500 rounded-t flex-1"
                            style={{ height: `${height}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative gradient blob */}
              <div className="absolute -z-10 -right-20 -top-20 w-[400px] h-[400px] bg-blue-100 rounded-full blur-3xl opacity-20" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 sm:px-8 lg:px-12 xl:px-16 bg-gray-50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-20 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
              Everything you need to capture more leads
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              Powerful tools designed specifically for real estate professionals
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-gray-200 bg-white hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-3xl">🔗</span>
                </div>
                <CardTitle className="text-xl font-semibold mb-3">Instant QR Generation</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Create QR codes directly from Zillow, Realtor.com, or any IDX site with our Chrome extension.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-gray-200 bg-white hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-3xl">📱</span>
                </div>
                <CardTitle className="text-xl font-semibold mb-3">Smart Lead Capture</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Each QR code leads to a beautiful property page with built-in contact forms to capture buyer info.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-gray-200 bg-white hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-3xl">📊</span>
                </div>
                <CardTitle className="text-xl font-semibold mb-3">Real-Time Analytics</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Track scans, leads, and engagement metrics to see which listings perform best.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-gray-200 bg-white hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-3xl">📄</span>
                </div>
                <CardTitle className="text-xl font-semibold mb-3">Printable Flyers</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Generate professional flyers with embedded QR codes for open houses and yard signs.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-gray-200 bg-white hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-3xl">🤖</span>
                </div>
                <CardTitle className="text-xl font-semibold mb-3">Automated Follow-Ups</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Send instant notifications and automated follow-ups to keep leads engaged.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-gray-200 bg-white hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-3xl">👥</span>
                </div>
                <CardTitle className="text-xl font-semibold mb-3">Team Collaboration</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Brokerages can manage multiple agents and view team-wide analytics in one dashboard.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6 sm:px-8 lg:px-12 xl:px-16 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-20 max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">Choose the plan that fits your business</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-gray-200 bg-white hover:shadow-lg transition-shadow">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl font-semibold mb-6">Starter</CardTitle>
                <div className="mb-8">
                  <span className="text-5xl font-bold text-gray-900">$29</span>
                  <span className="text-xl text-gray-600 ml-2">/mo</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4 text-base text-gray-700 mb-8">
                  <li className="flex items-center gap-3">
                    <span className="text-green-500 text-lg">✓</span> 
                    <span>Up to 10 listings</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-green-500 text-lg">✓</span> 
                    <span>500 QR scans/month</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-green-500 text-lg">✓</span> 
                    <span>Basic analytics</span>
                  </li>
                </ul>
                <Link href="/auth/signup" className="block">
                  <Button variant="outline" className="w-full py-3 text-base">
                    Get Started
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-600 bg-blue-50/30 relative shadow-lg">
              <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-bl-xl uppercase tracking-wide">
                Popular
              </div>
              <CardHeader className="pb-6 pt-8">
                <CardTitle className="text-2xl font-semibold mb-6">Pro</CardTitle>
                <div className="mb-8">
                  <span className="text-5xl font-bold text-blue-600">$79</span>
                  <span className="text-xl text-gray-600 ml-2">/mo</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4 text-base text-gray-700 mb-8">
                  <li className="flex items-center gap-3">
                    <span className="text-green-500 text-lg">✓</span> 
                    <span>Unlimited listings</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-green-500 text-lg">✓</span> 
                    <span>Unlimited scans</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-green-500 text-lg">✓</span> 
                    <span>Custom branding</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-green-500 text-lg">✓</span> 
                    <span>Lead export + automation</span>
                  </li>
                </ul>
                <Link href="/auth/signup" className="block">
                  <Button variant="primary" className="w-full py-3 text-base">
                    Upgrade to Pro
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-gray-200 bg-white hover:shadow-lg transition-shadow">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl font-semibold mb-6">Team</CardTitle>
                <div className="mb-8">
                  <span className="text-5xl font-bold text-gray-900">$299</span>
                  <span className="text-xl text-gray-600 ml-2">/mo</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4 text-base text-gray-700 mb-8">
                  <li className="flex items-center gap-3">
                    <span className="text-green-500 text-lg">✓</span> 
                    <span>Up to 10 agents</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-green-500 text-lg">✓</span> 
                    <span>Shared analytics</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-green-500 text-lg">✓</span> 
                    <span>Priority support</span>
                  </li>
                </ul>
                <Link href="/auth/signup" className="block">
                  <Button variant="outline" className="w-full py-3 text-base">
                    Book Demo
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 sm:px-8 lg:px-12 xl:px-16 bg-gray-900 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            Ready to transform your listings?
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            Join hundreds of real estate professionals using HomeQR to capture more leads and grow their business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" variant="primary" className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-3 text-base">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900 px-8 py-3 text-base">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
