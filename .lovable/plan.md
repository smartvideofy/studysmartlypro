

# Add Connected Accounts Section to Settings

## What It Does
Shows the user which login methods are connected to their account (Email, Google) and lets them link/unlink additional providers. For example, someone who signed up with email can link their Google account for faster logins in the future.

## How It Works
- Reads `user.identities` from the Supabase auth user object (already available via `useAuth`)
- Each identity has a `provider` field ("email", "google", etc.) and metadata like email address
- Linking: calls `supabase.auth.linkIdentity({ provider: 'google' })` to add Google
- Unlinking: calls `supabase.auth.unlinkIdentity(identity)` to remove a linked provider (only if 2+ providers exist)

## What Gets Built

### New Component: `src/components/settings/ConnectedAccountsSection.tsx`
- Lists each connected identity with a provider icon (Mail icon for email, a Google "G" for Google)
- Shows the email/identifier associated with each provider
- "Link Google Account" button if Google isn't connected yet
- "Unlink" button on non-primary providers (disabled if only one provider exists, to prevent lockout)

### Modified File: `src/pages/SettingsPage.tsx`
- New "Connected Accounts" section placed between the Account and Study Preferences sections
- Uses the existing `Section`, `SettingRow`, and `LinkRow` patterns for consistency

## Technical Details
- No database changes needed -- identity data comes from `supabase.auth.getUser()`
- The `user.identities` array is already available from the auth session
- `supabase.auth.linkIdentity()` triggers an OAuth redirect flow, then returns the user back
- `supabase.auth.unlinkIdentity()` requires the identity object with `identity_id` and `provider`
- Safety: prevent unlinking the last remaining provider

