# Testing Strategy for Smart Helpdesk with Agentic Triage

## Overview

This document outlines the comprehensive testing strategy for the Smart Helpdesk application, covering all aspects from unit tests to end-to-end testing, with special focus on the agentic workflow components.

## Testing Pyramid

```
                /\
               /  \
              /E2E \     ← End-to-End Tests
             /______\
            /        \
           /Integration\ ← Integration Tests
          /__________\
         /            \
        /  Unit Tests  \ ← Unit Tests
       /________________\
```

## 1. Unit Tests

### Backend Unit Tests (Jest)

#### 1.1 Authentication Tests
```javascript
// tests/auth.test.js
describe('Authentication Controller', () => {
  test('should register new user with valid data', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    };
    
    const result = await authController.register(userData);
    expect(result.success).toBe(true);
    expect(result.user.email).toBe(userData.email);
  });

  test('should reject duplicate email registration', async () => {
    // Implementation
  });

  test('should authenticate with valid credentials', async () => {
    // Implementation
  });

  test('should reject invalid credentials', async () => {
    // Implementation
  });

  test('should validate JWT tokens correctly', async () => {
    // Implementation
  });
});
```

#### 1.2 Agentic Workflow Tests
```javascript
// tests/agentic-workflow.test.js
describe('Agentic Triage Workflow', () => {
  describe('Classification', () => {
    test('should classify billing tickets correctly', () => {
      const ticket = {
        title: 'Refund request',
        description: 'I need a refund for my invoice #1234'
      };
      
      const result = agentClassifier.classify(ticket);
      expect(result.category).toBe('billing');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('should classify technical tickets correctly', () => {
      const ticket = {
        title: 'Application error',
        description: 'Getting 500 error when trying to login'
      };
      
      const result = agentClassifier.classify(ticket);
      expect(result.category).toBe('tech');
    });

    test('should handle ambiguous tickets', () => {
      const ticket = {
        title: 'General question',
        description: 'How do I use this?'
      };
      
      const result = agentClassifier.classify(ticket);
      expect(result.category).toBe('other');
      expect(result.confidence).toBeLessThan(0.6);
    });
  });

  describe('Knowledge Base Retrieval', () => {
    test('should retrieve relevant articles', () => {
      const ticket = {
        category: 'billing',
        description: 'payment method update'
      };
      
      const articles = kbRetriever.search(ticket);
      expect(articles).toHaveLength(3);
      expect(articles[0].score).toBeGreaterThan(0.8);
    });

    test('should return empty for no matches', () => {
      const ticket = {
        category: 'other',
        description: 'completely unrelated query'
      };
      
      const articles = kbRetriever.search(ticket);
      expect(articles).toHaveLength(0);
    });
  });

  describe('Response Drafting', () => {
    test('should generate response with citations', () => {
      const ticket = { category: 'billing' };
      const articles = [{ id: '1', title: 'Payment Methods' }];
      
      const response = responseDrafter.draft(ticket, articles);
      expect(response.content).toContain('[1]');
      expect(response.citations).toContain('1');
    });
  });

  describe('Decision Making', () => {
    test('should auto-close high confidence tickets', () => {
      const suggestion = {
        confidence: 0.9,
        category: 'billing'
      };
      
      const decision = decisionMaker.decide(suggestion, { 
        autoCloseEnabled: true, 
        threshold: 0.78 
      });
      
      expect(decision.action).toBe('auto_close');
    });

    test('should assign to human for low confidence', () => {
      const suggestion = {
        confidence: 0.5,
        category: 'tech'
      };
      
      const decision = decisionMaker.decide(suggestion, {
        autoCloseEnabled: true,
        threshold: 0.78
      });
      
      expect(decision.action).toBe('assign_human');
    });
  });
});
```

#### 1.3 API Validation Tests
```javascript
// tests/validation.test.js
describe('Input Validation', () => {
  test('should validate ticket creation data', () => {
    const validTicket = {
      title: 'Test ticket',
      description: 'Test description',
      category: 'tech'
    };
    
    const result = ticketValidator.validate(validTicket);
    expect(result.isValid).toBe(true);
  });

  test('should reject invalid ticket data', () => {
    const invalidTicket = {
      title: '', // Empty title
      description: 'Test',
      category: 'invalid' // Invalid category
    };
    
    const result = ticketValidator.validate(invalidTicket);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('title_required');
  });
});
```

### Frontend Unit Tests (Vitest + React Testing Library)

#### 1.4 Component Tests
```typescript
// tests/components/TicketForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TicketForm } from '@/components/TicketForm';

describe('TicketForm', () => {
  test('renders form fields correctly', () => {
    render(<TicketForm />);
    
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
  });

  test('submits form with valid data', async () => {
    const mockOnSubmit = vi.fn();
    render(<TicketForm onSubmit={mockOnSubmit} />);
    
    await userEvent.type(screen.getByLabelText(/title/i), 'Test Ticket');
    await userEvent.type(screen.getByLabelText(/description/i), 'Test Description');
    await userEvent.selectOptions(screen.getByLabelText(/category/i), 'tech');
    
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'Test Ticket',
        description: 'Test Description',
        category: 'tech'
      });
    });
  });

  test('shows validation errors for invalid input', async () => {
    render(<TicketForm />);
    
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });
  });
});
```

#### 1.5 Hook Tests
```typescript
// tests/hooks/useAuth.test.tsx
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';

describe('useAuth', () => {
  test('should handle login successfully', async () => {
    const { result } = renderHook(() => useAuth());
    
    act(() => {
      result.current.login('test@example.com', 'password123');
    });
    
    await waitFor(() => {
      expect(result.current.user).toBeTruthy();
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  test('should handle logout', async () => {
    const { result } = renderHook(() => useAuth());
    
    // First login
    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });
    
    // Then logout
    act(() => {
      result.current.logout();
    });
    
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
```

## 2. Integration Tests

### 2.1 API Integration Tests
```javascript
// tests/integration/api.test.js
import request from 'supertest';
import app from '../src/app.js';

describe('API Integration Tests', () => {
  let authToken;
  
  beforeAll(async () => {
    // Setup test database
    await setupTestDatabase();
    
    // Get auth token
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    authToken = response.body.token;
  });

  describe('Ticket Lifecycle', () => {
    test('should create, process, and resolve ticket', async () => {
      // Create ticket
      const createResponse = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Integration test ticket',
          description: 'This is a test ticket',
          category: 'tech'
        });
      
      expect(createResponse.status).toBe(201);
      const ticketId = createResponse.body.ticket.id;
      
      // Wait for agentic processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if suggestion was created
      const suggestionResponse = await request(app)
        .get(`/api/agent/suggestion/${ticketId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(suggestionResponse.status).toBe(200);
      expect(suggestionResponse.body.suggestion).toBeTruthy();
      
      // Check audit logs
      const auditResponse = await request(app)
        .get(`/api/tickets/${ticketId}/audit`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(auditResponse.body.logs).toContainEqual(
        expect.objectContaining({
          action: 'AGENT_CLASSIFIED'
        })
      );
    });
  });

  describe('Knowledge Base Search', () => {
    test('should return relevant articles', async () => {
      const response = await request(app)
        .get('/api/kb?query=payment')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.articles.length).toBeGreaterThan(0);
      expect(response.body.articles[0].title).toContain('payment');
    });
  });
});
```

### 2.2 Database Integration Tests
```javascript
// tests/integration/database.test.js
describe('Database Operations', () => {
  test('should maintain data consistency across operations', async () => {
    // Create user
    const user = await User.create({
      email: 'test@example.com',
      name: 'Test User',
      role: 'user'
    });
    
    // Create ticket
    const ticket = await Ticket.create({
      title: 'Test ticket',
      createdBy: user._id
    });
    
    // Create agent suggestion
    const suggestion = await AgentSuggestion.create({
      ticketId: ticket._id,
      confidence: 0.9
    });
    
    // Verify relationships
    const ticketWithSuggestion = await Ticket
      .findById(ticket._id)
      .populate('agentSuggestion');
    
    expect(ticketWithSuggestion.agentSuggestion._id).toEqual(suggestion._id);
  });
});
```

## 3. End-to-End Tests

### 3.1 Cypress E2E Tests
```javascript
// cypress/e2e/ticket-lifecycle.cy.js
describe('Ticket Lifecycle E2E', () => {
  beforeEach(() => {
    // Reset database state
    cy.exec('npm run test:seed');
    
    // Login as user
    cy.visit('/login');
    cy.get('[data-testid=email]').type('user@helpdesk.com');
    cy.get('[data-testid=password]').type('user123');
    cy.get('[data-testid=login-button]').click();
  });

  it('should create ticket and see AI processing', () => {
    // Create ticket
    cy.visit('/tickets/new');
    cy.get('[data-testid=ticket-title]').type('Payment issue with order #1234');
    cy.get('[data-testid=ticket-description]').type('I was charged twice for the same order');
    cy.get('[data-testid=ticket-category]').select('billing');
    cy.get('[data-testid=submit-ticket]').click();
    
    // Should redirect to ticket detail
    cy.url().should('include', '/tickets/');
    cy.get('[data-testid=ticket-status]').should('contain', 'Open');
    
    // Wait for AI processing
    cy.get('[data-testid=processing-indicator]', { timeout: 10000 })
      .should('be.visible');
    
    // Should see AI suggestion
    cy.get('[data-testid=ai-suggestion]', { timeout: 15000 })
      .should('be.visible');
    
    // Should see audit log
    cy.get('[data-testid=audit-log]').should('contain', 'AGENT_CLASSIFIED');
    cy.get('[data-testid=audit-log]').should('contain', 'KB_RETRIEVED');
    cy.get('[data-testid=audit-log]').should('contain', 'DRAFT_GENERATED');
  });

  it('should allow agent to review and send response', () => {
    // Login as agent
    cy.visit('/login');
    cy.get('[data-testid=email]').clear().type('agent@helpdesk.com');
    cy.get('[data-testid=password]').clear().type('agent123');
    cy.get('[data-testid=login-button]').click();
    
    // Go to agent dashboard
    cy.visit('/agent');
    cy.get('[data-testid=pending-suggestions]').should('be.visible');
    
    // Review first suggestion
    cy.get('[data-testid=suggestion-item]').first().click();
    
    // Edit response
    cy.get('[data-testid=draft-response]').should('be.visible');
    cy.get('[data-testid=edit-response]').click();
    cy.get('[data-testid=response-editor]').clear().type('Updated response with additional info');
    
    // Send response
    cy.get('[data-testid=send-response]').click();
    
    // Verify ticket status changed
    cy.get('[data-testid=ticket-status]').should('contain', 'Resolved');
    
    // Verify audit log updated
    cy.get('[data-testid=audit-log]').should('contain', 'REPLY_SENT');
  });
});
```

### 3.2 Playwright E2E Tests
```typescript
// tests/e2e/admin-workflow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Admin Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid=email]', 'admin@helpdesk.com');
    await page.fill('[data-testid=password]', 'admin123');
    await page.click('[data-testid=login-button]');
  });

  test('should manage KB articles', async ({ page }) => {
    // Navigate to KB management
    await page.click('[data-testid=nav-kb]');
    await expect(page).toHaveURL('/kb');
    
    // Create new article
    await page.click('[data-testid=create-article]');
    await page.fill('[data-testid=article-title]', 'Test Article');
    await page.fill('[data-testid=article-body]', 'This is a test article body');
    await page.fill('[data-testid=article-tags]', 'test,demo');
    await page.click('[data-testid=save-article]');
    
    // Verify article appears in list
    await expect(page.locator('[data-testid=article-list]'))
      .toContainText('Test Article');
    
    // Search for article
    await page.fill('[data-testid=kb-search]', 'test');
    await expect(page.locator('[data-testid=search-results]'))
      .toContainText('Test Article');
  });

  test('should configure system settings', async ({ page }) => {
    // Navigate to settings
    await page.click('[data-testid=nav-settings]');
    
    // Update confidence threshold
    await page.fill('[data-testid=confidence-threshold]', '0.85');
    
    // Toggle auto-close
    await page.click('[data-testid=auto-close-toggle]');
    
    // Save settings
    await page.click('[data-testid=save-settings]');
    
    // Verify success message
    await expect(page.locator('[data-testid=success-message]'))
      .toContainText('Settings saved successfully');
  });
});
```

## 4. Performance Tests

### 4.1 Load Testing
```javascript
// tests/performance/load.test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 10 },
    { duration: '3m', target: 50 },
    { duration: '1m', target: 0 },
  ],
};

export default function () {
  // Test ticket creation under load
  const payload = JSON.stringify({
    title: 'Load test ticket',
    description: 'This is a load test',
    category: 'tech'
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token'
    },
  };

  const response = http.post('http://localhost:5000/api/tickets', payload, params);
  
  check(response, {
    'status is 201': (r) => r.status === 201,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

### 4.2 Stress Testing
```javascript
// tests/performance/stress.test.js
export let options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '5m', target: 200 },
    { duration: '10m', target: 0 },
  ],
};

export default function () {
  // Test agentic workflow under stress
  const ticketResponse = http.post('/api/tickets', ticketData);
  
  if (ticketResponse.status === 201) {
    const ticketId = ticketResponse.json().ticket.id;
    
    // Poll for agent suggestion
    let suggestion = null;
    let attempts = 0;
    
    while (!suggestion && attempts < 10) {
      sleep(2);
      const suggestionResponse = http.get(`/api/agent/suggestion/${ticketId}`);
      
      if (suggestionResponse.status === 200) {
        suggestion = suggestionResponse.json().suggestion;
      }
      attempts++;
    }
    
    check(suggestion, {
      'AI suggestion created': (s) => s !== null,
      'suggestion has confidence': (s) => s && s.confidence !== undefined,
    });
  }
}
```

## 5. Security Tests

### 5.1 Authentication Security Tests
```javascript
// tests/security/auth.test.js
describe('Authentication Security', () => {
  test('should prevent JWT token manipulation', async () => {
    const validToken = await generateValidToken();
    const manipulatedToken = manipulateToken(validToken);
    
    const response = await request(app)
      .get('/api/tickets')
      .set('Authorization', `Bearer ${manipulatedToken}`);
    
    expect(response.status).toBe(401);
  });

  test('should enforce rate limiting on login attempts', async () => {
    const promises = Array.from({ length: 10 }, () =>
      request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrong' })
    );
    
    const responses = await Promise.all(promises);
    const blockedResponses = responses.filter(r => r.status === 429);
    
    expect(blockedResponses.length).toBeGreaterThan(0);
  });

  test('should sanitize input to prevent injection', async () => {
    const maliciousInput = {
      title: '<script>alert("xss")</script>',
      description: '{{ constructor.constructor("return process")().exit() }}'
    };
    
    const response = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${validToken}`)
      .send(maliciousInput);
    
    expect(response.body.ticket.title).not.toContain('<script>');
  });
});
```

### 5.2 Authorization Tests
```javascript
// tests/security/authorization.test.js
describe('Authorization Security', () => {
  test('should prevent cross-user data access', async () => {
    const user1Token = await getTokenForUser('user1');
    const user2Token = await getTokenForUser('user2');
    
    // Create ticket as user1
    const ticketResponse = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${user1Token}`)
      .send(validTicketData);
    
    const ticketId = ticketResponse.body.ticket.id;
    
    // Try to access as user2
    const accessResponse = await request(app)
      .get(`/api/tickets/${ticketId}`)
      .set('Authorization', `Bearer ${user2Token}`);
    
    expect(accessResponse.status).toBe(403);
  });

  test('should enforce admin-only operations', async () => {
    const userToken = await getTokenForUser('user');
    
    const response = await request(app)
      .post('/api/kb')
      .set('Authorization', `Bearer ${userToken}`)
      .send(kbArticleData);
    
    expect(response.status).toBe(403);
  });
});
```

## 6. AI/ML Model Tests

### 6.1 Classification Accuracy Tests
```javascript
// tests/ai/classification.test.js
describe('AI Classification Tests', () => {
  const testCases = [
    { 
      description: 'Need refund for order #1234', 
      expectedCategory: 'billing',
      minConfidence: 0.8 
    },
    { 
      description: 'App crashes when I login', 
      expectedCategory: 'tech',
      minConfidence: 0.7 
    },
    { 
      description: 'Where is my package?', 
      expectedCategory: 'shipping',
      minConfidence: 0.8 
    }
  ];

  testCases.forEach(testCase => {
    test(`should classify "${testCase.description}" as ${testCase.expectedCategory}`, () => {
      const result = classifier.classify({ description: testCase.description });
      
      expect(result.category).toBe(testCase.expectedCategory);
      expect(result.confidence).toBeGreaterThanOrEqual(testCase.minConfidence);
    });
  });

  test('should handle edge cases gracefully', () => {
    const edgeCases = [
      '', // Empty string
      'a', // Single character
      'x'.repeat(10000), // Very long string
      '🎉🎊🎈', // Emojis only
    ];

    edgeCases.forEach(description => {
      expect(() => {
        const result = classifier.classify({ description });
        expect(result.category).toBeDefined();
        expect(typeof result.confidence).toBe('number');
      }).not.toThrow();
    });
  });
});
```

### 6.2 Knowledge Base Retrieval Tests
```javascript
// tests/ai/kb-retrieval.test.js
describe('KB Retrieval Tests', () => {
  test('should return relevant articles in correct order', () => {
    const query = 'payment method credit card';
    const articles = kbRetriever.search({ description: query });
    
    expect(articles).toHaveLength(3);
    expect(articles[0].score).toBeGreaterThanOrEqual(articles[1].score);
    expect(articles[1].score).toBeGreaterThanOrEqual(articles[2].score);
    
    // First result should be highly relevant
    expect(articles[0].score).toBeGreaterThan(0.8);
  });

  test('should handle queries with no matches', () => {
    const query = 'completely unrelated topic xyz123';
    const articles = kbRetriever.search({ description: query });
    
    expect(articles).toEqual([]);
  });

  test('should perform well with concurrent requests', async () => {
    const queries = Array.from({ length: 100 }, (_, i) => `test query ${i}`);
    
    const startTime = Date.now();
    const promises = queries.map(query => 
      kbRetriever.search({ description: query })
    );
    
    const results = await Promise.all(promises);
    const endTime = Date.now();
    
    expect(results).toHaveLength(100);
    expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5s
  });
});
```

## 7. Test Data Management

### 7.1 Fixtures
```javascript
// tests/fixtures/tickets.js
export const ticketFixtures = {
  billing: {
    title: 'Billing Issue',
    description: 'I was charged twice for my subscription',
    category: 'billing',
    keywords: ['charge', 'bill', 'subscription', 'payment']
  },
  
  tech: {
    title: 'Technical Problem',
    description: 'Application shows 500 error on login',
    category: 'tech',
    keywords: ['error', '500', 'login', 'technical']
  },
  
  shipping: {
    title: 'Delivery Issue',
    description: 'My package has not arrived yet',
    category: 'shipping',
    keywords: ['package', 'delivery', 'shipping', 'tracking']
  }
};

export const kbArticleFixtures = [
  {
    id: '1',
    title: 'How to Update Payment Methods',
    body: 'Step 1: Go to billing settings...',
    tags: ['billing', 'payment', 'credit-card'],
    category: 'billing'
  },
  {
    id: '2',
    title: 'Troubleshooting Login Errors',
    body: 'If you encounter login errors...',
    tags: ['tech', 'login', 'error', 'troubleshooting'],
    category: 'tech'
  }
];
```

### 7.2 Test Database Seeds
```javascript
// tests/helpers/database.js
export async function seedTestDatabase() {
  // Clear existing data
  await User.deleteMany({});
  await Ticket.deleteMany({});
  await Article.deleteMany({});
  
  // Create test users
  const users = await User.insertMany([
    {
      _id: 'user1',
      email: 'user1@test.com',
      role: 'user',
      password: await bcrypt.hash('password123', 12)
    },
    {
      _id: 'agent1',
      email: 'agent1@test.com',
      role: 'agent',
      password: await bcrypt.hash('password123', 12)
    },
    {
      _id: 'admin1',
      email: 'admin1@test.com',
      role: 'admin',
      password: await bcrypt.hash('password123', 12)
    }
  ]);
  
  // Create test articles
  await Article.insertMany(kbArticleFixtures);
  
  return { users };
}

export async function cleanupTestDatabase() {
  await mongoose.connection.dropDatabase();
}
```

## 8. Continuous Integration

### 8.1 GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:7.0
        ports:
          - 27017:27017
        options: >-
          --health-cmd "mongosh --eval 'db.adminCommand({ping: 1})'"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install backend dependencies
      run: |
        cd backend
        npm ci
    
    - name: Install frontend dependencies
      run: |
        cd frontend
        npm ci
    
    - name: Run backend tests
      run: |
        cd backend
        npm test -- --coverage
      env:
        MONGO_URI: mongodb://localhost:27017/helpdesk_test
        REDIS_URL: redis://localhost:6379
        JWT_SECRET: test-secret
    
    - name: Run frontend tests
      run: |
        cd frontend
        npm test -- --coverage
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Start services
      run: docker-compose up -d
    
    - name: Wait for services
      run: |
        timeout 60s bash -c 'until curl -f http://localhost:5000/api/health; do sleep 5; done'
    
    - name: Run integration tests
      run: |
        cd backend
        npm run test:integration
    
    - name: Cleanup
      run: docker-compose down

  e2e-tests:
    runs-on: ubuntu-latest
    needs: integration-tests
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install Playwright
      run: npx playwright install --with-deps
    
    - name: Start application
      run: |
        docker-compose up -d
        timeout 120s bash -c 'until curl -f http://localhost:3000; do sleep 5; done'
    
    - name: Run Playwright tests
      run: npx playwright test
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
```

## 9. Test Coverage Goals

### Coverage Targets
- **Overall**: >85%
- **Critical paths**: >95%
- **Agentic workflow**: >90%
- **API endpoints**: >85%
- **UI components**: >80%

### Coverage Reports
```bash
# Generate coverage reports
npm run test:coverage

# View HTML report
open coverage/lcov-report/index.html

# Check coverage thresholds
npx jest --coverage --coverageThreshold='{"global":{"lines":85,"functions":85,"branches":85,"statements":85}}'
```

## 10. Best Practices

### 10.1 Test Organization
- Group related tests in describe blocks
- Use meaningful test descriptions
- Follow AAA pattern (Arrange, Act, Assert)
- Keep tests independent and idempotent

### 10.2 Mock Strategy
- Mock external dependencies (APIs, databases)
- Use real objects for integration tests
- Mock timers for time-dependent code
- Spy on internal methods judiciously

### 10.3 Test Data
- Use factories for generating test data
- Keep test data minimal and focused
- Clean up after each test
- Use realistic data for better testing

### 10.4 Performance
- Run tests in parallel when possible
- Use database transactions for faster cleanup
- Mock heavy operations in unit tests
- Profile slow tests and optimize

This comprehensive testing strategy ensures the Smart Helpdesk application is thoroughly tested across all layers, with special attention to the critical agentic workflow components. The combination of unit, integration, and end-to-end tests provides confidence in both individual components and the system as a whole.