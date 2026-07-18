# Continuity of Intent

A public canon for responsible authorship in AI-assisted engineering.

The site names a form of work that is easy to miss when models, sessions, and
implementation paths change quickly: the human obligation to sustain intent,
select among possibilities, and remain responsible for the whole.

## Environments

- Preview: https://main--continuity-of-intent--somarc.aem.page/
- Live: https://main--continuity-of-intent--somarc.aem.live/

## Architecture

This is an Adobe Experience Manager Edge Delivery Services site based on the
standard AEM boilerplate. Code lives in this repository. Authored source lives
in DA and is intentionally separate from the code bus.

The project is also a release-grade dogfood surface for `@somarc/da-cli`:

- `.da.json` pins the DA target to `somarc/continuity-of-intent`.
- `.da/workspace/` is the ignored local content workspace.
- remote writes remain dry-run by default and require explicit `--commit`.
- preview and live promotion remain separate operations.

The durable editorial source and amendment posture are recorded in
[CANON.md](./CANON.md).

## Authoring contracts

The homepage intentionally uses a small semantic block vocabulary:

| Block | Authored rows |
|---|---|
| `canon-hero` | label; page `h1`; deck; actions. Additional cells and rows are preserved as supporting content. |
| `canon-articles` | article number + heading/body. A one-cell row receives an automatic number. |
| `continuity-record` | stage label + heading/body. A one-cell row uses the neutral `Stage` label. |
| `claim-ledger` | controlled claim label + definition. A one-cell row uses the neutral `Claim` label. |

Section styles provide the larger narrative states: `problem`, `inscription`,
`canon`, `continuity`, `constitution`, `method`, `provenance`, and `closing`.
The initial DA tables are contracts; decorators must never silently discard an
author's additional content.

## Local development

```sh
npm ci
npm run lint

# Agent-oriented local source/code surface
da up --content .da/workspace --fallback preview --port 3000

# Full AEM development proxy
npx -y @adobe/aem-cli up --no-open --forward-browser-logs
```

Static content-driven-development fixtures live under `drafts/` and are
excluded from the delivery code bus.

## DA workflow

Inspect before changing anything:

```sh
da status --format json
da site model --format json
da content status
da content diff /index.html
```

Validate local source:

```sh
da content fix-sections .da/workspace/*.html --format json
da design audit .da/workspace/index.html --format json
da pipeline quality-gate .da/workspace/index.html --format json
```

Remote content writes are intentionally explicit:

```sh
# Preflight only
da content put-tree .da/workspace --strict-sections

# Mutating source write, after reviewing the preflight
da --commit content put-tree .da/workspace --strict-sections --yes

# Preview only; never promotes to live
da --commit preview tree / --verify --yes
```

Publishing to `*.aem.live` is a separate human decision and is not part of the
default development loop.

## Quality contract

- semantic, authorable EDS blocks rather than framework components;
- text-first rendering with no JavaScript dependency for meaning;
- one page-level `h1` and a coherent heading hierarchy;
- visible keyboard focus and WCAG-minded contrast;
- restrained motion with a complete `prefers-reduced-motion` path;
- no modification of `scripts/aem.js`;
- lint clean before review.

## License

Apache-2.0. See [LICENSE](./LICENSE).
