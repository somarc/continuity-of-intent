# Grok Imagine Task — Continuity Hero Video

You are running inside the reviewed `pipelines/grok-imagine-media.yaml`
Riverboat workflow in the trusted `somarc/continuity-of-intent` checkout.

## Hard boundaries

1. Follow the loaded Grok Imagine guidance and use the only available tool,
   `image_to_video`, if it exists.
2. Use this approved still as frame one and the visual identity anchor:

```text
.da/media-staging/continuity-hero-poster.webp
```

3. Use Grok Imagine `image_to_video` only if that tool is actually available.
   Do not invent a video tool, synthesize fake motion with CSS, or silently use
   another provider. If it is unavailable, leave the poster intact, create no
   MP4, and report that the poster-only path is the valid result.
4. You have no shell, file-writing, web, MCP, Git, or DA tool. Do not request
   one. The reviewed Riverboat collector owns all filesystem work.
5. Use the existing authenticated Grok session. Never print, read, request, or
   persist credentials.

## Motion brief

Animate one restrained six-second shot. The camera makes a barely perceptible
lateral drift with shallow parallax through the dark archive while the
acid-lime thread carries one slow pulse from left to upper-right. Paper and
smoked-glass layers breathe by only a few pixels; monumental geometry stays
stable. Preserve the dark left/lower typography safe zone, avoid hard cuts and
busy movement, and make the final frame visually compatible with the first for
an unobtrusive near-seamless website loop. No text, logos, UI, new objects,
flashing, rapid motion, or audio.

## Output contract

- Prefer a 6-second 16:9 MP4 at the source image aspect ratio.
- Leave the raw Imagine result in this Grok session's managed `images/`
  folder. Do not copy, convert, or inspect it with another tool.
- The reviewed Riverboat collector will remove audio, normalize H.264/yuv420p
  only when required, set fast-start metadata, and write:

```text
.da/media-staging/continuity-hero-loop.mp4
```

- End after the `image_to_video` result, or clearly state that the current Grok
  tool surface is poster-only. The tracked collector and validator will prove
  whether an MP4 tool event and valid file exist.
