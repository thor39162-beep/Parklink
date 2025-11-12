"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

export default function AddSpacePage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [address, setAddress] = useState("")
  const [latitude, setLatitude] = useState("")
  const [longitude, setLongitude] = useState("")
  const [pricePerHour, setPricePerHour] = useState("")
  const [pricePerDay, setPricePerDay] = useState("")
  const [capacity, setCapacity] = useState("1")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) {
        router.push("/auth/login")
        return
      }

      const { error: insertError } = await supabase.from("parking_spaces").insert({
        owner_id: authData.user.id,
        title,
        description,
        address,
        latitude: Number.parseFloat(latitude),
        longitude: Number.parseFloat(longitude),
        price_per_hour: Number.parseFloat(pricePerHour),
        price_per_day: pricePerDay ? Number.parseFloat(pricePerDay) : null,
        capacity: Number.parseInt(capacity),
      })

      if (insertError) throw insertError
      router.push("/dashboard/owner")
    } catch (err: any) {
      setError(err.message || "Failed to create space")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar userType="owner" />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">List a New Parking Space</CardTitle>
            <CardDescription>Fill in the details about your parking space</CardDescription>
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
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Describe your parking space..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={loading}
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
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Latitude</label>
                  <Input
                    type="number"
                    step="0.00001"
                    placeholder="40.7128"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Longitude</label>
                  <Input
                    type="number"
                    step="0.00001"
                    placeholder="-74.0060"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Price per Hour ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="5.00"
                    value={pricePerHour}
                    onChange={(e) => setPricePerHour(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Price per Day ($) (Optional)</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="40.00"
                    value={pricePerDay}
                    onChange={(e) => setPricePerDay(e.target.value)}
                    disabled={loading}
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
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                {loading ? "Creating..." : "Create Listing"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
