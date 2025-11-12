"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, MapPin, DollarSign, CheckCircle, Clock } from "lucide-react"

interface ParkingSpace {
  id: string
  title: string
  address: string
  price_per_hour: number
  price_per_day: number | null
  capacity: number
  is_available: boolean
}

interface Booking {
  id: string
  space_id: string
  parking_spaces: {
    title: string
    address: string
  }
  start_time: string
  end_time: string
  total_price: number
  status: string
}

export default function SeekerDashboard() {
  const [spaces, setSpaces] = useState<ParkingSpace[]>([])
  const [filteredSpaces, setFilteredSpaces] = useState<ParkingSpace[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [userName, setUserName] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser()
        if (!authData.user) {
          router.push("/auth/login")
          return
        }

        // Get user profile
        const { data: profileData } = await supabase
          .from("users_profile")
          .select("full_name")
          .eq("id", authData.user.id)
          .single()

        setUserName(profileData?.full_name || "User")

        // Get available parking spaces
        const { data: spacesData, error: spacesError } = await supabase
          .from("parking_spaces")
          .select("*")
          .eq("is_available", true)
          .order("created_at", { ascending: false })

        if (spacesError) throw spacesError

        let availableSpaces = spacesData || []

        const { data: bookedSpaces } = await supabase.from("bookings").select("space_id").eq("status", "confirmed")

        const bookedSpaceIds = new Set(bookedSpaces?.map((b) => b.space_id) || [])
        availableSpaces = availableSpaces.filter((space) => !bookedSpaceIds.has(space.id))

        setSpaces(availableSpaces)
        setFilteredSpaces(availableSpaces)

        const { data: bookingsData, error: bookingsError } = await supabase
          .from("bookings")
          .select("*, parking_spaces(title, address)")
          .eq("seeker_id", authData.user.id)
          .in("status", ["pending", "confirmed"])
          .order("created_at", { ascending: false })

        if (bookingsError) throw bookingsError
        setBookings(bookingsData || [])

        // Get user's favorites
        const { data: favoritesData } = await supabase
          .from("favorites")
          .select("space_id")
          .eq("seeker_id", authData.user.id)

        const favoriteIds = new Set(favoritesData?.map((f) => f.space_id) || [])
        setFavorites(favoriteIds)
      } catch (err: any) {
        setError(err.message || "Failed to load spaces")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router, supabase])

  useEffect(() => {
    const filtered = spaces.filter(
      (space) =>
        space.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        space.address.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    setFilteredSpaces(filtered)
  }, [searchQuery, spaces])

  const toggleFavorite = async (spaceId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) return

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar userType="seeker" userName={userName} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {bookings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Your Bookings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {bookings.map((booking) => (
                <Card key={booking.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-base">{booking.parking_spaces.title}</CardTitle>
                        <CardDescription className="flex items-center mt-1">
                          <MapPin className="w-3 h-3 mr-1" />
                          {booking.parking_spaces.address}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                        {booking.status === "confirmed" && <CheckCircle className="w-3 h-3 mr-1" />}
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm">
                      <p className="text-gray-600 dark:text-gray-400">Booking Period</p>
                      <p className="font-semibold">
                        {formatDate(booking.start_time)} to {formatDate(booking.end_time)}
                      </p>
                    </div>
                    <div className="text-sm">
                      <p className="text-gray-600 dark:text-gray-400">Total Price</p>
                      <p className="font-semibold">₹{booking.total_price.toFixed(2)}</p>
                    </div>
                    {booking.status === "pending" && (
                      <p className="text-xs text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                        ⏳ Waiting for owner approval...
                      </p>
                    )}
                    {booking.status === "confirmed" && (
                      <p className="text-xs text-green-600 bg-green-50 dark:bg-green-900/20 p-2 rounded">
                        ✓ Your booking is confirmed!
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Find Parking Spaces</h1>
          <div className="flex gap-3">
            <Input
              type="text"
              placeholder="Search by title or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Link href="/dashboard/bookings">
              <Button variant="outline">All Bookings</Button>
            </Link>
            <Link href="/dashboard/favorites">
              <Button variant="outline">My Favorites</Button>
            </Link>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

        {filteredSpaces.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                {spaces.length === 0
                  ? "No parking spaces available right now."
                  : "No parking spaces match your search."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
