"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/lib/toast"

export default function OrganizationSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [organization, setOrganization] = useState<any>(null)
  const [orgName, setOrgName] = useState("")

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

      fetchOrganization()
    }
  }, [status, session, router])

  const fetchOrganization = async () => {
    try {
      const res = await fetch("/api/organization/info")
      if (res.ok) {
        const data = await res.json()
        setOrganization(data.organization)
        setOrgName(data.organization.name)
      }
    } catch (error) {
      console.error("Error fetching organization:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateName = async () => {
    if (!orgName || orgName.trim().length < 2) {
      toast.error("Organization name must be at least 2 characters")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/organization/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgName.trim() }),
      })

      if (res.ok) {
        toast.success("Organization name updated successfully")
        fetchOrganization()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to update organization")
      }
    } catch (error) {
      toast.error("Failed to update organization")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteOrganization = async () => {
    if (!confirm(
      "Are you sure you want to delete this organization? This action cannot be undone. All members will lose access."
    )) {
      return
    }

    const confirmation = prompt('Type "DELETE" to confirm:')
    if (confirmation !== "DELETE") {
      toast.error("Deletion cancelled - confirmation text did not match")
      return
    }

    try {
      const res = await fetch("/api/organization/delete", {
        method: "DELETE",
      })

      if (res.ok) {
        toast.success("Organization deleted successfully")
        router.push("/dashboard")
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to delete organization")
      }
    } catch (error) {
      toast.error("Failed to delete organization")
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Organization Settings</h1>
        <p className="text-gray-600">Manage your organization preferences and configuration</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Update your organization name and details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="orgName">Organization Name</Label>
            <Input
              id="orgName"
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="My Organization"
            />
          </div>
          <Button onClick={handleUpdateName} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Organization Information</CardTitle>
          <CardDescription>View your organization details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between py-2">
            <span className="text-sm font-medium">Total Members</span>
            <span className="text-sm text-gray-600">
              {organization?.members?.length || 0}
            </span>
          </div>
          <Separator />
          <div className="flex justify-between py-2">
            <span className="text-sm font-medium">Created</span>
            <span className="text-sm text-gray-600">
              {organization?.createdAt
                ? new Date(organization.createdAt).toLocaleDateString()
                : "N/A"}
            </span>
          </div>
          <Separator />
          <div className="flex justify-between py-2">
            <span className="text-sm font-medium">Organization ID</span>
            <span className="text-sm text-gray-600 font-mono">
              {organization?._id || "N/A"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>Irreversible and destructive actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Delete Organization</h4>
            <p className="text-sm text-gray-600 mb-4">
              Once you delete an organization, there is no going back. All members will lose
              access, and all organization data will be permanently deleted.
            </p>
            <Button variant="destructive" onClick={handleDeleteOrganization}>
              Delete Organization
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
