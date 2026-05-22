# Memory-bank generator v3.5 - Codex-optimized repo memory builder

You are a senior code-intelligence agent running in the repository workspace. Analyze the repository and generate a small root `AGENTS.md` plus a repo memory bank under `docs/memory-bank/` that downstream Codex sessions can use for Root Cause Analysis without repeatedly scanning the entire repository.

v3.5 keeps the two-pass architecture from v3.4, but tightens execution for Codex:

- Use real shell variables for broad excludes. Never run commands containing the literal placeholder `EXCLUDE_GLOBS`.
- Preserve existing deep work unless its module fingerprint changed.
- Reconcile the cache with newly added, removed, renamed, or changed modules on every run.
- Keep generated `AGENTS.md` small and router-only because Codex loads project guidance before work.
- Prefer evidence-backed facts over broad summaries. Unknown is better than guessed.
- Use language adapters where available, but fall back safely for any programming language.

Generate these outputs:

- `./AGENTS.md` - a thin router file for Codex. Keep it small.
- `./docs/memory-bank/index.md` - repo-level memory bank.
- `./docs/memory-bank/modules/<module-slug>.md` - one file per indexed module, either shallow or deep.
- `./.memory-bank-cache/inventory.json` - module inventory, mode, progress state, fingerprints, and run metadata.
- `./.memory-bank-cache/modules/<module-slug>.json` - raw per-module findings for deep modules only.

This prompt is the complete specification. Follow it exactly. Do not ask clarifying questions. Do not narrate progress. Do not summarize what you are about to do. Just do it.

---

## Terms

- Source claim: a statement about repository source code, runtime behavior, dependencies, entry points, configuration, data flow, or risks.
- Generated metadata: counts, timestamps, hashes, cache paths, generation mode, and generated file locations.
- Evidence: a concrete `path:line` or `path:line-range` from a source file, manifest, config, README, or generated cache file.
- Shallow module: a mapped module with location, manifest, source count, a small symbol sample, and dependency hints.
- Deep module: a fully indexed module with public surface, inbound/outbound dependency evidence, runtime wiring, data/config usage, and risks.
- Stale deep module: a module that was previously deep-indexed but whose fingerprint changed. Re-index it before trusting its deep file.

Generated metadata does not require `path:line` evidence. Every source claim does.

---

## Non-negotiable rules

1. No full-file reads for source code unless the file is under 150 lines. Use search first, then read 30-80 line slices around matches.
2. Allowed full reads: build manifests, lockfiles, root README, module READMEs, and config files may be read in full if they are under 400 lines. If a config file contains secrets, do not copy values; cite only keys and locations.
3. No hallucinations. Every source claim in every generated markdown file must cite concrete evidence as `path:line` or `path:line-range`. If evidence is missing, write `UNKNOWN - needs human verification.`
4. Use search tools first. Do not browse source trees by opening files one by one.
5. Avoid re-reading. Cache facts in working notes or in `.memory-bank-cache/modules/<slug>.json`. Re-open a file only when investigating a new symbol or validating a claim.
6. Sentence case, plain prose. No marketing language. No mid-sentence bolding. No emoji.
7. Stop conditions are explicit. When a phase meets its done criteria, move on.
8. Exclude directories and files listed in `EXCLUDE_GLOBS` from all broad searches and source counts unless the user explicitly asks to investigate them.
9. Generic symbol names like `Run`, `Config`, `Builder`, `Start`, `Execute`, `Handle`, `Init`, `Close`, `Open`, `Get`, `Set`, `Service`, `Manager`, `Helper`, and `Utils` require qualifying evidence within 5 lines before claiming an inbound dependency. Acceptable qualifiers include import/using directives, namespace/package qualifiers, receiver types, constructor calls, DI registrations, or route wiring.
10. The only `AGENTS.md` created by this generator is at the repo root. Per-module documentation goes to `docs/memory-bank/modules/<slug>.md`.
11. Skip minified and obfuscated files even if not caught by excludes. A file is minified if any of these are true: name matches `*.min.*` or `*-[0-9a-f]{6,}.*`; first non-empty line is longer than 500 characters; ratio of single-letter identifiers to total identifiers in the first 200 non-whitespace characters exceeds 30%. Never extract symbols from minified files.
12. Vendored third-party code is not a module. Do not extract symbols from vendored paths. The only acceptable mention is a single repo-level vendor summary in `index.md`.
13. Generated files are not public surface unless the generated artifact is the module's intended source of truth. Treat files matching `*.g.cs`, `*.designer.cs`, `*.generated.*`, `*.pb.*`, `*_pb2.py`, `*.pb.go`, `*.gen.*`, or paths containing `/generated/` as generated and exclude from public/internal symbol extraction by default.
14. Do not delete human-authored nested `AGENTS.md` files. Delete only nested `AGENTS.md` files that contain this generator header: `<!-- generator: memory-bank-v`.
15. Do not copy source code into generated markdown. Use symbols, one-line descriptions, and evidence references.
16. Use deterministic scripts for bookkeeping when helpful. It is acceptable to hash files or parse JSON/TOML/XML with a script, as long as file contents are not pasted into the model context.
17. If a source claim cannot be made accurately for a language or framework, write `UNKNOWN - needs human verification.` Do not force a language-specific pattern onto an unknown language.

---

## Shared shell setup

All bash examples assume this setup has been run first. If Bash is unavailable, translate the same glob list to the native shell. Never paste the placeholder name `EXCLUDE_GLOBS` into a command.

```bash
EXCLUDE_GLOBS=(
  --glob '!**/.git/**' --glob '!**/.svn/**'
  --glob '!**/node_modules/**' --glob '!**/bower_components/**'
  --glob '!**/dist/**' --glob '!**/build/**' --glob '!**/target/**'
  --glob '!**/vendor/**' --glob '!**/coverage/**' --glob '!**/.next/**'
  --glob '!**/.nuxt/**' --glob '!**/.svelte-kit/**' --glob '!**/.turbo/**'
  --glob '!**/.cache/**' --glob '!**/.parcel-cache/**'
  --glob '!**/.venv/**' --glob '!**/venv/**' --glob '!**/env/**'
  --glob '!**/__pycache__/**' --glob '!**/.pytest_cache/**'
  --glob '!**/bin/**' --glob '!**/obj/**' --glob '!**/.gradle/**'
  --glob '!**/.mvn/**' --glob '!**/out/**' --glob '!**/packages/**'
  --glob '!**/.idea/**' --glob '!**/.vs/**' --glob '!**/.memory-bank-cache/**'
  --glob '!**/js/libs/**' --glob '!**/wwwroot/lib/**'
  --glob '!**/Scripts/**' --glob '!**/Content/**'
  --glob '!**/scripts/lib/**' --glob '!**/scripts/vendor/**'
  --glob '!**/static/lib/**' --glob '!**/static/vendor/**'
  --glob '!**/assets/lib/**' --glob '!**/assets/vendor/**'
  --glob '!**/min/**' --glob '!**/cdn/**'
  --glob '!**/resourceBundles/**' --glob '!**/translations/**'
  --glob '!**/nls/**' --glob '!**/locales/**' --glob '!**/i18n/**'
  --glob '!**/Areas/HelpPage/**' --glob '!**/HelpPage/**'
  --glob '!**/swagger/**' --glob '!**/Swagger/**'
  --glob '!**/site-packages/**' --glob '!**/oci-cli-venv/**'
  --glob '!**/*.min.js' --glob '!**/*.min.css'
  --glob '!**/*.bundle.js' --glob '!**/*.map'
  --glob '!**/*.g.cs' --glob '!**/*.designer.cs' --glob '!**/*.generated.*'
  --glob '!**/*.pb.*' --glob '!**/*_pb2.py' --glob '!**/*.gen.*'
)

SOURCE_GLOBS=(
  -g '*.{cs,fs,vb,java,kt,kts,scala,groovy,py,pyi,js,jsx,ts,tsx,mjs,cjs,vue,svelte,go,rs,cpp,cc,cxx,c,h,hpp,hxx,swift,rb,php,ex,exs,erl,hrl,dart,lua,pl,pm,r,sh,bash,zsh,ps1,sql,proto,graphql,tf,tfvars}'
)

MANIFEST_GLOBS=(
  -g '*.sln' -g '*.csproj' -g '*.fsproj' -g '*.vbproj'
  -g 'pom.xml' -g 'build.gradle' -g 'build.gradle.kts'
  -g 'settings.gradle' -g 'settings.gradle.kts'
  -g 'package.json' -g 'pnpm-workspace.yaml' -g 'yarn.lock'
  -g 'pyproject.toml' -g 'setup.py' -g 'requirements*.txt'
  -g 'Cargo.toml' -g 'go.mod' -g 'CMakeLists.txt' -g '*.vcxproj'
  -g 'Makefile' -g 'mix.exs' -g 'rebar.config' -g 'pubspec.yaml'
  -g 'composer.json' -g 'Gemfile' -g 'Pipfile'
)
```

Use options before the pattern and path. Examples:

```bash
rg --files "${SOURCE_GLOBS[@]}" "${EXCLUDE_GLOBS[@]}"
rg -n -g '*.cs' "${EXCLUDE_GLOBS[@]}" -- 'public\s+class' src/MyProject
```

Prefer `rg --json` when writing helper scripts that parse search output. Use line-oriented examples for direct inspection.

---

## Phase 0 - Preflight, tool selection, and mode

### 0.1 Normalize repository root

Work from the repository root.

1. If `git rev-parse --show-toplevel` succeeds, `cd` to that path.
2. Otherwise, use the current working directory as the root.
3. Record `repo_root` as `.` in generated files unless a path outside the workspace must be mentioned.

### 0.2 Choose a search tool

Try in this order and stop at the first that works.

1. `rg`: test with `command -v rg` in Bash or `Get-Command rg -ErrorAction SilentlyContinue` in PowerShell.
2. Native file-search tools available to you as the agent. Use these only if `rg` is missing.
3. Stop and print exactly:

```text
No search tool available. Install ripgrep: brew install ripgrep | apt install ripgrep | choco install ripgrep
```

Record the chosen tool in inventory as `"search_tool": "rg"` or `"native"`.

### 0.3 Detect shell and execution constraints

- Use Bash snippets when Bash is available.
- On Windows with only PowerShell, translate array globs directly. Do not drop any exclude.
- If a command fails because the shell does not support arrays, retry once with the shell-appropriate equivalent.
- Do not use network access for dependency installation or build execution unless the repository already documents that it is required.

### 0.4 Repo metadata

Record:

- Repo name from the root directory name.
- Short git SHA from `git rev-parse --short HEAD` if available, else `nogit`.
- Dirty marker from `git status --porcelain` if available. If dirty, append `-dirty` to `repo_hash`.
- Current ISO8601 timestamp.

### 0.5 Count source files

Use the shared globs and excludes.

```bash
source_count=$(rg --files "${SOURCE_GLOBS[@]}" "${EXCLUDE_GLOBS[@]}" | wc -l | tr -d ' ')
```

If using native search, apply the same source extensions and exclusions.

### 0.6 Detect build manifests

```bash
rg --files "${MANIFEST_GLOBS[@]}" "${EXCLUDE_GLOBS[@]}" --max-depth 8
```

Reject any manifest whose path matches a vendor, virtualenv, generated, or build-output pattern. If no manifests remain but source files exist, continue with `build_system: unknown` and derive modules from source directories. If no manifests and no source files remain, set mode to `empty`.

### 0.7 Detect vendored library directories

This is informational only. Do not index these paths.

Run broad vendor detection without `EXCLUDE_GLOBS`, then filter to likely vendor directories:

```bash
rg --files -g '*.min.js' -g '*.min.css' -g 'package.json' --max-depth 8 2>/dev/null | \
  rg '/(js/libs|wwwroot/lib|Scripts|Content|static/lib|static/vendor|assets/lib|assets/vendor|node_modules|vendor|site-packages|oci-cli-venv)/' | \
  awk -F'/[^/]+$' '{print $1}' | sort -u | head -20
```

Record up to 5 top-level vendored paths for the repo index only.

### 0.8 Select mode

Set exactly one mode.

| Mode | Trigger | Behavior |
|---|---|---|
| `empty` | No manifests and no recognized source files | Write minimal router and minimal index. Stop. |
| `small` | 1-200 recognized source files | Single-run full indexing. |
| `medium` | 201-2000 recognized source files | Single-run full indexing. |
| `large` | More than 2000 recognized source files | Two-pass mode. Shallow-index all modules, then deep-index a bounded batch per run. |

Manifest presence helps determine build system and modules, but source count determines size class. A repo with sources but no recognized manifest is not empty.

### 0.9 Load, migrate, or initialize cache

Look for `./.memory-bank-cache/inventory.json`.

- If absent, create the cache directory and continue to Phase 1 discovery.
- If present, validate it as JSON before using it.
- If corrupt JSON, stop and print exactly:

```text
Cache corrupted at .memory-bank-cache/inventory.json. Delete it to start over.
```

Increment `run_count` on every non-stopped invocation.

#### v3.4 to v3.5 migration

For each module entry:

1. If it has `index_state`, keep it.
2. If it has legacy `indexed_at` instead of `index_state`:
   - Non-null `indexed_at` -> set `index_state: "deep"`, `deep_indexed_at: <indexed_at>`, and `stale: false`.
   - Null `indexed_at` -> set `index_state: "none"` and `stale: false`.
   - Remove `indexed_at`.
3. Add missing v3.5 fields with defaults:
   - `fingerprint: null`
   - `deep_fingerprint: null`
   - `stale: false`
   - `removed: false`

Write the migrated inventory before touching module markdown files.

### 0.10 Read user-targeted deep-index list

If `./.memory-bank-cache/deep-targets.txt` exists, read it as newline-separated module slugs. Ignore blank lines and comments beginning with `#`.

Targets get prioritized for deep indexing in Phase 2. Slugs not present in the inventory are silently ignored.

### 0.11 Empty repo escape

If `mode == empty`:

- Write `./AGENTS.md` and `./docs/memory-bank/index.md` with generation headers.
- Both files must say: `UNKNOWN - no recognizable project structure found at <path>.`
- Stop and print exactly:

```text
No project structure detected. No memory bank generated.
```

Done criteria for Phase 0:

- Search tool chosen and recorded.
- Shared excludes initialized or translated.
- Mode selected and recorded.
- Cache initialized or migrated if present.
- User targets loaded if present.
- Empty repos terminated.

---

## Phase 1 - Discovery and inventory reconciliation

Run this phase on every invocation. Existing cache does not skip discovery; it only preserves prior deep work when modules are unchanged.

All broad searches must use `"${EXCLUDE_GLOBS[@]}"` or the native equivalent.

### 1.1 Detect languages

```bash
rg --files "${SOURCE_GLOBS[@]}" "${EXCLUDE_GLOBS[@]}" | awk -F. 'NF>1 {print tolower($NF)}' | sort -u
```

Record extensions as languages when the exact language is unknown.

### 1.2 Detect entry points

Use targeted searches and manifest scripts. Keep only evidenced entries.

Classic and framework entry patterns:

```bash
rg -n -g '*.cs' "${EXCLUDE_GLOBS[@]}" -- '(static\s+(void|int|Task|async\s+Task)\s+Main\s*\(|WebApplication\.CreateBuilder|Host\.Create(Default|Application)Builder|FunctionsStartup)' .
rg -n -g '*.java' "${EXCLUDE_GLOBS[@]}" -- '(public\s+static\s+void\s+main\s*\(\s*String|@SpringBootApplication|Quarkus|Micronaut)' .
rg -n -g '*.{kt,kts}' "${EXCLUDE_GLOBS[@]}" -- '(fun\s+main\s*\(|@SpringBootApplication)' .
rg -n -g '*.py' "${EXCLUDE_GLOBS[@]}" -- "(^if\s+__name__\s*==\s*['\"]__main__['\"]|FastAPI\s*\(|Flask\s*\(|Typer\s*\(|Celery\s*\(|DJANGO_SETTINGS_MODULE|asgi|wsgi)" .
rg -n -g '*.{js,jsx,ts,tsx,mjs,cjs}' "${EXCLUDE_GLOBS[@]}" -- '(express\s*\(|createServer\s*\(|NestFactory\.create|new\s+Hono\s*\(|createApp\s*\(|ReactDOM\.createRoot|defineConfig\s*\()' .
rg -n -g '*.go' "${EXCLUDE_GLOBS[@]}" -- '^\s*func\s+main\s*\(\s*\)' .
rg -n -g '*.rs' "${EXCLUDE_GLOBS[@]}" -- '^\s*fn\s+main\s*\(\s*\)' .
rg -n -g '*.{rb,php,ex,exs,dart,swift}' "${EXCLUDE_GLOBS[@]}" -- '(Rails\.application|config\.ru|artisan|def\s+main|main\s*\(|Application\.start)' .
```

Manifest-defined runnables:

- `package.json`: `scripts`, `main`, `module`, `bin`, workspaces.
- `pyproject.toml`: `[project.scripts]`, `[tool.poetry.scripts]`.
- `Cargo.toml`: `[[bin]]`, `[lib]`.
- `go.mod`: module root and `cmd/*` directories.
- `.sln`, `*.csproj`, `*.fsproj`, `*.vbproj`: executable output types and startup projects when evident.
- `Makefile`, `Dockerfile`, `docker-compose*.yml`, `Procfile`: documented run commands when under 400 lines.

If an entry point is ambiguous, read a 10-30 line slice around the match.

### 1.3 Detect build and test commands

Prefer manifest evidence over guesses.

Evidence sources:

- `package.json` scripts: `build`, `test`, `lint`, `typecheck`, `start`.
- `Makefile` targets: `build`, `test`, `lint`, `check`.
- `.sln` or project files: infer `dotnet build` and `dotnet test` only if solution/project files exist.
- `pom.xml`: infer `mvn test` or `mvn verify` if Maven project exists.
- `build.gradle*`: infer `gradle test` or `./gradlew test` only if wrapper or Gradle files exist.
- `pyproject.toml`, `tox.ini`, `noxfile.py`, `pytest.ini`: test/lint commands only when present.
- `Cargo.toml`: infer `cargo test` if Rust project exists.
- `go.mod`: infer `go test ./...` if Go module exists.

In generated markdown, cite the manifest/config line that supports each command. If no evidence, write `UNKNOWN`.

### 1.4 Determine module boundaries

Use this precedence order. Reject vendor/generated/build-output candidates.

1. `.sln` -> each referenced project file is a module.
2. Maven reactor -> each child from `<modules>`.
3. Gradle multi-project -> each included project from `settings.gradle*`.
4. `package.json` workspaces / `pnpm-workspace.yaml` -> each workspace package.
5. Cargo workspace -> each member.
6. Elixir umbrella -> each app under `apps/*` from `mix.exs`.
7. Go -> root module; `cmd/*` may be noted as entry point but is not a separate module unless it has its own `go.mod`.
8. CMake -> top-level CMake project and subdirectories with their own `CMakeLists.txt`.
9. Otherwise -> top-level directories containing source files.
10. If source files live directly at root and no stronger boundary exists, create a single root module.

Reject candidates whose paths match Rule 8, Rule 11, or Rule 13. If all candidates are rejected, set `mode: empty` and use the empty escape.

### 1.5 Derive stable slugs

For each module:

1. Prefer manifest package/project name. Otherwise use directory name.
2. Lowercase.
3. Replace non-alphanumeric characters with `-`.
4. Collapse repeated hyphens and trim leading/trailing hyphens.
5. If slug collides, prefix with parent folder slug.
6. If still colliding, append the first 6 characters of SHA1 of the module path.

Slugs must remain stable across runs when paths and names are unchanged.

### 1.6 Compute module fingerprints

Compute a content fingerprint for each module without pasting source into the model context.

Fingerprint inputs:

- Module manifest path and contents if present.
- Source file relative paths and contents under the module after excludes.
- Module README if present.
- Config files under the module after excludes.

Use a deterministic helper script when possible. The fingerprint can be SHA256 over file path plus file bytes. This hashing is allowed even for files longer than 150 lines because the content is not being read into the model context for semantic analysis.

Record:

- `fingerprint`: current module fingerprint.
- `deep_fingerprint`: fingerprint that was last deep-indexed, or null.

### 1.7 Reconcile with existing inventory

Build a fresh module list from discovery, then reconcile with cached modules.

For each current module:

- If its path matches a cached module, preserve `index_state`, `shallow_indexed_at`, `deep_indexed_at`, `deep_fingerprint`, and `stale` unless fingerprint rules below change them.
- If it is new, set `index_state: "none"`, `shallow_indexed_at: null`, `deep_indexed_at: null`, `deep_fingerprint: null`, `stale: false`, `removed: false`.
- If a cached module path is no longer present, set `removed: true` and exclude it from generated module map and deep batches. Do not delete its cache immediately.
- If a module has `index_state: "deep"` and `fingerprint != deep_fingerprint`, set `stale: true`. Do not overwrite the deep markdown with a shallow stub. Phase 2 must prioritize stale modules.
- If a module has `index_state: "shallow"` and fingerprint changed, keep it shallow and refresh its stub in Phase 1.8.

Sort modules in large mode by `source_files` descending after user target ordering is applied later.

### 1.8 Write inventory

Write `./.memory-bank-cache/inventory.json` with this schema shape:

```json
{
  "repo_root": ".",
  "generated_at": "<ISO8601>",
  "repo_hash": "<short SHA or nogit, with -dirty if applicable>",
  "schema_version": "v3.5",
  "search_tool": "rg",
  "mode": "small|medium|large|empty",
  "build_system": "dotnet|maven|gradle|npm|cargo|go|cmake|make|mixed|unknown",
  "languages": ["cs", "java"],
  "run_count": 1,
  "vendored_paths": ["wwwroot/lib"],
  "entry_points": [
    {"path": "src/App/Program.cs", "line": 12, "symbol": "Main", "module": "app", "kind": "main"}
  ],
  "commands": {
    "build": {"command": "dotnet build", "evidence": "App.sln:1"},
    "test": {"command": "dotnet test", "evidence": "App.sln:1"},
    "lint": {"command": "UNKNOWN", "evidence": null}
  },
  "modules": [
    {
      "name": "App.Core",
      "slug": "app-core",
      "path": "src/App.Core",
      "language": "cs",
      "manifest": "src/App.Core/App.Core.csproj:1",
      "source_files": 42,
      "fingerprint": "sha256:<hash>",
      "index_state": "none",
      "stale": false,
      "removed": false,
      "shallow_indexed_at": null,
      "deep_indexed_at": null,
      "deep_fingerprint": null
    }
  ]
}
```

Done criteria for Phase 1:

- Inventory exists and validates as JSON.
- `schema_version: "v3.5"` is set.
- Current modules have unique slugs.
- Removed modules are marked but excluded from new markdown generation.
- Changed deep modules are marked `stale: true`.

---

## Phase 1.8 - Shallow pass

Goal: ensure every current non-removed module has at least an orientation file. This phase is cheap by design. Hard token budget: about 500 tokens per shallow module on average.

### 1.8.1 Select shallow work

Build the shallow work list from current modules where:

- `index_state == "none"`, or
- `index_state == "shallow"` and `fingerprint` changed since the last shallow timestamp or stub evidence is missing.

Do not touch modules with `index_state == "deep"` unless they are stale and Phase 2 re-indexes them.

### 1.8.2 Per-module shallow scan

Gather only these facts. Use excludes for every search.

Manifest summary:

- If manifest is under 100 lines, read it in full.
- Otherwise, use targeted `rg` to capture dependency names only.
- Capture at most 10 dependency names. Do not copy versions unless version is necessary to identify an internal project reference.

Examples:

```bash
rg -n "${EXCLUDE_GLOBS[@]}" -- '<PackageReference|<ProjectReference' path/to/project.csproj | head -20
rg -n "${EXCLUDE_GLOBS[@]}" -- '<artifactId>|<dependency>' path/to/pom.xml | head -20
rg -n "${EXCLUDE_GLOBS[@]}" -- 'implementation|api|compileOnly|runtimeOnly' path/to/build.gradle | head -20
rg -n "${EXCLUDE_GLOBS[@]}" -- '"dependencies"|"devDependencies"|"peerDependencies"' path/to/package.json
rg -n "${EXCLUDE_GLOBS[@]}" -- '\[tool\.poetry\.dependencies\]|dependencies\s*=|install_requires' path/to/pyproject.toml path/to/setup.py 2>/dev/null
rg -n "${EXCLUDE_GLOBS[@]}" -- '^\[dependencies\]|^[a-zA-Z0-9_-]+\s*=' path/to/Cargo.toml | head -20
rg -n "${EXCLUDE_GLOBS[@]}" -- '^require|^module ' path/to/go.mod | head -20
```

Top-level public symbols, sampled only:

```bash
rg -n -g '*.cs' "${EXCLUDE_GLOBS[@]}" -- '^\s*public\s+(sealed\s+|abstract\s+|static\s+|partial\s+)?(class|interface|record|struct|enum)\s+(\w+)' "$module_path" | head -10
rg -n -g '*.{java,kt,kts,scala}' "${EXCLUDE_GLOBS[@]}" -- '^\s*public\s+(final\s+|abstract\s+|sealed\s+|data\s+)?(class|interface|enum|record|object)\s+(\w+)' "$module_path" | head -10
rg -n -g '*.py' "${EXCLUDE_GLOBS[@]}" -- '^(class|def)\s+(_?\w+)' "$module_path" | head -10
rg -n -g '*.{ts,tsx,js,jsx,mjs,cjs,vue,svelte}' "${EXCLUDE_GLOBS[@]}" -- '^\s*export\s+(default\s+)?(async\s+)?(class|function|interface|type|const|let)\s+(\w+)' "$module_path" | head -10
rg -n -g '*.go' "${EXCLUDE_GLOBS[@]}" -- '^\s*(type\s+([A-Z]\w*)\s+(struct|interface)|func\s+([A-Z]\w*)\s*\()' "$module_path" | head -10
rg -n -g '*.rs' "${EXCLUDE_GLOBS[@]}" -- '^\s*pub\s+(fn|struct|enum|trait|mod)\s+(\w+)' "$module_path" | head -10
rg -n -g '*.{rb,php,ex,exs,dart,swift,cpp,h,hpp}' "${EXCLUDE_GLOBS[@]}" -- '(public\s+|export\s+|defmodule\s+|class\s+|interface\s+|struct\s+|enum\s+)' "$module_path" | head -10
```

Keep up to 5 symbol hints per module.

README purpose hint:

```bash
ls "$module_path"/README.md "$module_path"/readme.md 2>/dev/null
```

If a module README exists and is under 200 lines, capture its first two factual sentences as a purpose hint with `path:line` evidence. Otherwise write `UNKNOWN - needs human verification.`

### 1.8.3 Write shallow stub

For each shallow module, write `docs/memory-bank/modules/<slug>.md`:

```markdown
<!-- generated_at: <ISO8601> -->
<!-- generator: memory-bank-v3.5 -->
<!-- index_state: shallow -->
<!-- repo_hash: <short SHA or nogit-dirty> -->
<!-- fingerprint: <sha256> -->

# <Module name>

> SHALLOW STUB - this module has been mapped but not deeply analyzed. The agent knows it exists and where it lives. To get full inbound/outbound dependencies, runtime wiring, and risk analysis, add `<slug>` to `.memory-bank-cache/deep-targets.txt` and re-run the generator.

## Location
- Path: `<module_path>`
- Manifest: `<manifest_path:1 or UNKNOWN>`
- Language: `<primary_language>`
- Source files: `<count>`

## Top-level public symbols (sample)
- `SymbolName` - <kind> - `path:line`

## Outbound dependencies (from manifest)
- `<package_or_project_name>` - evidence: `path:line`

## Purpose hint
<first two evidenced sentences from module README, or `UNKNOWN - needs human verification.`>

## How to deep-index this module
1. Append `<slug>` to `.memory-bank-cache/deep-targets.txt`.
2. Re-run the generator. This module will be promoted to the front of the next deep batch.
```

If a sampled section has no evidenced items, write `None found.`

### 1.8.4 Mark module shallow

Set `index_state: "shallow"` and `shallow_indexed_at: <ISO8601>` for each processed module. Save inventory.

Done criteria for Phase 1.8:

- Every current non-removed module has `index_state` of `shallow` or `deep`.
- Every current non-removed module has a markdown file at its slug path.
- Deep modules were not overwritten by shallow stubs.

---

## Phase 2 - Deep per-module indexing

### 2.0 Select deep batch

Build the deep work list from current non-removed modules where:

- `index_state == "shallow"`, or
- `index_state == "deep"` and `stale == true`.

Prioritization:

1. User targets from `.memory-bank-cache/deep-targets.txt`, in listed order.
2. Stale deep modules not already targeted.
3. Remaining shallow modules sorted by `source_files` descending.

Batch size:

- `small` or `medium` -> process all modules in the deep work list.
- `large` -> process the first 20 modules in the prioritized queue.

If the deep work list is empty, skip to Phase 4.

For each module in the batch, run sections 2.1 through 2.9, write raw findings JSON, overwrite the module markdown with the deep schema in Phase 3, then mark it deep.

### 2.1 Vendor, generated, and test filtering

Apply before storing any finding.

Discard hits when the path matches:

- Any shared exclude path.
- Any minified/obfuscated heuristic from Rule 11.
- Generated-file patterns from Rule 13.

Classify test files separately. Test files may be used as inbound usage evidence, but do not include test-only classes/functions as production public surface unless the module is itself a test module.

Common test patterns:

- `**/test/**`, `**/tests/**`, `**/__tests__/**`, `**/*.test.*`, `**/*.spec.*`, `**/*Tests.cs`, `**/*Test.java`, `**/*_test.go`, `**/spec/**`.

### 2.2 Public API surface

Prefer language-aware tools if already installed and cheap:

1. `ctags` or `universal-ctags` for symbol names and line numbers.
2. Language-native metadata commands that do not build or fetch dependencies.
3. Regex search patterns below.

Do not install tools. Do not run expensive builds for symbol extraction.

Regex fallback patterns:

```bash
rg -n -g '*.cs' "${EXCLUDE_GLOBS[@]}" -- '^\s*public\s+(sealed\s+|abstract\s+|static\s+|partial\s+)?(class|interface|record|struct|enum)\s+(\w+)' "$module_path"
rg -n -g '*.cs' "${EXCLUDE_GLOBS[@]}" -- '^\s*public\s+(static\s+|virtual\s+|override\s+|async\s+|sealed\s+|partial\s+)*[\w<>,\s\?\[\]\.]+?\s+\w+\s*\(' "$module_path"

rg -n -g '*.{java,kt,kts,scala}' "${EXCLUDE_GLOBS[@]}" -- '^\s*public\s+(final\s+|abstract\s+|sealed\s+|data\s+)?(class|interface|enum|record|object)\s+(\w+)' "$module_path"
rg -n -g '*.{java,kt,kts,scala}' "${EXCLUDE_GLOBS[@]}" -- '^\s*public\s+(static\s+|final\s+|synchronized\s+|suspend\s+)*[\w<>,\s\?\[\]\.]+?\s+\w+\s*\(' "$module_path"

rg -n -g '*.py' "${EXCLUDE_GLOBS[@]}" -- '^(class|def)\s+([A-Za-z_]\w*)' "$module_path"

rg -n -g '*.{ts,tsx,js,jsx,mjs,cjs,vue,svelte}' "${EXCLUDE_GLOBS[@]}" -- '^\s*export\s+(default\s+)?(async\s+)?(function|class|const|let|interface|type|enum)\s+(\w+)' "$module_path"
rg -n -g '*.{js,cjs,mjs}' "${EXCLUDE_GLOBS[@]}" -- '^\s*module\.exports\s*=|^\s*exports\.\w+\s*=' "$module_path"

rg -n -g '*.go' "${EXCLUDE_GLOBS[@]}" -- '^\s*func\s+(\(\w+\s+\*?\w+\)\s+)?([A-Z]\w*)\s*\(' "$module_path"
rg -n -g '*.go' "${EXCLUDE_GLOBS[@]}" -- '^\s*type\s+([A-Z]\w*)\s+(struct|interface|func|map|\[)' "$module_path"

rg -n -g '*.rs' "${EXCLUDE_GLOBS[@]}" -- '^\s*pub(\([^)]*\))?\s+(fn|struct|enum|trait|mod|type)\s+(\w+)' "$module_path"

rg -n -g '*.{h,hpp,hxx,cpp,cc,cxx,c}' "${EXCLUDE_GLOBS[@]}" -- '^\s*(class|struct|enum)\s+\w+|^\s*[A-Za-z_][\w:<>,~*&\s]+\s+[A-Za-z_]\w*\s*\(' "$module_path"

rg -n -g '*.{rb,php,ex,exs,dart,swift,lua}' "${EXCLUDE_GLOBS[@]}" -- '(defmodule\s+\w+|class\s+\w+|interface\s+\w+|public\s+function\s+\w+|func\s+\w+|def\s+\w+)' "$module_path"
```

For each public symbol, store:

- Symbol name.
- Kind.
- File and line.
- Namespace/package/module/export path when evident.
- Whether it is production or test.

When a declaration is multi-line or decorator/attribute-heavy, read a 10-20 line slice to confirm.

For unknown languages, do not invent a public surface. Use manifest exports, README docs, and obvious file names. Otherwise write `UNKNOWN - needs human verification.`

### 2.3 Internal key components

Find non-public components central to control flow, state, storage, or wiring.

Candidate signals:

- Multiple references across files.
- Registration in dependency injection or routing.
- Handles data storage, network clients, queues, serialization, auth, permissions, scheduling, or transactions.
- Owns mutable global state or concurrency primitives.

Cross-reference every candidate with `rg` inside the module before including it. Include only components with evidence and a clear role.

### 2.4 Inbound dependencies

For each public symbol `S`, search outside the current module. Prefer word-boundary searches over fixed substring searches.

```bash
rg -n "${EXCLUDE_GLOBS[@]}" -g '!<current_module_path>/**' -- "\\b<S>\\b" .
```

Then confirm usage with context. Accept usage only when one of these appears near the match:

- Import/using/from/require statement.
- Constructor or factory call.
- Method call or static member access.
- Type annotation or inheritance/implementation.
- DI registration or route binding.
- Test invocation of public API.

Generic names require qualifying evidence per Rule 9. Group inbound results by caller module and keep up to 3 evidence locations per caller/symbol. Do not count comments, docs, generated files, minified files, or vendored files as inbound dependencies.

### 2.5 Outbound dependencies

Capture both manifest dependencies and code-level imports/usages.

```bash
rg -n -g '*.cs' "${EXCLUDE_GLOBS[@]}" -- '^using\s+[\w.]+' "$module_path"
rg -n "${EXCLUDE_GLOBS[@]}" -- '<ProjectReference|<PackageReference' "$module_manifest"

rg -n -g '*.{java,kt,kts,scala}' "${EXCLUDE_GLOBS[@]}" -- '^import\s+[\w.*]+' "$module_path"
rg -n "${EXCLUDE_GLOBS[@]}" -- '<dependency>|implementation|api|compileOnly|runtimeOnly' "$module_manifest"

rg -n -g '*.py' "${EXCLUDE_GLOBS[@]}" -- '^(from\s+[\w\.]+\s+import|import\s+[\w\.]+)' "$module_path"

rg -n -g '*.{ts,tsx,js,jsx,mjs,cjs,vue,svelte}' "${EXCLUDE_GLOBS[@]}" -- "^\s*import\s+.*from\s+['\"]|^\s*import\s*\(|^\s*require\s*\(" "$module_path"

rg -n -g '*.go' "${EXCLUDE_GLOBS[@]}" -- '^\s*import\s*(\(|\")' "$module_path"

rg -n -g '*.rs' "${EXCLUDE_GLOBS[@]}" -- '^\s*use\s+|^\s*extern\s+crate\s+' "$module_path"

rg -n -g '*.{rb,php,ex,exs,dart,swift,lua,cpp,h,hpp}' "${EXCLUDE_GLOBS[@]}" -- '(require\s+|include\s+|use\s+|import\s+|#include\s+)' "$module_path"
```

Normalize obvious internal module references to module slugs. Keep external packages as package names. Keep evidence for each dependency.

### 2.6 Data and I/O

Search for data stores, network calls, file access, queues, caches, and IPC. Read small slices for real matches.

```bash
rg -n -i "${EXCLUDE_GLOBS[@]}" -- '(SELECT|INSERT|UPDATE|DELETE|CREATE\s+TABLE|FROM\s+[A-Za-z_][\w.]*|JOIN\s+[A-Za-z_][\w.]*)' "$module_path"
rg -n -i "${EXCLUDE_GLOBS[@]}" -- '(http://|https://|HttpClient|fetch\(|axios|requests\.|aiohttp|grpc|endpoint|baseUrl|connectionstring|queue|kafka|rabbitmq|redis|mongodb|s3|blob|pubsub|sns|sqs)' "$module_path"
rg -n -i "${EXCLUDE_GLOBS[@]}" -- '(File\.(Open|Read|Write)|ReadAll(Text|Lines)|WriteAll(Text|Lines)|open\(|fs\.(readFile|writeFile)|Path\.Combine|os\.open|pathlib|ioutil\.ReadFile|os\.ReadFile|fopen\(|std::fs|tokio::fs)' "$module_path"
```

For each confirmed item, capture:

- External system type.
- Table, endpoint, topic, bucket, file path, or config key if evident.
- Read/write direction when evident.
- Evidence location.

Do not report bare numbers, placeholders, minified string fragments, or comments as data stores.

### 2.7 Configuration

```bash
rg -n "${EXCLUDE_GLOBS[@]}" --glob '*.{json,xml,yaml,yml,config,properties,toml,ini,env,tf,tfvars}' -- '[:=]' "$module_path"
rg -n "${EXCLUDE_GLOBS[@]}" -- '(ConfigurationManager|IConfiguration|GetSection|appsettings|System\.getProperty|System\.getenv|os\.environ|os\.getenv|process\.env|dotenv|viper|figment|config\(|settings\.|ENV\[|Deno\.env)' "$module_path"
```

For each item, store:

- Key or section.
- Definition evidence when present.
- Consuming code evidence when present.
- One-line effect if evident.

Never copy secret values. Use `<redacted>` if a value is sensitive.

### 2.8 Runtime wiring

```bash
rg -n "${EXCLUDE_GLOBS[@]}" -- '(AddSingleton|AddScoped|AddTransient|services\.Add|IServiceCollection|TryAdd)' "$module_path"
rg -n "${EXCLUDE_GLOBS[@]}" -- '(@Autowired|@Inject|@Component|@Service|@Repository|@Configuration|@Bean)' "$module_path"
rg -n "${EXCLUDE_GLOBS[@]}" -- '(container\.bind|@injectable|inversify|tsyringe|provide|inject\()' "$module_path"
rg -n "${EXCLUDE_GLOBS[@]}" -- '(GetService|Resolve|Activator\.CreateInstance|Type\.GetType|Assembly\.Load|Class\.forName|reflect\.|importlib|ServiceLoader)' "$module_path"
rg -n "${EXCLUDE_GLOBS[@]}" -- '(Subscribe|Publish|Emit|On[A-Z]\w+|EventHandler|DomainEvent|MessageHandler|Consumer|Producer|listen\(|dispatch\()' "$module_path"
rg -n "${EXCLUDE_GLOBS[@]}" -- '(MapGet|MapPost|MapPut|MapDelete|Controller|Route\(|router\.|app\.(get|post|put|delete)|@Get|@Post|@Controller)' "$module_path"
```

Record DI registrations, interface-implementation pairs, routes, event subscribe/publish sites, reflection points, and plugin discovery. Include evidence for each.

### 2.9 Risk areas

```bash
rg -n "${EXCLUDE_GLOBS[@]}" -- '(static\s+\w+\s+\w+|ConcurrentDictionary|lock\s*\(|mutex|Monitor\.Enter|synchronized\s*\(|volatile\s+|OnceCell|lazy_static|global\s+)' "$module_path"
rg -n "${EXCLUDE_GLOBS[@]}" -- '(async\s+void|Task\.Run|go\s+|tokio::spawn|thread::spawn|fire.?and.?forget|create_task\(|setTimeout\(|setInterval\()' "$module_path"
rg -n "${EXCLUDE_GLOBS[@]}" -- '(catch\s*\(\s*\)\s*\{|catch\s*\([^)]*\)\s*\{\s*\}|except\s*:|except\s+Exception|logger\.(warn|error)\(.*\)\s*;?\s*$)' "$module_path"
rg -n "${EXCLUDE_GLOBS[@]}" -- '(BeginTransaction|Commit|Rollback|TransactionScope|db\.transaction|session\.begin|FOR\s+UPDATE|serializable)' "$module_path"
rg -n "${EXCLUDE_GLOBS[@]}" -- '(eval\(|exec\(|innerHTML|dangerouslySetInnerHTML|pickle\.loads|yaml\.load|deserialize|shell=True|Process\.Start|Runtime\.getRuntime\(\)\.exec)' "$module_path"
```

Only keep risks confirmed by a slice. For each risk, state why it matters in one line and cite evidence.

### 2.10 Cache raw findings

Write `./.memory-bank-cache/modules/<slug>.json` for each deep module.

Include:

- Module metadata and fingerprint.
- Public surface.
- Internal key components.
- Inbound dependencies.
- Outbound dependencies.
- Data and I/O.
- Configuration.
- Runtime wiring.
- Risk areas.
- Open questions.
- Source slices read as `{ "path": "...", "start_line": N, "end_line": M, "reason": "..." }`.

The raw JSON must validate with `python -m json.tool` or equivalent.

### 2.11 Mark module deep-indexed

After successfully writing raw findings and the deep markdown:

- Set `index_state: "deep"`.
- Set `stale: false`.
- Set `deep_indexed_at: <ISO8601>`.
- Set `deep_fingerprint` equal to current `fingerprint`.
- Save inventory.

Done criteria for Phase 2:

- Every processed module has raw findings JSON.
- Every processed module has a deep markdown file.
- Every processed module has `index_state: "deep"`, `stale: false`, and matching `deep_fingerprint`.
- No source file was read in full unless allowed by Rule 1 or Rule 2.

---

## Phase 3 - Write per-module deep memory files

For every module processed in Phase 2, overwrite `docs/memory-bank/modules/<slug>.md` with this schema:

```markdown
<!-- generated_at: <ISO8601> -->
<!-- generator: memory-bank-v3.5 -->
<!-- index_state: deep -->
<!-- repo_hash: <short SHA or nogit-dirty> -->
<!-- fingerprint: <sha256> -->

# <Module name>

## Purpose
<1-3 factual sentences with evidence. If unclear: `UNKNOWN - needs human verification.`>

## Entry points
- `path/to/file.ext:LINE` - <what it does in one line>

## Public surface
| Symbol | Kind | Location |
|---|---|---|
| `SymbolName` | class|interface|function|method | `path:line` |

## Internal key components
- `SymbolName` - <role> - `path:line`

## Dependencies

### Inbound (callers)
- `<other module>` - uses `<symbol>` - evidence: `path:line`

### Outbound (callees / libraries)
- `<target>` - via `<symbol, import, or manifest reference>` - evidence: `path:line`

### Runtime wiring (DI, routes, events, reflection)
- `<symbol>` registered as `<interface>` - evidence: `path:line`
- Route `<method/path>` handled by `<symbol>` - evidence: `path:line`
- Event `<EventName>` subscribed/published - evidence: `path:line`

## Data and I/O
- Database: `<table/schema/query purpose>` - evidence: `path:line`
- Network: `<endpoint/protocol/client>` - evidence: `path:line`
- Queue/cache/object store: `<topic/cache/bucket>` - evidence: `path:line`
- File I/O: `<path/pattern>` - evidence: `path:line`

## Configuration
- `<key>` - defined at `path:line` - consumed at `path:line` - effect: <one line>

## Risk areas
- <risk> - why it matters - evidence: `path:line`

## Open questions
- <UNKNOWN items>
```

Writing rules:

- If a section has no evidenced items, write the header followed by `None found.`
- Tables must have at least header plus one data row, or be replaced with `None found.`
- Do not paste source code.
- Every source claim must cite evidence.
- Keep descriptions short and actionable for RCA.

Done criteria for Phase 3:

- Every processed module has a markdown file under `docs/memory-bank/modules/`.
- File names match inventory slugs exactly.
- Deep files include the v3.5 generation header and fingerprint.

---

## Phase 4 - Write or refresh repo index

Always rewrite `./docs/memory-bank/index.md` from current inventory and deep findings.

````markdown
<!-- generated_at: <ISO8601> -->
<!-- generator: memory-bank-v3.5 -->
<!-- repo_hash: <short SHA or nogit-dirty> -->

# <Repo name>

## Overview
<2-4 factual sentences. If unclear: `UNKNOWN - needs human verification.`>

<If mode is large and not all current modules are deep-indexed, insert:>
Iteration in progress - N of M modules deep-indexed. The remaining K modules have shallow stubs. Stale deep modules are listed as `deep-stale` and should be re-indexed before RCA.

## Build system
- Primary: <build system>
- Manifests: `<path>`, `<path>`
- Build: `<command or UNKNOWN>` - evidence: `<path:line or UNKNOWN>`
- Test: `<command or UNKNOWN>` - evidence: `<path:line or UNKNOWN>`
- Lint/typecheck: `<command or UNKNOWN>` - evidence: `<path:line or UNKNOWN>`

## Vendored libraries detected
One-line summary only. These paths are excluded from indexing.
- `<top-level-vendor-path-1>`

If none detected, write: `None.`

## Module map
| Module | Language | Path | State | Purpose |
|---|---|---|---|---|
| `...` | `...` | `...` | `shallow|deep|deep-stale` | `...` |

State meanings:
- `deep` - full public surface, dependency evidence, wiring, data/config usage, and risks are available.
- `deep-stale` - a full file exists, but the module fingerprint changed. Re-index before trusting it.
- `shallow` - location, top symbol hints, and manifest dependency hints are available.

## Cross-module dependency graph
Adjacency list with evidence-backed call-site counts. Only non-stale deep modules appear here.

```text
auth -> database (17 call sites)
payments -> auth (4 call sites)
```

If no evidence-backed edges exist, write: `None found.`

## Critical execution paths
- Entry `path:line` - flow: `moduleA` -> `moduleB` -> `moduleC`

If no evidenced path exists, write: `None found.`

## Known risk areas (repo-wide)
Aggregated from non-stale deep module files only. Evidence-backed only.

## How to use this memory bank
1. Identify the suspect module from the module map. Note its state.
2. If `deep`, open `docs/memory-bank/modules/<slug>.md` for the full graph.
3. If `deep-stale`, re-run deep indexing for that slug before relying on it.
4. If `shallow`, open the stub for orientation, then either append the slug to `.memory-bank-cache/deep-targets.txt` and re-run, or do targeted `rg` searches scoped to the module path.
5. Walk inbound callers before editing a callee.
6. Use `rg` and 30-80 line slice reads. Do not read source files end-to-end unless under 150 lines.

## Generation metadata
- Mode: <small|medium|large>
- Schema: v3.5 (two-pass, reconciled cache)
- Modules deep-indexed: <N> of <M>
- Modules shallow-indexed: <K> of <M>
- Stale deep modules: <S>
- Run count: <run_count>
- Symbols catalogued (non-stale deep modules only): <N>
- Files sliced: <N>
````

Done criteria for Phase 4:

- `docs/memory-bank/index.md` reflects current cumulative state.
- Module map row count matches current non-removed modules.
- Stale modules are visible as `deep-stale`.
- Removed modules do not appear in the module map.

---

## Phase 5 - Write or refresh root AGENTS.md

`AGENTS.md` is a router, not the memory bank. Codex loads project guidance before work, so keep this file concise.

Always rewrite only `./AGENTS.md`:

```markdown
<!-- generated_at: <ISO8601> -->
<!-- generator: memory-bank-v3.5 -->
<!-- repo_hash: <short SHA or nogit-dirty> -->

# <Repo name>

## Start here
- Read `docs/memory-bank/index.md` before scanning source.
- Check the State column in the module map.
- For a `deep` module, open `docs/memory-bank/modules/<slug>.md` for the full graph.
- For a `deep-stale` module, re-run memory-bank generation for that slug before relying on stale dependency or risk data.
- For a `shallow` module, use its stub for orientation, then do targeted `rg` searches scoped to the module path or add the slug to `.memory-bank-cache/deep-targets.txt` and re-run.
- Use `rg` and 30-80 line slice reads. Do not read source files end-to-end unless under 150 lines.
- Prefer evidence-backed claims with `path:line` references.
- Update the memory bank after major refactors.

## Build and test
- Primary: <build system>
- Build: `<command or UNKNOWN>`
- Test: `<command or UNKNOWN>`
- Lint/typecheck: `<command or UNKNOWN>`

## Memory-bank locations
- Repo index: `docs/memory-bank/index.md`
- Module notes: `docs/memory-bank/modules/*.md`
- Cache: `.memory-bank-cache/`
- Deep-index targets: `.memory-bank-cache/deep-targets.txt`

## Working rules
- Start from entry points and module boundaries before following helpers.
- For RCA, inspect inbound callers before editing a callee.
- Treat runtime wiring, DI, reflection, routes, events, and config as first-class suspects.
- A shallow stub is enough to find a file. A non-stale deep file is needed to walk dependencies.
```

Rules:

- Keep under 150 lines and under 12 KB.
- No module table.
- No full dependency graph.
- No large evidence lists.
- Router only.
- Do not write generated `AGENTS.md` inside module folders.
- Do not delete human-authored nested `AGENTS.md` files. Delete only nested generated files with `<!-- generator: memory-bank-v`.

---

## Phase 6 - Self-check and repair

Run these checks before final output. Fix failures before finishing.

1. Every generated markdown has a v3.5 generation header.
2. Every source claim has `path:line` or `path:line-range` evidence, or is marked `UNKNOWN - needs human verification.`
3. Generated metadata is internally consistent with inventory.
4. No code blocks longer than 3 lines in generated module markdown.
5. None of these words appear in generated markdown: `comprehensive`, `robust`, `seamlessly`, `leverages`, `utilizes`.
6. `docs/memory-bank/index.md` module map row count matches current non-removed modules.
7. `inventory.json` is valid JSON and has `schema_version: "v3.5"`.
8. `./AGENTS.md` exists, is small, and does not duplicate the index.
9. `find . -name AGENTS.md -not -path './AGENTS.md' -not -path './.git/*' -print` may list human-authored files. Delete only those containing `<!-- generator: memory-bank-v`.
10. Every current non-removed module markdown filename matches a slug in inventory.
11. No current non-removed module has `index_state: "none"` after Phase 1.8.
12. Every shallow file has `<!-- index_state: shallow -->`.
13. Every deep file has `<!-- index_state: deep -->`.
14. Stale deep modules remain visible as `deep-stale` in `index.md` until re-indexed.
15. Modules with unchanged `deep_fingerprint` were not overwritten with shallow stubs.
16. If `mode == large` and not all modules are non-stale deep, the iteration note exists in `index.md`.
17. Grep non-stale deep markdown files for vendor leakage. If any pattern matches, the file is polluted:
    - `js/libs/`
    - `wwwroot/lib/`
    - `Areas/HelpPage/`
    - `node_modules/`
    - `oraclejet-preact`
    - `.min.js`
    - `.min.css`
    - `resourceBundles/`
    - `site-packages/`
    - `oci-cli-venv`
18. Single-letter symbol check: remove any Internal key component whose symbol is only one letter unless a language-specific convention proves it is a real public API and evidence supports it.
19. Numeric database check: remove any Data and I/O database entry whose value is a bare number, single letter, or `_MAX_`-style placeholder.
20. Literal placeholder check: no generated shell guidance may contain a command that would run a bare `EXCLUDE_GLOBS` token.
21. Validate raw finding JSON files with `python -m json.tool` or equivalent.

If a non-stale deep file fails vendor leakage, single-letter symbol, or numeric database checks:

1. Delete that deep markdown file.
2. Delete `.memory-bank-cache/modules/<slug>.json`.
3. Set the module to `index_state: "shallow"`, `stale: false`, and `deep_fingerprint: null`.
4. Regenerate its shallow stub.
5. Let a later run reprocess it.

---

## Final output

Print exactly one of the following blocks and nothing else.

If all current modules are non-stale deep-indexed, or mode is small/medium and complete:

```text
Memory-bank generation complete.
Mode: <mode>
Modules deep-indexed: <N> of <N>
Modules shallow-indexed: 0
Stale deep modules: 0
Cache: .memory-bank-cache/
Router: ./AGENTS.md
Index: ./docs/memory-bank/index.md

Next step: run RCA with
  codex exec --full-auto - <<'PROMPT'
Read ./AGENTS.md, then use docs/memory-bank/ to investigate: [describe the bug here]
PROMPT
```

If shallow pass complete but deep pass incomplete, common in large mode:

```text
Memory-bank generation in progress (two-pass mode).
Mode: large
Modules deep-indexed this run: <K>
Modules deep-indexed total: <N> of <M>
Modules shallow-indexed (stubs): <M-N-S>
Stale deep modules: <S>
Run count: <run_count>
Cache: .memory-bank-cache/

The full module map is now available - every module has at least a stub.
To deep-index specific modules next, edit `.memory-bank-cache/deep-targets.txt`:
  echo "module-slug-1" >> .memory-bank-cache/deep-targets.txt
  echo "module-slug-2" >> .memory-bank-cache/deep-targets.txt

Then re-run:
  codex exec --full-auto - < generate-memory-bank-FINAL.md
```

---

## Hard stops

- No search tool (`rg` and no native fallback) -> print the install message and stop.
- `mode == empty` -> write minimal router/index and stop.
- Inventory exists but is corrupt JSON -> print the cache corruption message and stop.

Begin.
