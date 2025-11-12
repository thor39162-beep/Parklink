"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, MapPin, DollarSign, Users, Phone, Map, Calendar, Clock } from "lucide-react"

interface ParkingSpace {
  id: string
  title: string
  description: string
  address: string
  google_maps_link: string
  contact_number: string
  availability_date_from: string
  availability_date_to: string
  availability_time_from: string
  availability_time_to: string
  price_per_hour: number
  price_per_day: number | null
  capacity: number
  owner_id: string
}

export default function SpaceDetailPage() {
  const [space, setSpace] = useState<ParkingSpace | null>(null)
  const [startDate, setStartDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endDate, setEndDate] = useState("")
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
    if (startDate && startTime && endDate && endTime && space) {
      const startDateTime = `${startDate}T${startTime}`
      const endDateTime = `${endDate}T${endTime}`

      const start = new Date(startDateTime)
      const end = new Date(endDateTime)
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
  }, [startDate, startTime, endDate, endTime, space])

  const formatTimeAmPm = (time24: string): string => {
    if (!time24) return ""
    const [hours, minutes] = time24.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const hour12 = hour % 12 || 12
    return `${hour12.toString().padStart(2, "0")}:${minutes} ${ampm}`
  }

  const validateDateTime = (date: string, time: string, isEndTime = false): string | null => {
    if (!space || !date || !time) return null

    const selectedDate = new Date(`${date}T00:00:00Z`)

    // Handle availability dates - they might be ISO strings or need proper parsing
    const availFromDateStr = space.availability_date_from.split("T")[0]
    const availToDateStr = space.availability_date_to.split("T")[0]

    const availFromDate = new Date(`${availFromDateStr}T00:00:00Z`)
    const availToDate = new Date(`${availToDateStr}T00:00:00Z`)

    const availFromTime = space.availability_time_from
    const availToTime = space.availability_time_to

    // Check date constraints
    if (selectedDate < availFromDate) {
      return `Booking date cannot be before ${new Date(availFromDateStr).toLocaleDateString()}`
    }
    if (selectedDate > availToDate) {
      return `Booking date cannot be after ${new Date(availToDateStr).toLocaleDateString()}`
    }

    // Check time constraints
    if (time < availFromTime) {
      return `Booking time must be at or after ${formatTimeAmPm(availFromTime)}`
    }
    if (isEndTime && time > availToTime) {
      return `Booking end time must be at or before ${formatTimeAmPm(availToTime)}`
    }

    return null
  }

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const validationError = validateDateTime(value, startTime)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    setStartDate(value)
  }

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const validationError = validateDateTime(startDate, value)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    setStartTime(value)
  }

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const validationError = validateDateTime(value, endTime, true)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    setEndDate(value)
  }

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const validationError = validateDateTime(endDate, value, true)
    if (validationError) {
      setError(validationError)
      return
    }

    // Also validate that end datetime is after start datetime
    if (startDate && startTime && endDate) {
      const startDateTime = `${startDate}T${startTime}`
      const endDateTime = `${endDate}T${value}`
      if (endDateTime <= startDateTime) {
        setError("End time must be after start time")
        return
      }
    }

    setError(null)
    setEndTime(value)
  }

  const handleBooking = async () => {
    if (!startDate || !startTime || !endDate || !endTime) {
      setError("Please select both start and end dates and times")
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

      const startDateTime = `${startDate}T${startTime}`
      const endDateTime = `${endDate}T${endTime}`

      const { error: bookingError } = await supabase.from("bookings").insert({
        space_id: spaceId,
        seeker_id: authData.user.id,
        owner_id: space.owner_id,
        start_time: startDateTime,
        end_time: endDateTime,
        total_price: totalPrice,
        status: "pending",
      })

      if (bookingError) throw bookingError

      setSuccessMessage("Booking created successfully! The owner will review your request.")
      setStartDate("")
      setStartTime("")
      setEndDate("")
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

                {space.google_maps_link && (
                  <a href={space.google_maps_link} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2">
                      <Map className="w-4 h-4" />
                      View on Google Maps
                    </Button>
                  </a>
                )}

                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Owner Contact</p>
                      <p className="font-semibold">{space.contact_number}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg space-y-3">
                  <h3 className="font-semibold text-amber-900 dark:text-amber-100">Availability Window</h3>
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-amber-600" />
                    <div>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        {new Date(space.availability_date_from).toLocaleDateString()} to{" "}
                        {new Date(space.availability_date_to).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-amber-600" />
                    <div>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        {formatTimeAmPm(space.availability_time_from)} to {formatTimeAmPm(space.availability_time_to)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-slate-900 rounded-lg">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Hourly Rate</p>
                      <p className="font-semibold">₹{space.price_per_hour}/hr</p>
                    </div>
                  </div>
                  {space.price_per_day && (
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-slate-900 rounded-lg">
                      <DollarSign className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Daily Rate</p>
                        <p className="font-semibold">₹{space.price_per_day}/day</p>
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
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={handleStartDateChange}
                    disabled={bookingLoading}
                    min={space.availability_date_from.split("T")[0]}
                    max={space.availability_date_to.split("T")[0]}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Start Time ({formatTimeAmPm(startTime) || "HH:MM AM/PM"})
                  </label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={handleStartTimeChange}
                    disabled={bookingLoading}
                    min={space.availability_time_from}
                    max={space.availability_time_to}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={handleEndDateChange}
                    disabled={bookingLoading}
                    min={startDate || space.availability_date_from.split("T")[0]}
                    max={space.availability_date_to.split("T")[0]}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">End Time ({formatTimeAmPm(endTime) || "HH:MM AM/PM"})</label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={handleEndTimeChange}
                    disabled={bookingLoading}
                    min={space.availability_time_from}
                    max={space.availability_time_to}
                  />
                </div>

                {totalPrice > 0 && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Price</span>
                      <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        ₹{totalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleBooking}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={bookingLoading || !startDate || !startTime || !endDate || !endTime}
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
