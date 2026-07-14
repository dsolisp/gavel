import { test } from '@playwright/test';

test('uses hardcoded environment values', async ({ request }) => {
  await fetch('http://localhost:3000/health');
  await request.get('https://staging.example.test/status');
  await request.get('http://10.0.0.1/health');
  await request.get('https://api.example.test:8080/health');
  const outputPath = '/home/user/results.json';
  const windowsPath = 'C:\\Users\\tester\\results.json';
  const password = 'do-not-report-this-value';
  await request.post('/login', { data: { password, outputPath, windowsPath } });
});
