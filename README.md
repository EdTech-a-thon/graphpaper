# Graph Paper Maker

A small web app for teachers to make printable coordinate grids. Everything
runs in the browser, and the settings are saved in the page address, so a
bookmarked or shared link opens the same graph.

Live at **https://graphpaper.teacher.dev**.

## What you can control

- **Layout**: first quadrant, all four quadrants, or your own start values
- **Blocks** on each axis, set separately (e.g. 10 across, 20 up)
- **Count by** (the scale) on each axis, set separately (e.g. 1s across, 5s up)
- **Numbers**: every line, every 2nd, 5th or 10th line, or none
- **Title and axis labels**: short labels (`x`, `y`) go at the arrow tips and
  longer ones run along the sides. You can also leave them empty and draw
  blank lines for students to fill in.
- **Arrows** on the axes, and **light gray** grid lines
- **Data** (optional): points drawn as dots, as dots joined by lines, or as a
  line only, plus a line `y = mx + b`

## Getting it out

**Print** (1, 2 or 4 graphs per page), **Copy image** (paste into Docs or
Slides), **Download PNG/SVG**, or **Copy link**.

## Development

```bash
npm install
npm run dev
npm run build
```

The Cloudflare Web Analytics token is read from `VITE_CF_BEACON_TOKEN`, which
is set only in Vercel's production environment.
