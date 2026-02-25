# Entra ID Authentication Setup Guide

This guide covers different authentication methods for your Playwright Testing Service with Entra ID.

## 1. GitHub Actions with Workload Identity Federation (Recommended for CI/CD)

### Setup Steps:
1. **Create an Entra ID Application:**
   ```bash
   az ad app create --display-name "Playwright-Testing-GitHub-Actions"
   ```

2. **Create a Service Principal:**
   ```bash
   az ad sp create --id <app-id-from-step-1>
   ```

3. **Configure Workload Identity Federation:**
   ```bash
   az ad app federated-credential create \
     --id <app-id> \
     --parameters '{
       "name": "playwright-github-actions",
       "issuer": "https://token.actions.githubusercontent.com",
       "subject": "repo:<your-org>/<your-repo>:ref:refs/heads/main",
       "audience": ["api://AzureADTokenExchange"]
     }'
   ```

4. **Assign Required Permissions:**
   ```bash
   # For Playwright Testing Service
   az role assignment create \
     --assignee <service-principal-id> \
     --role "Playwright Testing Service User" \
     --scope "/subscriptions/<subscription-id>/resourceGroups/<resource-group>/providers/Microsoft.PlaywrightTesting/accounts/<account-name>"
   ```

5. **Add GitHub Secrets:**
   - `AZURE_CLIENT_ID`: The application ID
   - `AZURE_TENANT_ID`: Your tenant ID  
   - `AZURE_SUBSCRIPTION_ID`: Your subscription ID

## 2. Local Development Authentication

### Option A: Azure CLI (Simplest)
```bash
az login
az account set --subscription <subscription-id>
```

### Option B: Environment Variables
Create a `.env` file (already in .gitignore):
```env
AZURE_CLIENT_ID=<your-client-id>
AZURE_CLIENT_SECRET=<your-client-secret>
AZURE_TENANT_ID=<your-tenant-id>
```

### Option C: Managed Identity (Azure VMs)
When running on Azure VMs, DefaultAzureCredential automatically uses the VM's managed identity.

## 3. Enhanced Authentication Configuration

### Create auth.setup.ts for session management:
```typescript
// tests/auth.setup.ts
import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Navigate to your application's login page
  await page.goto('/login');
  
  // Perform authentication steps
  await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL || '');
  await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD || '');
  await page.click('button[type="submit"]');
  
  // Wait for navigation or success indicator
  await expect(page).toHaveURL('/dashboard');
  
  // Save authentication state
  await page.context().storageState({ path: authFile });
});
```

### Update playwright.config.ts to use authentication:
```typescript
// Add this to your projects array
{
  name: 'setup',
  testMatch: /.*\.setup\.ts/,
},
{
  name: 'chromium',
  use: {
    ...devices['Desktop Chrome'],
    // Use saved authentication state
    storageState: 'playwright/.auth/user.json',
  },
  dependencies: ['setup'],
},
```

## 4. Service-Specific Authentication

### For testing applications that use Entra ID:
```typescript
// tests/helpers/auth.ts
import { Page } from '@playwright/test';

export async function loginWithEntraID(page: Page, email: string, password: string) {
  // Navigate to your app
  await page.goto('/');
  
  // Click Microsoft login button
  await page.click('text=Sign in with Microsoft');
  
  // Handle Entra ID login flow
  await page.fill('input[type="email"]', email);
  await page.click('input[type="submit"]');
  
  await page.fill('input[type="password"]', password);
  await page.click('input[type="submit"]');
  
  // Handle additional prompts (MFA, consent, etc.)
  try {
    await page.click('text=Yes', { timeout: 5000 });
  } catch {
    // MFA or consent not required
  }
  
  // Wait for redirect back to your application
  await page.waitForURL('/dashboard');
}
```

## 5. Testing Different Authentication Scenarios

### Multi-tenant application testing:
```typescript
// tests/multi-tenant.spec.ts
import { test, expect } from '@playwright/test';
import { loginWithEntraID } from './helpers/auth';

test('Login as tenant A user', async ({ page }) => {
  await loginWithEntraID(page, process.env.TENANT_A_USER!, process.env.TENANT_A_PASSWORD!);
  // Test tenant A specific features
});

test('Login as tenant B user', async ({ page }) => {
  await loginWithEntraID(page, process.env.TENANT_B_USER!, process.env.TENANT_B_PASSWORD!);
  // Test tenant B specific features
});
```

## 6. Environment Variables for GitHub Actions

Add these to your GitHub repository secrets:
```yaml
# Authentication
AZURE_CLIENT_ID: Your Entra ID application client ID
AZURE_TENANT_ID: Your Entra ID tenant ID  
AZURE_SUBSCRIPTION_ID: Your Azure subscription ID

# Test Users (if testing Entra ID login flows)
TEST_USER_EMAIL: test.user@yourtenant.onmicrosoft.com
TEST_USER_PASSWORD: SecurePassword123!
TENANT_A_USER: tenanta@yourtenant.onmicrosoft.com
TENANT_A_PASSWORD: SecurePassword123!
```

## 7. Troubleshooting

### Common Issues:
1. **Authentication failures**: Check that service principal has correct permissions
2. **Token expiration**: DefaultAzureCredential handles token refresh automatically
3. **Local development**: Ensure `az login` is run and correct subscription is selected
4. **CI/CD failures**: Verify GitHub secrets are set correctly

### Debug Authentication:
```typescript
// Add this to your playwright.service.config.ts for debugging
import { DefaultAzureCredential } from '@azure/identity';

const credential = new DefaultAzureCredential({
  // Enable logging
  loggingOptions: {
    enableSystemLog: true,
    systemLogLevel: 'info'
  }
});
```

This setup provides flexible authentication for different environments while maintaining security best practices.