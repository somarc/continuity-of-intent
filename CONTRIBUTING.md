# Contributing to Continuity of Intent

Continuity of Intent is a public, amendable canon and an Adobe Experience
Manager Edge Delivery Services site. Contributions should preserve both its
editorial precision and its authorable, high-performance implementation.

## Before proposing a change

Read:

- [CANON.md](./CANON.md) for the current intent and amendment protocol;
- [README.md](./README.md) for the code/content boundary and local workflow;
- [AGENTS.md](./AGENTS.md) for repository-specific EDS engineering rules;
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

Material changes to the canon should state:

1. **Then** — the prior statement or interpretation.
2. **Learned** — the evidence, constraint, or changed understanding.
3. **Now** — the proposed revision.
4. **Continuity preserved** — what remains invariant.

## Development workflow

Create a feature branch and install the pinned development dependencies:

```sh
npm ci
npm run lint
```

Use the project-pinned DA target and inspect state before any remote operation:

```sh
da status --format json
da site model --format json
da content status
```

Remote writes are dry-run by default. Never add `--commit` until the target,
paths, and preflight are understood. Preview and live publication are separate
decisions; a contribution must not publish to `*.aem.live` as a side effect.

## EDS expectations

- Keep authored content separate from the code bus.
- Preserve semantic heading order and accessible names.
- Treat each block's initial table as an authoring contract.
- Handle missing and additional authored cells without deleting content.
- Keep the static path meaningful if JavaScript or optional motion fails.
- Respect `prefers-reduced-motion` and visible keyboard focus.
- Do not modify `scripts/aem.js`.

### Generated media

Do not call Grok, Imagine, or another media generator ad hoc. Use the reviewed
`pipelines/grok-imagine-media.yaml` pipeline with the hidden root
`--riverboat-gambler` flag and inspect its dry-run plan first. Riverboat runs
arbitrary local shell commands and is not protected by root `--commit`; only
trusted repository YAML may cross that boundary.

Generated images and videos belong in `.da/media-staging/`, not Git. Preserve
the prompt brief and generated manifest, validate poster/video properties, and
perform DA media upload as a separate dry-run and approved mutation. Never
publish generated media to `*.aem.live` from the creation pipeline.

## Pull requests

A pull request should include:

- the intent advanced or amended;
- affected invariants and authoring contracts;
- evidence from lint, section-shape checks, and local/feature preview;
- a feature-preview URL for the changed page;
- known limits or debt that remain open.

Useful checks:

```sh
npm run lint
git diff --check
da content fix-sections .da/workspace/*.html --format json
da pipeline quality-gate .da/workspace/index.html --format json
```

## License

By contributing, you agree that your contribution may be distributed under
this repository's [Apache License 2.0](./LICENSE).
