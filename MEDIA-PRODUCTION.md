# Continuity of Intent Media Production

**Status:** trusted local production contract  
**Generator:** Grok Build / Imagine  
**Orchestrator:** DA CLI Riverboat Gambler  
**Delivery owner:** DA content bus

## Why Riverboat exists here

Grok Imagine is exposed through Grok Build tools such as `image_gen`,
`image_edit`, and—when the current Grok surface provides it—`image_to_video`.
Those tools are not DA subcommands. A repeatable media run therefore requires a
trusted local pipeline that can invoke the Grok headless agent and then return
to DA's normal validation and content-bus boundaries.

Riverboat is that bridge. It is also arbitrary shell execution. Its use must be
visible, reviewed, approval-gated, and limited to tracked local YAML.

The Grok subprocess is additionally confined by the tracked
`continuity-media` sandbox: the repository is read-only except for
`.da/media-staging`, and sensitive credential and Git paths are kernel-denied.
Each Grok run receives exactly one Imagine tool and no terminal, file-writing,
web, MCP, Git, or DA tool. A tracked Riverboat collector—not the model—copies
and normalizes the managed output. The validator proves which Imagine tool
appeared in the Grok session transcript and refuses tracked-file drift or
misplaced generated binaries.

## Visual thesis

The canon's media should portray **durable intent passing through transient
systems**: a single acid-lime signal threading through a dark, tactile archive
of stone, paper, glass, and relay geometry. It should feel like an editorial
film still, not cyberpunk wallpaper or an “AI brain.”

The hero title owns the left and lower field. Media must preserve dark,
low-detail negative space there and carry its visual event toward the upper
right. No generated asset may contain the site headline, labels, logos,
watermarks, readable UI, or invented technical diagrams.

## Trusted workflow

### 1. Inspect the executable plan

```sh
da --riverboat-gambler \
  --org somarc --repo continuity-of-intent --branch canon \
  --format json pipeline run pipelines/grok-imagine-media.yaml --dry-run
```

The plan must report `riverboat.unsafeExecution: true`, enumerate the Grok and
local validator shell steps, and show no unapproved shell step.

### 2. Generate into local staging

After reviewing the tracked YAML and briefs:

```sh
da --riverboat-gambler \
  --org somarc --repo continuity-of-intent --branch canon \
  --format json pipeline run pipelines/grok-imagine-media.yaml --approve-all
```

Do **not** add root `--commit`. It does not protect Riverboat shell steps, and
media generation must remain separate from remote mutation.

Expected local outputs:

```text
.da/media-staging/continuity-hero-poster.webp
.da/media-staging/continuity-hero-loop.mp4       # optional when tool exists
.da/media-staging/manifest.json
```

### 3. Review and validate

```sh
node tools/validate-media.cjs --plan
```

The validator checks dimensions, 16:9 crop, file bounds, video duration,
codec/stream properties, and hashes. Human visual review remains mandatory.

If an Imagine tool call succeeded but collection or validation was improved
after the run, recover the managed outputs without generating again:

```sh
da --riverboat-gambler \
  --org somarc --repo continuity-of-intent --branch canon \
  --format json pipeline run pipelines/grok-imagine-collect.yaml --dry-run

da --riverboat-gambler \
  --org somarc --repo continuity-of-intent --branch canon \
  --format json pipeline run pipelines/grok-imagine-collect.yaml --approve-all
```

The recovery YAML is also tracked, approval-gated, local-only, and performs no
DA write.

### 4. Preflight DA media ownership

Run the commands printed by `--plan` without `--commit` first. The canonical
routes are:

```text
/media/continuity-hero-poster.webp
/media/continuity-hero-loop.mp4
```

Only after approval:

```sh
da --commit content put /media/continuity-hero-poster.webp \
  .da/media-staging/continuity-hero-poster.webp

# only when the optional video exists and passed review
da --commit content put /media/continuity-hero-loop.mp4 \
  .da/media-staging/continuity-hero-loop.mp4
```

### 5. Author, preview, prove

Add the poster and optional video as authored rows in `canon-hero`, upload the
updated DA page source, and preview only on the feature ref:

```sh
da --commit preview page /index.html --branch canon --yes
da preview explain /index --branch canon --format json
```

Verify the browser has a poster-first path, muted `playsInline` video, a static
fallback, readable scrim, and no video under `prefers-reduced-motion`.

## Media acceptance contract

### Poster

- WebP, 16:9, at least 1920×1080;
- preferably 2400×1350;
- no larger than 5 MiB;
- dark type-safe field on the left/lower area;
- decorative alt text is empty; meaning remains in authored copy.

### Video

- MP4, H.264, 16:9, at least 1280×720;
- 6 or 10 seconds, ideally a subtle near-seamless loop;
- no audio stream;
- no larger than 25 MiB;
- one slow camera motion or restrained signal pulse—no hard cuts;
- poster remains the LCP and reduced-motion experience.

## Provenance

The validator writes a checksummed local manifest naming the Riverboat
pipeline, Grok version, prompt briefs, and generated file properties. DA upload
and page publication remain separate provenance events. A generated file alone
is never evidence that it was reviewed, uploaded, previewed, or published.
