# tint2 Config Generator

A visual, in-browser generator for [tint2](https://gitlab.com/o9000/tint2) panel configuration files (`tint2rc`). Build your panel with form controls, see a live preview, and export a ready-to-use config — no build step, no dependencies.

## Features

- Panel geometry: edge, alignment, monitor, layer, size, margin, padding, corner radius, border
- Ordered, toggleable panel items: Launcher, Taskbar, Pager, Free space, Clock, Battery, Systray
- Per-widget settings: fonts, colors, clock formats, launcher apps, battery thresholds, systray sort/size
- Live panel preview that updates as you edit
- One-click copy or download of the generated `tint2rc`

## Usage

Open `index.html` directly in a browser, or serve the folder:

```sh
python3 -m http.server 8000
```

Then visit `http://localhost:8000/`.

Once you're happy with the preview, click **Download tint2rc** and save it to `~/.config/tint2/tint2rc`, then restart tint2 (or run `tint2 -c ~/.config/tint2/tint2rc`) to apply it.

## License

MIT
