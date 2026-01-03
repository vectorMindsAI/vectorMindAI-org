"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Key, Plus, Trash2, Save } from "lucide-react"
import { toast } from "@/lib/toast"
import Link from "next/link"

interface ApiKey {
  provider: string
  apiKey: string
}

const commonProviders = [
  { name: "groq", label: "Groq" },
  { name: "openai", label: "OpenAI" },
  { name: "anthropic", label: "Anthropic" },
  { name: "google", label: "Google AI" },
  { name: "tavily", label: "Tavily Search" },
  { name: "perplexity", label: "Perplexity" },
  { name: "cohere", label: "Cohere" },
]

export default function ApiKeysPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated") {
      fetchApiKeys()
    }
  }, [status, router])

  const fetchApiKeys = async () => {
    try {
      const response = await fetch("/api/user/api-keys")
      const data = await response.json()

      if (response.ok && data.apiKeys) {
        setApiKeys(data.apiKeys)
      }
    } catch (error) {
      console.error("Error fetching API keys:", error)
      toast.error("Failed to load API keys")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveKeys = async () => {
    setSaving(true)
    try {
      console.log("Sending API keys:", apiKeys)
      
      const response = await fetch("/api/user/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKeys }),
      })

      const data = await response.json()
      console.log("Response from server:", data)

      if (response.ok) {
        toast.success("API keys saved successfully!")
        // Reload the keys to confirm save
        await fetchApiKeys()
      } else {
        console.error("Error response:", data)
        toast.error(data.error || "Failed to save API keys")
      }
    } catch (error) {
      console.error("Error saving API keys:", error)
      toast.error("Failed to save API keys")
    } finally {
      setSaving(false)
    }
  }

  const addNewKey = () => {
    setApiKeys([...apiKeys, { provider: "", apiKey: "" }])
  }

  const removeKey = (index: number) => {
    setApiKeys(apiKeys.filter((_, i) => i !== index))
  }

  const updateKey = (index: number, field: "provider" | "apiKey", value: string) => {
    const updated = [...apiKeys]
    updated[index][field] = value
    setApiKeys(updated)
  }

  const addCommonProvider = (providerName: string) => {
    // Check if provider already exists
    const exists = apiKeys.some(k => k.provider === providerName)
    if (exists) {
      toast.error(`${providerName} already added`)
      return
    }
    setApiKeys([...apiKeys, { provider: providerName, apiKey: "" }])
  }

  if (loading) {
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
    <div className="min-h-screen bg-background p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Key className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>API Keys Management</CardTitle>
                <CardDescription>
                  Store your API keys securely. They'll be automatically used when you select a model.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Quick Add Common Providers */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Quick Add Common Providers</Label>
              <div className="flex flex-wrap gap-2">
                {commonProviders.map((provider) => (
                  <Button
                    key={provider.name}
                    variant="outline"
                    size="sm"
                    onClick={() => addCommonProvider(provider.name)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {provider.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* API Keys List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Your API Keys</Label>
                <Button variant="outline" size="sm" onClick={addNewKey}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Custom Key
                </Button>
              </div>

              {apiKeys.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <Key className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No API keys saved yet</p>
                  <p className="text-muted-foreground text-xs">Add your first key to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {apiKeys.map((key, index) => (
                    <Card key={index} className="bg-card border">
                      <CardContent className="pt-6">
                        <div className="grid gap-4 md:grid-cols-[200px_1fr_auto]">
                          <div>
                            <Label className="text-xs">Provider Name</Label>
                            <Input
                              placeholder="e.g., groq"
                              value={key.provider}
                              onChange={(e) => updateKey(index, "provider", e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">API Key</Label>
                            <Input
                              type="password"
                              placeholder="Enter API key"
                              value={key.apiKey}
                              onChange={(e) => updateKey(index, "apiKey", e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div className="flex items-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeKey(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="flex gap-3 pt-4">
              <Button onClick={handleSaveKeys} disabled={saving} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save All Keys"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
