export default function AboutSection() {
  return (
    <section id="about" className="py-20 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white">About AutoRD</h2>
          <p className="mt-4 text-xl text-gray-400 max-w-3xl mx-auto">
            We help businesses innovate without disrupting their core operations.
          </p>
        </div>
        
        <div className="mt-16 bg-[#1a1a1a] rounded-xl p-8 border border-[#333]">
          <div className="prose prose-lg prose-invert max-w-none">
            <p>
              Running a business while trying to innovate is like changing tires while driving 100km/h. 
              It&apos;s challenging, risky, and requires specialized skills.
            </p>
            <p>
              At AutoRD, we believe that businesses shouldn&apos;t have to choose between focusing on their 
              core operations and staying innovative. Our AI-powered platform helps you do both by:
            </p>
            <ul>
              <li>Analyzing your business to understand your unique challenges and opportunities</li>
              <li>Researching market trends and innovations relevant to your industry</li>
              <li>Building proof of concepts that you can test with minimal disruption</li>
              <li>Providing actionable insights to help you grow and stay competitive</li>
            </ul>
            <p>
              Founded in 2023, AutoRD is on a mission to democratize innovation for businesses of all sizes.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
} 