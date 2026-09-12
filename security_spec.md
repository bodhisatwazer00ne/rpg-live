# Security Specification for Habit Quest Life RPG

## 1. Data Invariants
- Each user profile document is keyed by `{userId}` matching `request.auth.uid`.
- Users can only read and write their own document `/users/{userId}`.
- Writing to `/users/{userId}` requires an authenticated session (`request.auth != null`).
- Unauthenticated users cannot read or write any user records.
- Document ID path `{userId}` must be a valid identifier.
- The `userId` field inside the document must match `request.auth.uid`.
- The user's `email` must match `request.auth.token.email`.
- Default-deny catch-all rule protects any unspecified paths.

## 2. The "Dirty Dozen" Threat Payloads
1. **Unauthenticated Read:** Anonymous or unauthenticated request reading `/users/victim_123`. Must return `PERMISSION_DENIED`.
2. **Cross-User Read:** Authenticated User A reading `/users/user_B`. Must return `PERMISSION_DENIED`.
3. **Cross-User Overwrite:** Authenticated User A writing into `/users/user_B`. Must return `PERMISSION_DENIED`.
4. **Id Spoofing in Payload:** Authenticated User A writing to `/users/user_A` with payload `{ userId: "user_B" }`. Must return `PERMISSION_DENIED`.
5. **Path Traversal / Junk Id:** User attempting to write to `/users/../../../malicious`. Must return `PERMISSION_DENIED`.
6. **Email Spoofing:** User writing email other than their authenticated email token. Must return `PERMISSION_DENIED`.
7. **Unauthenticated List Query:** Calling `getDocs(collection(db, "users"))`. Must return `PERMISSION_DENIED`.
8. **Over-sized Document ID:** Request with 1024-character userId. Must return `PERMISSION_DENIED`.
9. **Arbitrary Collection Write:** Writing to `/admins/user_A` or `/system_config/master`. Must return `PERMISSION_DENIED`.
10. **Document Deletion by Third Party:** User A trying to delete `/users/user_B`. Must return `PERMISSION_DENIED`.
11. **Shadow Collection Access:** Accessing subcollections without ownership rules. Must return `PERMISSION_DENIED`.
12. **Blanket Query Scraping:** Querying `/users` where userId is not specified or does not match caller UID. Must return `PERMISSION_DENIED`.
