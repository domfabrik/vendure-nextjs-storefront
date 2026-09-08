## Getting Started

### Installation
    yarn install

### Run Dev mode with HMR
    yarn dev

### Run Prod mode
    - yarn build
    - copy static folder to ./next/standalone/.next
    - node ./next/standalone/server.js

### Deploy
    - yarn build
    - copy static folder to ./next/standalone/.next
    - copy public folder to ./next/standalone
    - copy all files from ./next/standalone to server
    - run command "node server"

### Linting and Formating
    yarn prebuild

### Lead checkout semantics

Checkout sends an unpaid request through `prepareLeadOrder` and `submitLeadOrder`. The prepare response establishes the Vendure session before an attempt is created. An unresolved attempt stores its session capability, UUID v4 token and exact payload in browser local storage. Retry and reload reuse that identity and payload; the storefront does not silently create a new session or token after an uncertain submit result. If local storage is unavailable, an in-memory copy preserves retries and React remounts in the current document, but cannot survive a full page reload.

The cart is cleared as soon as the backend receipt arrives. A later intentional checkout creates a new token and backend order. The receipt `orderId` is the stable reconciliation field; prices and currency come from the backend receipt.

The checkout emits only the custom Metrika goal `order_request_submitted` with `orderId`, `value` and `currency`. It does not emit an ecommerce purchase or the `purchase` goal because the request is unpaid. Contact data and submission/session credentials are not sent to analytics. Backend order IDs are deduplicated for the browser site-data lifecycle using the latest 100 IDs; when storage is unavailable, deduplication covers the current document. Phone auto-goals remain a separate interaction and must not be added to request counts. Host/counter matching still limits test analytics to counter `112305722` and production analytics to its own configured counter.

Shared test release, workflow/SHA evidence and browser/cabinet checks belong to `fabric-u17.17`. Do not submit synthetic requests to an environment whose operator email delivery is not isolated.

### Storefront acceptance smoke

The portable production-safe smoke uses `BASE_URL` and discovers real category and product URLs from that origin. It performs GET/SSR checks and desktop/mobile Chromium checks. Browser GraphQL mutations, Next server actions, analytics hosts and same-origin POSTs are blocked or observed before they can leave the browser. It writes `artifacts/storefront-acceptance/report.json` and `artifacts/storefront-acceptance/junit.xml`; a failed or required NOT_RUN case exits nonzero.

Linux/macOS:

```sh
BASE_URL=https://test.domfabrik.ru EXPECTED_METRIKA_ID=112305722 npm run test:acceptance
```

Windows PowerShell:

```powershell
$env:BASE_URL = 'https://test.domfabrik.ru'; $env:EXPECTED_METRIKA_ID = '112305722'; npm run test:acceptance
```

Use `BASE_URL=https://domfabrik.ru EXPECTED_METRIKA_ID=110706774` for a separately authorized production-safe smoke. `ACCEPTANCE_ENV` is inferred from the allowlisted hostname. `ACCEPTANCE_PROFILE=isolated-write` always rejects the production hostname. A14/A15 run through the existing `lead-checkout-ui-test.mjs` against an owned loopback Vendure fixture and write a separate report; the fixture uses a synthetic database schema and does not send email or analytics. The existing `test:seo` and lead harness remain the mock/live HTTP and isolated coverage paths.

Coverage matrix:

| Cases | live production-safe | mock/contract | isolated-write |
| --- | --- | --- | --- |
| A01-A07, A10-A13 | `test:acceptance` HTTP/SSR | `test:seo` fixtures | — |
| A08-A09, A16 | `test:acceptance` browser with mutation guard | `test:acceptance:contract` | — |
| A14-A15 | NOT_RUN in the read-only profile | — | `test:lead-backend:report` with explicit loopback fixture |
| A17-A18 | runner evidence and failure probes | `test:acceptance:contract` + CI | aggregate gate |

`npm test` runs the checkout matrix in a real headless Chromium browser. The harness uses `BROWSER_PATH` when set (and accepts the legacy `EDGE_PATH`), otherwise it finds Google Chrome or Microsoft Edge on the Linux `PATH` and checks the standard Edge locations on Windows. The mandatory test fails with a clear setup error when no supported browser is available; it is never silently skipped. GitHub's `ubuntu-latest` runner provides these browsers.

For the complete mandatory report, run the read-only profile, then the isolated report with `LEAD_TEST_API_URL=http://127.0.0.1:31910/shop-api`, and finally `npm run test:acceptance:aggregate` with `ACCEPTANCE_LIVE_REPORT` and `ACCEPTANCE_ISOLATED_REPORT` pointing at those two JSON files. The aggregate command runs the behavioral negative contract probes and fails if any A01-A18 case is missing, failed, or skipped. GitHub Actions runs these two profiles in separate no-deploy jobs, checks out backend fixture commit `0387240ad3ee088270ffd4582c3c66c73a30f5e6`, uses an ephemeral Postgres service, and uploads JSON/JUnit evidence.
