"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, DollarSign, MapPin, ArrowLeft } from "lucide-react"

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
  created_at: string
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadBookings = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser()
        if (!authData.user) {
          router.push("/auth/login")
          return
        }

        const { data: bookingsData, error: bookingsError } = await supabase
          .from("bookings")
          .select("*, parking_spaces(title, address)")
          .eq("seeker_id", authData.user.id)
          .order("created_at", { ascending: false })

        if (bookingsError) throw bookingsError
        setBookings(bookingsData || [])
      } catch (err: any) {
        setError(err.message || "Failed to load bookings")
      } finally {
        setLoading(false)
      }
    }

    loadBookings()
  }, [router, supabase])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
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
      <Navbar userType="seeker" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">My Bookings</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">{bookings.length} total bookings</p>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

        {bookings.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="space-y-4">
              <Calendar className="w-12 h-12 mx-auto text-gray-300" />
              <p className="text-gray-600 dark:text-gray-400">You haven't made any bookings yet.</p>
              <Link href="/dashboard">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">Browse Spaces</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{booking.parking_spaces.title}</CardTitle>
                      <CardDescription className="flex items-center mt-2">
                        <MapPin className="w-4 h-4 mr-2" />
                        {booking.parking_spaces.address}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-start space-x-3">
                      <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                        <p className="font-semibold text-sm">
                          {formatDate(booking.start_time)} - {formatDate(booking.end_time)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Price</p>
                        <p className="font-semibold text-sm">${booking.total_price.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Booked On</p>
                        <p className="font-semibold text-sm">{formatDate(booking.created_at)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
