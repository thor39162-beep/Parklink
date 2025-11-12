"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface NavbarProps {
  userType?: "owner" | "seeker"
  userName?: string
}

export function Navbar({ userType = "seeker", userName = "User" }: NavbarProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
      router.push("/auth/login")
    } catch (err) {
      console.error("Error logging out:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href={userType === "owner" ? "/dashboard/owner" : "/dashboard"} className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              P
            </div>
            <span className="font-bold text-xl hidden sm:inline">ParkLink</span>
          </Link>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
              {userType === "owner" ? "Space Owner" : "Space Seeker"}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="rounded-full w-10 h-10 p-0">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profile Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} disabled={loading} className="text-red-600 cursor-pointer">
                  {loading ? "Signing out..." : "Sign Out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  )
}
