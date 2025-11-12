"use server"

import { createServiceClient } from "@/lib/supabase/server"

export async function createUserProfile(userId: string, email: string, fullName: string, userType: "owner" | "seeker") {
  const supabase = await createServiceClient()

  const { error } = await supabase.from("users_profile").insert({
    id: userId,
    email,
    full_name: fullName,
    user_type: userType,
  })

  if (error) {
    console.error("[v0] Profile creation error:", error)
    throw new Error(error.message || "Failed to create profile")
  }

  return { success: true }
}
