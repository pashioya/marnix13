# Marnix 13: Unified Home Server Portal (Makerkit Edition)

## Project Overview

Marnix 13 is a unified homepage and user management portal for self-hosted media and productivity services. Built on the Makerkit Next.js SaaS Starter Kit Lite, it provides authenticated users with a single entry point to access services such as Jellyfin, Manga Reader, Radarr, Sonarr, and Nextcloud. The portal streamlines account management, onboarding, and service integration for a seamless user experience.

## Features

### Centralized Homepage

A clean, protected homepage displaying links to all publicly exposed services (Jellyfin, Manga Reader, Radarr, Sonarr, Nextcloud), visible only to authenticated and approved users.

### User Registration & Approval

- Users can request an account via a registration form.
- New registrations require admin approval before access is granted.
- Upon approval, the system automatically provisions accounts for the user in Jellyfin and Nextcloud using their respective APIs.

### Authentication & Authorization

- Secure email/password authentication powered by Supabase (integrated with Makerkit).
- Role-based access control using Makerkit's built-in teams and roles system.
- Only approved users can access core features; admin dashboard is restricted to administrators.

### Service Integration & Onboarding

- Personalized links to all available services after login.
- One-click setup for the Infuse app: Users are prompted to download Infuse and can automatically configure Jellyfin as a media source.
- Future support planned for additional Jellyfin clients, enabling single-click server setup.

### Mobile Client Recommendations

- Recommendations and guides for Radarr and Sonarr mobile clients with a focus on user-friendly UI/UX.

### Admin Dashboard & Monitoring

- Admin panel for reviewing and approving user registrations.
- Planned extensions for monitoring current users and extracting log data from Jellyfin and other services.

## Tech Stack

- **Frontend**: Next.js (Makerkit SaaS Starter Kit Lite)
- **Authentication & Database**: Supabase (managed PostgreSQL)
- **Backend Integrations**: Supabase Edge Functions or Next.js API routes for service provisioning
- **UI**: Tailwind CSS, ShadCN UI (via Makerkit)
- **Deployment**: Vercel, Netlify, or self-hosted

## Getting Started

1. Clone the repository and follow Makerkit's setup instructions.
2. Configure Supabase for authentication and database management.
3. Set up environment variables for service API integrations (Jellyfin, Nextcloud, etc.).
4. Deploy the app and begin customizing the homepage, approval flow, and admin dashboard.

## Planned Enhancements

- Support for more Jellyfin clients with automated configuration.
- Enhanced admin dashboard for user monitoring and log analytics.
- Improved onboarding flows and UI for mobile client recommendations.
