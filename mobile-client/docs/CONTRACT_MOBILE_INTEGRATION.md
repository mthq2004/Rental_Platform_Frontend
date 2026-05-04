# Contract / Deposit Mobile Integration

This document describes how the mobile client integrates with contract APIs and how to run the end-to-end test flow.

API endpoints used (proxy via `EXPO_PUBLIC_API_URL`):
- POST `/contract/rental-requests` — create rental request
- POST `/contract/holding-deposits/open` — open holding deposit window
- POST `/contract/holding-deposits/pay` — pay holding deposit
- GET `/contract/rental-contracts/my` — list my contracts
- GET `/contract/rental-contracts/:id` — get contract detail

Files added/changed:
- `services/contract.service.ts` — thin wrapper around API.
- `store/slices/contract.slice.ts` — Redux thunks and reducer.
- `app/(rental)/create-request.tsx` — screen to create rental request.
- `app/(rental)/requests.tsx` — screen to manage tenant/owner requests and open deposit.
- `app/(rental)/pay-deposit.tsx` — screen to pay deposit.
- `app/(rental)/contract-detail.tsx` — screen to view contract.
- `scripts/e2e/contract-flow-test.js` — Node E2E script.

Running locally (prereqs: backend running and reachable, token for test account):

1) Install deps and start app
```bash
cd mobile-client
npm install
npm run start
```

2) Run E2E contract flow (node script)
```bash
EXPO_PUBLIC_API_URL='https://api.yourdomain.com/api' \
TEST_API_TOKEN='Bearer eyJ...' \
TEST_PROPERTY_ID='property-id' \
TEST_OWNER_ID='owner-id' \
npm run e2e:contract-flow
```

What the E2E script does:
- Create a rental request using test property/owner
- Open holding deposit window for that request
- Simulate payment for holding deposit (method: `wallet`)
- Fetch `GET /contract/rental-contracts/my` to confirm contract list

Correct product flow on mobile:
- Tenant sends rental request from property detail.
- Tenant lands on `app/(rental)/requests.tsx` to track the request.
- Owner opens holding deposit window from the owner requests list.
- First tenant to pay the holding deposit gets the lock; backend creates the contract.
- Tenant can then open the contract from the same requests screen.

Notes / Next steps:
- If your backend requires webhooks or payment redirects (MoMo/VNPay), the mobile flow should open a webview and handle callback — current script simulates direct `pay` API call.
- Add UI polish and consistent colors to match web-client theme.
- Add automated UI E2E (Detox / Appium) if you want true mobile instrumentation tests.
- Socket / realtime: AppInitializer now initializes a socket connection and the mobile client listens to `rental_request.updated`, `holding_deposit.paid`, `contract.created`, `contract.updated` events to automatically refresh contract state.

Detox skeleton (optional):
- Added guidance only. Full Detox setup requires native build environment (macOS for iOS) — follow Detox docs to add real-device/emulator tests.
Detox skeleton files:
- `e2e/detox.config.js` — example config
- `e2e/first.test.js` — placeholder test

Follow Detox docs to install `detox` and configure native projects before running UI tests.
