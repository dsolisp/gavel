import { test } from '@playwright/test';

const SEED_DATA = true;

// First argument uses a recognized skip prefix; no separate reason comment needed.
test.skip(SEED_DATA, 'requires live DB');
