// Factory: external test data only. No hardcoded strings, IDs, or
// credentials in test bodies. Each call returns a fresh object.
export interface User {
  email: string;
  password: string;
  role: 'trader' | 'admin' | 'viewer';
}

export const UserFactory = {
  create(overrides: Partial<User> = {}): User {
    const stamp = Date.now().toString(36);
    return {
      email: `user-${stamp}@example.test`,
      password: `pw-${stamp}`,
      role: 'trader',
      ...overrides,
    };
  },
};
