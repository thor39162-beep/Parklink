"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Mail, User, UserCheck } from "lucide-react"

interface UserProfile {
  id: string
  email: string
  full_name: string
  user_type: "owner" | "seeker"
  avatar_url: string | null
  created_at: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [fullName, setFullName] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser()
        if (!authData.user) {
          router.push("/auth/login")
          return
        }

        const { data: profileData, error: profileError } = await supabase
          .from("users_profile")
          .select("*")
          .eq("id", authData.user.id)
          .single()

        if (profileError) throw profileError

        setProfile(profileData)
        setFullName(profileData.full_name || "")
      } catch (err: any) {
        setError(err.message || "Failed to load profile")
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [router, supabase])

  const handleSaveProfile = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) return

      const { error: updateError } = await supabase
        .from("users_profile")
        .update({
          full_name: fullName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", authData.user.id)

      if (updateError) throw updateError

      setSuccess("Profile updated successfully!")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">Profile not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Profile Settings</CardTitle>
            <CardDescription>Manage your ParkLink account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">{success}</div>
            )}

            <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-slate-900 rounded-lg">
              <div className="w-16 h-16 bg-blue-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-2xl font-semibold text-blue-600 dark:text-blue-400">
                {profile.full_name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{profile.full_name || "User"}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{profile.email}</p>
              </div>
              <Badge className="bg-blue-100 text-blue-800">
                {profile.user_type === "owner" ? "Space Owner" : "Space Seeker"}
              </Badge>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Full Name
                </label>
                <Input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={saving} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </label>
                <Input type="email" value={profile.email} disabled className="bg-gray-100 dark:bg-slate-800" />
                <p className="text-xs text-gray-600 dark:text-gray-400">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center">
                  <UserCheck className="w-4 h-4 mr-2" />
                  Account Type
                </label>
                <Input
                  type="text"
                  value={profile.user_type === "owner" ? "Space Owner" : "Space Seeker"}
                  disabled
                  className="bg-gray-100 dark:bg-slate-800"
                />
                <p className="text-xs text-gray-600 dark:text-gray-400">Account type cannot be changed</p>
              </div>

              <div className="text-xs text-gray-500 pt-2">
                Member since {new Date(profile.created_at).toLocaleDateString()}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
              <Button
                onClick={handleSaveProfile}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Dashboard Links</CardTitle>
            <CardDescription>Quick access to your spaces and bookings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile.user_type === "owner" && (
              <>
                <Link href="/dashboard/owner">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    My Parking Spaces
                  </Button>
                </Link>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage and monitor all your listed parking spaces
                </p>
              </>
            )}
            {profile.user_type === "seeker" && (
              <>
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    Browse Parking Spaces
                  </Button>
                </Link>
                <Link href="/dashboard/bookings">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    My Bookings
                  </Button>
                </Link>
                <Link href="/dashboard/favorites">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    Favorite Spaces
                  </Button>
                </Link>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  View your parking bookings and saved favorites
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
