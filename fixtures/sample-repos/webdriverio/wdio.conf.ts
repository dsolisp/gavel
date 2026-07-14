// wdio.conf.ts — minimal config for the sample.
export const config = {
  runner: 'local',
  specs: ['./test/specs/**/*.spec.ts'],
  framework: 'mocha',
  reporters: ['spec'],
  maxInstances: 1,
  capabilities: [{ browserName: 'chrome' }],
  baseUrl: 'http://localhost:3000',
  beforeTest: () => {
    // Specs use fixture-style setup; nothing to do globally.
  },
};
