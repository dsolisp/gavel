# Suppression Guide

You can suppress specific gavel findings with a comment:

```ts
// gavel-ignore
test('example', () => {
  expect(1).toBe(1);
});
```

Always prefer adding a tag and reason to the ignore directive.
