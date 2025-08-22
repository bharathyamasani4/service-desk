// Smart Helpdesk Application - Fixed Version
class SmartHelpdeskApp {
  constructor() {
    this.currentUser = null;
    this.currentPage = 'dashboard';
    this.notifications = [];
    this.mockData = this.initializeMockData();
    this.init();
  }

  initializeMockData() {
    // Initialize with provided mock data and add to localStorage if not present
    const defaultData = {
      users: [
        {"id": "1", "email": "admin@helpdesk.com", "name": "Admin User", "role": "admin", "password": "admin123"},
        {"id": "2", "email": "agent@helpdesk.com", "name": "Support Agent", "role": "agent", "password": "agent123"},
        {"id": "3", "email": "user@helpdesk.com", "name": "John Customer", "role": "user", "password": "user123"}
      ],
      tickets: [
        {"id": "1", "title": "Refund for double charge", "description": "I was charged twice for order #1234", "category": "other", "status": "triaged", "createdBy": "3", "assignee": "2", "createdAt": "2024-01-15T10:30:00Z", "replies": []},
        {"id": "2", "title": "App shows 500 on login", "description": "Stack trace mentions auth module", "category": "other", "status": "open", "createdBy": "3", "createdAt": "2024-01-15T11:00:00Z", "replies": []},
        {"id": "3", "title": "Where is my package?", "description": "Shipment delayed 5 days", "category": "other", "status": "waiting_human", "createdBy": "3", "assignee": "2", "createdAt": "2024-01-15T12:00:00Z", "replies": []}
      ],
      kbArticles: [
        {"id": "1", "title": "How to update payment method", "body": "To update your payment method, go to Account Settings > Payment Methods. Click 'Add Payment Method' or edit an existing one. We accept credit cards, debit cards, and PayPal.", "tags": ["billing", "payments"], "status": "published", "updatedAt": "2024-01-10T09:00:00Z"},
        {"id": "2", "title": "Troubleshooting 500 errors", "body": "500 errors indicate server issues. Try these steps: 1. Clear your browser cache 2. Try incognito mode 3. Check your internet connection 4. Contact support if issues persist.", "tags": ["tech", "errors"], "status": "published", "updatedAt": "2024-01-12T14:30:00Z"},
        {"id": "3", "title": "Tracking your shipment", "body": "You can track shipments using the tracking number provided in your order confirmation email. Visit our tracking page and enter your tracking number. Updates are provided in real-time.", "tags": ["shipping", "delivery"], "status": "published", "updatedAt": "2024-01-14T16:45:00Z"}
      ],
      agentSuggestions: [
        {"id": "1", "ticketId": "1", "predictedCategory": "billing", "articleIds": ["1"], "draftReply": "I can help you with the double charge issue. Please check this article on payment methods [1]. We'll process your refund within 3-5 business days.", "confidence": 0.85, "autoClosed": false, "createdAt": "2024-01-15T10:31:00Z"}
      ],
      auditLogs: [
        {"id": "1", "ticketId": "1", "traceId": "trace-001", "actor": "system", "action": "TICKET_CREATED", "timestamp": "2024-01-15T10:30:00Z", "meta": {}},
        {"id": "2", "ticketId": "1", "traceId": "trace-001", "actor": "system", "action": "AGENT_CLASSIFIED", "meta": {"category": "billing", "confidence": 0.7}, "timestamp": "2024-01-15T10:30:05Z"},
        {"id": "3", "ticketId": "1", "traceId": "trace-001", "actor": "system", "action": "KB_RETRIEVED", "meta": {"articleIds": ["1"], "scores": [0.9]}, "timestamp": "2024-01-15T10:30:10Z"}
      ],
      config: {
        autoCloseEnabled: true,
        confidenceThreshold: 0.78,
        slaHours: 24
      }
    };

    // Load from localStorage or use defaults
    const stored = localStorage.getItem('helpdeskData');
    if (stored) {
      return JSON.parse(stored);
    } else {
      this.saveData(defaultData);
      return defaultData;
    }
  }

  saveData(data = this.mockData) {
    localStorage.setItem('helpdeskData', JSON.stringify(data));
  }

  init() {
    // Ensure DOM is fully loaded before setting up
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.setupEventListeners();
        this.checkAuth();
      });
    } else {
      this.setupEventListeners();
      this.checkAuth();
    }
  }

  setupEventListeners() {
    // Authentication
    const loginForm = document.getElementById('login-form-element');
    const registerForm = document.getElementById('register-form-element');
    
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }
    if (registerForm) {
      registerForm.addEventListener('submit', (e) => this.handleRegister(e));
    }
    
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (showRegisterLink) {
      showRegisterLink.addEventListener('click', (e) => this.toggleAuthForm(e, 'register'));
    }
    if (showLoginLink) {
      showLoginLink.addEventListener('click', (e) => this.toggleAuthForm(e, 'login'));
    }
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout());
    }

    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => this.handleNavigation(e));
    });

    // Modals
    const createTicketBtn = document.getElementById('create-ticket-btn');
    if (createTicketBtn) {
      createTicketBtn.addEventListener('click', () => this.showCreateTicketModal());
    }
    
    this.setupModalEventListeners();
    this.setupFilterEventListeners();
    this.setupFormEventListeners();
  }

  setupModalEventListeners() {
    const modals = [
      { closeBtn: 'close-create-ticket', cancelBtn: 'cancel-create-ticket', modal: 'create-ticket-modal', form: 'create-ticket-form', handler: (e) => this.createTicket(e) },
      { closeBtn: 'close-ticket-detail', modal: 'ticket-detail-modal', form: 'reply-form', handler: (e) => this.sendReply(e) },
      { closeBtn: 'close-article-modal', cancelBtn: 'cancel-article', modal: 'article-modal', form: 'article-form', handler: (e) => this.saveArticle(e) }
    ];

    modals.forEach(modalConfig => {
      const closeBtn = document.getElementById(modalConfig.closeBtn);
      const cancelBtn = modalConfig.cancelBtn ? document.getElementById(modalConfig.cancelBtn) : null;
      const form = document.getElementById(modalConfig.form);
      
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.hideModal(modalConfig.modal));
      }
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => this.hideModal(modalConfig.modal));
      }
      if (form && modalConfig.handler) {
        form.addEventListener('submit', modalConfig.handler);
      }
    });

    // Modal background clicks
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.add('hidden');
        }
      });
    });
  }

  setupFilterEventListeners() {
    const statusFilter = document.getElementById('status-filter');
    const categoryFilter = document.getElementById('category-filter');
    const searchTickets = document.getElementById('search-tickets');
    const searchKB = document.getElementById('search-kb');

    if (statusFilter) statusFilter.addEventListener('change', () => this.filterTickets());
    if (categoryFilter) categoryFilter.addEventListener('change', () => this.filterTickets());
    if (searchTickets) searchTickets.addEventListener('input', () => this.filterTickets());
    if (searchKB) searchKB.addEventListener('input', () => this.filterKBArticles());
  }

  setupFormEventListeners() {
    const settingsForm = document.getElementById('settings-form');
    const confidenceThreshold = document.getElementById('confidence-threshold');
    const createArticleBtn = document.getElementById('create-article-btn');

    if (settingsForm) {
      settingsForm.addEventListener('submit', (e) => this.saveSettings(e));
    }
    if (confidenceThreshold) {
      confidenceThreshold.addEventListener('input', (e) => {
        const thresholdValue = document.getElementById('threshold-value');
        if (thresholdValue) {
          thresholdValue.textContent = parseFloat(e.target.value).toFixed(2);
        }
      });
    }
    if (createArticleBtn) {
      createArticleBtn.addEventListener('click', () => this.showCreateArticleModal());
    }

    // Ticket detail tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.switchTab(e));
    });
  }

  checkAuth() {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const userData = JSON.parse(atob(token));
        this.currentUser = userData;
        this.showMainApp();
      } catch (e) {
        this.logout();
      }
    } else {
      this.showAuthPage();
    }
  }

  async handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
      this.showToast('Please enter both email and password', 'error');
      return;
    }

    this.showLoading();

    // Simulate API delay
    setTimeout(() => {
      const user = this.mockData.users.find(u => u.email === email && u.password === password);
      
      if (user) {
        const token = btoa(JSON.stringify({id: user.id, email: user.email, name: user.name, role: user.role}));
        localStorage.setItem('authToken', token);
        this.currentUser = {id: user.id, email: user.email, name: user.name, role: user.role};
        
        this.hideLoading();
        this.showToast('Login successful!', 'success');
        
        // Small delay to show success message before redirecting
        setTimeout(() => {
          this.showMainApp();
        }, 500);
      } else {
        this.hideLoading();
        this.showToast('Invalid credentials', 'error');
      }
    }, 1000);
  }

  async handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    if (!name || !email || !password) {
      this.showToast('Please fill in all fields', 'error');
      return;
    }

    this.showLoading();

    setTimeout(() => {
      // Check if user already exists
      if (this.mockData.users.find(u => u.email === email)) {
        this.showToast('User already exists', 'error');
        this.hideLoading();
        return;
      }

      const newUser = {
        id: String(this.mockData.users.length + 1),
        name, email, password,
        role: 'user'
      };

      this.mockData.users.push(newUser);
      this.saveData();

      const token = btoa(JSON.stringify({id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role}));
      localStorage.setItem('authToken', token);
      this.currentUser = {id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role};
      
      this.hideLoading();
      this.showToast('Registration successful!', 'success');
      
      setTimeout(() => {
        this.showMainApp();
      }, 500);
    }, 1000);
  }

  toggleAuthForm(e, form) {
    e.preventDefault();
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (form === 'register') {
      loginForm.classList.add('hidden');
      registerForm.classList.remove('hidden');
    } else {
      registerForm.classList.add('hidden');
      loginForm.classList.remove('hidden');
    }
  }

  logout() {
    localStorage.removeItem('authToken');
    this.currentUser = null;
    this.showAuthPage();
    this.showToast('Logged out successfully', 'info');
  }

  showAuthPage() {
    const authPage = document.getElementById('auth-page');
    const mainApp = document.getElementById('main-app');
    
    if (authPage) authPage.classList.remove('hidden');
    if (mainApp) mainApp.classList.add('hidden');
  }

  showMainApp() {
    const authPage = document.getElementById('auth-page');
    const mainApp = document.getElementById('main-app');
    
    if (authPage) authPage.classList.add('hidden');
    if (mainApp) mainApp.classList.remove('hidden');
    
    // Set user info in header
    const userName = document.getElementById('user-name');
    const userRole = document.getElementById('user-role');
    
    if (userName) userName.textContent = this.currentUser.name;
    if (userRole) userRole.textContent = this.currentUser.role;
    
    // Set role-based visibility
    const app = document.getElementById('app');
    if (app) app.setAttribute('data-role', this.currentUser.role);
    
    // Load current page
    this.loadPage(this.currentPage);
  }

  handleNavigation(e) {
    e.preventDefault();
    const page = e.target.getAttribute('data-page');
    if (page) {
      this.navigateToPage(page);
    }
  }

  navigateToPage(page) {
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    const targetLink = document.querySelector(`[data-page="${page}"]`);
    if (targetLink) {
      targetLink.classList.add('active');
    }
    
    this.currentPage = page;
    this.loadPage(page);
  }

  loadPage(page) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // Show target page
    const targetPage = document.getElementById(`${page}-page`);
    if (targetPage) {
      targetPage.classList.add('active');
    }
    
    // Load page-specific content
    switch(page) {
      case 'dashboard':
        this.loadDashboard();
        break;
      case 'tickets':
        this.loadTickets();
        break;
      case 'knowledge-base':
        this.loadKnowledgeBase();
        break;
      case 'agent-dashboard':
        this.loadAgentDashboard();
        break;
      case 'settings':
        this.loadSettings();
        break;
    }
  }

  loadDashboard() {
    this.updateDashboardStats();
    this.loadRecentActivity();
    this.loadCategoryChart();
  }

  updateDashboardStats() {
    const tickets = this.mockData.tickets;
    const totalTickets = tickets.length;
    const pendingTickets = tickets.filter(t => ['open', 'triaged', 'waiting_human'].includes(t.status)).length;
    const resolvedTickets = tickets.filter(t => ['resolved', 'closed'].includes(t.status)).length;
    const aiResolutionRate = totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0;

    const totalElement = document.getElementById('total-tickets');
    const pendingElement = document.getElementById('pending-tickets');
    const resolvedElement = document.getElementById('resolved-tickets');
    const aiRateElement = document.getElementById('ai-resolution-rate');

    if (totalElement) totalElement.textContent = totalTickets;
    if (pendingElement) pendingElement.textContent = pendingTickets;
    if (resolvedElement) resolvedElement.textContent = resolvedTickets;
    if (aiRateElement) aiRateElement.textContent = `${aiResolutionRate}%`;
  }

  loadRecentActivity() {
    const container = document.getElementById('recent-activity-list');
    if (!container) return;
    
    const recentLogs = this.mockData.auditLogs
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    container.innerHTML = recentLogs.map(log => `
      <div class="activity-item">
        <div class="activity-content">${this.formatActivityMessage(log)}</div>
        <div class="activity-time">${this.formatTime(log.timestamp)}</div>
      </div>
    `).join('');
  }

  formatActivityMessage(log) {
    const ticket = this.mockData.tickets.find(t => t.id === log.ticketId);
    const ticketTitle = ticket ? ticket.title : `Ticket #${log.ticketId}`;
    
    switch(log.action) {
      case 'TICKET_CREATED':
        return `New ticket created: ${ticketTitle}`;
      case 'AGENT_CLASSIFIED':
        return `AI classified ticket as ${log.meta.category}`;
      case 'KB_RETRIEVED':
        return `AI found ${log.meta.articleIds ? log.meta.articleIds.length : 0} relevant articles`;
      case 'DRAFT_GENERATED':
        return `AI generated reply draft`;
      case 'AUTO_CLOSED':
        return `Ticket auto-resolved by AI`;
      case 'ASSIGNED_TO_HUMAN':
        return `Ticket assigned to human agent`;
      case 'REPLY_SENT':
        return `Reply sent to customer`;
      default:
        return log.action.replace(/_/g, ' ').toLowerCase();
    }
  }

  loadCategoryChart() {
    const canvas = document.getElementById('categoryChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const tickets = this.mockData.tickets;
    
    const categories = ['billing', 'tech', 'shipping', 'other'];
    const data = categories.map(cat => 
      tickets.filter(t => t.category === cat).length
    );

    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: categories.map(cat => cat.charAt(0).toUpperCase() + cat.slice(1)),
        datasets: [{
          data: data,
          backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5'],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true
            }
          }
        }
      }
    });
  }

  loadTickets() {
    this.displayTickets(this.mockData.tickets);
  }

  displayTickets(tickets) {
    const container = document.getElementById('tickets-list');
    if (!container) return;
    
    // Filter by role - users only see their own tickets
    let filteredTickets = tickets;
    if (this.currentUser.role === 'user') {
      filteredTickets = tickets.filter(t => t.createdBy === this.currentUser.id);
    }
    
    if (filteredTickets.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="text-align: center; padding: 40px; color: var(--color-text-secondary);">
          <i class="fas fa-ticket-alt fa-3x" style="margin-bottom: 16px;"></i>
          <h3>No tickets found</h3>
          <p>No tickets match your current filters.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filteredTickets.map(ticket => {
      const creator = this.mockData.users.find(u => u.id === ticket.createdBy);
      const assignee = ticket.assignee ? this.mockData.users.find(u => u.id === ticket.assignee) : null;
      
      return `
        <div class="ticket-card" data-ticket-id="${ticket.id}">
          <div class="ticket-header">
            <h3 class="ticket-title">${ticket.title}</h3>
            <div class="ticket-meta">
              <span class="status-badge ${ticket.status}">${ticket.status.replace('_', ' ')}</span>
              <span class="category-badge ${ticket.category}">${ticket.category}</span>
              <span class="ticket-id">#${ticket.id}</span>
            </div>
          </div>
          <div class="ticket-description">${ticket.description}</div>
          <div class="ticket-footer">
            <span>Created by ${creator ? creator.name : 'Unknown'}</span>
            ${assignee ? `<span class="ticket-assignee">Assigned to ${assignee.name}</span>` : ''}
            <span class="ticket-date">${this.formatTime(ticket.createdAt)}</span>
          </div>
        </div>
      `;
    }).join('');

    // Add click handlers to tickets
    container.querySelectorAll('.ticket-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const ticketId = card.getAttribute('data-ticket-id');
        this.showTicketDetail(ticketId);
      });
    });
  }

  filterTickets() {
    const statusFilter = document.getElementById('status-filter');
    const categoryFilter = document.getElementById('category-filter');
    const searchTerm = document.getElementById('search-tickets');

    const statusValue = statusFilter ? statusFilter.value : '';
    const categoryValue = categoryFilter ? categoryFilter.value : '';
    const searchValue = searchTerm ? searchTerm.value.toLowerCase() : '';

    let filteredTickets = this.mockData.tickets;

    // Filter by role - users only see their own tickets
    if (this.currentUser.role === 'user') {
      filteredTickets = filteredTickets.filter(t => t.createdBy === this.currentUser.id);
    }

    if (statusValue) {
      filteredTickets = filteredTickets.filter(t => t.status === statusValue);
    }

    if (categoryValue) {
      filteredTickets = filteredTickets.filter(t => t.category === categoryValue);
    }

    if (searchValue) {
      filteredTickets = filteredTickets.filter(t => 
        t.title.toLowerCase().includes(searchValue) || 
        t.description.toLowerCase().includes(searchValue)
      );
    }

    this.displayTickets(filteredTickets);
  }

  showCreateTicketModal() {
    const modal = document.getElementById('create-ticket-modal');
    if (modal) {
      modal.classList.remove('hidden');
    }
  }

  async createTicket(e) {
    e.preventDefault();
    
    const titleElement = document.getElementById('ticket-title');
    const descriptionElement = document.getElementById('ticket-description');
    const categoryElement = document.getElementById('ticket-category');
    const attachmentsElement = document.getElementById('ticket-attachments');

    if (!titleElement || !descriptionElement) {
      this.showToast('Form elements not found', 'error');
      return;
    }

    const title = titleElement.value;
    const description = descriptionElement.value;
    const category = categoryElement ? categoryElement.value : 'other';
    const attachments = attachmentsElement ? attachmentsElement.value : '';

    if (!title || !description) {
      this.showToast('Please fill in all required fields', 'error');
      return;
    }

    this.showLoading();

    setTimeout(async () => {
      const ticketId = String(this.mockData.tickets.length + 1);
      const newTicket = {
        id: ticketId,
        title,
        description,
        category,
        status: 'open',
        createdBy: this.currentUser.id,
        createdAt: new Date().toISOString(),
        replies: [],
        attachments: attachments ? [attachments] : []
      };

      this.mockData.tickets.push(newTicket);
      
      // Add audit log
      this.addAuditLog(ticketId, 'system', 'TICKET_CREATED', {});
      
      this.saveData();
      
      // Trigger agentic triage
      await this.performAgenticTriage(ticketId);
      
      this.hideModal('create-ticket-modal');
      this.loadTickets();
      this.updateDashboardStats();
      this.showToast('Ticket created successfully!', 'success');
      this.hideLoading();
      
      // Reset form
      const form = document.getElementById('create-ticket-form');
      if (form) form.reset();
    }, 1000);
  }

  async performAgenticTriage(ticketId) {
    const ticket = this.mockData.tickets.find(t => t.id === ticketId);
    const traceId = `trace-${Date.now()}`;
    
    // Step 1: Classification
    await this.simulateDelay(1000);
    const classification = this.classifyTicket(ticket);
    this.addAuditLog(ticketId, 'system', 'AGENT_CLASSIFIED', classification, traceId);
    
    // Step 2: KB Retrieval
    await this.simulateDelay(1500);
    const kbResults = this.retrieveKBArticles(ticket);
    this.addAuditLog(ticketId, 'system', 'KB_RETRIEVED', {articleIds: kbResults.map(r => r.id), scores: kbResults.map(r => r.score)}, traceId);
    
    // Step 3: Draft Reply
    await this.simulateDelay(2000);
    const draftReply = this.generateReply(ticket, kbResults, classification);
    this.addAuditLog(ticketId, 'system', 'DRAFT_GENERATED', {length: draftReply.draftReply.length}, traceId);
    
    // Step 4: Create Agent Suggestion
    const suggestionId = String(this.mockData.agentSuggestions.length + 1);
    const suggestion = {
      id: suggestionId,
      ticketId: ticketId,
      predictedCategory: classification.predictedCategory,
      articleIds: kbResults.map(r => r.id),
      draftReply: draftReply.draftReply,
      confidence: draftReply.confidence,
      autoClosed: false,
      createdAt: new Date().toISOString(),
      traceId: traceId
    };
    
    this.mockData.agentSuggestions.push(suggestion);
    
    // Step 5: Decision
    const config = this.mockData.config;
    if (config.autoCloseEnabled && draftReply.confidence >= config.confidenceThreshold) {
      // Auto-close ticket
      ticket.status = 'resolved';
      ticket.replies.push({
        id: String(Date.now()),
        sender: 'system',
        message: draftReply.draftReply,
        timestamp: new Date().toISOString(),
        isAI: true
      });
      suggestion.autoClosed = true;
      
      this.addAuditLog(ticketId, 'system', 'AUTO_CLOSED', {confidence: draftReply.confidence}, traceId);
      this.addNotification('Ticket auto-resolved', `Ticket #${ticketId} was automatically resolved by AI agent.`, 'success');
    } else {
      // Assign to human
      ticket.status = 'waiting_human';
      const availableAgent = this.mockData.users.find(u => u.role === 'agent');
      if (availableAgent) {
        ticket.assignee = availableAgent.id;
        this.addAuditLog(ticketId, 'system', 'ASSIGNED_TO_HUMAN', {assignee: availableAgent.id}, traceId);
      }
      
      this.addNotification('New ticket needs review', `Ticket #${ticketId} requires human attention.`, 'info');
    }
    
    this.saveData();
  }

  classifyTicket(ticket) {
    const text = `${ticket.title} ${ticket.description}`.toLowerCase();
    
    const keywords = {
      billing: ['refund', 'invoice', 'payment', 'charge', 'bill', 'money', 'cost', 'price'],
      tech: ['error', 'bug', 'crash', 'not working', 'broken', 'login', 'password', '500', 'technical'],
      shipping: ['delivery', 'package', 'tracking', 'shipping', 'shipment', 'arrived', 'delayed']
    };
    
    let maxScore = 0;
    let category = 'other';
    
    for (const [cat, words] of Object.entries(keywords)) {
      const score = words.filter(word => text.includes(word)).length;
      if (score > maxScore) {
        maxScore = score;
        category = cat;
      }
    }
    
    const confidence = Math.min(0.3 + (maxScore * 0.15), 0.9);
    
    return {
      predictedCategory: category,
      confidence: confidence
    };
  }

  retrieveKBArticles(ticket) {
    const text = `${ticket.title} ${ticket.description}`.toLowerCase();
    const articles = this.mockData.kbArticles.filter(a => a.status === 'published');
    
    const scored = articles.map(article => {
      const articleText = `${article.title} ${article.body} ${article.tags.join(' ')}`.toLowerCase();
      let score = 0;
      
      // Simple keyword matching
      const words = text.split(' ');
      words.forEach(word => {
        if (word.length > 3 && articleText.includes(word)) {
          score += 1;
        }
      });
      
      // Bonus for tag matches
      article.tags.forEach(tag => {
        if (text.includes(tag)) {
          score += 2;
        }
      });
      
      return { ...article, score: Math.min(score / 10, 1.0) };
    });
    
    return scored
      .filter(a => a.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }

  generateReply(ticket, kbArticles, classification) {
    const templates = {
      billing: "Thank you for contacting us about your billing inquiry. ",
      tech: "I understand you're experiencing technical difficulties. ",
      shipping: "I can help you with your shipping inquiry. ",
      other: "Thank you for reaching out to us. "
    };
    
    let reply = templates[classification.predictedCategory] || templates.other;
    
    if (kbArticles.length > 0) {
      reply += "I've found some helpful resources that should address your concern:\n\n";
      kbArticles.forEach((article, index) => {
        reply += `${index + 1}. ${article.title}\n`;
      });
      reply += "\nPlease review these articles and let us know if you need any additional assistance.";
    } else {
      reply += "I'll make sure our team reviews your request and gets back to you soon.";
    }
    
    // Calculate confidence based on classification confidence and KB matches
    let confidence = classification.confidence;
    if (kbArticles.length > 0) {
      const avgKBScore = kbArticles.reduce((sum, a) => sum + a.score, 0) / kbArticles.length;
      confidence = Math.min(confidence + (avgKBScore * 0.3), 0.95);
    }
    
    return {
      draftReply: reply,
      confidence: confidence,
      citations: kbArticles.map(a => a.id)
    };
  }

  showTicketDetail(ticketId) {
    const ticket = this.mockData.tickets.find(t => t.id === ticketId);
    if (!ticket) return;
    
    // Update modal content
    const titleElement = document.getElementById('ticket-detail-title');
    const idElement = document.getElementById('ticket-detail-id');
    const statusElement = document.getElementById('ticket-detail-status');
    const categoryElement = document.getElementById('ticket-detail-category');
    const descriptionElement = document.getElementById('ticket-detail-description');

    if (titleElement) titleElement.textContent = ticket.title;
    if (idElement) idElement.textContent = `#${ticket.id}`;
    if (statusElement) {
      statusElement.textContent = ticket.status.replace('_', ' ');
      statusElement.className = `status-badge ${ticket.status}`;
    }
    if (categoryElement) {
      categoryElement.textContent = ticket.category;
      categoryElement.className = `category-badge ${ticket.category}`;
    }
    if (descriptionElement) descriptionElement.textContent = ticket.description;
    
    // Load content
    this.loadTicketConversation(ticketId);
    this.loadTicketSuggestions(ticketId);
    this.loadTicketAuditLog(ticketId);
    
    // Show modal
    const modal = document.getElementById('ticket-detail-modal');
    if (modal) {
      modal.classList.remove('hidden');
    }
  }

  loadTicketConversation(ticketId) {
    const ticket = this.mockData.tickets.find(t => t.id === ticketId);
    const container = document.getElementById('ticket-conversation');
    if (!container) return;
    
    if (!ticket.replies || ticket.replies.length === 0) {
      container.innerHTML = '<p style="color: var(--color-text-secondary); text-align: center;">No replies yet.</p>';
      return;
    }
    
    container.innerHTML = ticket.replies.map(reply => {
      const sender = this.mockData.users.find(u => u.id === reply.sender) || {name: 'AI Agent'};
      return `
        <div class="message ${reply.isAI ? 'agent' : 'user'}">
          <div class="message-content">${reply.message}</div>
          <div class="message-meta">
            ${sender.name} • ${this.formatTime(reply.timestamp)}
          </div>
        </div>
      `;
    }).join('');
  }

  loadTicketSuggestions(ticketId) {
    const suggestions = this.mockData.agentSuggestions.filter(s => s.ticketId === ticketId);
    const container = document.getElementById('ai-suggestions');
    if (!container) return;
    
    if (suggestions.length === 0) {
      container.innerHTML = '<p style="color: var(--color-text-secondary);">No AI suggestions available.</p>';
      return;
    }
    
    container.innerHTML = suggestions.map(suggestion => `
      <div class="ai-suggestion">
        <div class="suggestion-header">
          <h4>AI Suggestion</h4>
          <span class="confidence-score">${Math.round(suggestion.confidence * 100)}% confidence</span>
        </div>
        <div class="suggestion-content">${suggestion.draftReply}</div>
        <div class="suggestion-citations">
          <strong>Referenced Articles:</strong>
          ${suggestion.articleIds.map(id => {
            const article = this.mockData.kbArticles.find(a => a.id === id);
            return article ? article.title : `Article #${id}`;
          }).join(', ')}
        </div>
        ${this.currentUser.role === 'agent' && !suggestion.autoClosed ? `
          <div class="suggestion-actions">
            <button class="btn btn--sm btn--primary" onclick="app.useAISuggestion('${suggestion.id}')">Use This Reply</button>
            <button class="btn btn--sm btn--outline" onclick="app.editAISuggestion('${suggestion.id}')">Edit & Send</button>
          </div>
        ` : ''}
      </div>
    `).join('');
  }

  loadTicketAuditLog(ticketId) {
    const logs = this.mockData.auditLogs.filter(l => l.ticketId === ticketId);
    const container = document.getElementById('audit-log');
    if (!container) return;
    
    container.innerHTML = logs.map(log => `
      <div class="audit-entry">
        <div class="audit-action">${log.action.replace(/_/g, ' ')}</div>
        <div class="audit-details">${this.formatAuditDetails(log)}</div>
        <div class="audit-time">${this.formatTime(log.timestamp)} | Trace: ${log.traceId || 'N/A'}</div>
      </div>
    `).join('');
  }

  formatAuditDetails(log) {
    if (!log.meta || Object.keys(log.meta).length === 0) {
      return 'No additional details';
    }
    
    return Object.entries(log.meta).map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}: ${value.join(', ')}`;
      }
      return `${key}: ${value}`;
    }).join(' | ');
  }

  useAISuggestion(suggestionId) {
    const suggestion = this.mockData.agentSuggestions.find(s => s.id === suggestionId);
    if (!suggestion) return;
    
    const replyMessage = document.getElementById('reply-message');
    if (replyMessage) {
      replyMessage.value = suggestion.draftReply;
    }
    
    const conversationTab = document.querySelector('[data-tab="conversation"]');
    if (conversationTab) {
      conversationTab.click();
    }
  }

  editAISuggestion(suggestionId) {
    const suggestion = this.mockData.agentSuggestions.find(s => s.id === suggestionId);
    if (!suggestion) return;
    
    const replyMessage = document.getElementById('reply-message');
    if (replyMessage) {
      replyMessage.value = suggestion.draftReply;
    }
    
    const conversationTab = document.querySelector('[data-tab="conversation"]');
    if (conversationTab) {
      conversationTab.click();
    }
  }

  async sendReply(e) {
    e.preventDefault();
    
    const messageElement = document.getElementById('reply-message');
    const statusElement = document.getElementById('reply-status');
    
    if (!messageElement) return;
    
    const message = messageElement.value.trim();
    const newStatus = statusElement ? statusElement.value : '';
    
    if (!message) {
      this.showToast('Please enter a reply message', 'error');
      return;
    }
    
    const ticketIdElement = document.getElementById('ticket-detail-id');
    if (!ticketIdElement) return;
    
    const ticketId = ticketIdElement.textContent.replace('#', '');
    const ticket = this.mockData.tickets.find(t => t.id === ticketId);
    
    this.showLoading();
    
    setTimeout(() => {
      // Add reply
      const reply = {
        id: String(Date.now()),
        sender: this.currentUser.id,
        message: message,
        timestamp: new Date().toISOString(),
        isAI: false
      };
      
      ticket.replies.push(reply);
      
      // Update status if specified
      if (newStatus) {
        ticket.status = newStatus;
      }
      
      // Add audit log
      this.addAuditLog(ticketId, 'agent', 'REPLY_SENT', {status: newStatus || ticket.status});
      
      this.saveData();
      
      // Refresh conversation
      this.loadTicketConversation(ticketId);
      
      // Clear form
      const replyForm = document.getElementById('reply-form');
      if (replyForm) replyForm.reset();
      
      this.showToast('Reply sent successfully!', 'success');
      this.hideLoading();
      
      // Update ticket list if visible
      if (this.currentPage === 'tickets') {
        this.loadTickets();
      }
    }, 1000);
  }

  switchTab(e) {
    const tabName = e.target.getAttribute('data-tab');
    if (!tabName) return;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    const targetTab = document.getElementById(`${tabName}-tab`);
    if (targetTab) {
      targetTab.classList.add('active');
    }
  }

  loadKnowledgeBase() {
    this.displayKBArticles(this.mockData.kbArticles);
  }

  displayKBArticles(articles) {
    const container = document.getElementById('kb-articles-list');
    if (!container) return;
    
    if (articles.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="text-align: center; padding: 40px; color: var(--color-text-secondary);">
          <i class="fas fa-book fa-3x" style="margin-bottom: 16px;"></i>
          <h3>No articles found</h3>
          <p>No articles match your search criteria.</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = articles.map(article => `
      <div class="kb-article">
        <div class="article-header">
          <h3 class="article-title">${article.title}</h3>
          <span class="article-status ${article.status}">${article.status}</span>
        </div>
        <div class="article-preview">${article.body.substring(0, 150)}...</div>
        <div class="article-tags">
          ${article.tags.map(tag => `<span class="article-tag">${tag}</span>`).join('')}
        </div>
        <div class="article-actions">
          <button class="btn btn--sm btn--outline" onclick="app.editArticle('${article.id}')">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="btn btn--sm btn--outline" onclick="app.deleteArticle('${article.id}')">
            <i class="fas fa-trash"></i> Delete
          </button>
        </div>
      </div>
    `).join('');
  }

  filterKBArticles() {
    const searchElement = document.getElementById('search-kb');
    const searchTerm = searchElement ? searchElement.value.toLowerCase() : '';
    
    let filteredArticles = this.mockData.kbArticles;
    
    if (searchTerm) {
      filteredArticles = filteredArticles.filter(article =>
        article.title.toLowerCase().includes(searchTerm) ||
        article.body.toLowerCase().includes(searchTerm) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }
    
    this.displayKBArticles(filteredArticles);
  }

  showCreateArticleModal() {
    const modalTitle = document.getElementById('article-modal-title');
    const form = document.getElementById('article-form');
    const modal = document.getElementById('article-modal');
    
    if (modalTitle) modalTitle.textContent = 'Create Article';
    if (form) form.reset();
    if (modal) modal.classList.remove('hidden');
  }

  editArticle(articleId) {
    const article = this.mockData.kbArticles.find(a => a.id === articleId);
    if (!article) return;
    
    const modalTitle = document.getElementById('article-modal-title');
    const titleField = document.getElementById('article-title');
    const bodyField = document.getElementById('article-body');
    const tagsField = document.getElementById('article-tags');
    const statusField = document.getElementById('article-status');
    const form = document.getElementById('article-form');
    const modal = document.getElementById('article-modal');
    
    if (modalTitle) modalTitle.textContent = 'Edit Article';
    if (titleField) titleField.value = article.title;
    if (bodyField) bodyField.value = article.body;
    if (tagsField) tagsField.value = article.tags.join(', ');
    if (statusField) statusField.value = article.status;
    if (form) form.setAttribute('data-article-id', articleId);
    if (modal) modal.classList.remove('hidden');
  }

  async saveArticle(e) {
    e.preventDefault();
    
    const titleElement = document.getElementById('article-title');
    const bodyElement = document.getElementById('article-body');
    const tagsElement = document.getElementById('article-tags');
    const statusElement = document.getElementById('article-status');
    const form = document.getElementById('article-form');
    
    if (!titleElement || !bodyElement) return;
    
    const title = titleElement.value;
    const body = bodyElement.value;
    const tags = tagsElement ? tagsElement.value.split(',').map(t => t.trim()).filter(t => t) : [];
    const status = statusElement ? statusElement.value : 'draft';
    const articleId = form ? form.getAttribute('data-article-id') : null;
    
    if (!title || !body) {
      this.showToast('Please fill in all required fields', 'error');
      return;
    }
    
    this.showLoading();
    
    setTimeout(() => {
      if (articleId) {
        // Update existing article
        const article = this.mockData.kbArticles.find(a => a.id === articleId);
        if (article) {
          article.title = title;
          article.body = body;
          article.tags = tags;
          article.status = status;
          article.updatedAt = new Date().toISOString();
        }
        this.showToast('Article updated successfully!', 'success');
      } else {
        // Create new article
        const newArticle = {
          id: String(this.mockData.kbArticles.length + 1),
          title,
          body,
          tags,
          status,
          updatedAt: new Date().toISOString()
        };
        this.mockData.kbArticles.push(newArticle);
        this.showToast('Article created successfully!', 'success');
      }
      
      this.saveData();
      this.hideModal('article-modal');
      this.loadKnowledgeBase();
      this.hideLoading();
      
      // Clear form
      if (form) {
        form.reset();
        form.removeAttribute('data-article-id');
      }
    }, 800);
  }

  deleteArticle(articleId) {
    if (confirm('Are you sure you want to delete this article?')) {
      this.mockData.kbArticles = this.mockData.kbArticles.filter(a => a.id !== articleId);
      this.saveData();
      this.loadKnowledgeBase();
      this.showToast('Article deleted successfully!', 'success');
    }
  }

  loadAgentDashboard() {
    this.updateAgentStats();
    this.loadSuggestionsQueue();
  }

  updateAgentStats() {
    const suggestions = this.mockData.agentSuggestions.filter(s => !s.autoClosed);
    const assignedTickets = this.mockData.tickets.filter(t => t.assignee === this.currentUser.id);
    const resolvedToday = this.mockData.tickets.filter(t => 
      t.assignee === this.currentUser.id && 
      ['resolved', 'closed'].includes(t.status) &&
      new Date(t.updatedAt || t.createdAt).toDateString() === new Date().toDateString()
    );
    
    const pendingSuggestionsElement = document.getElementById('pending-suggestions');
    const assignedTicketsElement = document.getElementById('assigned-tickets');
    const resolvedTodayElement = document.getElementById('resolved-today');
    
    if (pendingSuggestionsElement) pendingSuggestionsElement.textContent = suggestions.length;
    if (assignedTicketsElement) assignedTicketsElement.textContent = assignedTickets.length;
    if (resolvedTodayElement) resolvedTodayElement.textContent = resolvedToday.length;
  }

  loadSuggestionsQueue() {
    const suggestions = this.mockData.agentSuggestions.filter(s => !s.autoClosed);
    const container = document.getElementById('suggestions-queue-list');
    if (!container) return;
    
    if (suggestions.length === 0) {
      container.innerHTML = '<p style="color: var(--color-text-secondary);">No pending suggestions.</p>';
      return;
    }
    
    container.innerHTML = suggestions.map(suggestion => {
      const ticket = this.mockData.tickets.find(t => t.id === suggestion.ticketId);
      return `
        <div class="suggestion-card" onclick="app.showTicketDetail('${suggestion.ticketId}')">
          <h4>${ticket ? ticket.title : `Ticket #${suggestion.ticketId}`}</h4>
          <p>Category: ${suggestion.predictedCategory} | Confidence: ${Math.round(suggestion.confidence * 100)}%</p>
          <div style="margin-top: 8px; font-size: 14px; color: var(--color-text-secondary);">
            ${suggestion.draftReply.substring(0, 100)}...
          </div>
        </div>
      `;
    }).join('');
  }

  loadSettings() {
    const config = this.mockData.config;
    
    const autoCloseElement = document.getElementById('auto-close-enabled');
    const thresholdElement = document.getElementById('confidence-threshold');
    const thresholdValueElement = document.getElementById('threshold-value');
    const slaElement = document.getElementById('sla-hours');
    
    if (autoCloseElement) autoCloseElement.checked = config.autoCloseEnabled;
    if (thresholdElement) thresholdElement.value = config.confidenceThreshold;
    if (thresholdValueElement) thresholdValueElement.textContent = config.confidenceThreshold.toFixed(2);
    if (slaElement) slaElement.value = config.slaHours;
  }

  async saveSettings(e) {
    e.preventDefault();
    
    const autoCloseElement = document.getElementById('auto-close-enabled');
    const thresholdElement = document.getElementById('confidence-threshold');
    const slaElement = document.getElementById('sla-hours');
    
    const autoCloseEnabled = autoCloseElement ? autoCloseElement.checked : true;
    const confidenceThreshold = thresholdElement ? parseFloat(thresholdElement.value) : 0.78;
    const slaHours = slaElement ? parseInt(slaElement.value) : 24;
    
    this.showLoading();
    
    setTimeout(() => {
      this.mockData.config = {
        autoCloseEnabled,
        confidenceThreshold,
        slaHours
      };
      
      this.saveData();
      this.showToast('Settings saved successfully!', 'success');
      this.hideLoading();
    }, 500);
  }

  // Utility functions
  addAuditLog(ticketId, actor, action, meta = {}, traceId = null) {
    const log = {
      id: String(this.mockData.auditLogs.length + 1),
      ticketId,
      traceId: traceId || `trace-${Date.now()}`,
      actor,
      action,
      meta,
      timestamp: new Date().toISOString()
    };
    
    this.mockData.auditLogs.push(log);
  }

  addNotification(title, message, type = 'info') {
    this.notifications.push({
      id: Date.now(),
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false
    });
    
    this.updateNotificationCount();
    this.showToast(title, type);
  }

  updateNotificationCount() {
    const unreadCount = this.notifications.filter(n => !n.read).length;
    const countElement = document.getElementById('notification-count');
    if (countElement) {
      countElement.textContent = unreadCount;
      countElement.style.display = unreadCount > 0 ? 'block' : 'none';
    }
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div style="font-weight: 500; margin-bottom: 4px;">${this.getToastTitle(type)}</div>
      <div>${message}</div>
    `;
    
    const container = document.getElementById('toast-container');
    if (container) {
      container.appendChild(toast);
      
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 4000);
    }
  }

  getToastTitle(type) {
    const titles = {
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Info'
    };
    return titles[type] || 'Notification';
  }

  showLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.classList.remove('hidden');
    }
  }

  hideLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.classList.add('hidden');
    }
  }

  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  formatTime(timestamp) {
    return new Date(timestamp).toLocaleString();
  }

  simulateDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new SmartHelpdeskApp();
});