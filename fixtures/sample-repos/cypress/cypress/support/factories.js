// Factory: external test data. No hardcoded credentials in test bodies.
export const UserFactory = {
  create(overrides = {}) {
    const stamp = Date.now().toString(36);
    return {
      email: `user-${stamp}@example.test`,
      password: `pw-${stamp}`,
      role: 'trader',
      ...overrides,
    };
  },
};
