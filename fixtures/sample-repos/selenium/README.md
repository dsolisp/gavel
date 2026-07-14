# Selenium Sample

Minimal Selenium + Python repo showing the Test Constitution in action.

## Layout

```
selenium/
├── README.md
├── pyproject.toml
├── gavel.config.json
├── conftest.py
├── factories.py
├── pages/
│   ├── locators/
│   │   └── login_locators.py
│   └── actions/
│       ├── login_actions.py        # canonical pattern
│       └── login_actions_bad.py    # VIOLATION: expect-in-action + selector-leak
└── tests/
    ├── test_login_good.py          # clean: uses pytest fixtures, plain assert
    └── test_login_bad.py           # VIOLATION: manual-wait, ignore-no-reason, plus the actions_bad class
```

## Patterns Demonstrated (Good)

- **pytest fixture DI** — `manual_login_page` injected into every test.
- **Class-based POM** — locator class + page class with `WebDriverWait`.
- **Factory data** — `UserFactory.build()`.
- **Native waits** — `WebDriverWait(..., expected_conditions.visibility_of_element_located)`.
- **Plain `assert`** — pytest-native assertion, no wrappers.

## Rule Coverage

Run from the gavel repo root:

    node scripts/self-check.js fixtures/sample-repos/selenium

The scanner finds 36 violations across 5 of the 9 self-check rules:

| Rule | Where | Fires? |
|------|-------|--------|
| `expect-in-action` | `pages/actions/login_actions_bad.py:22,23` | yes |
| `selector-leak` | `pages/actions/login_actions_bad.py:27,32` + `tests/test_login_bad.py` (raw `find_element` and `querySelector` calls) | yes |
| `manual-wait` | `tests/test_login_bad.py:56,66,78` (`time.sleep`) | yes |
| `ignore-no-reason` | `tests/test_login_bad.py:42` (bare `# gavel-ignore`) | yes |
| `skip-marker` | `tests/test_login_bad.py:34` (`@pytest.mark.skip` without reason) | yes |
| `no-di` | — | no — gates on `new FooPage(` regex; Python does not use `new` |
| `no-step` | — | no — gates on `test(` / `it(` regex; Python uses `def test_` |
| `bare-test-fail` | — | no — sample does not use `@pytest.mark.xfail` |
| `test-fail-order` | — | no — depends on `test.fail` / `expect` ordering inside a JS-style block |

The four rules that do not fire are gated on JavaScript/TypeScript test
patterns that Python does not use. To see them demonstrated, use the
**Playwright** or **Cypress** samples in this directory.
