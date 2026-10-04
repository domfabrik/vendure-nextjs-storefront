# Product recommendation fallback forwardport

This report covers the local `fabric-scm.7` port only. It does not close the historical HTTP 500 incident and makes no production claim.

## Scope and behavior

- Base: `7faf94ad1525bec5498a5a29097850e0c6f27d4f`, preserving the current `9cd2e83` UI/SEO lineage and accepted `fabric-d3h` facet change.
- Reference: `8b0655e44ba1c364f477d19228dbd6a36ca1eb14`, consulted narrowly; no historical UI tree was copied.
- `src/app/products/[slug]/page.tsx` catches only the optional `SearchCollectionProducts` request after the primary product has loaded. It records the existing safe `{ operation, category, errorClass }` diagnostic and returns an empty recommendation list.
- Primary product fetches, `notFound`, price, stock, variant selection, canonical and Product JSON-LD behavior remain outside the catch.

## Behavioral evidence

The fresh no-catch control reproduced the failure: recommendation HTTP 503 caused `pdp-related-http` to return raw HTTP 500 after the primary product loaded. The candidate returned HTTP 200 and retained H1, visible price, stock, exact canonical and Product JSON-LD. GraphQL recommendation errors and delayed errors also returned 200; slow success remained successful.

For both Mozilla and YandexBot, the isolated fixture also verifies:

- a successful recommendation response renders the heading and the `test-chair-1` link/name;
- a product whose collections are only `all` and `search` returns 200 with the full primary PDP contract and leaves the aggregate count of every `SearchCollectionProducts` request unchanged;
- primary HTTP, GraphQL and disconnect failures remain honest 5xx responses without product H1, canonical or Product JSON-LD; a missing product remains 404/noindex;
- safe recommendation logs contain only `operation`, `category` and `errorClass`.

## Source and image provenance

Recovery evidence is in `D:/work/hobby/fabric/tmp/scm-delivery-evidence/scm7/fabric-scm-7-recovery-20261004-205708-7256`.

The recovery export used `git archive` at the pinned base and byte-copied only the five declared working overlays. Raw and normalized full-tree comparisons both found exactly those five paths. All 20 archived binary assets remained byte-identical and binary drift was zero. CRLF-to-LF normalization ran only in isolated copies and only for known text extensions or `Dockerfile`; `source-provenance.json` records raw and normalized hashes plus every EOL mapping. The checkout was not normalized.

The fresh images start from `node:25.2.1-bookworm-slim` (`sha256:56bfd99fb517725afa89dea5037704935a8f5ec4619fe38d1bc1ba514c181842`) and copy only `/app/node_modules` from the verified owned dependency image `sha256:88c560eaf3dd80cb38ff54206864b8eaa460f8497ca921bbb25cdec53d3b9b4f`.

| Profile | Tag | Image ID | Owner / run label |
| --- | --- | --- | --- |
| candidate | `fabric-scm-7-recovery-20261004-205708-7256:candidate-r2` | `sha256:cf264632ef486808fe050870c24b8a3ced5e83f12f4c8a6eeebb98522e044808` | `codex-scm7-recovery` / `fabric-scm-7-recovery-20261004-205708-7256-r2` |
| no-catch control | `fabric-scm-7-recovery-20261004-205708-7256:control-r2` | `sha256:a9ef4993f71e090d4fd47a87493c2d40ad35c1abcc933aaeff4878fd48fdf239` | `codex-scm7-recovery` / `fabric-scm-7-recovery-20261004-205708-7256-r2` |

`candidate-r2-image-tree-verification.json` compares all 209 non-dependency files in the candidate image with the normalized byte-safe context and reports zero differences.

The four frozen implementation/test files used by the candidate image have these hashes:

| File | Checkout/raw SHA-256 | Normalized image SHA-256 |
| --- | --- | --- |
| `src/app/products/[slug]/page.tsx` | `88785060de9ed7bd95d369c248cadbacf8e50e086efe0a011cad97f470ff8924` | same |
| `src/shared/api/collections/index.ts` | `5f1c185b91b479ee6473f18161736df883c22b8d1601d8307a7dbe2deb834990` | same |
| `scripts/seo-http-test.mjs` | `09959bff128ebe61ed17e8fa509a96c9436cb4f88915cc78a0e78c521d12ee21` | `62373bbd72bc410c1fd153778b248aa1fff84a95d728377771a09688f03a3521` |
| `scripts/product-http-cases.mjs` | `48d8d948af8c52ae3087040d3ebce25571b8d23eaa31b4042894808d7d2615e0` | same |

This report was refreshed after the successful image run so it could record final image IDs and checks. That is an allowed reporting-only delta: the four frozen implementation/test files did not change, and the complete final five-file source package and its manifest contain the actual final report bytes.

## Validation

All final candidate checks passed in uniquely named, labeled containers on Node 25.2.1:

- `yarn lint` (Biome and TypeScript): exit 0;
- `yarn lint:fsd`: exit 0;
- `yarn test`: exit 0;
- `yarn test:seo`: exit 0, including the full SEO HTTP and production-build matrix.

The final control `yarn test:seo` exited 1 at the expected assertion: `pdp-related-http` actual 500 versus expected 200. Earlier failed/corrupt provenance attempts remain historical under the parent evidence directory and are not used for these claims. Within this recovery run, the cancelled full-bookworm download and the first image that omitted `.github` are retained as failed tooling attempts; only the `*-r2` images and `candidate-r2-*`/`control-r2-*` results are final.

No backend, database, env, server, SSH, deploy, production load, PR, commit or push was performed. The exact historical SSR incident stage remains unknown, the original incident remains open, and product request deduplication belongs to the subsequent task.
