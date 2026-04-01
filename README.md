# Kilovate Notes

A fast, minimal, offline-first notes app built with Tauri v2 and React. Your notes live locally in a SQLite database — no accounts, no cloud, no nonsense.

![Kilovate Notes](./src-tauri/icons/128x128.png)

---

## Features

- 📝 Create, edit, and delete notes
- 📁 Organise notes into folders
- 💾 Autosave — notes save automatically 2 seconds after you stop typing
- 🗑️ Delete confirmation to prevent accidental data loss
- 🌙 Dark mode by default
- ⚡ Fully offline — data stored locally in SQLite (`%APPDATA%\com.kilovate.notes\notes.db`)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Tauri v2](https://tauri.app) |
| Frontend | React + Vite + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Icons | HugeIcons |
| Database | SQLite via `@tauri-apps/plugin-sql` |

---

## Getting Started (Simple)

### Install

Download the [NSIS Installer](https://github.com/mrmtsenga/notes/releases/download/v0.1.0/Notes_0.1.0_x64-setup.exe) and run it.

### Uninstall

To uninstall, go to `Settings > Apps > Installed Apps` on Windows, or simply "Move to trash" on macOS.

### Prerequisites

- [Node.js](https://nodejs.org/) or [Bun](https://bun.sh/)
- [Rust](https://www.rust-lang.org/tools/install) (via rustup)
- [Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (Windows only)

### Install dependencies

```bash
bun install
```

### Run in development

```bash
bun run tauri dev
```

### Build for production

```bash
bun run tauri build
```

The installer will be output to:

```
src-tauri/target/release/bundle/nsis/     ← .exe installer
src-tauri/target/release/bundle/msi/      ← .msi installer
```

---

## Project Structure

```
├── src/
│   ├── App.tsx              # Main application component
│   ├── lib/
│   │   └── db.ts            # SQLite database layer
│   └── components/          # UI components (shadcn/ui)
├── src-tauri/
│   ├── src/
│   │   └── lib.rs           # Tauri app entry point
│   ├── icons/               # App icons
│   └── tauri.conf.json      # Tauri configuration
```

---

## Data Storage

All data is stored locally on your machine. No data is ever sent to a server.

| Platform | Location |
|---|---|
| Windows | `%APPDATA%\com.kilovate.notes\notes.db` |
| macOS | `~/Library/Application Support/com.kilovate.notes/notes.db` |
| Linux | `~/.local/share/com.kilovate.notes/notes.db` |

---

## License

MIT — do whatever you want with it.

---

Built by [Kilovate](https://github.com/kilovate)