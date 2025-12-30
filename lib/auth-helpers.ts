import { auth } from "@/auth"

export interface AuthSession {
  user: {
    id: string
    email: string
    name: string
    role: "individual" | "org-admin" | "member"
    organizationId?: string
  }
}

/**
 * Get the current authenticated session
 */
export async function getAuthSession(): Promise<AuthSession | null> {
  const session = await auth()
  return session as AuthSession | null
}

/**
 * Check if the user is an organization admin
 */
export function isOrgAdmin(session: AuthSession | null): boolean {
  return session?.user?.role === "org-admin"
}

/**
 * Check if the user is a member of an organization
 */
export function isOrgMember(session: AuthSession | null): boolean {
  return session?.user?.role === "member" || session?.user?.role === "org-admin"
}

/**
 * Verify if user can access organization data
 */
export function canAccessOrgData(
  session: AuthSession | null,
  organizationId: string
): boolean {
  if (!session?.user) return false
  
  // Must be part of an organization
  if (!isOrgMember(session)) return false
  
  // Must be in the same organization
  return session.user.organizationId === organizationId
}

/**
 * Verify organization membership
 */
export function verifyOrgMembership(
  session: AuthSession | null,
  organizationId: string
): { valid: boolean; error?: string } {
  if (!session?.user) {
    return { valid: false, error: "Not authenticated" }
  }

  if (!isOrgMember(session)) {
    return { valid: false, error: "Not a member of any organization" }
  }

  if (session.user.organizationId !== organizationId) {
    return { valid: false, error: "Not a member of this organization" }
  }

  return { valid: true }
}

/**
 * Check if user can manage organization (admin only)
 */
export function canManageOrganization(
  session: AuthSession | null,
  organizationId: string
): boolean {
  if (!session?.user || !isOrgAdmin(session)) return false
  return session.user.organizationId === organizationId
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth(): Promise<AuthSession> {
  const session = await getAuthSession()
  if (!session?.user) {
    throw new Error("Authentication required")
  }
  return session
}

/**
 * Require organization admin role
 */
export async function requireOrgAdmin(): Promise<AuthSession> {
  const session = await requireAuth()
  if (!isOrgAdmin(session)) {
    throw new Error("Organization admin access required")
  }
  return session
}

/**
 * Require organization membership
 */
export async function requireOrgMember(): Promise<AuthSession> {
  const session = await requireAuth()
  if (!isOrgMember(session)) {
    throw new Error("Organization membership required")
  }
  return session
}
