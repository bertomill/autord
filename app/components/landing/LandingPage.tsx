'use client';

import Navbar from './Navbar';
import AboutSection from './AboutSection';
import FeaturesSection from './FeaturesSection';
import PricingSection from './PricingSection';
import Footer from './Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <AboutSection />
      <Footer />
    </div>
  );
}

// Include HeroSection directly in this file since it doesn't exist as a separate component
function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
            Innovation research <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">in minutes, powered by AI</span>
          </h1>
          <p className="mt-6 text-xl text-gray-300 max-w-3xl">
            Stay on top of innovations while focusing on your core business operations. AutoRD helps you research, analyze, and implement new ideas efficiently.
          </p>
          <div className="mt-10">
            <a href="/signup" className="px-8 py-4 rounded-lg text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium text-lg">
              Sign up for free
            </a>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>
    </section>
  );
} 