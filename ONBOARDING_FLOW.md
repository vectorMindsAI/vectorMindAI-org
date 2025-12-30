# Onboarding Flow Documentation

## Overview
This document describes the complete onboarding flow for new users in the VectorMind AI organization system.

## User Flow

### 1. New User Signup (Email/Password)
```
User → /auth/signup
  ↓ Fill form & submit
  ↓ Account created
  ↓ Auto sign-in
  ↓ Redirect to /dashboard
  ↓ Middleware checks: No organization?
  ↓ Redirect to /onboarding
  ↓ Choose: Create org OR Join org
  ↓ Complete onboarding
  ↓ Redirect to appropriate dashboard
```

### 2. New User Signup (Google OAuth)
```
User → /auth/signup → Click "Google"
  ↓ Google authentication
  ↓ New user created automatically
  ↓ Redirect to /dashboard
  ↓ Middleware checks: No organization?
  ↓ Redirect to /onboarding
  ↓ Choose: Create org OR Join org
  ↓ Complete onboarding
  ↓ Redirect to appropriate dashboard
```

### 3. Existing User Login
```
User → /auth/signin
  ↓ Sign in with credentials or Google
  ↓ Redirect to /dashboard
  ↓ Middleware checks: Has organization?
  ↓ Show dashboard (no redirect)
```

## Onboarding Page Options

### Option 1: Create Organization
1. User clicks "Create Organization"
2. Enters organization name
3. Clicks "Create"
4. Backend:
   - Creates organization
   - Sets user as org-admin
   - Updates user role and organizationId
5. Redirects to /dashboard/organization

### Option 2: Join Organization
1. User clicks "Join Organization"
2. Enters organization name to search
3. Clicks "Search"
4. Backend returns matching organizations
5. User clicks "Request to Join" on desired org
6. Backend:
   - Creates join request with status "pending"
   - Stores user info in organization.joinRequests
7. Redirects to /dashboard?pending=true
8. Shows message: "Waiting for admin approval"

### Option 3: Skip
1. User clicks "Skip for now"
2. Redirects to /dashboard as individual user
3. Can access onboarding later via link in dashboard

## Admin Approval Flow

### For Organization Admins
```
Admin → /dashboard/organization
  ↓ Click "Join Requests" tab
  ↓ See all pending requests with user details
  ↓ Click "Approve" or "Reject"
  ↓
  If Approved:
    - User added to organization.members
    - User.role set to "member"
    - User.organizationId set to org ID
    - Request status changed to "approved"
    - User can now access org features
  ↓
  If Rejected:
    - Request status changed to "rejected"
    - User remains as individual
```

## Middleware Logic

The middleware (`middleware.ts`) handles automatic redirection:

```typescript
When user accesses /dashboard:
  - Check if user has session
  - Check if user.organizationId exists
  - If NO organizationId → Redirect to /onboarding
  - If YES → Allow access to dashboard
```

## Key Files

### Authentication
- `/auth.ts` - NextAuth configuration
- `/app/api/auth/signup/route.ts` - User registration API

### Pages
- `/app/auth/signup/page.tsx` - Signup form
- `/app/auth/signin/page.tsx` - Signin form
- `/app/onboarding/page.tsx` - Onboarding selection

### API Routes
- `/app/api/organization/create/route.ts` - Create organization
- `/app/api/organization/search/route.ts` - Search organizations
- `/app/api/organization/join-request/route.ts` - Send/list join requests
- `/app/api/organization/join-request/[requestId]/route.ts` - Approve/reject requests

### Components
- `/components/join-requests-panel.tsx` - Admin panel for reviewing requests

## Database Changes

### Organization Model
```typescript
joinRequests: [{
  userId: string
  userName: string
  userEmail: string
  userImage?: string
  status: "pending" | "approved" | "rejected"
  requestedAt: Date
  respondedAt?: Date
  respondedBy?: string
}]
```

### User Model
```typescript
role: "individual" | "org-admin" | "member"
organizationId?: ObjectId
joinedAt?: Date
```

## Testing Checklist

- [ ] Create account with email/password → Redirects to onboarding
- [ ] Create account with Google → Redirects to onboarding
- [ ] Create organization from onboarding → Becomes org-admin
- [ ] Search for organization → Returns results
- [ ] Send join request → Appears in admin panel
- [ ] Approve join request → User becomes member
- [ ] Reject join request → User stays individual
- [ ] Skip onboarding → Can access dashboard as individual
- [ ] Existing user login → Goes directly to dashboard
- [ ] User with organization → No redirect to onboarding

## Security Considerations

1. **Data Isolation**: Users can only see organizations in search, not sensitive data
2. **Admin Only**: Only org-admins can approve/reject join requests
3. **Single Organization**: Users can only belong to one organization at a time
4. **Duplicate Prevention**: Cannot send multiple requests to same organization
5. **Session Validation**: All actions require valid authentication
