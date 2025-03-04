export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white">How AutoRD works</h2>
          <p className="mt-4 text-xl text-gray-400 max-w-3xl mx-auto">
            Our AI-powered platform helps businesses innovate without disrupting their core operations.
          </p>
        </div>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Feature 1 */}
          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] hover:border-blue-500/50 transition-all duration-300 group">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-500/30 transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Website Analysis</h3>
            <p className="text-gray-400">
              We analyze your company website to understand your business, products, and services.
            </p>
          </div>
          
          {/* Feature 2 */}
          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] hover:border-blue-500/50 transition-all duration-300 group">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-6 group-hover:bg-purple-500/30 transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Market Research</h3>
            <p className="text-gray-400">
              Daily research to identify new innovations and opportunities in your industry.
            </p>
          </div>
          
          {/* Feature 3 */}
          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] hover:border-blue-500/50 transition-all duration-300 group">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-6 group-hover:bg-green-500/30 transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Proof of Concept</h3>
            <p className="text-gray-400">
              We build proof of concepts for your business to test new innovations quickly.
            </p>
          </div>
          
          {/* Feature 4 */}
          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] hover:border-blue-500/50 transition-all duration-300 group">
            <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mb-6 group-hover:bg-red-500/30 transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Growth Insights</h3>
            <p className="text-gray-400">
              Get insights into industry standards and growth opportunities for your business.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
} 