'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MapPin } from 'lucide-react'
import { motion } from 'framer-motion'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()

        if (profile?.role === 'municipal_official' || profile?.role === 'moderator') {
          router.push('/dashboard')
        } else {
          router.push('/map')
        }
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      className="min-h-screen flex flex-col justify-center items-center relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2 }}
    >
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 25%, #C7D2FE 50%, #FDE68A 75%, #E0F2FE 100%)',
          backgroundSize: '400% 400%',
        }}
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Floating background icons */}
      <motion.div
        className="absolute top-16 left-16 text-[#0078D4]/15"
        animate={{ y: [0, -25, 0], rotate: [0, 10, -10, 0] }}
        transition={{ duration: 7, repeat: Infinity }}
      >
        <MapPin size={100} />
      </motion.div>
      <motion.div
        className="absolute bottom-20 right-20 text-[#0078D4]/15"
        animate={{ y: [0, 25, 0], rotate: [0, -10, 10, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
      >
        <MapPin size={120} />
      </motion.div>

      {/* Login Card */}
      <motion.div
        className="relative z-10 bg-white/60 backdrop-blur-lg shadow-2xl border border-white/30 rounded-2xl p-8 w-[90%] sm:w-[400px] text-center"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.8 }}
      >
        {/* Logo */}
        <motion.div
          className="flex justify-center items-center space-x-2 mb-4"
          whileHover={{ scale: 1.05 }}
        >
          <motion.div
            animate={{
              rotate: [0, 5, -5, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <MapPin className="h-10 w-10 text-[#0078D4] drop-shadow-md" />
          </motion.div>
          <motion.h1
            className="text-3xl font-extrabold text-gray-800"
            animate={{ opacity: [1, 0.7, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            CityPulse
          </motion.h1>
        </motion.div>

        <motion.h2
          className="text-2xl font-semibold text-gray-900"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Sign in to your account
        </motion.h2>
        <motion.p
          className="text-sm text-gray-600 mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Welcome back 👋 Let’s make our city better together.
        </motion.p>

        <motion.form
          onSubmit={handleLogin}
          className="mt-6 space-y-5 text-left"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.15 } },
          }}
        >
          {error && (
            <motion.div
              className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {error}
            </motion.div>
          )}

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <motion.input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              whileFocus={{ scale: 1.02, boxShadow: '0 0 10px rgba(0,120,212,0.25)' }}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-[#0078D4] focus:border-[#0078D4]"
            />
          </motion.div>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <motion.input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              whileFocus={{ scale: 1.02, boxShadow: '0 0 10px rgba(0,120,212,0.25)' }}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-[#0078D4] focus:border-[#0078D4]"
            />
          </motion.div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            className="w-full py-3 rounded-lg bg-[#0078D4] text-white font-semibold hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </motion.button>
        </motion.form>

        <motion.div
          className="mt-8 text-sm text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          <span>Don't have an account? </span>
          <Link
            href="/signup"
            className="text-[#0078D4] font-medium hover:underline"
          >
            Create one
          </Link>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
