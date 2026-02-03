"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <span className="text-xl font-bold text-slate-900">Stagefy</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#benefits" className="text-slate-600 hover:text-slate-900 transition-colors">Benefits</a>
              <a href="#how-it-works" className="text-slate-600 hover:text-slate-900 transition-colors">How It Works</a>
              <a href="#features" className="text-slate-600 hover:text-slate-900 transition-colors">Features</a>
              <a href="#pricing" className="text-slate-600 hover:text-slate-900 transition-colors">Pricing</a>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
                Log In
              </Link>
              <Link href="/signup" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-gradient pt-24 pb-20 lg:pt-32 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              AI-Powered Real Estate Media
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Make Your Listings Look <span className="text-gradient">Incredible</span> in Minutes
            </h1>
            <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              AI-powered photo edits, videos, and templates built specifically for real estate agents. No design skills needed.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup" className="btn-shine px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold text-lg shadow-lg hover:shadow-xl w-full sm:w-auto">
                Try a Free Edit
              </Link>
              <a href="#how-it-works" className="px-8 py-4 bg-white text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-semibold text-lg border border-slate-200 w-full sm:w-auto">
                See How It Works
              </a>
            </div>
            <p className="text-sm text-slate-500 mt-4">Free to try • No credit card required • 3 free edits</p>
          </div>
          
          {/* Hero Visual */}
          <div className="mt-16 max-w-5xl mx-auto animate-fade-in" style={{animationDelay: '0.2s'}}>
            <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
              <div className="absolute top-0 left-0 right-0 h-10 bg-slate-100 border-b border-slate-200 flex items-center gap-2 px-4">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <div className="pt-10 p-6 bg-gradient-to-br from-slate-50 to-slate-100">
                {/* Mock UI */}
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-8">
                    <div className="aspect-video bg-slate-200 rounded-xl overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-blue-600/20"></div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex gap-2">
                          <div className="flex-1 h-12 bg-white/90 rounded-lg flex items-center justify-center text-sm text-slate-600">
                            ✨ AI Enhanced
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-4 space-y-3">
                    <div className="h-20 bg-white rounded-xl shadow-sm border border-slate-200"></div>
                    <div className="h-20 bg-white rounded-xl shadow-sm border border-slate-200"></div>
                    <div className="h-20 bg-white rounded-xl shadow-sm border border-slate-200"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Before/After Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">See the Difference</h2>
            <p className="text-lg text-slate-600">Transform ordinary listing photos into stunning visuals in seconds</p>
          </div>
          <BeforeAfterSlider />
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="benefits-gradient py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Why Agents Love Stagefy</h2>
            <p className="text-lg text-slate-600">Everything you need to create professional listing media</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <BenefitCard
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              title="Incredibly Fast"
              description="Edit photos, create videos, and generate templates in under 5 minutes. Spend less time on marketing, more time selling."
              gradient="from-blue-500 to-blue-600"
            />
            <BenefitCard
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              }
              title="Professional Quality"
              description="AI-powered enhancements make every photo look professionally staged. Stand out from the competition."
              gradient="from-amber-500 to-amber-600"
            />
            <BenefitCard
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              title="So Easy to Use"
              description="No design skills required. Just upload your photos and let AI do the magic. Intuitive for any agent."
              gradient="from-emerald-500 to-emerald-600"
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">How It Works</h2>
            <p className="text-lg text-slate-600">Get started in 3 simple steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              number="1"
              title="Upload Your Photos"
              description="Simply drag and drop your listing photos. Our AI works with any quality image."
              imageColor="bg-blue-100"
            />
            <StepCard
              number="2"
              title="Choose Your Enhancement"
              description="Select from photo edits, video creation, or template generation. Customize as needed."
              imageColor="bg-emerald-100"
            />
            <StepCard
              number="3"
              title="Download & Share"
              description="Get professional results instantly. Export for your listing portal or social media."
              imageColor="bg-amber-100"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-gradient py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Powerful Features</h2>
            <p className="text-lg text-slate-600">Everything you need to create stunning listing media</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              title="AI Photo Editing"
              description="Enhance lighting, remove objects, and virtual stage rooms instantly."
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />
            <FeatureCard
              title="Image to Video"
              description="Turn static listing photos into engaging video tours automatically."
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              }
            />
            <FeatureCard
              title="AI Templates"
              description="Generate beautiful listing templates and social media graphics in seconds."
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              }
            />
            <FeatureCard
              title="CRM Integration"
              description="Manage your listings, contacts, and media in one organized place."
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
            />
            <FeatureCard
              title="Team Collaboration"
              description="Share edits with your team and maintain consistent branding."
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              }
            />
            <FeatureCard
              title="Instant Export"
              description="Download in any format optimized for your listing portal or social media."
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              }
            />
          </div>
        </div>
      </section>

      {/* Pricing Teaser Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-lg text-slate-600">Pay only for what you use, with generous free tier included</p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 md:p-12 text-white shadow-2xl">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-bold mb-4">Start Free, Upgrade When You Need More</h3>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      3 free AI edits every month
                    </li>
                    <li className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Unlimited listing management
                    </li>
                    <li className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      All templates included
                    </li>
                    <li className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Cancel anytime
                    </li>
                  </ul>
                </div>
                <div className="text-center md:text-right">
                  <div className="text-5xl font-bold mb-2">Free</div>
                  <div className="text-blue-200 mb-6">To get started</div>
                  <Link href="/signup" className="inline-block px-8 py-4 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-all font-semibold text-lg shadow-lg">
                    Get Started Free
                  </Link>
                </div>
              </div>
            </div>
            <div className="text-center mt-8">
              <p className="text-slate-600">Need more? <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">View paid plans</Link> starting from R520/month</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="cta-gradient py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Make Your Listings Stand Out?</h2>
          <p className="text-xl text-blue-100 mb-8">Join thousands of agents who trust Stagefy for their listing media</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="btn-shine px-8 py-4 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-all font-semibold text-lg shadow-lg w-full sm:w-auto">
              Try a Free Edit
            </Link>
            <Link href="/login" className="px-8 py-4 bg-blue-500 text-white rounded-xl hover:bg-blue-400 transition-all font-semibold text-lg border-2 border-blue-400 w-full sm:w-auto">
              Already a member? Log In
            </Link>
          </div>
          <p className="text-sm text-blue-200 mt-4">No credit card required • 3 free edits • Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-white">Stagefy</span>
              </div>
              <p className="text-sm">AI-powered media creation for real estate professionals.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Log In</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} Stagefy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Before/After Slider Component
function BeforeAfterSlider() {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      setSliderPosition(Math.min(Math.max(x, 0), 100));
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      const x = ((touch.clientX - rect.left) / rect.width) * 100;
      setSliderPosition(Math.min(Math.max(x, 0), 100));
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div 
        ref={containerRef}
        className="before-after-container relative aspect-[4/3] cursor-ew-resize select-none"
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
      >
        {/* Before Image (dimmed) */}
        <div className="absolute inset-0 bg-slate-200">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-64 h-48 bg-slate-300 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <svg className="w-16 h-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <p className="text-slate-500 font-medium">Original Photo</p>
            </div>
          </div>
          <div className="absolute top-4 left-4 px-3 py-1 bg-slate-900/70 text-white text-sm rounded-full">Before</div>
        </div>

        {/* After Image (revealed) */}
        <div 
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          <div className="absolute inset-0 bg-blue-50">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-64 h-48 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg mx-auto mb-4 flex items-center justify-center shadow-lg">
                  <div className="text-blue-600">
                    <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <p className="text-sm font-medium">AI Enhanced</p>
                  </div>
                </div>
                <p className="text-blue-600 font-medium">Enhanced Photo</p>
              </div>
            </div>
          </div>
          <div className="absolute top-4 right-4 px-3 py-1 bg-blue-600 text-white text-sm rounded-full">After</div>
        </div>

        {/* Slider Handle */}
        <div 
          className="slider-handle"
          style={{ left: `${sliderPosition}%` }}
        >
          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
          </svg>
        </div>

        {/* Slider Line */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
          style={{ left: `${sliderPosition}%` }}
        ></div>
      </div>
      
      <div className="flex justify-center gap-8 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-slate-300"></div>
          <span className="text-sm text-slate-500">Before</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-sm text-slate-500">After</span>
        </div>
      </div>
    </div>
  );
}

// Benefit Card Component
function BenefitCard({ 
  icon, 
  title, 
  description, 
  gradient 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  gradient: string;
}) {
  return (
    <div className="card-hover bg-white rounded-2xl p-8 shadow-lg border border-slate-100">
      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white mb-6 shadow-lg`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}

// Step Card Component
function StepCard({ 
  number, 
  title, 
  description, 
  imageColor 
}: { 
  number: string; 
  title: string; 
  description: string;
  imageColor: string;
}) {
  return (
    <div className="relative">
      <div className="text-center">
        <div className="relative inline-flex items-center justify-center mb-6">
          <div className={`w-20 h-20 ${imageColor} rounded-2xl flex items-center justify-center`}>
            <span className="text-3xl font-bold text-slate-700">{number}</span>
          </div>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
        <p className="text-slate-600 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

// Feature Card Component
function FeatureCard({ 
  title, 
  description, 
  icon 
}: { 
  title: string; 
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="card-hover bg-white rounded-xl p-6 shadow-md border border-slate-100 hover:shadow-lg transition-all">
      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 text-sm">{description}</p>
    </div>
  );
}
