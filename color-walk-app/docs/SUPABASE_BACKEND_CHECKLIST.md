# Color Walk Supabase Backend Checklist

This document describes the backend capability required for the existing Expo app to move from local demo persistence to multi-device production data. It is a handoff document only. Do not run a migration blindly: confirm names with the backend owner first.

## 1. Existing Frontend Contract

The app already has Supabase Email Auth and these environment variables:

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

The app uses the authenticated `auth.users.id` UUID as the user identity. The client must only use the anon key. A service-role key must never be placed in Expo or the web build.

Current TypeScript records are in `src/types/index.ts`:

- `PhotoRecord`: captured image, date, target color, analysis result, optional location.
- `MoodRecord`: one diary mood/note per user/date.
- `CommunityPost`: photo post, caption, colour, likes and visibility.
- `FriendRecord`: requested/accepted user relationship.
- `ChallengeState`: daily one-to-one PK state.

## 2. Required Storage

Create a private bucket named `color-photos`.

Path convention:

```text
{auth.uid()}/{photo-id}.jpg
{auth.uid()}/avatars/{uuid}.jpg
```

Required rules:

- Authenticated users can upload only when the first path segment equals `auth.uid()::text`.
- Users can read/delete their own original images.
- Community feed images are read through short-lived signed URLs returned by an RPC/API, or through a separate resized public bucket. Do not make users' original/private images public.
- Restrict MIME types to `image/jpeg`, `image/png`, `image/webp`; cap the upload size, for example 10 MB.
- Generate a display thumbnail (for example 800 px WebP/JPEG) with an Edge Function or worker. Feed and album grid must not load original full-size images.

## 3. Database Tables

### 3.1 `profiles`

One row per auth user. Create it with an `auth.users` trigger at sign-up.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid primary key references auth.users(id)` | User identity |
| `nickname` | `text not null` | Public display name, unique or separately searchable public ID |
| `public_id` | `text unique not null` | Friend lookup identifier; do not expose email for search |
| `avatar_path` | `text null` | Storage object path |
| `is_discoverable` | `boolean default true` | Allows friend lookup |
| `created_at`, `updated_at` | `timestamptz` | Server timestamps |

Needed operations: fetch/update own profile; resolve an `is_discoverable` profile by `public_id`; return only safe public fields for another user.

### 3.2 `daily_targets`

This table is already read by the app. Keep it or expose equivalent RPC/API.

| Column | Type |
| --- | --- |
| `id` | `uuid` |
| `date` | `date unique` |
| `color_hex`, `color_name` | `text` |
| `target_category` | `text check ('红','橙','黄','绿','青','蓝','紫','粉')` |
| `quote` | `text` |
| `is_active` | `boolean` |

Public authenticated read is sufficient. Only admins can create/update targets.

### 3.3 `photos`

Every capture or selected image needs one row. This replaces local-only `PhotoRecord` storage.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid primary key` | Generated before upload or returned after insert |
| `user_id` | `uuid references profiles(id)` | Required, indexed |
| `created_at` | `timestamptz default now()` | Server source of truth for album/day counts |
| `image_path` | `text not null` | Private original storage path |
| `thumbnail_path` | `text null` | Display asset path |
| `source` | `text check ('camera','library')` | |
| `target_id` | `uuid references daily_targets(id) null` | Preserve target snapshot below as well |
| `color_hex`, `color_name`, `target_category` | `text` | Snapshot, protects history when daily target changes |
| `analysis` | `jsonb not null` | `distribution`, `targetRatio`, `success`, `reason`, `brightness`, `colorCoverage`, `analysisMode` |
| `latitude`, `longitude`, `location_accuracy` | numeric nullable | Private by default |
| `visibility` | `text check ('private','community') default 'private'` | A post must opt in explicitly |
| `deleted_at` | `timestamptz null` | Soft delete/audit |

Indexes: `(user_id, created_at desc)`, `(visibility, created_at desc)`, `(target_category, created_at desc)`.

RLS: owner can select/insert/update/delete own rows; other users cannot read private rows or coordinates. Community feed must not expose raw location.

### 3.4 `diary_entries`

One diary entry per user per local calendar date.

| Column | Type |
| --- | --- |
| `id` | `uuid primary key` |
| `user_id` | `uuid references profiles(id)` |
| `entry_date` | `date not null` |
| `mood` | `text check ('happy','calm','sad','restless','excited') null` |
| `note` | `text not null default ''` |
| `created_at`, `updated_at` | `timestamptz` |

Constraint: `unique (user_id, entry_date)`. RLS: only owner may read/write. Use UPSERT for save/update.

### 3.5 `friendships`

Do not store a friend relationship in only one direction.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid primary key` | |
| `requester_id`, `addressee_id` | `uuid references profiles(id)` | Check they differ |
| `status` | `text check ('pending','accepted','declined','blocked')` | |
| `created_at`, `responded_at` | `timestamptz` | |

Constraint: unique canonical pair. Use a generated `least_user_id`/`greatest_user_id`, or an RPC, to stop duplicate reciprocal requests.

Operations:

- Search public profile by public ID.
- Send request, list outgoing/incoming requests.
- Accept/decline/cancel/remove/block.
- List accepted friends with safe aggregate progress: today distinct colour count, total accepted photos, avatar URL.

RLS: only requester/addressee can read a relationship. Both can see accepted friends' aggregate data, not private photos/location/diary.

### 3.6 `community_posts`

Keep community content separate from `photos`; a photo can exist without a public post and one photo can optionally have a post.

| Column | Type |
| --- | --- |
| `id` | `uuid primary key` |
| `author_id` | `uuid references profiles(id)` |
| `photo_id` | `uuid references photos(id)` |
| `caption` | `text not null default ''`, max 140/500 by product decision |
| `visibility` | `text check ('public','friends','private') default 'public'` |
| `status` | `text check ('published','hidden','deleted')` |
| `created_at`, `updated_at` | `timestamptz` |

Constraint: choose whether a photo can have one public post (`unique(photo_id)`) or multiple posts. The current app expects one.

### 3.7 `post_likes`, `post_comments`, `post_shares`, `post_reports`

These cover every interaction shown or expected in the community UI.

| Table | Required columns | Constraint/RLS |
| --- | --- | --- |
| `post_likes` | `post_id`, `user_id`, `created_at` | `unique(post_id,user_id)`; user can create/delete own like |
| `post_comments` | `id`, `post_id`, `author_id`, `body`, `status`, timestamps | Authors manage own; public reads published comments |
| `post_shares` | `id`, `post_id`, `user_id`, `channel`, `created_at` | Optional analytics; own insert only |
| `post_reports` | `id`, `post_id`, `reporter_id`, `reason`, `status` | Reporter inserts/reads own; admin only sees all |

Feed API must return: post id, author display fields, caption, created time, thumbnail signed/public URL, target colour, like count, comment count, and `liked_by_me`.

### 3.8 `challenges` and `challenge_participants`

Use a participant table rather than fixed `opponent_name` fields so joining by code, score calculation and future multiplayer work correctly.

`challenges`:

| Column | Type |
| --- | --- |
| `id` | `uuid primary key` |
| `invite_code` | `text unique not null` |
| `mode` | `text check ('same_color','own_color')` |
| `target_date` | `date not null` |
| `target_id` | `uuid nullable references daily_targets(id)` |
| `creator_id` | `uuid references profiles(id)` |
| `status` | `text check ('inviting','active','completed','cancelled','expired')` |
| `max_participants` | `smallint default 2` |
| `created_at`, `expires_at`, `completed_at` | `timestamptz` |

`challenge_participants`:

| Column | Type |
| --- | --- |
| `challenge_id` | `uuid references challenges(id)` |
| `user_id` | `uuid references profiles(id)` |
| `joined_at` | `timestamptz` |
| `score` | integer default 0 or computed by RPC |
| `status` | `joined/left/disqualified` |

Constraints: `primary key(challenge_id,user_id)`, maximum participant count enforced by a transaction/RPC, one active challenge per user/date if that is the game rule.

Required RPC/API:

- `create_challenge(mode)` returns challenge and invite code.
- `join_challenge(invite_code)` validates expiry/capacity/auth and adds participant atomically.
- `get_challenge(challenge_id)` returns both participants and scores.
- `list_my_active_challenges()`.
- `finish_expired_challenges()` scheduled job.

Score policy: count the participant's own `photos` where `analysis.success = true`, created on `target_date`, and within the challenge start/end time. Prefer a server RPC/view; never accept a client-submitted score as truth.

### 3.9 `notifications` (recommended)

Needed for friend requests, accepted friends, PK invitations, challenge joins/completion, likes and comments.

Columns: `id`, `user_id`, `actor_id nullable`, `type`, `payload jsonb`, `read_at`, `created_at`. The owner can read/update only their notifications; triggers or Edge Functions create notifications after relevant events.

## 4. RPC / API Surface Required by the App

Do not make the client query arbitrary tables for composite feed or score data. Expose views/RPCs with exact safe fields.

| Feature | Required endpoint / RPC |
| --- | --- |
| Profile | get/update own profile; lookup profile by `public_id` |
| Album | list own photos by cursor/date; create photo metadata after Storage upload; delete photo; signed image URL batch |
| Diary | list entries for month; upsert entry by `entry_date` |
| Today | get daily target by date |
| Friends | send/respond/list friendship requests; accepted friend summaries |
| Community | cursor-paginated public/friends feed; create/edit/delete post; like/unlike; comments; report |
| PK | create/join/get/cancel challenge; server-calculated progress |
| Ranking | weekly leaderboard based on approved photo stats |
| Notifications | list/mark-read |

Use cursor pagination (`created_at`, `id`) for photos, posts and comments; avoid loading all historical images.

## 5. Realtime and Edge Functions

Enable Supabase Realtime only for rows a user is allowed to receive:

- `friendships` and `notifications` for the current user.
- `challenge_participants` and `challenges` for current participants.
- Optional `post_likes`/`post_comments` for an open post.

Recommended Edge Functions/background jobs:

- Validate image MIME/size, generate thumbnails, strip EXIF/GPS from public image derivatives.
- Perform server-side colour analysis if it becomes authoritative.
- Issue signed URLs for private images.
- Expire daily challenges and write final results.
- Rate-limit posting, comments, likes and friend requests.
- Moderate/review reports.

## 6. RLS Baseline

Enable RLS on every app table and Storage bucket. The essential rules are:

- `profiles`: own row read/update; public lookup returns a restricted view only.
- `photos`, `diary_entries`: owner only. Community viewers never receive coordinates or original image paths.
- `community_posts`: public/friends read only when `status = 'published'` and visibility permits it; author controls own rows.
- `post_likes`, `post_comments`: controlled by actor identity and post visibility.
- `friendships`, `challenges`, `challenge_participants`, `notifications`: involved user only.
- Administrative moderation/target management uses server-side service role or an explicit admin claim, never a broad anon policy.

Test every policy using two ordinary test accounts, not the dashboard admin session.

## 7. Frontend Integration Order

1. Create `profiles`, Storage bucket, and `photos`; then replace web data-URI/local image persistence with upload + own-photo query.
2. Add `diary_entries`; sync diary calendar and notes with UPSERT.
3. Add `community_posts` and feed RPC; make publish upload photo then create the post. Replace `本机待同步` status.
4. Add friendships/profile lookup; make the plus button send a real request and populate friend summaries.
5. Add challenge tables/RPCs and Realtime; make invite codes work across devices.
6. Add likes/comments/notifications/ranking/moderation.

## 8. Acceptance Tests Before Release

- Account A uploads a private photo: it appears in A album after logout/login and on another device; B cannot read it or its coordinates.
- A diary entry appears only for A, survives refresh, and correctly shows blank dates.
- A publishes a photo: B can see the thumbnail/caption but never original storage path or exact location.
- B likes/comments; A sees updated counts and notification. A cannot forge B's action.
- A sends a friend request to B by public ID; B accepts; both see safe aggregate progress.
- A creates a PK and shares code; B joins on another device; both receive real-time score updates; expiry locks changes at the configured end time.
- Invalid/expired invite, duplicate like, duplicate friendship request, oversized upload, forbidden MIME, private post access, and deleted account data are all rejected correctly.

## 9. Information Needed Back From Backend

Before the app can replace its local fallback, provide:

1. Final table/RPC names and exact column names.
2. Storage bucket names and whether feed thumbnails are public or signed.
3. Upload sequence (direct Storage upload vs Edge Function), size limit and image transformation policy.
4. RLS behavior verified with normal user JWTs.
5. Which subscriptions are enabled for Realtime.
6. API responses for photo list, feed, friend summary, and challenge detail.
7. A non-production test project or two test users for end-to-end QA.
