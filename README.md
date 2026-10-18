# Git Visualizer

An interactive web app that teaches Git commands through visual animations.

**Live demo:** [learngit.tech](https://learngit.tech)

## Overview

Git Visualizer shows what a Git command actually does instead of describing it. Click a command and watch files and commits move between the four zones of the Git workflow:

**Working Directory → Staging Area → Local Repository → Remote Repository**

Good for:
- Learning Git for the first time
- Building a mental model of how Git works internally
- Teaching Git to others

## Features

- **48 animated commands** in a terminal-style panel, grouped into 10 categories, each with a short plain-English description
- **Four-zone visualization** of working directory, staging area, local repo and remote repo
- **Guided scenarios** (the "Learn" button): step-by-step lessons for Your First Commit, Push to Remote, Branch & Merge, Undoing Mistakes and Stashing Changes
- **Quick command palette** with `Ctrl+B`
- **Dark, terminal-inspired design** with glassmorphism panels

## Commands in the panel

<details>
<summary>Show all commands</summary>

**Getting Started**: `init`, `clone`, `config user`

**Basic Operations**: `status`, `add .`, `add <file>`, `commit`, `commit -am`, `diff`, `diff --staged`

**Remote Operations**: `remote add`, `push`, `push -u`, `pull`, `fetch`, `fetch --all`

**Branching & Merging**: `branch` (list / create / delete), `checkout`, `checkout -b`, `switch`, `merge`, `merge --no-ff`

**Undoing Changes**: `restore`, `restore --staged`, `reset`, `reset --soft`, `reset --hard`, `revert`, `clean`

**Stashing**: `stash`, `stash pop`, `stash list`, `stash clear`

**Tags & Releases**: `tag` (list / create), `push --tags`

**History & Logs**: `log`, `log --oneline`, `log --graph`, `show`

**Configuration**: `config --list`, aliases

**Advanced**: `cherry-pick`, `rebase`, plus GitHub fork and pull request flows

</details>

## Tech stack

- HTML5
- CSS3 (animations, glassmorphism)
- Vanilla JavaScript, no framework and no build step
- Google Fonts (Inter, JetBrains Mono) and Phosphor Icons via CDN

## Project structure

```
index.html      # Layout: command panel, scenario panel, visualization zones
styles.css      # Theme, layout and animation styles
script.js       # GitVisualizer class: repo state, command handlers, scenarios, command palette
animations.js   # AnimationEngine: moves files and commits between zones
```

## Getting started

No dependencies to install. Clone the repo and open `index.html` in a browser:

```bash
git clone https://github.com/mertcaneren0/interactive-git-visualizer.git
cd interactive-git-visualizer
open index.html    # macOS; on Windows use: start index.html
```

An internet connection is needed for the fonts and icons loaded from CDNs.

## How to use

1. Pick a command from the left panel (or press `Ctrl+B` and type one)
2. Watch the animation on the right
3. Read the explanation that appears
4. Try a guided scenario from the "Learn" button to practice a full workflow

## Contributing

Ideas and pull requests are welcome: new commands, better animations, bug fixes or translations.

---

Built by [Mertcan Eren](https://github.com/mertcaneren0)
