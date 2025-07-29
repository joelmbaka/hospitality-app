# Hospitality-App – July 2025 Snapshot

Clone & run locally:

```bash
# 1. Clone repository
 git clone https://github.com/joelmbaka/hospitality-app.git
 cd hospitality-app

# 2. Install dependencies (Expo + project packages)
 npm install -g expo-cli  # if not already installed
 npm install

# 3. Configure environment variables
 cp .env.example .env  # then edit with your Supabase & Stripe keys

# 4. Start the Expo dev server (mobile & web)
 expo start            # press 'w' for web, 'i' or 'a' for iOS/Android

# Optional – build static web bundle for Vercel
 npm run build:web     # outputs to `web-build/`
```

---

# Backend 

This Supabase-Postgres workspace powers a coastal-Kenya hospitality platform covering accommodation, dining and event services.

1. Auth & Roles
profiles mirrors auth.users, holding user metadata and a single role (guest, staff, property_manager, admin). A trigger assigns guest on signup. All Row Level Security (RLS) checks reference this column; the legacy user_roles table was removed.

2. Properties & Services
properties stores venue data (geo-coords, JSONB address/contact, hours). Each row has a services UUID[] array validated by a trigger to ensure every element exists in the global services catalog. services is a read-only table listing high-level offerings: accommodation, dining, events, comprehensive.

3. Resources
resources describes bookable units bound to both a property and a service. Examples: Deluxe Room, Pool Bar, Grand Ballroom, each with free-form specifications (JSONB). Property managers (see below) may manage only the resources belonging to their venues.

4. Availability & Bookings
Fully-functional booking flow:
• `availability` rows describe date/time slots with capacity and price.
• Performance indexes were added for fast look-ups.
• Triggers automatically decrement capacity on booking creation and restore it on cancellation / expiry.
• RPCs `confirm_booking(i_booking_id)` and `cancel_booking(i_booking_id)` enforce role-based permissions, adjust capacity, and emit audit notices.

5. Commerce & Payments
`orders` table now processes payments end-to-end:
• Added `stripe_payment_intent_id` and status enum (`pending|paid|cancelled`).
• Supabase Edge Function `stripe-webhook` verifies signatures, then calls SQL function `handle_stripe_event(evt jsonb)`.
• The SQL function disables RLS internally and updates order status to `paid` / `cancelled` based on `payment_intent.*` events.
• Permanent dashboard webhook endpoint (`whsec_…`) is configured; local testing via Stripe CLI succeeds with 200 responses and DB updates.
• Menus and `meal_items` tables scaffolded ready for population.

6. Property Managers
property_managers links users (role property_manager) to the properties they oversee. Unique (user_id, property_id) ensures one assignment per venue. RLS grants managers full CRUD on their venues, resources and availability, while admins retain global control.

7. Security
RLS is enabled on every table. Public users have read-only access to services and properties. All write operations are gated by role- or ownership-based policies. Audit logging, encryption at rest, and payment-data isolation are scheduled.

8. Migrations & Seeding
Migrations now load roles, global functions, properties, services, resource types and managers. Seeds populate three sample resorts (Diani, Watamu, Lamu) with rooms, bars, venues, and appointed Swahili-named managers.

# FrontEnd
• Build front-end payment screens that create PaymentIntents and poll order status

---

9. Mobile UI Roadmap (Expo Router / React-Native)

This section outlines the planned structure, navigation and visual language for the client apps.

**Navigation skeleton (role-aware)**
• Auth Stack → `/(auth)` with `sign-in`, `sign-up`.
• Guest Tab Navigator → `/(tabs)` containing `Home`, `Bookings`, `Account`, `About`.
• Manager Tab Navigator → `/manager` containing `Dashboard`, `Calendar`, `Orders`, `Resources`, `Account`.
• Modal routes (`/modals/`) for contextual flows (e.g. PaymentSheet, QR check-in).

**Core screens**
1. Home / Properties list – fetches `properties` with hero images, distance, service tags.
2. Property detail – tabs: Overview, Rooms, Dining, Events. CTA "Book" opens booking flow.
3. Availability & Booking wizard – calendar picker → resource selection → extras → summary.
4. Order / Payment – shows price breakdown, opens Stripe PaymentSheet (via `stripe-react-native`) using `client_secret`. Poll Realtime channel for `orders.status` to flip to *Paid*.
5. Bookings – past & upcoming, allow cancel / refund.
6. Account – profile, saved guests, payment methods (Stripe Link), logout.
7. About – static info (already implemented).

**Property Manager screens**
1. Dashboard – occupancy %, revenue summary, arrivals/departures.
2. Calendar – scrollable availability calendar with drag-and-drop slot edits; create/update availability rows.
3. Orders – live list of guest orders (meals, events) with status filters; mark as prepared/completed.
4. Resources – CRUD rooms/venues, pricing, photos, capacity.
5. Account – profile, property switching (if multi-venue).

> Staff-specific UI (housekeeping, waiter POS) will be designed once backend roles & policies are fleshed out.


**Component design**
• Base theme: primary `#2E7D32`, dark background `#25292e`, accent `#FFC107`.
• Use React Native Elements + custom `ui/` folder for reusable atoms (Button, Card, Badge).
• Typography scale: H1 28, H2 22, body 16.

**State / data**
• Supabase JS is the single data source.
• Zustand store handles cart and lightweight client state.
• `useAuth()` hook exposes user + role and surfaces Supabase session changes.

**Accessibility & i18n**
• All touchables ≥ 44×44 pt, color-contrast WCAG AA.
• Plan i18n via `expo-localization`.

**Offline & performance (roadmap)**
• Lazy-load images with blur-hash.
• Add SQLite/IndexedDB cache for critical tables in a future iteration.

**Testing**
• Jest + @testing-library/react-native for components.

This roadmap will evolve as we flesh out the front-end but provides a clear blueprint for the next sprint.