"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function JoinOrganizationPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session, status, update } = useSession()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [invite, setInvite] = useState<any>(null)

  const inviteCode = params.inviteCode as string

  useEffect(() => {
    const validateInvite = async () => {
      try {
        const res = await fetch(`/api/organization/join/validate?code=${inviteCode}`)
        const data = await res.json()

        if (!res.ok) {
          setError(data.error || "Invalid or expired invite link")
          setLoading(false)
          return
        }

        setInvite(data.invite)
        setLoading(false)
      } catch (error) {
        setError("Failed to validate invite")
        setLoading(false)
      }
    }

    if (inviteCode) {
      validateInvite()
    }
  }, [inviteCode])

  const handleJoinOrganization = async () => {
    if (!session?.user) {
      router.push(`/auth/signin?callbackUrl=/auth/join/${inviteCode}`)
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/organization/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: inviteCode }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to join organization")
        setLoading(false)
        return
      }

      // Force session update to get latest organizationId
      await update()
      
      // Navigate to dashboard (session now has organizationId)
      router.push("/dashboard")
    } catch (error) {
      setError("Failed to join organization")
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validating invite...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Invite</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/dashboard")} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join Organization</CardTitle>
          <CardDescription>
            You've been invited to join <strong>{invite?.organizationName}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!session?.user ? (
            <>
              <p className="text-sm text-gray-600">
                Please sign in or create an account to accept this invitation.
              </p>
              <div className="space-y-2">
                <Button onClick={handleJoinOrganization} className="w-full">
                  Sign In to Join
                </Button>
                <Button
                  onClick={() => router.push(`/auth/signup?callbackUrl=/auth/join/${inviteCode}`)}
                  variant="outline"
                  className="w-full"
                >
                  Create Account
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                Click the button below to join the organization as a member.
              </p>
              <Button onClick={handleJoinOrganization} className="w-full" disabled={loading}>
                {loading ? "Joining..." : "Accept Invitation"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
