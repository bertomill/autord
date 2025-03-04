import Link from 'next/link';

export default function PricingSection() {
  return (
    <section id="pricing" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white">Simple, transparent pricing</h2>
          <p className="mt-4 text-xl text-gray-400 max-w-3xl mx-auto">
            Start with a free trial. No credit card required.
          </p>
        </div>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Free Tier */}
          <div className="bg-[#1a1a1a] rounded-xl p-8 border border-[#333] hover:border-blue-500/50 transition-all duration-300">
            <h3 className="text-xl font-semibold text-white">Free Trial</h3>
            <p className="mt-2 text-gray-400">Perfect for testing the waters</p>
            <div className="mt-6">
              <span className="text-4xl font-bold text-white">$0</span>
              <span className="text-gray-400">/forever</span>
            </div>
            <ul className="mt-6 space-y-4">
              <li className="flex items-start">
                <svg className="h-6 w-6 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-300">3 research calls</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-300">Basic website analysis</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-300">Email support</span>
              </li>
            </ul>
            <div className="mt-8">
              <Link href="/signup" className="block w-full py-3 px-4 rounded-lg text-center bg-[#333] text-white hover:bg-[#444] transition-all duration-200">
                Start for free
              </Link>
            </div>
          </div>
          
          {/* Pro Tier */}
          <div className="bg-[#1a1a1a] rounded-xl p-8 border border-blue-500/50 hover:border-blue-500 transition-all duration-300 relative">
            <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
              POPULAR
            </div>
            <h3 className="text-xl font-semibold text-white">Monthly</h3>
            <p className="mt-2 text-gray-400">For small to medium businesses</p>
            <div className="mt-6">
              <span className="text-4xl font-bold text-white">$20</span>
              <span className="text-gray-400">/month</span>
            </div>
            <ul className="mt-6 space-y-4">
              <li className="flex items-start">
                <svg className="h-6 w-6 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-300">200 research calls</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-300">Full website analysis</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-300">Priority support</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-300">Proof of concept development</span>
              </li>
            </ul>
            <div className="mt-8">
              <Link href="/signup" className="block w-full py-3 px-4 rounded-lg text-center bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-200">
                Get started
              </Link>
            </div>
          </div>
          
          {/* Enterprise Tier */}
          <div className="bg-[#1a1a1a] rounded-xl p-8 border border-[#333] hover:border-blue-500/50 transition-all duration-300">
            <h3 className="text-xl font-semibold text-white">Enterprise</h3>
            <p className="mt-2 text-gray-400">For larger organizations</p>
            <div className="mt-6">
              <span className="text-4xl font-bold text-white">Custom</span>
            </div>
            <ul className="mt-6 space-y-4">
              <li className="flex items-start">
                <svg className="h-6 w-6 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-300">Unlimited research calls</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-300">Advanced analytics</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-300">Dedicated account manager</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-300">Custom integrations</span>
              </li>
            </ul>
            <div className="mt-8">
              <Link href="/signup" className="block w-full py-3 px-4 rounded-lg text-center bg-[#333] text-white hover:bg-[#444] transition-all duration-200">
                Contact sales
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 