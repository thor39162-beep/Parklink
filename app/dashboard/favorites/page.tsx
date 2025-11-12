"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, MapPin, DollarSign, ArrowLeft } from "lucide-react"

interface ParkingSpace {
  id: string
  title: string
  address: string
  price_per_hour: number
  price_per_day: number | null
  capacity: number
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<ParkingSpace[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser()
        if (!authData.user) {
          router.push("/auth/login")
          return
        }

        const { data: favoriteSpaces, error: favError } = await supabase
          .from("favorites")
          .select("parking_spaces(*)")
          .eq("seeker_id", authData.user.id)

        if (favError) throw favError

        const spaces = favoriteSpaces?.map((fav: any) => fav.parking_spaces).filter(Boolean) || []
        setFavorites(spaces)
      } catch (err: any) {
        setError(err.message || "Failed to load favorites")
      } finally {
        setLoading(false)
      }
    }

    loadFavorites()
  }, [router, supabase])

  const removeFavorite = async (spaceId: string) => {
    try {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) return

      await supabase.from("favorites").delete().eq("seeker_id", authData.user.id).eq("space_id", spaceId)

      setFavorites(favorites.filter((space) => space.id !== spaceId))
    } catch (err) {
      console.error("Error removing favorite:", err)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar userType="seeker" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">My Favorite Spaces</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">{favorites.length} saved spaces</p>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

        {favorites.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="space-y-4">
              <Heart className="w-12 h-12 mx-auto text-gray-300" />
              <p className="text-gray-600 dark:text-gray-400">You haven't saved any favorite spaces yet.</p>
              <Link href="/dashboard">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">Browse Spaces</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((space) => (
              <Link key={space.id} href={`/dashboard/space/${space.id}`}>
                <Card className="hover:shadow-lg transition-shadow h-full cursor-pointer">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{space.title}</CardTitle>
                        <CardDescription className="flex items-center mt-2">
                          <MapPin className="w-4 h-4 mr-1" />
                          {space.address}
                        </CardDescription>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          removeFavorite(space.id)
                        }}
                        className="ml-2 p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors"
                      >
                        <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="font-semibold">₹{space.price_per_hour}</span>
                        <span className="text-sm text-gray-600">/hr</span>
                      </div>
                      {space.price_per_day && (
                        <div className="flex items-center text-sm text-gray-600">₹{space.price_per_day}/day</div>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {space.capacity} spot{space.capacity > 1 ? "s" : ""} available
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
