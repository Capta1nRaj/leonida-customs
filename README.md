# Leonida Studio

Leonida Studio is a browser-based image editor and poster creator inspired by GTA VI. It was built for the Build with React Image Editor challenge and is an unofficial fan project.

## Features

- Three-step workflow: edit an image, choose a visual direction, then set export details.
- 18 built-in sample images, grouped as official media or original project artwork.
- Image editing with `@unlayer/react-image-editor`, including crop, resize, filters, drawing, and stickers.
- Upload JPEG, PNG, or WebP images up to 12 MB.
- 12 visual directions, each with its own color treatment.
- Landscape `16:9` exports at `1600 × 900` and portrait `9:16` exports at `900 × 1600`.
- Six finish options: no finish, soft glow, cinema bars, corner tag, warm matte, and fine grain.
- Optional headline (up to 35 characters), small line (up to 42 characters), studio label, and editor watermark.
- Live preview and PNG export rendered in the browser.
- Image sharing through the browser's Web Share API when supported, with text-copy fallback.
- No account or application server required.

## The GTA VI experience

Leonida Studio turns GTA VI-inspired scenes into custom poster and story art. Goal: let fans shape their own view of Leonida instead of browsing static artwork. Built for Unlayer's Build with React Image Editor challenge, with image editing as core interaction.

1. Pick and edit: choose one of 18 built-in images or upload your own. `@unlayer/react-image-editor` handles crop, resize, filters, drawing, and stickers. Edited image becomes source for composition.
2. Choose direction: pick one of 12 visual directions. Each direction sets the generated composition's color treatment and offers a creative brief; direct source edits happen in the image editor.
3. Compose and export: choose landscape `16:9` or portrait `9:16`, add headline and small line, select finish and optional labels, then preview and download PNG or use Share.

You can move between workflow steps using the step navigation. Preview updates as you change the composition settings.

## Run locally

Install [Bun](https://bun.sh/) if it is not already installed, then run:

```bash
bun install
bun run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

Available project commands:

```bash
bun run typecheck  # TypeScript check
bun run lint       # Oxlint
bun run build      # Type check and production build
bun run preview    # Serve the production build locally
```

The production build is written to `dist/` and can be hosted by a static web host.

## Project structure

```text
src/
  App.tsx          Workflow, editor integration, preview, and PNG renderer
  index.css        Application styles and responsive layout
  data/samples.ts  Visual directions and built-in image catalog
  main.tsx         React entry point
public/
  samples/         Built-in sample images
  favicon.svg      Site icon
```

## Image handling and saved settings

Image editing and composition rendering happen in the browser. Uploaded images are not sent to an application server. The app saves workflow settings—such as the selected sample, direction, dimensions, text, and finish—in browser `localStorage`.

Uploaded images and edited image drafts are kept in memory for the current page session. They are not saved to `localStorage`, so refresh the page only after downloading any work you want to keep.

Sharing uses the browser's native share sheet when available. Depending on browser support, it shares the PNG file or the accompanying text. If native sharing is unavailable, the app copies the share text when clipboard access is available; PNG download remains available separately.

## Attribution and licensing

Leonida Studio is an unofficial fan project and is not affiliated with or endorsed by Rockstar Games. GTA VI and Rockstar Games media remain the property of their respective owners. Other sample artwork is included as project artwork.

The repository does not currently include a license file, so it does not grant permission to reuse the code or artwork. Third-party packages retain their own licenses.

The editor is provided by [`@unlayer/react-image-editor`](https://github.com/unlayer/react-image-editor).
