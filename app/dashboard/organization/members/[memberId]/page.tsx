"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, Mail, Calendar, Activity, History } from "lucide-react"

interface MemberProfile {
  userId: string
  name: string
  email: string
  role: string
  joinedAt: string
  image?: string
  stats: {
    totalSearches: number
    recentSearches: number
    lastActive?: string
  }
  recentHistory: Array<{
    _id: string
    query: string
    timestamp: string
    status: string
  }>
}

export default function MemberProfilePage() {
  const router = useRouter()
  const params = useParams()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [member, setMember] = useState<MemberProfile | null>(null)

  const memberId = params.memberId as string

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated") {
      const userRole = (session?.user as any)?.role
      if (userRole !== "org-admin") {
        router.push("/dashboard")
        return
      }

      fetchMemberProfile()
    }
  }, [status, session, memberId, router])

  const fetchMemberProfile = async () => {
    try {
      const res = await fetch(`/api/organization/members/${memberId}`)
      if (res.ok) {
        const data = await res.json()
        setMember(data.member)
      } else {
        router.push("/dashboard/organization")
      }
    } catch (error) {
      console.error("Error fetching member profile:", error)
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading member profile...</p>
        </div>
      </div>
    )
  }

  if (!member) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-500">Member not found</p>
            <Button onClick={() => router.push("/dashboard/organization")} className="mt-4">
              Back to Organization
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Member Profile</h1>
          <p className="text-gray-600">View detailed member activity and statistics</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/dashboard/organization")}>
          Back to Organization
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Member Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {member.image && (
              <img
                src={member.image}
                alt={member.name}
                className="w-24 h-24 rounded-full mx-auto"
              />
            )}
            <div className="text-center">
              <p className="font-bold text-lg">{member.name}</p>
              <p className="text-sm text-gray-600 flex items-center justify-center gap-1 mt-1">
                <Mail className="h-3 w-3" />
                {member.email}
              </p>
              <Badge className="mt-2">
                {member.role === "org-admin" ? "Admin" : "Member"}
              </Badge>
            </div>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Joined
                </span>
                <span className="font-medium">
                  {new Date(member.joinedAt).toLocaleDateString()}
                </span>
              </div>
              {member.stats.lastActive && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    Last Active
                  </span>
                  <span className="font-medium">
                    {new Date(member.stats.lastActive).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Searches</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{member.stats.totalSearches}</div>
                <p className="text-xs text-gray-500 mt-1">All-time searches</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{member.stats.recentSearches}</div>
                <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Search History
              </CardTitle>
              <CardDescription>Latest searches by this member</CardDescription>
            </CardHeader>
            <CardContent>
              {member.recentHistory.length > 0 ? (
                <div className="space-y-3">
                  {member.recentHistory.map((item) => (
                    <div
                      key={item._id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <p className="font-medium truncate">{item.query}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(item.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={item.status === "success" ? "default" : "destructive"}>
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No search history yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
