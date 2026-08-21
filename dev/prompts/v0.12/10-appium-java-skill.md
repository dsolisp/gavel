# Session 10 — Appium Java/Kotlin client skill

Obey `dev/prompts/v0.12/00-PROTOCOL.md`. Implement **only** this item. Tier C (docs/profile/detect wiring). Zero new rule tags. Do not invent Java-specific scanners; reuse existing tags (`selector-leak` already matches `findElement` / `MobileBy` / `AppiumBy`; `manual-wait` matches `Thread.sleep`).

## Why

Roadmap Feature 5: `gavel-appium` today is **.NET-only**. Java/Kotlin `io.appium:java-client` needs a profile: `AppiumDriver`, `MobileBy` → `AppiumBy`, UiAutomator2/XCUITest locator priority.

## Read first

- `skills/gavel-appium/SKILL.md` — clone structure (frontmatter, locator priority, waits, DI, POM, run commands, pin)
- `skills/gavel-selenium/SKILL.md` — Java wait/locator tone
- `skills/gavel-detect/SKILL.md` — profile activation list
- `scripts/detect.js` — JVM already adds `junit` when `pom.xml` / `build.gradle` exists; **does not** distinguish Appium Java
- `scripts/check-profile-freshness.js` — `PROFILE_RELEASES` has no `appium_java` key
- `scripts/verify-skills.js` — `CORE_SKILLS` array
- `scripts/verify-profile-fixtures.js` — freshness loop + `requiredProfileSnippets`; `playwright-dotnet-mismatch` assertions already wired (session 04) — this session adds **appium-java-fresh** only
- `plugin.yaml` — `provides_skills` (must list every public `skills/*` dir; `validate-manifest.js` + `verify-docs.js` enforce this)
- `scripts/validate-manifest.js`
- `.github/copilot-instructions.md` or skill indexes only if verify complains

Current Appium.WebDriver pin in .NET skill: **8.3.2**. For Java client, pick a **documented current** pin consistent with Appium 2 / java-client 9.x if that is the line the .NET 8.3.2 skill implies — read the .NET skill “Release Highlights” and mirror “current as of” dating. If unsure, pin **java-client 9.4.0** (or the latest 9.x you can justify from existing skill dates) and state it in the skill frontmatter the same way .NET does. Do not call nuget/maven at runtime.

## 1. New skill `skills/gavel-appium-java/SKILL.md`

YAML frontmatter like other skills (`name`, `description`). Content must include:

- Locator priority: AccessibilityId → AndroidUIAutomator / iOS NSPredicate / iOS class chain → XPath last
- `MobileBy` → `AppiumBy` migration (same as .NET)
- `AppiumDriver` / `AndroidDriver` / `IOSDriver`
- Native waits: `WebDriverWait` + expected conditions; no `Thread.sleep` / `implicitlyWait`
- Hybrid: `driver.context("WEBVIEW_...")` ; selector-leak applies in web context
- DI: JUnit 5 extensions / constructor injection; no `new LoginPage(driver)` in test methods (`no-di` Java may not fire — Java has no `new FooPage` suffix match unless they use that naming; still **document** it)
- POM: locator class owns `driver.findElement(AppiumBy...)`
- Run commands: `mvn test` / `gradle test`; Appium server `appium -p 4723`
- Kotlin one-liner note: same APIs (`AppiumBy.accessibilityId`) — do not a second skill

Keep it as short as `gavel-appium` (C#). No Bailiff. No new tags.

## 2. Register the skill

- `scripts/verify-skills.js` `CORE_SKILLS` — add `'gavel-appium-java'` (keep sort-ish next to `gavel-appium`)
- `plugin.yaml` `provides_skills` — add `- gavel-appium-java`
- `verify-docs.js` walks `skills/` dirs vs plugin.yaml — both must match
- `validate-manifest.js` PUBLIC skills vs plugin.yaml
- `skills/gavel-detect/SKILL.md` profile list: `Appium (Java/Kotlin) -> gavel-appium-java`
- `skills/gavel-help/SKILL.md` only if it enumerates profiles and verify/docs require it — grep `gavel-appium` and add the sibling where profiles are listed
- `check-rule-copies.js --check-all` if Western/Chinese adapters duplicate skill lists — grep `gavel-appium` there

Do **not** add a `bin` command. Profiles are skills, not CLI verbs.

## 3. Detect + freshness

`scripts/check-profile-freshness.js`:

Add `appium_java` (ecosystem `jvm` or `java`):

- Evidence: `pom.xml` / `build.gradle` / `build.gradle.kts` contains `io.appium:java-client` or `java-client`
- `current`: the pin you documented in the skill
- `profile`: `gavel-appium-java`

Parse Maven `<dependency>` / Gradle `implementation` with a **small** regex — do not add a Maven library. Export `detectJvmFramework` or extend `detectFramework()` chain: **Appium Java before generic JUnit** so an Appium Java repo is not reported as a generic Node/Python miss.

`scripts/detect.js`: if java-client is present, `frameworks.unshift('appium-java')` (or similar) and `profile: 'gavel-appium-java'`. Appium Java should win over “just junit” when both `pom.xml` and java-client exist.

Precedence vs Selenium Java: if both selenium and java-client appear, **Appium wins** (same as .NET).

## 4. Golden fixture

`fixtures/profiles/appium-java-fresh/` with a minimal `pom.xml` (or `build.gradle`) pinning `io.appium:java-client` to the skill current.

Wire `verify-profile-fixtures.js`:

- Freshness check **passes** (status not stale) on this dir
- JSON: `framework` / `profile` match `appium_java` → `gavel-appium-java` (use whatever keys you exported)
- `requiredProfileSnippets` add `['skills/gavel-appium-java/SKILL.md', 'AppiumBy']`

Unit test next to the playwright_dotnet freshness test: `detectFramework(appium-java-fresh)` / `detectStack`.

## 5. Optional sample repo

Roadmap says “Appium has golden fixtures for .NET and Java clients.” The .NET **sample repo** already exists; Java **profile** fixture satisfies “golden fixtures.” A full `fixtures/sample-repos/appium-java/` is **nice** but not required if time is tight. Prefer the profile fixture + skill. If you add a sample repo, keep it as small as `appium-dotnet` (good/bad locators/actions/tests) and do not add it to npm in a weird way (`fixtures/` is already in `package.json` files).

## Commands

```bash
node scripts/check-profile-freshness.js fixtures/profiles/appium-java-fresh --json
node scripts/detect.js fixtures/profiles/appium-java-fresh --json
node scripts/verify-skills.js
node scripts/validate-manifest.js
node scripts/verify-profile-fixtures.js
npm run verify
```

## Done when

- [ ] `skills/gavel-appium-java/SKILL.md` exists with AppiumBy / MobileBy migration / locator priority / hybrid context
- [ ] Listed in `verify-skills.js` + `plugin.yaml`
- [ ] Detect + freshness resolve java-client → `gavel-appium-java`
- [ ] Golden `appium-java-fresh` fixture wired
- [ ] No new rule tags, no new CLI verb
- [ ] `npm run verify` green

## Out of scope

Baseline CLI (11). Changing C# `gavel-appium` beyond a one-line “Java/Kotlin: see gavel-appium-java” pointer — allowed, keep it one line.
