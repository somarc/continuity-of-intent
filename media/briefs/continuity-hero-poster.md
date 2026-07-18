# Grok Imagine Task — Continuity Hero Poster

You are running inside the reviewed `pipelines/grok-imagine-media.yaml`
Riverboat workflow in the trusted `somarc/continuity-of-intent` checkout.

## Hard boundaries

1. Follow the loaded Grok Imagine guidance and use the only available tool,
   `image_gen`, for the visual. Do not draw a substitute with
   HTML, SVG, Canvas, or a local diffusion package.
2. You have no shell, file-writing, web, MCP, Git, or DA tool. Do not request
   one. The reviewed Riverboat collector owns all filesystem work.
3. Do not edit repository files, call DA, upload, preview, or publish.
4. Use the existing authenticated Grok session. Never print, read, request, or
   persist credentials.
5. Generate no text, headline, logo, readable interface, diagram labels, or
   watermark inside the image.

## Visual brief

Create a cinematic 16:9 editorial film still about **continuity of intent**: a
single acid-lime luminous thread traveling through a vast dark archive made of
black stone, warm paper strata, smoked glass, and precise relay geometry. The
thread remains coherent while surrounding chambers dissolve, re-form, and pass
state forward; the feeling is human stewardship through transient systems, not
an artificial brain. Premium tactile CGI with restrained volumetric light,
subtle grain, near-black and limestone palette, one controlled lime signal,
and solemn monumental scale.

Compose the event toward the upper-right and reserve a broad dark, low-detail
safe zone across the left and lower field for large white editorial typography.
No purple cyberpunk glow, humanoid robot, stock face, floating UI, binary rain,
or generic neural-network imagery. Cover crop may lose the extreme edges.

## Output contract

- Request `aspect_ratio: 16:9` from `image_gen`.
- The `image_gen` result remains in this Grok session's managed `images/`
  folder. Do not copy or convert it yourself.
- The reviewed Riverboat collector will auto-orient, center-crop, and resize
  the result to exactly 2400×1350 and write:

```text
.da/media-staging/continuity-hero-poster.webp
```

- Do not create the video in this step.
- End after the single successful `image_gen` call. The tracked collector and
  validator will prove the tool event, normalize the output, and hash it.
