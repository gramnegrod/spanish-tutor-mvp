'use client'

import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Mic, Zap, Globe } from 'lucide-react'
import { motion } from 'framer-motion'

export default function HomePage() {
  const { user } = useAuth()

  // Remove auto-redirect - let users see the landing page
  // They can manually click to go to practice

  return (
    <div className="min-h-screen">
      {/* Header - removed UserMenu for now */}
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Stop Learning Spanish.
              <span className="block text-3xl md:text-4xl text-orange-500 mt-2">
                Start Living It. 🇲🇽
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              No more grammar drills. No more vocabulary lists. Just real conversations 
              with Mexican locals who teach you <span className="font-semibold">exactly how they speak</span> - 
              from ordering tacos on the street to closing business deals in Polanco.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <>
                  <Link href="/practice-v2/select-npc">
                    <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                      🗺️ Choose Your Adventure
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/practice-v2/select-npc">
                    <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                      🗺️ Choose Your Adventure
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto">
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-red-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Pedagogical Vision Section */}
      <div className="py-20 bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Our Revolutionary Approach: <span className="text-orange-500">Context-First Learning</span>
            </h2>
            <div className="prose prose-lg mx-auto text-gray-600">
              <p className="mb-6">
                Traditional apps teach you to translate. We teach you to <span className="font-semibold">think in Spanish</span>.
              </p>
              <p className="mb-6">
                You&apos;ll talk to a taco vendor who says <span className="italic">&quot;¿Qué onda, güero?&quot;</span> instead of 
                textbook Spanish. When you&apos;re confused, they&apos;ll explain <span className="font-semibold">like a friend would</span> - 
                mixing Spanish and English naturally, just like real bilingual Mexicans do.
              </p>
              <p>
                No conjugation tables. No fill-in-the-blanks. Just real situations where you 
                <span className="font-semibold"> need to communicate to get what you want</span>.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Three principles that make our method different
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mic className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Immersive Context</h3>
              <p className="text-gray-600">
                You&apos;re not &quot;practicing Spanish&quot; - you&apos;re ordering tacos, negotiating prices, 
                making friends. The language comes naturally.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Natural Code-Switching</h3>
              <p className="text-gray-600">
                Our AI tutors explain in Spanglish when you&apos;re stuck - exactly how 
                bilingual friends help each other learn.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Mexican, Not Generic</h3>
              <p className="text-gray-600">
                Learn real Mexican Spanish - &quot;¿Mande?&quot;, &quot;ahorita&quot;, &quot;güey&quot; - 
                not textbook Latin American Spanish.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Who Is This For Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Perfect for Real-World Spanish Learners
            </h2>
            <div className="grid md:grid-cols-2 gap-8 text-left">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="font-bold text-xl mb-3 text-green-600">✅ This is for you if:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• You&apos;re planning to visit or live in Mexico</li>
                  <li>• You want to connect with Mexican friends/family</li>
                  <li>• You&apos;re tired of apps that teach &quot;neutral&quot; Spanish</li>
                  <li>• You learn better through conversation than rules</li>
                  <li>• You want to sound natural, not like a textbook</li>
                </ul>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="font-bold text-xl mb-3 text-red-600">❌ This isn&apos;t for you if:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• You need to pass a formal Spanish exam</li>
                  <li>• You want to learn Argentinian/Spanish from Spain</li>
                  <li>• You prefer structured grammar lessons</li>
                  <li>• You&apos;re looking for business/academic Spanish</li>
                  <li>• You want written Spanish practice</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Personas Preview */}
      <div className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              11 Authentic Mexico City Characters
            </h2>
            <p className="text-xl text-gray-600">
              Practice with locals in real situations
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-lg p-6 shadow-sm border border-gray-100"
            >
              <div className="text-3xl mb-3">🌮</div>
              <h3 className="text-lg font-semibold mb-2">Don Roberto - Taco Vendor</h3>
              <p className="text-gray-600 text-sm mb-3">
                Learn street Spanish while ordering tacos. Perfect for beginners!
              </p>
              <p className="text-xs text-orange-600">📍 Roma Norte</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white rounded-lg p-6 shadow-sm border border-gray-100"
            >
              <div className="text-3xl mb-3">🚕</div>
              <h3 className="text-lg font-semibold mb-2">Juan &apos;El Capi&apos; - Taxi Driver</h3>
              <p className="text-gray-600 text-sm mb-3">
                Navigate the city with chilango slang and mariachi rhythm
              </p>
              <p className="text-xs text-orange-600">📍 Airport</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-lg p-6 shadow-sm border border-gray-100"
            >
              <div className="text-3xl mb-3">☕</div>
              <h3 className="text-lg font-semibold mb-2">Mariana - Barista</h3>
              <p className="text-gray-600 text-sm mb-3">
                Order coffee with hipster CDMX vocabulary
              </p>
              <p className="text-xs text-orange-600">📍 Condesa</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white rounded-lg p-6 shadow-sm border border-gray-100"
            >
              <div className="text-3xl mb-3">🏨</div>
              <h3 className="text-lg font-semibold mb-2">Sra. Gómez - Hotel Receptionist</h3>
              <p className="text-gray-600 text-sm mb-3">
                Check in with clear, professional Spanish
              </p>
              <p className="text-xs text-orange-600">📍 Hotel Azteca</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white rounded-lg p-6 shadow-sm border border-gray-100"
            >
              <div className="text-3xl mb-3">🥗</div>
              <h3 className="text-lg font-semibold mb-2">Carlos - Restaurant Waiter</h3>
              <p className="text-gray-600 text-sm mb-3">
                Order meals and learn dining etiquette
              </p>
              <p className="text-xs text-orange-600">📍 Condesa</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="bg-white rounded-lg p-6 shadow-sm border border-gray-100"
            >
              <div className="text-3xl mb-3">🛍️</div>
              <h3 className="text-lg font-semibold mb-2">Doña Carmen - Market Vendor</h3>
              <p className="text-gray-600 text-sm mb-3">
                Buy produce with warm, maternal Spanish
              </p>
              <p className="text-xs text-orange-600">📍 Mercado Coyoacán</p>
            </motion.div>
          </div>

          <div className="text-center mt-8">
            <p className="text-gray-600">Plus 5 more characters including pharmacy, museum guide, Uber driver...</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Speak Spanish Like a Mexican?
          </h2>
          <p className="text-xl mb-8 text-orange-100">
            Join thousands learning authentic conversational Spanish
          </p>
          <div className="flex justify-center">
            <Link href="/practice-v2/select-npc">
              <Button size="lg" variant="secondary" className="bg-white text-orange-600 hover:bg-gray-100">
                🗺️ Start Your Adventure Now
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}