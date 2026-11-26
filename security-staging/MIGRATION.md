# IlmNuri security migration — staging only

Do not publish these rules to the current production database before the authenticated client and backend are ready. They intentionally block the legacy browser's direct database access.

## Immediate containment
- In Firebase Console inspect Realtime Database rules. If public access is enabled, restrict it immediately, even if the legacy application must temporarily stop. Do not accept real student data while access is unverified.
- Treat legacy plaintext passwords as potentially exposed. Invalidate them and require a new password via independently verified enrollment. Do not import or reuse plaintext passwords.
- Keep a private encrypted owner-only backup; never commit database exports or credentials to GitHub.
- Inspect the repository for hardcoded administrator credentials and remove them from active code. Rotate any exposed credentials; deleting a line does not erase Git history.

## Target design
- Firebase Authentication identifies users with a verified enrollment flow; preserve legacy user IDs via a server-only mapping.
- Assign school member and administrator custom claims exclusively through a trusted Admin SDK process. Staff identities must be verified by a school administrator.
- Migrate profile, announcements, room membership, messages and certificates to separate v2 nodes. Exclude passwords and unnecessary personal data. Additional task and award endpoints require their own authorization rules.
- Write operations run through a trusted backend that validates membership, ownership, input length and role; grades and awards cannot be assigned by clients.
- Private chats are readable only by verified members (and explicitly authorized moderation staff if school policy permits; the draft admin read grant requires policy review).
- The draft rules in this directory deny direct writes. They are not a drop-in replacement for the current application.
- Protect push registration with authentication; route notifications only to intended recipients. Revoke subscriptions on logout.
- Remove sensitive legacy localStorage snapshots, including on installed PWA clients; review service worker caches and old versions.
- Use Firebase Emulator Suite to test anonymous denial, student cross-account denial, room isolation, direct-write denial and backend authorization before cutover.

## Cutover
1. Owner confirms Firebase project access and current rules, then enables appropriate Authentication provider.
2. Deploy authenticated backend and new frontend to a staging project with synthetic data only.
3. Run migration on private verified backup, preserving account-to-record mapping; enroll users with new credentials.
4. Restrict legacy path, release new client, validate real devices and monitor errors. Roll back to a secure maintenance screen, not public database access.

The GitHub branch is not connected to live Firebase. No production rules have been changed.
