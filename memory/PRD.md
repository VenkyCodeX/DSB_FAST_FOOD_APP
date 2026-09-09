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

## Current limitation
The requested existing Node.js/Express backend URL was not supplied. The workspace-configured preview URL points to the starter FastAPI scaffold and currently returns 404 for `/api/items`, `/api/otp/send`, `/api/orders/coupon/validate`, and order routes. The app intentionally does not fake those responses; connect the real DSB backend URL to enable end-to-end ordering.

## Prioritized backlog
- P0: Configure a reachable existing DSB Node/Express API URL; verify real OTP, coupon, COD order creation, history, tracking, delivery confirmation, and review submission.
- P1: Add integration tests against the real backend and verify sold-out updates during an active cart.
- P1: Replace temporary local illustrated food art with approved DSB photography/logo assets when supplied.
- P2: Add push notifications for order status updates.