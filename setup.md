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

Install with Scoop (preferred):

```powershell
scoop bucket add r-bucket https://github.com/cderv/r-bucket.git
scoop install tinytex
```

Scoop’s post-install runs `tlmgr path add`, which writes the bin dir into your **user** `PATH`:

```
%USERPROFILE%\scoop\apps\tinytex\current\bin\windows
```

**Existing PowerShell windows do not pick that up automatically.** Either open a **new** terminal, or refresh this session:

```powershell
$env:Path = [Environment]::GetEnvironmentVariable('Path','User') + ';' + [Environment]::GetEnvironmentVariable('Path','Machine')
```

Then verify:

```powershell
Get-Command tlmgr, lualatex
```

You should see `tlmgr.bat` and `lualatex.exe` under `...\scoop\apps\tinytex\current\bin\windows\`.

If you prefer not to refresh the whole `PATH`, prepend the bin dir for this session only:

```powershell
$env:Path = "$env:USERPROFILE\scoop\apps\tinytex\current\bin\windows;" + $env:Path
```

Alternative — official installer: save and run [`install-bin-windows.bat`](https://yihui.org/tinytex/install-bin-windows.bat). That installs to `%APPDATA%\TinyTeX`. After install, open a new terminal (or refresh `PATH` as above). Session-only override if needed:

```powershell
$env:Path = "$env:APPDATA\TinyTeX\bin\windows;" + $env:Path
```

### 2. Poppler (PDF → PNG previews)

#### macOS

```bash
brew install poppler
```

#### Windows

```powershell
scoop install poppler
```

Provides `pdftoppm` / `pdfinfo`. Scoop shims are usually already on `PATH` in new terminals.

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
cp -f resume.pdf "Baden Morgan Resume.pdf"
rm -f resume.pdf
```

#### Windows

```powershell
# Skip if you already opened a new terminal after scoop install tinytex
$env:Path = [Environment]::GetEnvironmentVariable('Path','User') + ';' + [Environment]::GetEnvironmentVariable('Path','Machine')

cd outputs
lualatex -interaction=nonstopmode resume.tex
Copy-Item -Force resume.pdf "Baden Morgan Resume.pdf"
Remove-Item -Force resume.pdf
```

Run twice if paracol column balancing or cross-references look off (not strictly required for this template in practice — single pass has worked).

LuaLaTeX writes `resume.pdf` from the source name. Copy it to **`Baden Morgan Resume.pdf`** (the deliverable) and delete `resume.pdf`. Do not use `-jobname` (spaces break aux/log files).

## Generating a preview

```bash
pdftoppm -png -r 130 "Baden Morgan Resume.pdf" preview
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
| Compiled PDF | `outputs/Baden Morgan Resume.pdf` |
| Preview PNGs | `outputs/preview-*.png` |
| Profile photo | `assets/img/profile.jpg` (referenced as `../assets/img/profile.jpg` from `outputs/`) |
| TeX engine (macOS) | `~/Library/TinyTeX` |
| TeX engine (Windows, Scoop) | `%USERPROFILE%\scoop\apps\tinytex\current` |
| TeX binaries (Windows, Scoop) | `%USERPROFILE%\scoop\apps\tinytex\current\bin\windows` |
| TeX engine (Windows, `.bat`) | `%APPDATA%\TinyTeX` |
