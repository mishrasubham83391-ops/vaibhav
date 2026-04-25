# PAL Institute — Product Requirements & Status

## Original problem statement
Convert the uploaded coaching center spec into a working PAL Institute website with mobile-friendly UI, Supabase/Mongo-backed forms, required consent checkbox validation, password-protected admin panel, and Vercel deployability.

Subsequent ask: refactor for **Vercel (frontend) + PythonAnywhere (backend WSGI) + MongoDB Atlas**, env-driven, no hardcoded URLs.

## Architecture
- **Frontend:** React (CRA) + Tailwind, Shadcn/UI, Recharts. Routes: `/`, `/terms-and-conditions`, `/privacy-policy`, `/admin`. Hosted on Vercel.
- **Backend:** Python FastAPI (sync routes) + pymongo + JWT admin auth. ASGI for uvicorn (dev), WSGI via `a2wsgi` for PythonAnywhere.
- **Database:** MongoDB Atlas (or local). Collections: `demo_bookings`, `enquiries`, `scholarship_registrations`, `contact_messages`, `toppers`.

## What's implemented (2026-02 — current)
- Full landing page (countdown, dismissable announcement bar, sticky header w/ logo, hero w/ count-up stats, 8 course cards, results showcase, demo form w/ required consent, faculty, USP, scholarship, FAQ accordion, contact w/ map, footer, WhatsApp sticky, social-proof toast).
- Terms & Privacy pages with full content from PDF.
- Admin panel: JWT login (pwd `admin123`), dashboard (stats + pie + bar), bookings/enquiries/scholarship lists w/ status dropdown, toppers manager, CSV export, logout.
- Mobile responsive across all pages.
- Stateless JWT auth (works on PythonAnywhere multi-worker).
- WSGI entry point (`backend/wsgi.py`) for PythonAnywhere.
- `vercel.json` with SPA rewrites for the frontend.
- `.env.example` files + `DEPLOYMENT.md`.

## Test status
- iteration_1.json — 18/18 backend, all frontend flows pass.
- iteration_2.json — 20/20 after refactor (pymongo + JWT + WSGI). No regressions.

## Backlog (P1)
- Add `exp` claim to JWT (24h) and refresh-on-activity.
- Rate-limit `/api/admin/login`.
- Production hardening: fail-fast if `JWT_SECRET` is the default in non-dev env.
- Topper photo upload (currently URL-only) using object storage.

## Backlog (P2)
- Real Google reCAPTCHA on public forms.
- Email/SMS notifications on new booking (Resend / Twilio).
- PWA manifest + offline support.
- A/B test variants of hero headline.

## Next action items
- User to deploy: configure Vercel env (`REACT_APP_BACKEND_URL`) + PythonAnywhere env (`MONGO_URI`, `DB_NAME`, `JWT_SECRET`, `ADMIN_PASSWORD`, `CORS_ORIGINS`) per `DEPLOYMENT.md`.
