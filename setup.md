# LaTeX Setup — `cv` Resume Project

## Overview

This project builds a two-column resume (`outputs/resume.tex`) using **LuaLaTeX**, with a full-height emerald sidebar built via `paracol` + `eso-pic`.

## Toolchain

No system-wide/admin TeX install is required. Use TinyTeX (user install) plus Poppler for PDF → PNG previews.

### 1. TinyTeX (LuaLaTeX engine)

#### macOS

```bash
curl -sL "https://yihui.org/tinytex/install-bin-unix.sh" | sh
```

Installs to `~/Library/TinyTeX`, with binaries at:

```
~/Library/TinyTeX/bin/universal-darwin
```

Add to `PATH` for the current shell session (or add permanently to `~/.zshrc` yourself):

```bash
export PATH="$PATH:$HOME/Library/TinyTeX/bin/universal-darwin"
```

#### Windows

Save and run the official installer [`install-bin-windows.bat`](https://yihui.org/tinytex/install-bin-windows.bat) (requires PowerShell). Double-click the `.bat`, or run it from a terminal.

Installs to `%APPDATA%\TinyTeX` (typically `C:\Users\<you>\AppData\Roaming\TinyTeX`), with binaries at:

```
%APPDATA%\TinyTeX\bin\windows
```

Add to `PATH` for the current PowerShell session:

```powershell
$env:Path += ";$env:APPDATA\TinyTeX\bin\windows"
```

### 2. Poppler (PDF → PNG previews)

#### macOS

```bash
brew install poppler
```

#### Windows

Install [Scoop](https://scoop.sh/) if you do not already have it, then:

```powershell
scoop install poppler
```

Provides `pdftoppm` / `pdfinfo`, used to render previews of the compiled PDF.

### 3. LaTeX packages (via `tlmgr`)

Same on macOS and Windows once `tlmgr` is on `PATH`. Install incrementally as compile errors surface, or install the full set used by this project:

```bash
tlmgr install paracol fontawesome5 microtype ragged2e enumitem xcolor \
  tikzfill pgf hyperref geometry eso-pic \
  luatexbase ctablestack luaotfload luacode lualibs
```

On Windows PowerShell, the same packages work as one line:

```powershell
tlmgr install paracol fontawesome5 microtype ragged2e enumitem xcolor tikzfill pgf hyperref geometry eso-pic luatexbase ctablestack luaotfload luacode lualibs
```

Note: `luatexbase` / `ctablestack` / `luacode` etc. are needed because `fontspec` / `microtype` pull in LuaTeX-specific support packages not bundled by default with TinyTeX’s minimal install.

## Compiling

From the `outputs/` directory:

#### macOS

```bash
export PATH="$PATH:$HOME/Library/TinyTeX/bin/universal-darwin"
lualatex -interaction=nonstopmode resume.tex
```

#### Windows

```powershell
$env:Path += ";$env:APPDATA\TinyTeX\bin\windows"
lualatex -interaction=nonstopmode resume.tex
```

Run twice if paracol column balancing or cross-references look off (not strictly required for this template in practice — single pass has worked).

## Generating a preview

```bash
pdftoppm -png -r 130 resume.pdf preview
```

Same command on macOS and Windows (once Poppler is on `PATH`). Produces `preview-1.png`, `preview-2.png`, etc. — one per page.

## Cleaning up

Auxiliary files can be safely removed after compiling.

#### macOS

```bash
rm -f resume.aux resume.log resume.out
```

#### Windows

```powershell
Remove-Item -ErrorAction SilentlyContinue resume.aux, resume.log, resume.out
```

## File locations

| Purpose | Path |
|---|---|
| Resume source | `outputs/resume.tex` |
| Compiled PDF | `outputs/resume.pdf` |
| Preview PNGs | `outputs/preview-*.png` |
| Profile photo | `assets/img/profile.jpg` (referenced as `../assets/img/profile.jpg` from `outputs/`) |
| TeX engine (macOS) | `~/Library/TinyTeX` |
| TeX engine (Windows) | `%APPDATA%\TinyTeX` |
