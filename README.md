# JP Car Rental Technical Documentation

This project is a car rental management system built with Next.js 15, Supabase, and Xendit. It handles car inventory, real-time availability checks, user authentication, embedded payments, and admin management.

## Tech Stack

*   **Framework**: Next.js 15 (App Router)
*   **Database & Auth**: Supabase (Postgres, GoTrue, Storage)
*   **Payments**: Xendit (Embedded Components SDK)
*   **Image Processing**: Sharp (Server-side resizing/WebP conversion)
*   **Styling**: Tailwind CSS 4
*   **Validation**: Zod

## Core Logic and Architecture

### 1. Database Schema and Overlap Logic

The system relies on two main tables: `public.cars` and `public.bookings`.

The most critical piece of database logic is the `has_booking_overlap` SQL function. It uses Postgres `daterange` and the overlap operator `&&` to prevent double-booking.

*   **Status Filter**: Only bookings with statuses `pending`, `upcoming`, `active`, or `cancel_requested` block a car's availability.
*   **Atomic Creation**: The `create_booking_safely.sql` function wraps the overlap check and the insert statement in a single transaction to prevent race conditions during checkout.

### 2. Booking Lifecycle

A booking moves through the following states:

1.  **Pending**: User has filled out the form but has not paid. This blocks the car's calendar for 60 minutes.
2.  **Paid/Upcoming**: Webhook confirms payment. If the `start_date` is in the future, it is `upcoming`.
3.  **Active**: The current date falls within the `start_date` and `end_date`.
4.  **Completed**: The `end_date` has passed.
5.  **Cancel Requested**: User requested a cancellation. Admin must review.
6.  **Canceled**: Final state. Inventory is released.

### 3. Payment Integration (Xendit)

The system uses the Xendit Components SDK for an embedded checkout experience.

*   **Initialization**: The `initCheckoutComponentsSessionAction` server action creates a payment session on Xendit and returns a `components_sdk_key`.
*   **Reference Handling**: The `booking.id` is passed to Xendit as the `reference_id`.
*   **Webhook**: The route `/api/xendit/webhook` listens for `payment.capture` or `payment_session.completed`. When received, it calls `setBookingPaid`, which updates the status and triggers SMS/Email notifications.

### 4. Admin Management and Storage

Admins are identified by `app_metadata -> role = 'admin'` in Supabase Auth.

*   **Inventory**: Car images are uploaded to the `car-images` bucket.
*   **Image Pipeline**: Before upload, images are processed using the `sharp` library to resize them to 1920x1080 and convert them to WebP to save bandwidth.
*   **Cancellations**: Admins can approve cancellations. If the booking was paid via Xendit, the admin can specify a refund amount. The system then calls the Xendit Refund API.

### 5. Automated Cleanup

Because "Pending" bookings block inventory, abandoned checkouts must be cleared.

*   **Edge Function**: `supabase/functions/cleanup-expired-pending-bookings` identifies unpaid bookings older than one hour and sets them to `canceled`.
*   **Cron**: This is intended to be triggered every 15-30 minutes via Supabase's built-in scheduler or an external CRON job.

## Notifications

The system supports multiple providers for reliability:

*   **Email**: Supports Resend or SendGrid via the `EMAIL_PROVIDER` environment variable.
*   **SMS**: Supports Semaphore (PH) or Twilio via the `SMS_PROVIDER` environment variable.

## Development Requirements

### Environment Variables

The following variables are required in `.env.local`:

```text
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Xendit
XENDIT_SECRET_KEY=
XENDIT_WEBHOOK_VERIFICATION_TOKEN=

# Notifications
EMAIL_PROVIDER=resend # or sendgrid
RESEND_API_KEY=
RESEND_FROM_EMAIL=
SMS_PROVIDER=semaphore # or twilio
SEMAPHORE_API_KEY=
```

### Database Setup

Run the SQL scripts in the `supabase/` directory in this order:

1.  `admin_cars_setup.sql`: Tables and Storage buckets.
2.  `bookings_setup.sql`: Main booking logic.
3.  `bookings_refund_columns.sql`: Tracking for Xendit refunds.
4.  `create_booking_safely.sql`: The atomic transaction function.

### Admin User Creation

To set a user as an admin, use the Supabase SQL Editor:

```sql
update auth.users
set raw_app_metadata = raw_app_metadata || '{"role": "admin"}'
where email = 'your-admin-email@example.com';
```

## UI Components

*   **ScrollHero**: Handles the parallax hero effect and automatically detects background luminance to switch text color between black and white for readability.
*   **CarDetailClient**: Manages the local state for the calendar. It fetches `booked-dates` from the API to disable unavailable dates in the `react-day-picker` component.
*   **CarsBrowser**: Handles client-side filtering and searching of the car inventory.