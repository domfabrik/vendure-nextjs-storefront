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

`npm test` runs the checkout matrix in a real headless Chromium browser. The harness uses `BROWSER_PATH` when set (and accepts the legacy `EDGE_PATH`), otherwise it finds Google Chrome or Microsoft Edge on the Linux `PATH` and checks the standard Edge locations on Windows. The mandatory test fails with a clear setup error when no supported browser is available; it is never silently skipped. GitHub's `ubuntu-latest` runner provides these browsers.
