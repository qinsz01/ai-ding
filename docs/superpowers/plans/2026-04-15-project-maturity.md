# ai-ding Project Maturity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make ai-ding a mature, publishable open-source project with CI/CD, comprehensive tests, and npm release workflow.

**Architecture:** Add GitHub Actions for CI testing and npm publish, fill test gaps for CLI and hook mode, add ESLint for code quality, and add community contribution guidelines. No changes to core notification logic.

**Tech Stack:** GitHub Actions, ESLint (flat config), Vitest, npm publish, conventional commits.

---

### Task 1: Add ESLint for code quality

**Files:**
- Create: `eslint.config.js`
- Modify: `package.json` (add devDeps + scripts)

- [ ] **Step 1: Install ESLint dependencies**

```bash
cd /data1/openclaw/workspace/playground/ai-ding
npm install -D eslint @eslint/js typescript-eslint
```

- [ ] **Step 2: Create eslint.config.js**

Create `eslint.config.js`:

```js
import tseslint from "typescript-eslint";
import js from "@eslint/js";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  {
    files: ["**/*.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  }
);
```

- [ ] **Step 3: Add lint scripts to package.json**

Add to `package.json` scripts:

```json
"lint": "eslint src/",
"lint:fix": "eslint src/ --fix"
```

- [ ] **Step 4: Run lint and fix existing issues**

```bash
npm run lint
npm run lint:fix
```

- [ ] **Step 5: Verify tests still pass**

```bash
npm test
```

- [ ] **Step 6: Commit**

```bash
git add eslint.config.js package.json package-lock.json src/
git commit -m "chore: add ESLint with typescript-eslint"
```

---

### Task 2: Add CLI tests (cli.ts coverage)

**Files:**
- Create: `src/cli.test.ts`

The CLI entry (`src/cli.ts`) has these untested functions: `handleHook`, `extractQuestions`, `truncate`, `readStdin`, `initConfig`, and the commander program actions. We'll test the pure utility functions and the hook handler directly.

- [ ] **Step 1: Write tests for pure utility functions**

Create `src/cli.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { writeFileSync, existsSync, rmSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

// We need to import the unexported functions indirectly by testing via
// the CLI behavior, or we extract them. Since truncate and extractQuestions
// are not exported, we'll test the --hook mode via child_process.

// For unit testing, we'll extract the pure functions into a testable module.
```

Actually, `truncate`, `extractQuestions`, `handleHook` are all private in `cli.ts`. The cleanest approach: extract hook logic into a separate module.

- [ ] **Step 2: Extract hook logic into `src/hook.ts`**

Create `src/hook.ts` — extract the pure functions from `cli.ts`:

```ts
import { loadConfig } from "./config.js";
import { detectEnvironment } from "./env.js";
import { dispatch } from "./core.js";

export function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 3) + "...";
}

export function extractQuestions(toolInput: unknown): string {
  if (!toolInput || typeof toolInput !== "object") return "Claude has a question";
  const input = toolInput as Record<string, unknown>;
  const questions = input.questions;
  if (!Array.isArray(questions) || questions.length === 0) return "Claude has a question";
  const texts = questions
    .map((q: Record<string, unknown>) => String(q.question ?? ""))
    .filter(Boolean);
  return texts.length > 0 ? truncate(texts.join("; "), 200) : "Claude has a question";
}

export async function handleHook(input: string): Promise<void> {
  if (!input) return;

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(input);
  } catch {
    console.warn("[ai-ding] --hook: failed to parse stdin JSON");
    return;
  }

  // Skip subagent events
  if (data.agent_id) return;

  const event = data.hook_event_name as string | undefined;
  const config = loadConfig();
  const env = detectEnvironment();

  switch (event) {
    case "Stop": {
      const raw = data.last_assistant_message;
      const lastMsg = truncate(typeof raw === "string" && raw ? raw : "Task completed", 200);
      await dispatch(lastMsg, config, env, { title: "Claude Code" });
      break;
    }
    case "Notification": {
      const msg = String(data.message ?? "");
      const notifType = String(data.notification_type ?? "");
      if (notifType === "idle_prompt" || notifType === "permission_prompt" ||
          msg.includes("idle") || msg.includes("permission")) {
        await dispatch("Claude is waiting for your input", config, env, { title: "Needs Attention" });
      }
      break;
    }
    case "PreToolUse": {
      const toolName = String(data.tool_name ?? "");
      if (toolName === "AskUserQuestion") {
        const questions = extractQuestions(data.tool_input);
        await dispatch(questions, config, env, { title: "Question" });
      }
      break;
    }
    case "PermissionRequest": {
      const toolName = String(data.tool_name ?? "");
      await dispatch(`Permission needed: ${toolName || "tool"}`, config, env, { title: "Needs Attention" });
      break;
    }
  }
}
```

- [ ] **Step 3: Update `cli.ts` to import from hook.ts**

Replace `cli.ts` hook-related code. The `handleHook` function in cli.ts becomes:

```ts
import { handleHook } from "./hook.js";
```

Remove the `handleHook`, `extractQuestions`, and `truncate` function definitions from `cli.ts`. Keep `readStdin` and `initConfig` in cli.ts since they are CLI-specific. Update the `--hook` action to:

```ts
if (opts.hook) {
  const input = await readStdin();
  await handleHook(input);
  return;
}
```

- [ ] **Step 4: Write hook tests**

Create `src/hook.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { truncate, extractQuestions, handleHook } from "./hook.js";

// Mock dispatch so we don't send real notifications
vi.mock("./core.js", () => ({
  dispatch: vi.fn().mockResolvedValue([]),
}));

vi.mock("./config.js", () => ({
  loadConfig: vi.fn().mockReturnValue({
    channels: {
      desktop: { enabled: true },
      sound: { enabled: true, file: null },
      ntfy: { enabled: false, url: "" },
      telegram: { enabled: false, bot_token: "", chat_id: "" },
      bark: { enabled: false, url: "", device_key: "" },
      serverchan: { enabled: false, sendkey: "" },
      slack: { enabled: false, webhook_url: "" },
      email: { enabled: false, smtp_host: "", smtp_port: 587, from: "", to: "", user: "", password: "" },
    },
    remote: { fallback_order: ["sound", "ntfy"] },
    defaults: { message: "Task completed", title: "ai-ding" },
  }),
}));

vi.mock("./env.js", () => ({
  detectEnvironment: vi.fn().mockReturnValue("local"),
}));

import { dispatch } from "./core.js";

const mockDispatch = vi.mocked(dispatch);

describe("truncate", () => {
  it("returns string unchanged if within limit", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("truncates and appends ellipsis", () => {
    expect(truncate("abcdefghij", 7)).toBe("abcd...");
  });

  it("handles exact length", () => {
    expect(truncate("12345", 5)).toBe("12345");
  });
});

describe("extractQuestions", () => {
  it("returns default for null input", () => {
    expect(extractQuestions(null)).toBe("Claude has a question");
  });

  it("returns default for empty questions array", () => {
    expect(extractQuestions({ questions: [] })).toBe("Claude has a question");
  });

  it("extracts single question text", () => {
    expect(extractQuestions({ questions: [{ question: "Deploy now?" }] })).toBe("Deploy now?");
  });

  it("joins multiple questions with semicolon", () => {
    const result = extractQuestions({ questions: [{ question: "A?" }, { question: "B?" }] });
    expect(result).toBe("A?; B?");
  });
});

describe("handleHook", () => {
  beforeEach(() => {
    mockDispatch.mockClear();
  });

  it("does nothing on empty input", async () => {
    await handleHook("");
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("does nothing on invalid JSON", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    await handleHook("not json");
    expect(warnSpy).toHaveBeenCalledWith("[ai-ding] --hook: failed to parse stdin JSON");
    expect(mockDispatch).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("skips subagent events (agent_id present)", async () => {
    await handleHook(JSON.stringify({ agent_id: "sub-1", hook_event_name: "Stop" }));
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("handles Stop event with last_assistant_message", async () => {
    await handleHook(JSON.stringify({
      hook_event_name: "Stop",
      last_assistant_message: "Fixed the auth bug",
    }));
    expect(mockDispatch).toHaveBeenCalledWith("Fixed the auth bug", expect.anything(), expect.anything(), { title: "Claude Code" });
  });

  it("handles Stop event with no message (uses default)", async () => {
    await handleHook(JSON.stringify({
      hook_event_name: "Stop",
    }));
    expect(mockDispatch).toHaveBeenCalledWith("Task completed", expect.anything(), expect.anything(), { title: "Claude Code" });
  });

  it("handles Notification idle_prompt", async () => {
    await handleHook(JSON.stringify({
      hook_event_name: "Notification",
      notification_type: "idle_prompt",
      message: "",
    }));
    expect(mockDispatch).toHaveBeenCalledWith("Claude is waiting for your input", expect.anything(), expect.anything(), { title: "Needs Attention" });
  });

  it("ignores non-idle/permission Notification", async () => {
    await handleHook(JSON.stringify({
      hook_event_name: "Notification",
      notification_type: "other",
      message: "something else",
    }));
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("handles PreToolUse AskUserQuestion", async () => {
    await handleHook(JSON.stringify({
      hook_event_name: "PreToolUse",
      tool_name: "AskUserQuestion",
      tool_input: { questions: [{ question: "Continue?" }] },
    }));
    expect(mockDispatch).toHaveBeenCalledWith("Continue?", expect.anything(), expect.anything(), { title: "Question" });
  });

  it("ignores PreToolUse for other tools", async () => {
    await handleHook(JSON.stringify({
      hook_event_name: "PreToolUse",
      tool_name: "Bash",
      tool_input: {},
    }));
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("handles PermissionRequest event", async () => {
    await handleHook(JSON.stringify({
      hook_event_name: "PermissionRequest",
      tool_name: "Bash",
    }));
    expect(mockDispatch).toHaveBeenCalledWith("Permission needed: Bash", expect.anything(), expect.anything(), { title: "Needs Attention" });
  });
});
```

- [ ] **Step 5: Run tests**

```bash
npm test
```

Expected: All existing tests pass + all new hook/truncate/extractQuestions tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/hook.ts src/hook.test.ts src/cli.ts
git commit -m "refactor: extract hook logic into hook.ts and add comprehensive tests"
```

---

### Task 3: Add GitHub Actions CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create CI workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [master]
  pull_request:
    branches: [master]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: npm
      - run: npm ci
      - run: npm run build
      - run: npm test
      - run: npm run lint

  release:
    needs: test
    if: github.ref == 'refs/heads/master' && github.event_name == 'push'
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          registry-url: https://registry.npmjs.org
      - run: npm ci
      - run: npm run build
      - name: Check if version changed
        id: version
        run: |
          LOCAL=$(node -p "require('./package.json').version")
          PUBLISHED=$(npm view ai-ding version 2>/dev/null || echo "0.0.0")
          if [ "$LOCAL" != "$PUBLISHED" ]; then
            echo "changed=true" >> "$GITHUB_OUTPUT"
            echo "version=$LOCAL" >> "$GITHUB_OUTPUT"
          fi
      - name: Publish to npm
        if: steps.version.outputs.changed == 'true'
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
      - name: Create GitHub Release
        if: steps.version.outputs.changed == 'true'
        uses: softprops/action-gh-release@v2
        with:
          tag_name: v${{ steps.version.outputs.version }}
          generate_release_notes: true
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

- [ ] **Step 2: Commit**

```bash
mkdir -p .github/workflows
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions workflow for test + auto publish"
```

---

### Task 4: Add community contribution guidelines

**Files:**
- Create: `CONTRIBUTING.md`
- Create: `.github/ISSUE_TEMPLATE/bug_report.yml`
- Create: `.github/ISSUE_TEMPLATE/feature_request.yml`
- Create: `.github/PULL_REQUEST_TEMPLATE.md`

- [ ] **Step 1: Create CONTRIBUTING.md**

Create `CONTRIBUTING.md`:

```md
# Contributing to ai-ding

Thanks for your interest! Here's how to get started.

## Development Setup

```bash
git clone https://github.com/qinsz01/ai-ding.git
cd ai-ding
npm install
npm run build
npm test
```

## Development Workflow

1. Fork the repo and create a branch
2. Make your changes with tests
3. Ensure `npm run lint` and `npm test` pass
4. Open a PR with a clear description

## Adding a New Notification Channel

1. Create `src/notifiers/<channel>.ts` implementing the `Notifier` interface
2. Add config interface to `src/notifiers/types.ts`
3. Register in `src/core.ts` buildNotifiers()
4. Add env var mapping in `src/config.ts`
5. Add default config entry in `default-config.yaml` and `src/config.ts`
6. Write tests in `src/notifiers/<channel>.test.ts`
7. Update README with setup instructions

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` new features
- `fix:` bug fixes
- `docs:` documentation changes
- `chore:` build/tooling changes
- `test:` test additions/changes

## Release Process

1. Update `version` in `package.json`
2. Update `CHANGELOG.md`
3. Commit and push to master
4. CI automatically publishes to npm and creates a GitHub Release
```

- [ ] **Step 2: Create issue templates**

Create `.github/ISSUE_TEMPLATE/bug_report.yml`:

```yaml
name: Bug Report
description: Report a bug in ai-ding
labels: [bug]
body:
  - type: textarea
    id: description
    attributes:
      label: Description
      description: What happened?
    validations:
      required: true
  - type: textarea
    id: steps
    attributes:
      label: Steps to reproduce
      description: How can we reproduce this?
    validations:
      required: true
  - type: textarea
    id: expected
    attributes:
      label: Expected behavior
    validations:
      required: true
  - type: input
    id: version
    attributes:
      label: ai-ding version
      placeholder: "e.g. 1.0.0"
  - type: input
    id: node
    attributes:
      label: Node.js version
      placeholder: "e.g. 22.0.0"
  - type: dropdown
    id: channel
    attributes:
      label: Notification channel
      options:
        - desktop
        - sound
        - telegram
        - slack
        - ntfy
        - bark
        - serverchan
        - email
        - other
```

Create `.github/ISSUE_TEMPLATE/feature_request.yml`:

```yaml
name: Feature Request
description: Suggest a new feature or channel
labels: [enhancement]
body:
  - type: textarea
    id: problem
    attributes:
      label: Problem / Use Case
      description: What problem does this solve?
    validations:
      required: true
  - type: textarea
    id: solution
    attributes:
      label: Proposed Solution
    validations:
      required: true
  - type: dropdown
    id: type
    attributes:
      label: Type
      options:
        - New notification channel
        - CLI improvement
        - Config improvement
        - Plugin integration
        - Other
```

- [ ] **Step 3: Create PR template**

Create `.github/PULL_REQUEST_TEMPLATE.md`:

```md
## Summary

<!-- Brief description of changes -->

## Related Issues

<!-- Link to related issues, e.g. Fixes #123 -->

## Checklist

- [ ] `npm run lint` passes
- [ ] `npm test` passes
- [ ] New code has tests
- [ ] README updated (if applicable)
```

- [ ] **Step 4: Commit**

```bash
git add CONTRIBUTING.md .github/
git commit -m "docs: add CONTRIBUTING.md, issue and PR templates"
```

---

### Task 5: Prepare package.json for npm publish

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add missing package.json fields**

Update `package.json` to add `keywords`, `author`, and `exports`:

```json
{
  "keywords": [
    "claude-code",
    "codex",
    "notification",
    "alert",
    "telegram",
    "slack",
    "ntfy",
    "bark",
    "email",
    "ssh",
    "desktop",
    "cli"
  ],
  "author": { "name": "qinsz01" },
  "exports": {
    ".": "./dist/cli.js"
  }
}
```

Keep all existing fields unchanged. Only add these new fields.

- [ ] **Step 2: Verify build and test**

```bash
npm run build && npm test && npm run lint
```

- [ ] **Step 3: Test npm pack (dry run)**

```bash
npm pack --dry-run 2>&1 | head -30
```

Verify the files list looks correct (dist/, hooks/, skills/, etc., no src/).

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "chore: add keywords, author, exports to package.json"
```

---

### Task 6: Set up NPM_TOKEN secret and publish

**Files:**
- None (GitHub settings + npm operations)

- [ ] **Step 1: Add NPM_TOKEN to GitHub repo secrets**

The user needs to manually do this:
1. Go to https://github.com/qinsz01/ai-ding/settings/secrets/actions
2. Add secret `NPM_TOKEN` with value from `~/.npmrc` (the `npm_ysdJX...` token)

- [ ] **Step 2: Bump version for initial publish**

Since 1.0.0 is already in package.json but never published, it should work. But verify:

```bash
npm view ai-ding version 2>&1
```

If it returns "404", 1.0.0 is available for publishing.

- [ ] **Step 3: Dry-run publish**

```bash
npm publish --dry-run
```

Verify the package contents look right.

- [ ] **Step 4: Push all commits to master**

```bash
git push origin master
```

The CI workflow will automatically publish to npm and create a GitHub Release.

- [ ] **Step 5: Verify publish**

After CI completes:

```bash
npm view ai-ding version
```

Should return `1.0.0`. Then test:

```bash
npx ai-ding@latest "hello from published package"
```

---

## Task Dependency Graph

```
Task 1 (ESLint) ──┐
                   ├──> Task 3 (CI) ──> Task 6 (Publish)
Task 2 (Tests) ────┘
Task 4 (Community docs) ──> Task 6 (Publish)
Task 5 (package.json) ──> Task 6 (Publish)
```

Tasks 1, 2, 4, 5 can run in parallel. Task 3 depends on 1 and 2 (needs lint + test commands). Task 6 depends on all previous tasks.
