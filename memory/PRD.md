# DSB Fast Food Mobile App PRD

## Problem statement
Build a real customer-facing Android/iOS ordering app for DSB Fast Food, Shankar Nagar, Raipur. Customers need to browse the actual menu, build a persistent cart, authenticate by phone OTP, enter a GPS/manual delivery address, place COD orders, track orders, confirm delivery, review completed orders, manage profile, and switch English/Hindi.

## Architecture
- Frontend: Expo SDK 57, React Native, TypeScript, Expo Router, React Query provider, secure token storage with `expo-secure-store`, AsyncStorage persistence, `expo-location`, `expo-linking`.
- State: centralized `AppProvider` for menu inventory, cart, coupons, auth session, language, and orders.
- API: centralized `src/api/client.ts`, reads `EXPO_PUBLIC_BACKEND_URL` / Expo config and prefixes `/api`.
- Backend contract: compatible with the requested existing Node.js/Express/MongoDB DSB API; no admin surface or payment gateway was added.

## Personas
- Local DSB customer ordering fast food for delivery.
- Returning customer tracking an active COD order.
- Customer giving feedback after a completed order.

## Core requirements
- Five primary areas: Home, Menu, Cart, Orders, Profile.
- Actual ten-item DSB menu and prices only.
- Dynamic 11:00 AM–11:00 PM status, ₹10 delivery fee, ₹50 minimum order, COD, WhatsApp confirmation.
- Inventory, OTP, coupons, order creation, order history, tracking, delivery confirmation, and ratings use backend APIs.
- English/Hindi UI and local cart/profile/language persistence.

## Implemented — 2026-09-09
- Built the full native navigation shell with iOS 26 NativeTabs gating and classic fallback tabs.
- Built polished Home, Menu, Product, Cart, Checkout, Auth, Order Success, Order Tracking, Review, Orders, and Profile screens.
- Added base64-safe local food artwork, warm DSB design tokens, loading/error/empty states, accessible touch targets, responsive layout, and subtle press feedback.
- Added persistent cart/session/language state, secure token storage, coupon/order/tracking/review API client, GPS/manual address flow, and WhatsApp message composition.
- Verified TypeScript, ESLint, and browser smoke flow: Home → Menu → add Chicken Noodles → Cart; tester also verified product and profile flows.

## Implemented — 2026-02 (dark theme refresh)
- Replaced the warm-sand palette with a fiery near-black + deep-red dark theme (surface `#0A0A0A`, brand `#DC2626`, accent `#FF4136`) driven from the user's reference image; tokens applied via `src/theme.ts` and mirrored in `design_guidelines.json`.
- Swapped the placeholder SVG artwork for realistic Unsplash food photography per menu item and added a fresh moody hero image on Home.
- Set a light-content status bar and dark stack background so every screen (Home, Menu, Cart, Orders, Profile, Auth, Checkout, Product) renders consistently on dark.

## Current limitation
The requested existing Node.js/Express backend URL was not supplied. The workspace-configured preview URL points to the starter FastAPI scaffold and currently returns 404 for `/api/items`, `/api/otp/send`, `/api/orders/coupon/validate`, and order routes. The app intentionally does not fake those responses; connect the real DSB backend URL to enable end-to-end ordering.

## Prioritized backlog
- P0: Configure a reachable existing DSB Node/Express API URL; verify real OTP, coupon, COD order creation, history, tracking, delivery confirmation, and review submission.
- P1: Add integration tests against the real backend and verify sold-out updates during an active cart.
- P1: Swap the temporary DSB word-mark for the real logo asset once supplied by the owner.
- P2: Add push notifications for order status updates.

## Logo integration (done)
- Official DSB Fast Food logo saved at `frontend/assets/images/logo.png`.
- Generated app icon, adaptive icon, splash image and favicon from the logo (black background).
- Logo shown on: branch selection (welcome) screen, Home header, and phone sign-in screen.

## Session: WhatsApp / Splash / Receipt / Backend config (done)
- Backend URL: set `EXPO_PUBLIC_API_URL` in `frontend/.env` to the real Node.js API (currently empty → falls back to preview backend). `src/api/client.ts` reads it first.
- WhatsApp: `src/utils/whatsapp.ts` builds a full order summary (items, totals, address, branch) and auto-opens WhatsApp (whatsapp:// → wa.me fallback) to the Nursi branch number 919321611315 ~0.9s after the success screen mounts; button to resend. Order detail screen has "Share receipt on WhatsApp".
- Splash: `src/components/animated-splash.tsx` (reanimated) — logo pops in with pulsing red glow, fades out after ~2.5s; wraps the root Stack in `app/_layout.tsx`.
- Branded receipt: `app/order/[id].tsx` shows logo, brand, branch name/address/phone, receipt no., date, customer, items, subtotal/delivery/discount/total, payment, address.

## Session: Deglur WhatsApp / Active order banner / Reorder (done)
- Deglur branch phone/whatsapp set to 919321611315 (same as Nursi, per user).
- Store: `activeOrder` (latest order with status Preparing/Ready), `reorder(items)` (matches by name against current menu, skips sold-out/missing), auto-polls orders every 20s while any order is not Completed.
- Home: `src/components/active-order-banner.tsx` shows a pulsing banner (Preparing = red/amber, Ready = green) linking to `/order/[id]`.
- Receipt (`app/order/[id].tsx`): "Reorder these items" button → adds to cart → opens Cart; alerts about skipped items.
- BLOCKER: user has no backend URL. All order-related features need a live backend. Proposed: build DSB API in this workspace's FastAPI backend (items, otp, orders, coupons, updates) if user agrees.

## Session: Backend built in-workspace + Admin panel + Call + Ready chime (done, tested: 22/22 backend pytest, E2E frontend pass)
- Backend (FastAPI/Mongo) `backend/server.py` + `core/{config,db,auth}.py` + `routes/{auth,catalog,orders}.py`. Env: JWT_SECRET, ADMIN_PIN=dsb2025, DEV_MODE=true (devOtp returned), OTP_TTL_SECONDS, JWT_TTL_DAYS.
- Endpoints: /api/items, /api/updates, /api/otp/send|verify, /api/orders (create/by-phone/{id}/delivery-confirm/rating/coupon/validate), /api/admin/login, /api/admin/orders(+summary, /{id}/status), /api/admin/items/{id}/sold-out, /api/admin/updates CRUD. Server enforces active branch + IST opening hours (11:00–23:00 Nursi).
- Frontend: OTP dev hint (tap to fill), admin panel `/admin` (PIN) → `/admin/orders|menu|updates` via `src/components/admin-shell.tsx`; Profile footer link. Receipt: Call branch (tel:), Reorder, WhatsApp share. Home banner plays `assets/sounds/ready-chime.wav` + haptic when status flips to Ready (native only).
- To switch to real SMS: replace the OTP block in `routes/auth.py send_otp` and set DEV_MODE=false.
- Tests: `backend/tests/backend_test.py` (pytest).

## Session: Admin chime / Change PIN / Daily summary (done)
- POST /api/admin/change-pin {newPin} (admin token) stores bcrypt hash in `settings` collection; login checks stored hash, else env ADMIN_PIN. Admin Settings tab (`app/admin/settings.tsx`).
- GET /api/admin/orders/summary now includes `today: {count, revenue, completed, date}` (IST day). Orders screen shows two stat cards.
- Admin orders polls every 10s; new "Order Received" ids trigger `assets/sounds/new-order.wav` + haptic + green toast (tap → New filter). Bell icon toggles sound.
- Real SMS OTP: PENDING — user will provide MSG91/Twilio credentials later. Swap point: `routes/auth.py send_otp`.
