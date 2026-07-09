# WebdriverIO Sample

Minimal WebdriverIO + TypeScript repo showing the Test Constitution in action.

## Layout

```
webdriverio/
├── README.md
├── package.json
├── gavel.config.json
├── wdio.conf.ts
├── test/
│   ├── specs/
│   │   ├── login.good.spec.ts        # clean: uses fixture factories
│   │   └── login.bad.spec.ts         # VIOLATION: no-di, manual-wait, ignore-no-reason, skip-marker
│   └── pageobjects/
│       ├── locators/LoginLocators.ts
│       └── actions/
│           ├── LoginActions.ts       # canonical pattern
│           └── LoginActionsBad.ts    # VIOLATION: expect-in-action + selector-leak
└── support/
    ├── factories.ts
    └── page-fixtures.ts              # factory functions used by beforeEach
```

## Patterns Demonstrated (Good)

- **Getter-based locators** in a dedicated class.
- **`waitFor*()` methods** for native waits.
- **Service objects** for page composition.
- **Factory data** — `UserFactory.create()`.
- **`expect-webdriverio`** for native retrying assertions.
- **Fixture DI** — `getLoginActions()` / `getLoginLocators()` factories, no `new` in spec.

## Rule Coverage

Run from the gavel repo root:

    node scripts/self-check.js fixtures/sample-repos/webdriverio

The scanner finds 32 violations across 7 of the 9 self-check rules:

| Rule | Where | Fires? |
|------|-------|--------|
| `expect-in-action` | `test/pageobjects/actions/LoginActionsBad.ts:19,20` | yes |
| `selector-leak` | `test/pageobjects/actions/LoginActionsBad.ts:25,29` + `test/specs/login.bad.spec.ts` (`$('...')` and `$$('...')` shorthand) | yes |
| `manual-wait` | `test/specs/login.bad.spec.ts:25,65` (`browser.waitForTimeout`) + `:68` (`browser.pause`) | yes |
| `no-di` | `test/specs/login.bad.spec.ts:14,15` (`new LoginActions()` / `new LoginLocators()`) | yes |
| `skip-marker` | `test/specs/login.bad.spec.ts:37` (`it.skip(...)` without reason) | yes |
| `ignore-no-reason` | `test/specs/login.bad.spec.ts:42` (bare `// gavel-ignore`) | yes |
| `no-step` | `test/specs/login.bad.spec.ts:1` (long spec with `it()` calls, no step grouping) | yes |
| `bare-test-fail` | — | no — sample does not use `test.fail()` or `it.failing()` |
| `test-fail-order` | — | no — depends on `test.fail` / `expect` ordering inside a JS-style block |

The two rules that do not fire are gated on `test.fail()` / `it.failing()`
patterns that the bad spec does not use.
