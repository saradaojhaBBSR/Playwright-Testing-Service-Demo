import { test, expect } from '@playwright/test';

// This sample simulates a larger test suite
const tags = ['@smoke', '@sanity', '@issue'];
const TEST_ITERATIONS = parseInt(process.env.TEST_ITERATIONS);
//eastasia test//encryption on
// const TEST_ITERATIONS = parseInt(process.env.TEST_ITERATIONS || "50");
// for (let i = 0; i < TEST_ITERATIONS; i++) {
//   let tagid = i % 3;
//   test('has title ' + i + tags[tagid], async ({ page }) => {
//     const skip = Math.random();
//     if (skip > 0.9) {
//       test.skip();
//     }
//     await page.goto('https://playwright.dev/');

//     // Expect a title "to contain" a substring.
//     await expect(page).toHaveTitle(/Playwright/);
//   });

//   test('get started link ' + i + tags[tagid], async ({ page }) => {
//     await page.goto('https://playwright.dev/');

//     // Click the get started link.
//     await page.getByRole('link', { name: 'Get started' }).click();

//     // Expects the URL to contain intro.
//     await expect(page).toHaveURL(/.*intro/);

//     const randomResult = Math.random();
//     expect(randomResult).toBeGreaterThan(0.2);
//   }); 
// }

for (let i = 0; i < TEST_ITERATIONS; i++) {
  let tagid = i % 3;
  test('get started link ' + i + tags[tagid], async ({ page }) => {
      await page.goto('https://playwright.dev/');
      await page.getByRole('link', { name: 'Get started' }).click();
      await expect(page).toHaveURL(/.*intro/);
      const randomResult = Math.random();
      expect(randomResult).toBeGreaterThan(0.2);
  });
  test('has title ' + i + tags[tagid], async ({ page }) => {
      test.skip(i >= 10 && i <= 20 && i % 2 === 0, `Skipping test ${i} as it is an even number between 10 and 20`);
      await page.goto('https://playwright.dev/');
      await expect(page).toHaveTitle(/Playwright/);
      const randomResult = Math.random();
      expect(randomResult).toBeLessThan(0.2);
  });
}
