"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2, Users, ArrowRight } from "lucide-react"
import { toast } from "@/lib/toast"

export default function OnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status, update } = useSession()
  const [loading, setLoading] = useState(false)
  const [selectedOption, setSelectedOption] = useState<"create" | "join" | null>(null)
  const [organizationName, setOrganizationName] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated") {
      const organizationId = (session?.user as any)?.organizationId

      // If user already has organization, redirect to dashboard
      if (organizationId) {
        router.push("/dashboard")
      }
    }
  }, [status, session, router])

  const handleCreateOrganization = async () => {
    if (!organizationName.trim()) {
      toast.error("Please enter an organization name")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/organization/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: organizationName }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Organization created successfully!")
        // Update session to reflect new role and organization
        await update()
        router.push("/dashboard/organization")
      } else {
        toast.error(data.error || "Failed to create organization")
      }
    } catch (error) {
      console.error("Error creating organization:", error)
      toast.error("Failed to create organization")
    } finally {
      setLoading(false)
    }
  }

  const handleSearchOrganizations = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter an organization name to search")
      return
    }

    setSearching(true)

    try {
      const response = await fetch(`/api/organization/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()

      if (response.ok) {
        setSearchResults(data.organizations || [])
        if (data.organizations.length === 0) {
          toast.error("No organizations found")
        }
      } else {
        toast.error(data.error || "Failed to search organizations")
      }
    } catch (error) {
      console.error("Error searching organizations:", error)
      toast.error("Failed to search organizations")
    } finally {
      setSearching(false)
    }
  }

  const handleRequestToJoin = async (organizationId: string, organizationName: string) => {
    setLoading(true)

    try {
      const response = await fetch("/api/organization/join-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Join request sent to ${organizationName}! Waiting for admin approval.`)
        router.push("/dashboard?pending=true")
      } else {
        toast.error(data.error || "Failed to send join request")
      }
    } catch (error) {
      console.error("Error sending join request:", error)
      toast.error("Failed to send join request")
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = async () => {
    setLoading(true)

    try {
      // Create a default organization with user's name
      const userName = session?.user?.name || "My"
      const defaultOrgName = `${userName}'s Workspace`

      const response = await fetch("/api/organization/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: defaultOrgName }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Default workspace created! You can join other organizations anytime.")
        // Update session to reflect new role and organization
        await update()
        router.push("/dashboard")
      } else {
        toast.error(data.error || "Failed to create workspace")
      }
    } catch (error) {
      console.error("Error creating default workspace:", error)
      toast.error("Failed to create workspace")
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            Welcome to VectorMind AI
          </h1>
          <p className="text-muted-foreground">Set up your workspace to get started</p>
        </div>

        {!selectedOption ? (
          <div className="grid md:grid-cols-2 gap-6">
            <Card
              className="cursor-pointer hover:shadow-xl transition-all border-2 hover:border-purple-500 bg-card"
              onClick={() => setSelectedOption("create")}
            >
              <CardHeader>
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
                  <Building2 className="h-6 w-6 text-purple-500" />
                </div>
                <CardTitle>Create Organization</CardTitle>
                <CardDescription>
                  Start your own organization and invite team members to collaborate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Invite team members</li>
                  <li>• View all member activities</li>
                  <li>• Access organization analytics</li>
                  <li>• Manage team settings</li>
                </ul>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-xl transition-all border-2 hover:border-blue-500 bg-card"
              onClick={() => setSelectedOption("join")}
            >
              <CardHeader>
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
                <CardTitle>Join Organization</CardTitle>
                <CardDescription>
                  Request to join an existing organization and collaborate with your team
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Search for organizations</li>
                  <li>• Send join request</li>
                  <li>• Wait for admin approval</li>
                  <li>• Start collaborating</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        ) : selectedOption === "create" ? (
          <Card>
            <CardHeader>
              <CardTitle>Create Your Organization</CardTitle>
              <CardDescription>
                Enter a name for your organization. You'll be the admin and can invite team members later.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="orgName">Organization Name</Label>
                <Input
                  id="orgName"
                  placeholder="e.g., Acme Corporation"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleCreateOrganization}
                  disabled={loading || !organizationName.trim()}
                  className="flex-1"
                >
                  {loading ? "Creating..." : "Create Organization"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => setSelectedOption(null)} disabled={loading}>
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Join an Organization</CardTitle>
              <CardDescription>
                Search for an organization and send a join request. The admin will review and approve your request.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="search">Search Organization</Label>
                <div className="flex gap-2">
                  <Input
                    id="search"
                    placeholder="Enter organization name"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearchOrganizations()}
                    disabled={searching || loading}
                  />
                  <Button onClick={handleSearchOrganizations} disabled={searching || loading}>
                    {searching ? "Searching..." : "Search"}
                  </Button>
                </div>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <Label>Search Results</Label>
                  {searchResults.map((org) => (
                    <div
                      key={org._id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent"
                    >
                      <div>
                        <p className="font-medium">{org.name}</p>
                        <p className="text-sm text-muted-foreground">{org.memberCount} members</p>
                      </div>
                      <Button
                        onClick={() => handleRequestToJoin(org._id, org.name)}
                        disabled={loading}
                        size="sm"
                      >
                        Request to Join
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setSelectedOption(null)} disabled={loading} className="flex-1">
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center mt-6">
          <Button variant="ghost" onClick={handleSkip} disabled={loading}>
            {loading ? "Creating workspace..." : "Skip for now"}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            A default workspace will be created. You can join other organizations later.
          </p>
        </div>
      </div>
    </div>
  )
}
