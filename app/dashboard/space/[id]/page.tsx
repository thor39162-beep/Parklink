"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, MapPin, DollarSign, Users } from "lucide-react"

interface ParkingSpace {
  id: string
  title: string
  description: string
  address: string
  price_per_hour: number
  price_per_day: number | null
  capacity: number
  owner_id: string
}

export default function SpaceDetailPage() {
  const [space, setSpace] = useState<ParkingSpace | null>(null)
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [totalPrice, setTotalPrice] = useState(0)
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const router = useRouter()
  const params = useParams()
  const spaceId = params.id as string
  const supabase = createClient()

  useEffect(() => {
    const loadSpace = async () => {
      try {
        const { data: spaceData, error: spaceError } = await supabase
          .from("parking_spaces")
          .select("*")
          .eq("id", spaceId)
          .single()

        if (spaceError) throw spaceError
        setSpace(spaceData)
      } catch (err: any) {
        setError(err.message || "Failed to load space")
      } finally {
        setLoading(false)
      }
    }

    loadSpace()
  }, [spaceId, supabase])

  useEffect(() => {
    if (startTime && endTime && space) {
      const start = new Date(startTime)
      const end = new Date(endTime)
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)

      if (hours > 0) {
        let price = hours * space.price_per_hour
        // If it's more than 24 hours and daily price exists, use daily rate for full days
        if (space.price_per_day && hours >= 24) {
          const fullDays = Math.floor(hours / 24)
          const remainingHours = hours % 24
          price = fullDays * space.price_per_day + remainingHours * space.price_per_hour
        }
        setTotalPrice(Math.round(price * 100) / 100)
      } else {
        setTotalPrice(0)
      }
    }
  }, [startTime, endTime, space])

  const handleBooking = async () => {
    if (!startTime || !endTime) {
      setError("Please select both start and end times")
      return
    }

    setBookingLoading(true)
    setError(null)

    try {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) {
        router.push("/auth/login")
        return
      }

      if (!space) return

      const { error: bookingError } = await supabase.from("bookings").insert({
        space_id: spaceId,
        seeker_id: authData.user.id,
        owner_id: space.owner_id,
        start_time: startTime,
        end_time: endTime,
        total_price: totalPrice,
        status: "pending",
      })

      if (bookingError) throw bookingError

      setSuccessMessage("Booking created successfully! The owner will review your request.")
      setStartTime("")
      setEndTime("")
      setTotalPrice(0)

      setTimeout(() => {
        router.push("/dashboard/bookings")
      }, 2000)
    } catch (err: any) {
      setError(err.message || "Failed to create booking")
    } finally {
      setBookingLoading(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!space) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">Parking space not found</p>
            <Link href="/dashboard">
              <Button className="mt-4">Back to Browse</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar userType="seeker" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{space.title}</CardTitle>
                <CardDescription className="flex items-center mt-2">
                  <MapPin className="w-4 h-4 mr-2" />
                  {space.address}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {space.description && (
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-gray-600 dark:text-gray-400">{space.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-slate-900 rounded-lg">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Hourly Rate</p>
                      <p className="font-semibold">${space.price_per_hour}/hr</p>
                    </div>
                  </div>
                  {space.price_per_day && (
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-slate-900 rounded-lg">
                      <DollarSign className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Daily Rate</p>
                        <p className="font-semibold">${space.price_per_day}/day</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-slate-900 rounded-lg col-span-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Capacity</p>
                      <p className="font-semibold">
                        {space.capacity} spot{space.capacity > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Book This Space</CardTitle>
                <CardDescription>Select your parking dates and times</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">{error}</div>
                )}

                {successMessage && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded text-sm">
                    {successMessage}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Time</label>
                  <Input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    disabled={bookingLoading}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">End Time</label>
                  <Input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    disabled={bookingLoading}
                  />
                </div>

                {totalPrice > 0 && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Price</span>
                      <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        ${totalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleBooking}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={bookingLoading || !startTime || !endTime}
                >
                  {bookingLoading ? "Creating Booking..." : "Request Booking"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
