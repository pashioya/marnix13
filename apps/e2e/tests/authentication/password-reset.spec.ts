import { test } from '@playwright/test';

import { AuthPageObject } from './auth.po';

const newPassword = (Math.random() * 10000).toString();
const emailAddress = (Math.random() * 10000).toFixed(0);

test.describe('Password Reset Flow', () => {
  test.describe.configure({ mode: 'serial' });

  test('will reset the password and sign in with new one', async ({ page }) => {
    // Increase timeout for this test due to email dependency
    test.setTimeout(120000); // 2 minutes
    const email = `${emailAddress}@makerkit.dev`;
    const auth = new AuthPageObject(page);

    await page.goto('/auth/sign-up');

    await auth.signUp({
      email,
      password: 'password',
      repeatPassword: 'password',
    });

    await auth.visitConfirmEmailLink(email);
    await auth.signOut();
    await page.waitForURL('/');

    await page.goto('/auth/password-reset');

    await page.fill('[name="email"]', email);
    await page.click('[type="submit"]');

    // Wait for the success message or confirmation that email was sent  
    await page.waitForSelector('[role="alert"]', { timeout: 10000 });  

    // Immediately visit the confirm email link to avoid OTP expiration
    // Add a small delay to ensure the email is sent
    await page.waitForTimeout(1000);
    await auth.visitConfirmEmailLink(email, { deleteAfter: false });

    // Wait for redirect to update-password page, increase timeout and add more specific error handling
    try {
      await page.waitForURL('/update-password', { timeout: 30000 });
    } catch (error) {
      console.log('Current URL:', page.url());
      console.log('Expected URL: /update-password');
      console.log('Error:', error);
      throw error;
    }

    await auth.updatePassword(newPassword);

    await page
      .locator('a', {
        hasText: 'Back to Home Page',
      })
      .click();

    await page.waitForURL('/home');

    await auth.signOut();
    await page.waitForURL('/');

    await page.waitForTimeout(200);

    await page
      .locator('a', {
        hasText: 'Sign in',
      })
      .first()
      .click();

    await auth.signIn({
      email,
      password: newPassword,
    });

    await page.waitForURL('/home');
  });
});
