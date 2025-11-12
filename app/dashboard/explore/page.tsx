"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { MapView } from "@/components/map-view"
import { AdvancedSearch, type SearchFilters } from "@/components/advanced-search"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, MapPin, DollarSign } from "lucide-react"

interface ParkingSpace {
  id: string
  title: string
  address: string
  price_per_hour: number
  price_per_day: number | null
  capacity: number
  latitude: number
  longitude: number
  is_available: boolean
}

export default function ExplorePage() {
  const [spaces, setSpaces] = useState<ParkingSpace[]>([])
  const [filteredSpaces, setFilteredSpaces] = useState<ParkingSpace[]>([])
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | undefined>()
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadSpaces = async () => {
      try {
        const { data: spacesData, error: spacesError } = await supabase
          .from("parking_spaces")
          .select("*")
          .eq("is_available", true)

        if (spacesError) throw spacesError

        let availableSpaces = spacesData || []

        const { data: bookedSpaces } = await supabase.from("bookings").select("space_id").eq("status", "confirmed")

        const bookedSpaceIds = new Set(bookedSpaces?.map((b) => b.space_id) || [])
        availableSpaces = availableSpaces.filter((space) => !bookedSpaceIds.has(space.id))

        setSpaces(availableSpaces)
        setFilteredSpaces(availableSpaces)

        // Get favorites
        const { data: authData } = await supabase.auth.getUser()
        if (authData.user) {
          const { data: favoritesData } = await supabase
            .from("favorites")
            .select("space_id")
            .eq("seeker_id", authData.user.id)

          const favoriteIds = new Set(favoritesData?.map((f) => f.space_id) || [])
          setFavorites(favoriteIds)
        }
      } catch (err: any) {
        setError(err.message || "Failed to load spaces")
      } finally {
        setLoading(false)
      }
    }

    loadSpaces()
  }, [supabase])

  const handleSearch = (filters: SearchFilters) => {
    let filtered = spaces

    if (filters.query) {
      filtered = filtered.filter(
        (space) =>
          space.title.toLowerCase().includes(filters.query.toLowerCase()) ||
          space.address.toLowerCase().includes(filters.query.toLowerCase()),
      )
    }

    filtered = filtered.filter((space) => space.price_per_hour <= filters.maxPrice)
    filtered = filtered.filter((space) => space.capacity >= filters.minCapacity)

    setFilteredSpaces(filtered)
  }

  const toggleFavorite = async (spaceId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) {
        router.push("/auth/login")
        return
      }

      if (favorites.has(spaceId)) {
        await supabase.from("favorites").delete().eq("seeker_id", authData.user.id).eq("space_id", spaceId)

        const newFavorites = new Set(favorites)
        newFavorites.delete(spaceId)
        setFavorites(newFavorites)
      } else {
        await supabase.from("favorites").insert({
          seeker_id: authData.user.id,
          space_id: spaceId,
        })

        const newFavorites = new Set(favorites)
        newFavorites.add(spaceId)
        setFavorites(newFavorites)
      }
    } catch (err) {
      console.error("Error toggling favorite:", err)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar userType="seeker" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Explore Parking Spaces</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            {showAdvancedSearch ? (
              <AdvancedSearch onSearch={handleSearch} onClose={() => setShowAdvancedSearch(false)} />
            ) : (
              <Button onClick={() => setShowAdvancedSearch(true)} variant="outline" className="w-full">
                Show Filters
              </Button>
            )}
          </div>

          <div className="lg:col-span-3 space-y-8">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

            {filteredSpaces.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Map View</h2>
                <MapView
                  locations={filteredSpaces}
                  selectedLocation={selectedSpaceId}
                  onSelectLocation={setSelectedSpaceId}
                />
              </div>
            )}

            <div>
              <h2 className="text-lg font-semibold mb-4">All Spaces ({filteredSpaces.length})</h2>

              {filteredSpaces.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-400">No parking spaces match your search.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredSpaces.map((space) => (
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
                              onClick={(e) => toggleFavorite(space.id, e)}
                              className="ml-2 p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                              <Heart
                                className={`w-5 h-5 ${
                                  favorites.has(space.id) ? "fill-red-500 text-red-500" : "text-gray-300"
                                }`}
                              />
                            </button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex gap-4 text-sm">
                            <div className="flex items-center">
                              <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                              <span className="font-semibold">₹{space.price_per_hour}</span>
                              <span className="text-gray-600">/hr</span>
                            </div>
                            <div className="text-gray-600">
                              {space.capacity} spot{space.capacity > 1 ? "s" : ""}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
