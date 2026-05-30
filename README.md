<div align="center">

# 🦖 Monsterverse Companions
### Gamified VS Code Extension ⚡🦍

[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![VS Code](https://img.shields.io/badge/VS_Code-0078D4?style=for-the-badge&logo=visual%20studio%20code&logoColor=white)](https://code.visualstudio.com/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)

**Monsterverse Companions** is a highly interactive, animated VS Code extension that brings the epic Titans of the Monsterverse straight into your editor. Built with TypeScript and the VS Code Webview API, it delivers a dynamic, gamified coding experience by reacting to your every keystroke.

</div>

---

## 📖 Project Overview

This extension transforms the mundane task of coding by introducing a lively virtual pet ecosystem at the bottom of your editor. The Titans actively monitor your workspace, react to your code, and evolve as you work.

### Core Value Proposition
- **🎮 Gamified Coding**: Earn activity scores and evolve your Titans.
- **🧠 Reactive Intelligence**: Titans respond to typing speeds and lint errors in real-time.
- **🌍 Epic Roster**: Features iconic monsters like Godzilla, Kong, Ghidorah, and Mechagodzilla.
- **⚡ Lightweight Architecture**: Runs entirely within the VS Code Extension Host.
- **🎨 Modern UI**: Clean HTML/CSS webview with custom CSS animations and particle effects.

---

## 🎨 Design Philosophy: Gamified UI/UX

The interface is crafted to provide a highly interactive and engaging companion without distracting you from your code.

### Visual System
- **Design Style**: Sleek dark-mode integration matching native VS Code themes.
- **Animations**: Custom CSS keyframes for idle, walking, sleeping, and reacting states.
- **Feedback**: Real-time visual feedback when lint errors are detected (Titans get angry!).

### UX Highlights
- Dynamic sprite sheets tracking monster movements.
- Interactive clicking and poking mechanics.
- A live stats bar tracking your "Activity Score" and "Evolution Phase".
- Fully responsive webview panel.

---

## 🏗️ System Architecture

The application follows a **modern, event-driven architecture**:

### 🐹 Backend: VS Code Extension Host (TypeScript)
- `vscode` API integration to monitor document changes and diagnostics (errors).
- Event listeners for keystrokes and file saves.
- Message passing system to communicate with the Webview.

### ⚡ Frontend: Webview API (HTML/JS/CSS)
- Vanilla JavaScript DOM manipulation for lightweight rendering.
- State managed via window messaging system.
- CSS-driven sprite animation engine.

---

## 🚀 Key Features

### 🔍 Interactive Moods
- **Typing** → Titans notice when you are hard at work coding.
- **Errors** → They get furious when they detect bugs or lint errors in your code!
- **Idle** → They pace around and make idle chatter during your breaks.

### 🌍 Epic Titan Roster
- 🦖 **Godzilla**: The King of the Monsters.
- 🦍 **Kong**: The Eighth Wonder of the World.
- 🌩️ **Ghidorah**: The Three-Headed Golden King.
- 🔥 **Rodan**: The Fire Demon.
- 🤖 **Mechagodzilla**: The Apex Predator.
- ☢️ **MUTO**: The Parasite.
- 🕷️ **Scylla**: The Ice Titan.

### ⚡ Custom Evolutions
- Keep coding to increase your Activity Score.
- Watch your Titan evolve from **Base** → **Energized** → **Alpha** status!

---

## 📂 Project Structure

```text
monsterverse-companions/
├── src/                        # Extension Backend (TypeScript)
│   ├── extension.ts            # Extension entry point & Webview logic
│   ├── monsterManager.ts       # Monster configs and mood definitions
│   └── commands.ts             # VS Code command registrations
│
├── webview/                    # Frontend UI (HTML/JS/CSS)
│   ├── panel.html              # Main Webview structure
│   ├── panel.js                # Sprite engine & state management
│   ├── styles.css              # Animations & layout
│   └── monsters/               # Pre-rendered 1024x1024 sprite sheets
│
├── scripts/                    # Development Tools
│   └── generate_spritesheets.py# Python script to convert static PNGs to sprites
│
├── package.json                # Extension manifest & dependencies
└── tsconfig.json               # TypeScript configuration
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- VS Code (Version 1.80+)
- Python 3.10+ (Only required for regenerating sprite sheets)

---

### 1. Installation & Setup

```bash

# Install dependencies
npm install

# Compile the TypeScript extension
npm run compile
```

### 2. Running Locally

1. Open the project in VS Code.
2. Press `F5` to open a new **Extension Development Host** window.
3. In the new window, open the Command Palette (`Ctrl+Shift+P`).
4. Type and select `Monsterverse: Toggle Pet Panel`.

---

## 📊 Extension Commands

Access these commands through the VS Code Command Palette or via the native icons in the **Monsterverse Pet** sidebar panel header:

| Command | Description |
|--------|-------------|
| `Monsterverse: Toggle Pet Panel` | Opens or closes the monster viewing panel. |
| `Monsterverse: Add Monster` | Opens a Quick Pick menu to choose and spawn a specific Titan. |
| `Monsterverse: Poke Monsters` | Interacts with all active Titans on the screen. |
| `Monsterverse: Clear Monsters` | Opens a menu to selectively remove a specific Titan from the screen. |

---

## 📦 Architecture Highlights

- Zero-dependency Vanilla JS frontend for maximum performance.
- Seamless TypeScript API integration for VS Code diagnostics.
- Expandable modular design (easily add new monsters by updating the config and adding a spritesheet).

---

## 🎯 Use Cases

- A fun, interactive way to stay motivated while coding.
- Visual reminders to clean up lint errors (don't make Godzilla angry!).
- A personalized, aesthetic touch to your development environment.

---

<div align="center">
  <p>Built with 🎮 for Epic Coding Sessions</p>
  <p>Developed by <strong>Priyan</strong></p>
  <p>© 2026 Monsterverse Companions. All Rights Reserved.</p>
</div>
