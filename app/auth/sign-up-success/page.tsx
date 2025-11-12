"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SignUpSuccessPage() {
  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
        <CardDescription>We've sent you a confirmation link</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
          <p className="text-sm">
            Please check your email to verify your account. Once confirmed, you can log in to ParkLink.
          </p>
        </div>

        <div className="text-center text-sm text-gray-600">
          <p>Didn't receive the email? Check your spam folder or try signing up again.</p>
        </div>

        <Link href="/auth/login" className="block">
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Back to Sign In</Button>
        </Link>
      </CardContent>
    </Card>
  )
}
