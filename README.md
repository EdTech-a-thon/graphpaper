# Graph Paper Maker

A small web app for teachers to make printable coordinate grids. Everything
runs in the browser, and the settings are saved in the page address, so a
bookmarked or shared link opens the same graph.

Live at **https://graphpaper.teacher.dev**.

## What you can control

Every group of settings starts collapsed and shows a one-line summary, so the
whole setup can be read at a glance. Open one to change it.

- **Presets**: *First quadrant* and *All four quadrants* are built in. Save the
  current graph as a named preset, apply it later, or delete it. Saved presets
  are kept in this browser's localStorage.
- **x-axis / y-axis**, each set separately:
  - **Blocks** (e.g. 10 across, 20 up)
  - **Start at**, the value of the first line (e.g. −10 for four quadrants)
  - **Count by**, the scale (e.g. 1s across, 5s up)
  - **Numbers**: every line, every 2nd, 5th or 10th line, or none
  - **Label**: text, a blank line for students to write on, or none. Short
    labels (`x`, `y`) go at the arrow tip, and longer ones run along the side.
- **Title**: text, a blank line for students, or none
- **Style**: arrows on the axes, and black or light gray grid lines

## Getting it out

The icon toolbar above the graph has **Print** (1, 2 or 4 graphs per page),
**Copy image** (paste into Docs or Slides), **Download PNG**, **Download SVG**,
**Copy link** and **Start over**. The help button in the bottom-left corner has
the support email.

## Development

```bash
npm install
npm run dev
npm run build
```

The Cloudflare Web Analytics token is read from `VITE_CF_BEACON_TOKEN`, which
is set only in Vercel's production environment.
