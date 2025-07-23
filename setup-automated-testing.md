# Automated Testing & CI/CD Pipeline Setup

## 🎯 **Why Automated Testing is Critical**

With staging environment ready, you need automated testing to:
- ✅ Catch bugs before they reach staging/production
- ✅ Ensure new features don't break existing functionality
- ✅ Enable confident, fast deployments
- ✅ Maintain code quality as team grows

## 🚀 **Quick Testing Setup (45 minutes)**

### **Step 1: Frontend Testing Setup (20 minutes)**

**Install Testing Dependencies:**
```bash
cd frontend
npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

**Create `frontend/vitest.config.ts`:**
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
```

**Create `frontend/src/test/setup.ts`:**
```typescript
import '@testing-library/jest-dom'
```

**Create `frontend/src/test/components/NovaraLanding.test.tsx`:**
```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NovaraLanding from '../../components/NovaraLanding'
import { AuthProvider } from '../../contexts/AuthContext'

// Mock the API client
vi.mock('../../lib/api', () => ({
  apiClient: {
    createUser: vi.fn(),
    loginUser: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}))

const MockedNovaraLanding = () => (
  <AuthProvider>
    <NovaraLanding />
  </AuthProvider>
)

describe('NovaraLanding', () => {
  it('renders welcome message', () => {
    render(<MockedNovaraLanding />)
    expect(screen.getByText(/You don't have to navigate/i)).toBeInTheDocument()
    expect(screen.getByText(/IVF alone/i)).toBeInTheDocument()
  })

  it('shows signup form when Start Your Journey is clicked', async () => {
    const user = userEvent.setup()
    render(<MockedNovaraLanding />)
    
    const startButton = screen.getByText(/Start Your Journey/i)
    await user.click(startButton)
    
    expect(screen.getByText(/Email/i)).toBeInTheDocument()
  })

  it('shows login form when Already have account is clicked', async () => {
    const user = userEvent.setup()
    render(<MockedNovaraLanding />)
    
    const loginButton = screen.getByText(/Already have an account/i)
    await user.click(loginButton)
    
    expect(screen.getByText(/Welcome Back/i)).toBeInTheDocument()
  })
})
```

**Update `frontend/package.json` scripts:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

### **Step 2: Backend Testing Setup (15 minutes)**

**Install Testing Dependencies:**
```bash
cd backend
npm install --save-dev jest supertest @types/jest
```

**Create `backend/jest.config.js`:**
```javascript
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'server.js',
    'routes/**/*.js',
    '!**/node_modules/**'
  ]
};
```

**Create `backend/__tests__/health.test.js`:**
```javascript
const request = require('supertest');
const app = require('../server');

describe('Health Check', () => {
  it('should return health status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('service', 'Novara API');
    expect(response.body).toHaveProperty('timestamp');
  });
});

describe('API Endpoints', () => {
  it('should return API info on root', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);

    expect(response.body).toHaveProperty('message', 'Novara API is running');
    expect(response.body).toHaveProperty('endpoints');
  });

  it('should require authentication for protected routes', async () => {
    await request(app)
      .get('/api/users/me')
      .expect(401);
  });
});
```

**Update `backend/package.json` scripts:**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### **Step 3: GitHub Actions CI/CD Pipeline (10 minutes)**

**Create `.github/workflows/ci.yml`:**
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test-frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm run test:run
    
    - name: Build frontend
      run: npm run build

  test-backend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: backend/package-lock.json
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
      env:
        NODE_ENV: test
        JWT_SECRET: test-secret
        AIRTABLE_API_KEY: test-key
        AIRTABLE_BASE_ID: test-base

  deploy-staging:
    needs: [test-frontend, test-backend]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    
    steps:
    - name: Deploy to staging
      run: echo "Deploy to staging environment"
      # Add actual deployment steps here

  deploy-production:
    needs: [test-frontend, test-backend]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Deploy to production
      run: echo "Deploy to production environment"
      # Add actual deployment steps here
```

## 🔄 **Development Workflow**

**Recommended Git Workflow:**
```
feature/new-feature → develop → main
       ↓               ↓        ↓
   Local Tests     Staging   Production
```

**Branch Strategy:**
- `main` → Production deployments
- `develop` → Staging deployments  
- `feature/*` → Feature development

**Testing Strategy:**
- **Unit Tests:** Individual components/functions
- **Integration Tests:** API endpoints with database
- **E2E Tests:** Full user workflows (optional for MVP)

## 📊 **Test Coverage Goals**

**Minimum Coverage Targets:**
- **Frontend:** 70%+ component coverage
- **Backend:** 80%+ API endpoint coverage
- **Critical Paths:** 95%+ (auth, payments, core features)

**Testing Priorities:**
1. Authentication flows
2. Data persistence (Airtable integration)
3. API error handling
4. User interface components
5. Edge cases and error scenarios

## 🚀 **Running Tests Locally**

**Frontend Tests:**
```bash
cd frontend
npm test                 # Interactive test runner
npm run test:run        # Run once
npm run test:coverage   # Generate coverage report
```

**Backend Tests:**
```bash
cd backend
npm test                # Run all tests
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
```

**Full Project Test:**
```bash
# From project root
npm run test:all       # Run frontend and backend tests
```

## 🎯 **Post-Setup Benefits**

- ✅ **Automated Quality Gates:** No broken code reaches staging/production
- ✅ **Faster Development:** Catch issues early in development
- ✅ **Confidence in Changes:** Know that new features don't break existing ones
- ✅ **Team Collaboration:** Pull requests automatically tested
- ✅ **Deployment Safety:** Only tested code gets deployed

**Setup Time:** ~45 minutes
**Long-term Time Savings:** Hours of debugging prevented
**Code Quality:** Dramatically improved reliability

## 📋 **Next Steps After Setup**

1. **Write tests for existing critical components**
2. **Set up test coverage monitoring**
3. **Create E2E tests for key user journeys**
4. **Integrate with staging environment testing**
5. **Set up performance testing** 