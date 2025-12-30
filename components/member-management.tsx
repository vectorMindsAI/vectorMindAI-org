"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/lib/toast"

interface Member {
  userId: string
  name: string
  email: string
  role: "org-admin" | "member"
  joinedAt: string
  image?: string
}

interface Invite {
  code: string
  email?: string
  expiresAt: string
  link?: string
}

export function MemberManagement() {
  const [members, setMembers] = useState<Member[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState("")
  const [creatingInvite, setCreatingInvite] = useState(false)
  const [showInviteForm, setShowInviteForm] = useState(false)

  useEffect(() => {
    fetchMembers()
    fetchInvites()
  }, [])

  const fetchMembers = async () => {
    try {
      const res = await fetch("/api/organization/members")
      const data = await res.json()

      if (res.ok) {
        setMembers(data.members)
      }
    } catch (error) {
      console.error("Error fetching members:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchInvites = async () => {
    try {
      const res = await fetch("/api/organization/invite")
      const data = await res.json()

      if (res.ok) {
        setInvites(data.invites)
      }
    } catch (error) {
      console.error("Error fetching invites:", error)
    }
  }

  const handleCreateInvite = async () => {
    setCreatingInvite(true)
    try {
      const res = await fetch("/api/organization/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail || undefined,
          expiresInDays: 7,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success("Invite created - Invite link has been generated")
        setInviteEmail("")
        setShowInviteForm(false)
        fetchInvites()

        // Copy to clipboard
        if (data.invite?.link) {
          navigator.clipboard.writeText(data.invite.link)
          toast.success("Copied to clipboard - Invite link has been copied")
        }
      } else {
        toast.error(data.error || "Failed to create invite")
      }
    } catch (error) {
      toast.error("Failed to create invite")
    } finally {
      setCreatingInvite(false)
    }
  }

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!confirm(`Remove ${userName} from the organization?`)) {
      return
    }

    try {
      const res = await fetch("/api/organization/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(`Member removed - ${userName} has been removed`)
        fetchMembers()
      } else {
        toast.error(data.error || "Failed to remove member")
      }
    } catch (error) {
      toast.error("Failed to remove member")
    }
  }

  const handleDeleteInvite = async (code: string) => {
    try {
      const res = await fetch("/api/organization/invite", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })

      if (res.ok) {
        toast.success("Invite deleted - Invite has been removed")
        fetchInvites()
      }
    } catch (error) {
      toast.error("Failed to delete invite")
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading members...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>Manage your organization members</CardDescription>
            </div>
            <Button onClick={() => setShowInviteForm(!showInviteForm)}>
              {showInviteForm ? "Cancel" : "Invite Member"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showInviteForm && (
            <div className="mb-6 p-4 border rounded-lg space-y-3">
              <div>
                <label className="text-sm font-medium">Email (optional)</label>
                <Input
                  type="email"
                  placeholder="member@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to create a general invite link
                </p>
              </div>
              <Button onClick={handleCreateInvite} disabled={creatingInvite}>
                {creatingInvite ? "Creating..." : "Generate Invite Link"}
              </Button>
            </div>
          )}

          <div className="space-y-4">
            {members.map((member) => (
              <div
                key={member.userId}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  {member.image && (
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-10 h-10 rounded-full"
                    />
                  )}
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                    <p className="text-xs text-gray-400">
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge variant={member.role === "org-admin" ? "default" : "secondary"}>
                    {member.role === "org-admin" ? "Admin" : "Member"}
                  </Badge>
                  {member.role !== "org-admin" && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveMember(member.userId, member.name)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {invites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Invites</CardTitle>
            <CardDescription>Pending invitation links</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invites.map((invite) => (
                <div
                  key={invite.code}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium">{invite.email || "General invite"}</p>
                    <p className="text-xs text-gray-500">
                      Expires {new Date(invite.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const link = `${window.location.origin}/auth/join/${invite.code}`
                        navigator.clipboard.writeText(link)
                        toast.success("Copied - Invite link copied to clipboard")
                      }}
                    >
                      Copy Link
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteInvite(invite.code)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
