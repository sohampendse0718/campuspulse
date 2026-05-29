import Link from 'next/link'
import { MapPin, Bell, Users, TrendingUp } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <MapPin className="h-8 w-8 text-[#0078D4]" />
              <h1 className="text-2xl font-bold text-gray-900">CampusPulse</h1>
            </div>
            <div className="flex space-x-4">
              <Link 
                href="/login" 
                className="px-4 py-2 text-[#0078D4] hover:text-blue-700 font-medium"
              >
                Login
              </Link>
              <Link 
                href="/signup" 
                className="px-6 py-2 bg-[#0078D4] text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Report. Resolve. Rebuild.
          </h2>
          <p className="text-xl text-gray-600 mb-4">Together.</p>
          <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
            Bridge the gap between citizens and municipal authorities with transparent, 
            community-driven civic issue reporting and tracking.
          </p>
          <div className="flex justify-center space-x-4">
            <Link 
              href="/report" 
              className="px-8 py-4 bg-[#0078D4] text-white rounded-lg hover:bg-blue-700 font-semibold text-lg shadow-lg"
            >
              Report an Issue
            </Link>
            <Link 
              href="/map" 
              className="px-8 py-4 bg-white text-[#0078D4] border-2 border-[#0078D4] rounded-lg hover:bg-blue-50 font-semibold text-lg"
            >
              View Map
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={<MapPin className="h-10 w-10 text-[#0078D4]" />}
            title="Location-Based"
            description="Report issues with precise GPS location tracking for faster resolution"
          />
          <FeatureCard
            icon={<Bell className="h-10 w-10 text-[#0078D4]" />}
            title="Real-Time Updates"
            description="Get notified when your reported issues are being addressed"
          />
          <FeatureCard
            icon={<Users className="h-10 w-10 text-[#0078D4]" />}
            title="Community Driven"
            description="Vote and comment on issues to help prioritize what matters most"
          />
          <FeatureCard
            icon={<TrendingUp className="h-10 w-10 text-[#0078D4]" />}
            title="Transparent Analytics"
            description="Track municipal performance with public data and impact reports"
          />
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-[#0078D4] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <StatCard number="500+" label="Issues Resolved" />
            <StatCard number="2,000+" label="Active Citizens" />
            <StatCard number="85%" label="Resolution Rate" />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
          How It Works
        </h3>
        <div className="grid md:grid-cols-3 gap-8">
          <StepCard
            number="1"
            title="Report"
            description="Snap a photo and describe the civic issue with your location"
          />
          <StepCard
            number="2"
            title="Track"
            description="Monitor the status of your issue on the interactive campus map"
          />
          <StepCard
            number="3"
            title="Resolve"
            description="See before-and-after photos when authorities resolve the issue"
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            Powered by <span className="text-[#0078D4] font-semibold">CampusPulse</span>
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Making cities better, one report at a time.
          </p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
      <div className="mb-4">{icon}</div>
      <h4 className="text-xl font-semibold text-gray-900 mb-2">{title}</h4>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

function StatCard({ number, label }: { number: string, label: string }) {
  return (
    <div>
      <div className="text-4xl font-bold mb-2">{number}</div>
      <div className="text-blue-100">{label}</div>
    </div>
  )
}

function StepCard({ number, title, description }: { number: string, title: string, description: string }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-[#0078D4] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
        {number}
      </div>
      <h4 className="text-xl font-semibold text-gray-900 mb-2">{title}</h4>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}
