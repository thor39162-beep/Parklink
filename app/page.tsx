"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Users, Zap, CheckCircle } from "lucide-react"

export default function LandingPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: authData } = await supabase.auth.getUser()
      if (authData.user) {
        // Check user type to redirect to appropriate dashboard
        const { data: profileData } = await supabase
          .from("users_profile")
          .select("user_type")
          .eq("id", authData.user.id)
          .single()

        if (profileData?.user_type === "owner") {
          router.push("/dashboard/owner")
        } else {
          router.push("/dashboard")
        }
      }
    }

    checkAuth()
  }, [router, supabase])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      <nav className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">P</div>
          <span className="font-bold text-xl">ParkLink</span>
        </Link>
        <div className="space-x-4">
          <Link href="/auth/login">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/auth/sign-up">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">Get Started</Button>
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center space-y-6 mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white text-balance">
            Find & Share Parking Spaces Easily
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-balance">
            Connect with parking space owners and seekers in your area. Share spare parking spots or find affordable
            parking nearby.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Link href="/auth/sign-up">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                Start Sharing
              </Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button size="lg" variant="outline">
                Find Parking
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          <Card>
            <CardHeader>
              <MapPin className="w-8 h-8 text-blue-600 mb-2" />
              <CardTitle className="text-lg">Smart Location</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Find parking spaces near you with our interactive map
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="w-8 h-8 text-blue-600 mb-2" />
              <CardTitle className="text-lg">Community Driven</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Connect directly with local parking space owners
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="w-8 h-8 text-blue-600 mb-2" />
              <CardTitle className="text-lg">Easy Booking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Book parking in seconds with flexible pricing options
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CheckCircle className="w-8 h-8 text-blue-600 mb-2" />
              <CardTitle className="text-lg">Verified Spaces</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">All parking spaces are verified and reviewed</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white dark:bg-slate-900 border-0 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">How ParkLink Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-blue-600">
                  1
                </div>
                <h3 className="font-semibold mb-2">Sign Up</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Create your account as a space owner or seeker
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-blue-600">
                  2
                </div>
                <h3 className="font-semibold mb-2">Find or List</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  List your spaces or browse available parking spots
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-blue-600">
                  3
                </div>
                <h3 className="font-semibold mb-2">Book & Manage</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Book parking or manage your listings easily</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-16">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Ready to find your perfect parking space?</p>
          <Link href="/auth/sign-up">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
              Get Started Now
            </Button>
          </Link>
        </div>
      </main>

      <footer className="bg-gray-900 dark:bg-slate-950 text-white mt-16 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p>&copy; 2025 ParkLink. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
