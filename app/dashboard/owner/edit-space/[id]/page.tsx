"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

export default function EditSpacePage() {
  const router = useRouter()
  const params = useParams()
  const spaceId = params.id as string
  const supabase = createClient()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [address, setAddress] = useState("")
  const [googleMapsLink, setGoogleMapsLink] = useState("")
  const [contactNumber, setContactNumber] = useState("")
  const [availabilityDateFrom, setAvailabilityDateFrom] = useState("")
  const [availabilityDateTo, setAvailabilityDateTo] = useState("")
  const [availabilityTimeFrom, setAvailabilityTimeFrom] = useState("")
  const [availabilityTimeTo, setAvailabilityTimeTo] = useState("")
  const [pricePerHour, setPricePerHour] = useState("")
  const [pricePerDay, setPricePerDay] = useState("")
  const [capacity, setCapacity] = useState("1")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSpace = async () => {
      try {
        const { data, error: fetchError } = await supabase.from("parking_spaces").select("*").eq("id", spaceId).single()

        if (fetchError) throw fetchError

        setTitle(data.title || "")
        setDescription(data.description || "")
        setAddress(data.address || "")
        setGoogleMapsLink(data.google_maps_link || "")
        setContactNumber(data.contact_number || "")
        setAvailabilityDateFrom(data.availability_date_from || "")
        setAvailabilityDateTo(data.availability_date_to || "")
        setAvailabilityTimeFrom(data.availability_time_from || "")
        setAvailabilityTimeTo(data.availability_time_to || "")
        setPricePerHour(data.price_per_hour?.toString() || "")
        setPricePerDay(data.price_per_day?.toString() || "")
        setCapacity(data.capacity?.toString() || "1")
      } catch (err: any) {
        setError(err.message || "Failed to load space")
      } finally {
        setLoading(false)
      }
    }

    fetchSpace()
  }, [spaceId, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) {
        router.push("/auth/login")
        return
      }

      const { error: updateError } = await supabase
        .from("parking_spaces")
        .update({
          title,
          description,
          address,
          google_maps_link: googleMapsLink,
          contact_number: contactNumber,
          availability_date_from: availabilityDateFrom,
          availability_date_to: availabilityDateTo,
          availability_time_from: availabilityTimeFrom,
          availability_time_to: availabilityTimeTo,
          price_per_hour: Number.parseFloat(pricePerHour),
          price_per_day: pricePerDay ? Number.parseFloat(pricePerDay) : null,
          capacity: Number.parseInt(capacity),
        })
        .eq("id", spaceId)
        .eq("owner_id", authData.user.id)

      if (updateError) throw updateError
      router.push("/dashboard/owner")
    } catch (err: any) {
      setError(err.message || "Failed to update space")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
        <Navbar userType="owner" />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500">Loading...</p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar userType="owner" />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Edit Parking Space</CardTitle>
            <CardDescription>Update the details of your parking space</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  type="text"
                  placeholder="e.g., Downtown Parking Spot"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Describe your parking space..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={submitting}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Address</label>
                <Input
                  type="text"
                  placeholder="Full address of the parking space"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Google Maps Link</label>
                <Input
                  type="url"
                  placeholder="https://maps.google.com/?q=..."
                  value={googleMapsLink}
                  onChange={(e) => setGoogleMapsLink(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Contact Number</label>
                <Input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">Availability Date Range</label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-gray-600 dark:text-gray-400">From</label>
                    <Input
                      type="date"
                      value={availabilityDateFrom}
                      onChange={(e) => setAvailabilityDateFrom(e.target.value)}
                      required
                      disabled={submitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-gray-600 dark:text-gray-400">To</label>
                    <Input
                      type="date"
                      value={availabilityDateTo}
                      onChange={(e) => setAvailabilityDateTo(e.target.value)}
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">Availability Time Range</label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-gray-600 dark:text-gray-400">From</label>
                    <Input
                      type="time"
                      value={availabilityTimeFrom}
                      onChange={(e) => setAvailabilityTimeFrom(e.target.value)}
                      required
                      disabled={submitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-gray-600 dark:text-gray-400">To</label>
                    <Input
                      type="time"
                      value={availabilityTimeTo}
                      onChange={(e) => setAvailabilityTimeTo(e.target.value)}
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Price per Hour (₹)</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="50.00"
                    value={pricePerHour}
                    onChange={(e) => setPricePerHour(e.target.value)}
                    required
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Price per Day (₹) (Optional)</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="400.00"
                    value={pricePerDay}
                    onChange={(e) => setPricePerDay(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Capacity (Number of Spaces)</label>
                <Input
                  type="number"
                  min="1"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={submitting}>
                {submitting ? "Updating..." : "Update Listing"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
