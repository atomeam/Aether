# EcoMap — Tool Inventory

Recorded: 2026-07-18

## wsl://Ubuntu

| Tool | Binary Path | Version |
|------|-------------|---------|
| thyme | ~/.local/bin/thyme | 0.1.4 |
| tmux | /usr/bin/tmux | 3.6 |
| task | /usr/bin/task | 2.6.2 |
| jq | /usr/bin/jq | 1.8.1 |
| rg (ripgrep) | /usr/bin/rg | 15.1.0 |
| fd | ~/.local/bin/fd → /usr/bin/fdfind | 10.3.0 |
| bat | ~/.local/bin/bat → /usr/bin/batcat | 0.25.0 |
| fzf | /usr/bin/fzf | 0.67.0 |
| tree | /usr/bin/tree | 2.3.1 |
| htop | /usr/bin/htop | 3.4.1 |
| git | /usr/bin/git | 2.53.0 |
| curl | /usr/bin/curl | 8.18.0 |
| wget | /usr/bin/wget | 1.25.0 |
| python3 | /usr/bin/python3 | 3.14.3 |
| cargo/rustc | /usr/bin/cargo, /usr/bin/rustc | 1.93 |
| gcc/g++ | /usr/bin/gcc, /usr/bin/g++ | — |
| clang | /usr/bin/clang | — |
| cmake | /usr/bin/cmake | 4.2.3 |
| make | /usr/bin/make | — |
| perl | /usr/bin/perl | — |
| nc | /usr/bin/nc | — |

### Shims (non-destructive symlinks)

```
~/.local/bin/fd  → /usr/bin/fdfind
~/.local/bin/bat → /usr/bin/batcat
```

## powershell://local

| Tool | Binary Path | Version |
|------|-------------|---------|
| wuzz | C:\Users\adamm\go\bin\wuzz.exe | 0.5.0 |
| fx | C:\Users\adamm\go\bin\fx.exe | 39.2.0 |
| go | C:\Program Files\Go\bin\go.exe | 1.26.4 |
| node | C:\Program Files\nodejs\node.exe | v26.1.0 |
| npm | C:\Program Files\nodejs\npm.ps1 | — |
| git | C:\Program Files\Git\cmd\git.exe | 2.55.0 |
| python | C:\Users\adamm\...\Python313\python.exe | 3.13.13 |
| docker | C:\Program Files\Docker\resources\bin\docker.exe | — |
| kubectl | C:\Program Files\Docker\resources\bin\kubectl.exe | — |
| helm | winget link | — |
| terraform | winget link | — |
| aws | C:\Program Files\Amazon\AWSCLIV2\aws.exe | — |
| az | C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd | — |
| gcloud | C:\Program Files (x86)\Google\Cloud SDK\... | — |
| gh | C:\Program Files\GitHub CLI\gh.exe | — |
| java/javac | C:\Program Files\Microsoft\jdk-17\... | 17.0.19 |
| cargo/rustc | C:\Program Files\Rust stable MSVC 1.96\... | 1.96 |
| dotnet | C:\Program Files\dotnet\dotnet.exe | — |
| uv | pip scripts | — |
| pnpm | npm global | — |
| vercel | npm global | — |
| wrangler | npm global | — |
| esbuild | npm global | — |
| playwright | npm global | — |
| pytest | pip scripts | — |
| mise | winget link | — |
| starship | C:\Program Files\starship\bin\starship.exe | — |
| choco | C:\ProgramData\chocolatey\bin\choco.exe | — |
| winget | Windows Apps | — |

## Adapters

| Adapter | Location | Status |
|---------|----------|--------|
| thyme | `integrations/thyme/adapter.ps1` | ✅ THYME-001 proof passed |
| wuzz | `integrations/wuzz/adapter.ps1` | ✅ WUZZ-001 proof passed |
| fx | `integrations/fx/adapter.ps1` | ✅ FX-001 proof passed |
| taskwarrior | `integrations/taskwarrior/adapter.ps1` | ✅ All commands verified |

Contracts defined in `integrations/ADAPTER-CONTRACTS.md`.

## Not installed (deferred)

- Go/Node in WSL (available on Windows)
- Docker Engine in Ubuntu (use Docker Desktop WSL integration)
- yq (deferred until implementation chosen)
- jq/rg/fd/bat/fzf on Windows (deferred until PowerShell-native use case)
- More adapters (generic utilities → EcoMap, not dedicated adapters)
