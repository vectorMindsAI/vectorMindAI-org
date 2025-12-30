"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MemberManagement } from "@/components/member-management"
import JoinRequestsPanel from "@/components/join-requests-panel"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function OrganizationDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orgStats, setOrgStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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

      fetchOrgStats()
    }
  }, [status, session, router])

  const fetchOrgStats = async () => {
    try {
      const res = await fetch("/api/organization/stats")
      if (res.ok) {
        const data = await res.json()
        setOrgStats(data.stats)
      }
    } catch (error) {
      console.error("Error fetching org stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading organization...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Organization Management</h1>
        <p className="text-gray-600">Manage your team and monitor activity</p>
      </div>

      {orgStats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orgStats.totalMembers || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Searches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orgStats.totalSearches || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orgStats.activeMembers || 0}</div>
              <p className="text-xs text-gray-500">Last 7 days</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="requests">Join Requests</TabsTrigger>
          <TabsTrigger value="history">Organization History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <MemberManagement />
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <JoinRequestsPanel />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Organization Search History</CardTitle>
              <CardDescription>View all searches by your team members</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Go to the main dashboard to see the complete search history with member labels.
              </p>
              <button
                onClick={() => router.push("/dashboard")}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                View History
              </button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Organization Settings</CardTitle>
              <CardDescription>Configure organization preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Settings coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
