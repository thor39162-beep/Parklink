"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, MapPin, DollarSign, Calendar, Clock, CheckCircle, XCircle } from "lucide-react"

interface ParkingSpace {
  id: string
  title: string
  address: string
  price_per_hour: number
  price_per_day: number | null
  capacity: number
  is_available: boolean
}

interface PendingBooking {
  id: string
  space_id: string
  space_title: string
  seeker_id: string
  seeker_name: string
  start_time: string
  end_time: string
  total_price: number
  status: string
}

interface BookedBooking {
  id: string
  space_id: string
  space_title: string
  seeker_id: string
  seeker_name: string
  seeker_contact: string
  start_time: string
  end_time: string
  total_price: number
  status: string
}

export default function OwnerDashboard() {
  const [spaces, setSpaces] = useState<ParkingSpace[]>([])
  const [pendingBookings, setPendingBookings] = useState<PendingBooking[]>([])
  const [bookedBookings, setBookedBookings] = useState<BookedBooking[]>([])
  const [userName, setUserName] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [approving, setApproving] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get current user
        const { data: authData } = await supabase.auth.getUser()
        if (!authData.user) {
          router.push("/auth/login")
          return
        }

        // Get user profile
        const { data: profileData } = await supabase
          .from("users_profile")
          .select("full_name, user_type")
          .eq("id", authData.user.id)
          .single()

        if (profileData?.user_type !== "owner") {
          router.push("/dashboard")
          return
        }

        setUserName(profileData?.full_name || "User")

        const { data: confirmedBookingsData, error: confirmedError } = await supabase
          .from("bookings")
          .select()
          .eq("owner_id", authData.user.id)
          .eq("status", "confirmed")
          .order("start_time", { ascending: true })

        if (confirmedError) throw confirmedError

        const formattedConfirmedBookings = await Promise.all(
          (confirmedBookingsData || []).map(async (booking: any) => {
            const { data: seeker } = await supabase
              .from("users_profile")
              .select("full_name, contact_number")
              .eq("id", booking.seeker_id)
              .single()

            const { data: space } = await supabase
              .from("parking_spaces")
              .select("title")
              .eq("id", booking.space_id)
              .single()

            return {
              id: booking.id,
              space_id: booking.space_id,
              space_title: space?.title || "Unknown Space",
              seeker_id: booking.seeker_id,
              seeker_name: seeker?.full_name || "Unknown User",
              seeker_contact: seeker?.contact_number || "N/A",
              start_time: booking.start_time,
              end_time: booking.end_time,
              total_price: booking.total_price,
              status: booking.status,
            }
          }),
        )

        setBookedBookings(formattedConfirmedBookings)

        const { data: spacesData, error: spacesError } = await supabase
          .from("parking_spaces")
          .select("*")
          .eq("owner_id", authData.user.id)
          .order("created_at", { ascending: false })

        if (spacesError) throw spacesError

        const confirmedBookingSpaceIds = new Set((formattedConfirmedBookings || []).map((b) => b.space_id))
        const availableSpaces = (spacesData || []).filter((space) => !confirmedBookingSpaceIds.has(space.id))

        setSpaces(availableSpaces)

        const { data: bookingsData, error: bookingsError } = await supabase
          .from("bookings")
          .select()
          .eq("owner_id", authData.user.id)
          .eq("status", "pending")
          .order("created_at", { ascending: false })

        if (bookingsError) throw bookingsError

        // Fetch seeker and space info separately to avoid relationship issues
        const formattedBookings = await Promise.all(
          (bookingsData || []).map(async (booking: any) => {
            const { data: seeker } = await supabase
              .from("users_profile")
              .select("full_name")
              .eq("id", booking.seeker_id)
              .single()

            const { data: space } = await supabase
              .from("parking_spaces")
              .select("title")
              .eq("id", booking.space_id)
              .single()

            return {
              id: booking.id,
              space_id: booking.space_id,
              space_title: space?.title || "Unknown Space",
              seeker_id: booking.seeker_id,
              seeker_name: seeker?.full_name || "Unknown User",
              start_time: booking.start_time,
              end_time: booking.end_time,
              total_price: booking.total_price,
              status: booking.status,
            }
          }),
        )

        setPendingBookings(formattedBookings)
      } catch (err: any) {
        setError(err.message || "Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router, supabase])

  const handleApproveBooking = async (bookingId: string) => {
    setApproving(bookingId)
    try {
      // Get booking details
      const booking = pendingBookings.find((b) => b.id === bookingId)
      if (!booking) throw new Error("Booking not found")

      // Update booking status to confirmed
      const { error: bookingError } = await supabase
        .from("bookings")
        .update({ status: "confirmed" })
        .eq("id", bookingId)

      if (bookingError) throw bookingError

      // Create a booking slot to mark this time as unavailable
      const { error: slotError } = await supabase.from("booking_slots").insert({
        space_id: booking.space_id,
        booking_id: bookingId,
        start_time: booking.start_time,
        end_time: booking.end_time,
      })

      if (slotError) throw slotError

      setPendingBookings(pendingBookings.filter((b) => b.id !== bookingId))
    } catch (err: any) {
      setError(err.message || "Failed to approve booking")
    } finally {
      setApproving(null)
    }
  }

  const handleRejectBooking = async (bookingId: string) => {
    setApproving(bookingId)
    try {
      const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", bookingId)

      if (error) throw error

      setPendingBookings(pendingBookings.filter((b) => b.id !== bookingId))
    } catch (err: any) {
      setError(err.message || "Failed to reject booking")
    } finally {
      setApproving(null)
    }
  }

  const handleDeleteSpace = async (spaceId: string) => {
    if (!window.confirm("Are you sure you want to delete this parking space?")) {
      return
    }

    setDeletingId(spaceId)
    try {
      const { error } = await supabase.from("parking_spaces").delete().eq("id", spaceId)

      if (error) throw error

      setSpaces(spaces.filter((s) => s.id !== spaceId))
    } catch (err: any) {
      setError(err.message || "Failed to delete space")
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar userType="owner" userName={userName} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

        {pendingBookings.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center mb-6">
              <Clock className="w-6 h-6 mr-3 text-amber-600" />
              <h2 className="text-2xl font-bold">Pending Bookings</h2>
              <span className="ml-3 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-semibold">
                {pendingBookings.length}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingBookings.map((booking) => (
                <Card key={booking.id} className="border-amber-200 dark:border-amber-900">
                  <CardHeader>
                    <CardTitle className="text-lg">{booking.space_title}</CardTitle>
                    <CardDescription>From: {booking.seeker_name}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Check-in:</span>
                        <span className="font-medium">{new Date(booking.start_time).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Check-out:</span>
                        <span className="font-medium">{new Date(booking.end_time).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-gray-600 dark:text-gray-400">Total Price:</span>
                        <span className="font-bold text-green-600">₹{booking.total_price.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={() => handleApproveBooking(booking.id)}
                        disabled={approving === booking.id}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleRejectBooking(booking.id)}
                        disabled={approving === booking.id}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {bookedBookings.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center mb-6">
              <CheckCircle className="w-6 h-6 mr-3 text-green-600" />
              <h2 className="text-2xl font-bold">Booking Received</h2>
              <span className="ml-3 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                {bookedBookings.length}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookedBookings.map((booking) => (
                <Card key={booking.id} className="border-green-200 dark:border-green-900">
                  <CardHeader>
                    <CardTitle className="text-lg">{booking.space_title}</CardTitle>
                    <CardDescription>Booked by: {booking.seeker_name}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Check-in:</span>
                        <span className="font-medium">{new Date(booking.start_time).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Check-out:</span>
                        <span className="font-medium">{new Date(booking.end_time).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-gray-600 dark:text-gray-400">Total Price:</span>
                        <span className="font-bold text-green-600">₹{booking.total_price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-2">
                        <span className="text-gray-600 dark:text-gray-400">Contact:</span>
                        <span className="font-medium">{booking.seeker_contact}</span>
                      </div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-2 text-center text-sm text-green-700 dark:text-green-300 font-medium">
                      ✓ Booking Confirmed
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Parking Spaces</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Manage and monitor your parking spaces</p>
          </div>
          <Link href="/dashboard/owner/add-space">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <PlusCircle className="w-5 h-5 mr-2" />
              Add Space
            </Button>
          </Link>
        </div>

        {spaces.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400">You haven't listed any parking spaces yet.</p>
                <Link href="/dashboard/owner/add-space">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">Create Your First Listing</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {spaces.map((space) => (
              <Card key={space.id} className="hover:shadow-lg transition-shadow h-full">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{space.title}</CardTitle>
                      <CardDescription className="flex items-center mt-2">
                        <MapPin className="w-4 h-4 mr-1" />
                        {space.address}
                      </CardDescription>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${space.is_available ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}
                    >
                      {space.is_available ? "Available" : "Unavailable"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                        <span>₹{space.price_per_hour}/hr</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                        <span>
                          {space.capacity} spot{space.capacity > 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <Link href={`/dashboard/owner/edit-space/${space.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full bg-transparent">
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDeleteSpace(space.id)}
                      disabled={deletingId === space.id}
                    >
                      {deletingId === space.id ? "Deleting..." : "Delete"}
                    </Button>
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
