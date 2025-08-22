// Smart Helpdesk Application - Fixed Authentication and Loading
class SmartHelpdeskApp {
  constructor() {
    this.currentUser = null;
    this.currentPage = 'dashboard';
    this.notifications = [];
    this.loadingTimeouts = new Set();
    this.mockData = this.initializeMockData();
    this.init();
  }

  initializeMockData() {
    const defaultData = {
      users: [
        {"id": "1", "email": "admin@helpdesk.com", "name": "Admin User", "role": "admin", "password": "admin123"},
        {"id": "2", "email": "agent@helpdesk.com", "name": "Support Agent", "role": "agent", "password": "agent123"},
        {"id": "3", "email": "user@helpdesk.com", "name": "John Customer", "role": "user", "password": "user123"}
      ],
      tickets: [
        {"id": "1", "title": "Refund Request", "description": "Need refund for double charge on order #1234", "category": "billing", "status": "triaged", "createdBy": "3", "assignee": "2", "createdAt": "2024-08-20T09:00:00Z", "replies": [{"id": "1", "sender": "system", "message": "I understand you were charged twice for order #1234. I'll process your refund immediately. Please refer to our payment policy for details.", "timestamp": "2024-08-20T09:01:00Z", "isAI": true}]},
        {"id": "2", "title": "Login Error", "description": "Getting 500 error when trying to login", "category": "tech", "status": "open", "createdBy": "3", "createdAt": "2024-08-20T09:15:00Z", "replies": []},
        {"id": "3", "title": "Package Delay", "description": "My package is delayed by 5 days", "category": "shipping", "status": "waiting_human", "createdBy": "3", "assignee": "2", "createdAt": "2024-08-20T09:30:00Z", "replies": []}
      ],
      kbArticles: [
        {"id": "1", "title": "Payment Policy", "body": "Our payment policy covers billing, refunds, and payment methods. We accept all major credit cards and PayPal. Refunds are processed within 3-5 business days.", "tags": ["billing", "payment"], "status": "published", "updatedAt": "2024-08-20T08:00:00Z"},
        {"id": "2", "title": "Technical Troubleshooting", "body": "Steps to resolve common technical issues including login problems: 1. Clear browser cache 2. Try incognito mode 3. Check internet connection 4. Contact support if issues persist.", "tags": ["tech", "support"], "status": "published", "updatedAt": "2024-08-20T08:00:00Z"},
        {"id": "3", "title": "Shipping Information", "body": "Tracking and delivery information for all orders. You can track your shipment using the tracking number provided in your order confirmation email.", "tags": ["shipping", "delivery"], "status": "published", "updatedAt": "2024-08-20T08:00:00Z"}
      ],
      agentSuggestions: [
        {"id": "1", "ticketId": "1", "predictedCategory": "billing", "articleIds": ["1"], "draftReply": "I can help you with the double charge issue. Please check our payment policy. We'll process your refund within 3-5 business days.", "confidence": 0.92, "autoClosed": false, "createdAt": "2024-08-20T09:01:00Z"}
      ],
      auditLogs: [
        {"id": "1", "ticketId": "1", "traceId": "trace-001", "actor": "system", "action": "TICKET_CREATED", "timestamp": "2024-08-20T09:00:00Z", "meta": {}},
        {"id": "2", "ticketId": "1", "traceId": "trace-001", "actor": "system", "action": "AGENT_CLASSIFIED", "meta": {"category": "billing", "confidence": 0.92}, "timestamp": "2024-08-20T09:00:05Z"},
        {"id": "3", "ticketId": "1", "traceId": "trace-001", "actor": "system", "action": "AUTO_CLOSED", "meta": {"confidence": 0.92}, "timestamp": "2024-08-20T09:01:00Z"}
      ],
      config: {
        autoCloseEnabled: true,
        confidenceThreshold: 0.78,
        slaHours: 24
      }
    };

    try {
      const stored = localStorage.getItem('helpdeskData');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load data from localStorage, using defaults');
    }
    
    this.saveData(defaultData);
    return defaultData;
  }

  saveData(data = this.mockData) {
    try {
      localStorage.setItem('helpdeskData', JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save data to localStorage');
    }
  }

  init() {
    // Ensure loading overlay is hidden immediately
    this.hideLoading();
    
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
    // Demo login buttons - set up immediately
    this.setupDemoLoginButtons();
    
    // Authentication forms
    this.setupAuthForms();
    
    // Skip loading button
    const skipLoadingBtn = document.getElementById('skip-loading');
    if (skipLoadingBtn) {
      skipLoadingBtn.addEventListener('click', () => this.skipLoading());
    }

    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => this.handleNavigation(e));
    });

    this.setupModalEventListeners();
    this.setupFilterEventListeners();
    this.setupFormEventListeners();
  }

  setupDemoLoginButtons() {
    const demoLogins = [
      { id: 'demo-admin-login', email: 'admin@helpdesk.com', password: 'admin123' },
      { id: 'demo-agent-login', email: 'agent@helpdesk.com', password: 'agent123' },
      { id: 'demo-user-login', email: 'user@helpdesk.com', password: 'user123' }
    ];

    demoLogins.forEach(demo => {
      const btn = document.getElementById(demo.id);
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          this.demoLogin(demo.email, demo.password);
        });
      }
    });
  }

  setupAuthForms() {
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
      showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleAuthForm(e, 'register');
      });
    }
    if (showLoginLink) {
      showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleAuthForm(e, 'login');
      });
    }
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
      });
    }
  }

  demoLogin(email, password) {
    // Find user instantly
    const user = this.mockData.users.find(u => u.email === email && u.password === password);
    
    if (user) {
      // Create token and set current user
      const token = btoa(JSON.stringify({
        id: user.id, 
        email: user.email, 
        name: user.name, 
        role: user.role
      }));
      
      localStorage.setItem('authToken', token);
      this.currentUser = {
        id: user.id, 
        email: user.email, 
        name: user.name, 
        role: user.role
      };
      
      // Show success and redirect immediately
      this.showToast(`Logged in as ${user.name}`, 'success');
      this.showMainApp();
    } else {
      this.showToast('Demo login failed', 'error');
    }
  }

  setupModalEventListeners() {
    // Create ticket button
    const createTicketBtn = document.getElementById('create-ticket-btn');
    if (createTicketBtn) {
      createTicketBtn.addEventListener('click', () => this.showCreateTicketModal());
    }

    // Create article button
    const createArticleBtn = document.getElementById('create-article-btn');
    if (createArticleBtn) {
      createArticleBtn.addEventListener('click', () => this.showCreateArticleModal());
    }

    // Modal close buttons and forms
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
        return;
      } catch (e) {
        localStorage.removeItem('authToken');
      }
    }
    this.showAuthPage();
  }

  handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email')?.value;
    const password = document.getElementById('login-password')?.value;

    if (!email || !password) {
      this.showToast('Please enter both email and password', 'error');
      return;
    }

    // Find user and authenticate immediately
    const user = this.mockData.users.find(u => u.email === email && u.password === password);
    
    if (user) {
      const token = btoa(JSON.stringify({
        id: user.id, 
        email: user.email, 
        name: user.name, 
        role: user.role
      }));
      
      localStorage.setItem('authToken', token);
      this.currentUser = {
        id: user.id, 
        email: user.email, 
        name: user.name, 
        role: user.role
      };
      
      this.showToast('Login successful!', 'success');
      this.showMainApp();
    } else {
      this.showToast('Invalid credentials', 'error');
    }
  }

  handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('register-name')?.value;
    const email = document.getElementById('register-email')?.value;
    const password = document.getElementById('register-password')?.value;

    if (!name || !email || !password) {
      this.showToast('Please fill in all fields', 'error');
      return;
    }

    // Check if user already exists
    if (this.mockData.users.find(u => u.email === email)) {
      this.showToast('User already exists', 'error');
      return;
    }

    const newUser = {
      id: String(this.mockData.users.length + 1),
      name, email, password,
      role: 'user'
    };

    this.mockData.users.push(newUser);
    this.saveData();

    const token = btoa(JSON.stringify({
      id: newUser.id, 
      email: newUser.email, 
      name: newUser.name, 
      role: newUser.role
    }));
    
    localStorage.setItem('authToken', token);
    this.currentUser = {
      id: newUser.id, 
      email: newUser.email, 
      name: newUser.name, 
      role: newUser.role
    };
    
    this.showToast('Registration successful!', 'success');
    this.showMainApp();
  }

  toggleAuthForm(e, form) {
    e.preventDefault();
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (form === 'register') {
      loginForm?.classList.add('hidden');
      registerForm?.classList.remove('hidden');
    } else {
      registerForm?.classList.add('hidden');
      loginForm?.classList.remove('hidden');
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
    
    authPage?.classList.remove('hidden');
    mainApp?.classList.add('hidden');
  }

  showMainApp() {
    const authPage = document.getElementById('auth-page');
    const mainApp = document.getElementById('main-app');
    
    authPage?.classList.add('hidden');
    mainApp?.classList.remove('hidden');
    
    // Set user info in header
    const userName = document.getElementById('user-name');
    const userRole = document.getElementById('user-role');
    
    if (userName) userName.textContent = this.currentUser.name;
    if (userRole) userRole.textContent = this.currentUser.role;
    
    // Set role-based visibility
    const app = document.getElementById('app');
    if (app) app.setAttribute('data-role', this.currentUser.role);
    
    // Load current page immediately
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
    
    // Load page-specific content instantly
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
    const aiResolutionRate = totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 85;

    const totalEl = document.getElementById('total-tickets');
    const pendingEl = document.getElementById('pending-tickets');
    const resolvedEl = document.getElementById('resolved-tickets');
    const aiRateEl = document.getElementById('ai-resolution-rate');

    if (totalEl) totalEl.textContent = totalTickets;
    if (pendingEl) pendingEl.textContent = pendingTickets;
    if (resolvedEl) resolvedEl.textContent = resolvedTickets;
    if (aiRateEl) aiRateEl.textContent = `${aiResolutionRate}%`;
  }

  loadRecentActivity() {
    const container = document.getElementById('recent-activity-list');
    if (!container) return;
    
    const recentLogs = this.mockData.auditLogs
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 8);

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
        return `AI classified ticket as ${log.meta.category || 'unknown'}`;
      case 'KB_RETRIEVED':
        return `AI found ${log.meta.articleIds?.length || 0} relevant articles`;
      case 'AUTO_CLOSED':
        return `Ticket auto-resolved by AI`;
      case 'REPLY_SENT':
        return `Reply sent to customer`;
      default:
        return log.action.replace(/_/g, ' ').toLowerCase();
    }
  }

  loadCategoryChart() {
    const canvas = document.getElementById('categoryChart');
    if (!canvas) return;
    
    // Clear any existing chart
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
      existingChart.destroy();
    }
    
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
          borderColor: 'var(--color-surface)'
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
    
    let filteredTickets = tickets;
    if (this.currentUser.role === 'user') {
      filteredTickets = tickets.filter(t => t.createdBy === this.currentUser.id);
    }
    
    if (filteredTickets.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-ticket-alt fa-3x"></i>
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
            <span>Created by ${creator?.name || 'Unknown'}</span>
            ${assignee ? `<span class="ticket-assignee">Assigned to ${assignee.name}</span>` : ''}
            <span class="ticket-date">${this.formatTime(ticket.createdAt)}</span>
          </div>
        </div>
      `;
    }).join('');

    // Add click handlers
    container.querySelectorAll('.ticket-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const ticketId = card.getAttribute('data-ticket-id');
        this.showTicketDetail(ticketId);
      });
    });
  }

  filterTickets() {
    const statusValue = document.getElementById('status-filter')?.value || '';
    const categoryValue = document.getElementById('category-filter')?.value || '';
    const searchValue = document.getElementById('search-tickets')?.value.toLowerCase() || '';

    let filteredTickets = this.mockData.tickets;

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
      
      // Focus first input
      const titleInput = document.getElementById('ticket-title');
      setTimeout(() => titleInput?.focus(), 100);
    }
  }

  createTicket(e) {
    e.preventDefault();
    
    const titleElement = document.getElementById('ticket-title');
    const descriptionElement = document.getElementById('ticket-description');
    const categoryElement = document.getElementById('ticket-category');

    if (!titleElement || !descriptionElement) {
      this.showToast('Form elements not found', 'error');
      return;
    }

    const title = titleElement.value.trim();
    const description = descriptionElement.value.trim();
    const category = categoryElement?.value || 'other';

    if (!title || !description) {
      this.showToast('Please fill in all required fields', 'error');
      return;
    }

    this.showLoading();
    
    // Simulate AI processing with timeout
    setTimeout(() => {
      const ticketId = String(this.mockData.tickets.length + 1);
      const newTicket = {
        id: ticketId,
        title,
        description,
        category,
        status: 'triaged',
        createdBy: this.currentUser.id,
        createdAt: new Date().toISOString(),
        replies: []
      };

      // Generate AI response
      const aiResponse = this.generateQuickAIResponse(newTicket);
      newTicket.replies.push({
        id: String(Date.now()),
        sender: 'system',
        message: aiResponse,
        timestamp: new Date().toISOString(),
        isAI: true
      });

      this.mockData.tickets.push(newTicket);
      this.saveData();
      
      this.hideModal('create-ticket-modal');
      this.hideLoading();
      this.showToast('Ticket created and processed by AI!', 'success');
      
      if (this.currentPage === 'tickets') {
        this.loadTickets();
      }
      this.updateDashboardStats();
      
      // Reset form
      const form = document.getElementById('create-ticket-form');
      form?.reset();
    }, 1500);
  }

  generateQuickAIResponse(ticket) {
    const text = `${ticket.title} ${ticket.description}`.toLowerCase();
    
    if (text.includes('refund') || text.includes('charge') || text.includes('billing')) {
      return "Thank you for contacting us about your billing inquiry. I understand your concern about the charges. Our billing team will review your account and process any necessary refunds within 3-5 business days. Please refer to our payment policy for more details.";
    } else if (text.includes('error') || text.includes('login') || text.includes('technical')) {
      return "I understand you're experiencing technical difficulties. Please try these troubleshooting steps: 1. Clear your browser cache 2. Try using incognito mode 3. Check your internet connection. If the issue persists, our technical team will investigate further.";
    } else if (text.includes('shipping') || text.includes('delivery') || text.includes('package')) {
      return "I can help you with your shipping inquiry. Please check your tracking information in your order confirmation email. If your package is delayed, we'll work with our shipping partners to provide updates and ensure prompt delivery.";
    } else {
      return "Thank you for reaching out to us. Our support team has received your request and will review it carefully. We'll get back to you within 24 hours with a detailed response to address your concern.";
    }
  }

  showTicketDetail(ticketId) {
    const ticket = this.mockData.tickets.find(t => t.id === ticketId);
    if (!ticket) return;
    
    // Update modal content
    const titleEl = document.getElementById('ticket-detail-title');
    const idEl = document.getElementById('ticket-detail-id');
    const statusEl = document.getElementById('ticket-detail-status');
    const categoryEl = document.getElementById('ticket-detail-category');
    const descEl = document.getElementById('ticket-detail-description');

    if (titleEl) titleEl.textContent = ticket.title;
    if (idEl) idEl.textContent = `#${ticket.id}`;
    
    if (statusEl) {
      statusEl.textContent = ticket.status.replace('_', ' ');
      statusEl.className = `status-badge ${ticket.status}`;
    }
    
    if (categoryEl) {
      categoryEl.textContent = ticket.category;
      categoryEl.className = `category-badge ${ticket.category}`;
    }
    
    if (descEl) descEl.textContent = ticket.description;
    
    // Load content
    this.loadTicketConversation(ticketId);
    this.loadTicketSuggestions(ticketId);
    this.loadTicketAuditLog(ticketId);
    
    // Show modal
    const modal = document.getElementById('ticket-detail-modal');
    modal?.classList.remove('hidden');
  }

  loadTicketConversation(ticketId) {
    const ticket = this.mockData.tickets.find(t => t.id === ticketId);
    const container = document.getElementById('ticket-conversation');
    if (!container) return;
    
    if (!ticket.replies || ticket.replies.length === 0) {
      container.innerHTML = '<p style="color: var(--color-text-secondary); text-align: center; padding: 20px;">No replies yet.</p>';
      return;
    }
    
    container.innerHTML = ticket.replies.map(reply => {
      const sender = this.mockData.users.find(u => u.id === reply.sender) || {name: reply.isAI ? 'AI Agent' : 'System'};
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
    const container = document.getElementById('ai-suggestions');
    if (!container) return;
    
    const suggestion = this.mockData.agentSuggestions.find(s => s.ticketId === ticketId);
    
    if (!suggestion) {
      container.innerHTML = '<p style="color: var(--color-text-secondary);">No AI suggestions available.</p>';
      return;
    }
    
    container.innerHTML = `
      <div class="ai-suggestion">
        <div class="suggestion-header">
          <h4>AI Suggestion</h4>
          <span class="confidence-score">${Math.round(suggestion.confidence * 100)}% confidence</span>
        </div>
        <div class="suggestion-content">${suggestion.draftReply}</div>
        <div class="suggestion-citations">
          <strong>Referenced Articles:</strong>
          Payment Policy, Technical Troubleshooting
        </div>
      </div>
    `;
  }

  loadTicketAuditLog(ticketId) {
    const logs = this.mockData.auditLogs.filter(l => l.ticketId === ticketId);
    const container = document.getElementById('audit-log');
    if (!container) return;
    
    container.innerHTML = logs.map(log => `
      <div class="audit-entry">
        <div class="audit-action">${log.action.replace(/_/g, ' ')}</div>
        <div class="audit-details">System processed ticket automatically</div>
        <div class="audit-time">${this.formatTime(log.timestamp)} | Trace: ${log.traceId || 'N/A'}</div>
      </div>
    `).join('');
  }

  sendReply(e) {
    e.preventDefault();
    
    const messageElement = document.getElementById('reply-message');
    const statusElement = document.getElementById('reply-status');
    
    if (!messageElement) return;
    
    const message = messageElement.value.trim();
    const newStatus = statusElement?.value || '';
    
    if (!message) {
      this.showToast('Please enter a reply message', 'error');
      return;
    }
    
    const ticketIdElement = document.getElementById('ticket-detail-id');
    if (!ticketIdElement) return;
    
    const ticketId = ticketIdElement.textContent.replace('#', '');
    const ticket = this.mockData.tickets.find(t => t.id === ticketId);
    
    // Add reply immediately
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
    
    this.saveData();
    
    // Refresh conversation
    this.loadTicketConversation(ticketId);
    
    // Clear form
    const replyForm = document.getElementById('reply-form');
    replyForm?.reset();
    
    this.showToast('Reply sent successfully!', 'success');
    
    if (this.currentPage === 'tickets') {
      this.loadTickets();
    }
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
    targetTab?.classList.add('active');
  }

  loadKnowledgeBase() {
    this.displayKBArticles(this.mockData.kbArticles);
  }

  displayKBArticles(articles) {
    const container = document.getElementById('kb-articles-list');
    if (!container) return;
    
    if (articles.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-book fa-3x"></i>
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
    const searchTerm = searchElement?.value.toLowerCase() || '';
    
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
    const titleEl = document.getElementById('article-modal-title');
    const form = document.getElementById('article-form');
    const modal = document.getElementById('article-modal');

    if (titleEl) titleEl.textContent = 'Create Article';
    if (form) form.reset();
    if (modal) modal.classList.remove('hidden');
  }

  editArticle(articleId) {
    const article = this.mockData.kbArticles.find(a => a.id === articleId);
    if (!article) return;
    
    document.getElementById('article-modal-title').textContent = 'Edit Article';
    document.getElementById('article-title').value = article.title;
    document.getElementById('article-body').value = article.body;
    document.getElementById('article-tags').value = article.tags.join(', ');
    document.getElementById('article-status').value = article.status;
    document.getElementById('article-form').setAttribute('data-article-id', articleId);
    document.getElementById('article-modal').classList.remove('hidden');
  }

  saveArticle(e) {
    e.preventDefault();
    
    const title = document.getElementById('article-title')?.value?.trim();
    const body = document.getElementById('article-body')?.value?.trim();
    const tags = document.getElementById('article-tags')?.value.split(',').map(t => t.trim()).filter(t => t) || [];
    const status = document.getElementById('article-status')?.value || 'draft';
    const articleId = document.getElementById('article-form')?.getAttribute('data-article-id');
    
    if (!title || !body) {
      this.showToast('Please fill in all required fields', 'error');
      return;
    }
    
    if (articleId) {
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
      const newArticle = {
        id: String(this.mockData.kbArticles.length + 1),
        title, body, tags, status,
        updatedAt: new Date().toISOString()
      };
      this.mockData.kbArticles.push(newArticle);
      this.showToast('Article created successfully!', 'success');
    }
    
    this.saveData();
    this.hideModal('article-modal');
    this.loadKnowledgeBase();
    
    const form = document.getElementById('article-form');
    form?.reset();
    form?.removeAttribute('data-article-id');
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
    const resolvedToday = assignedTickets.filter(t => 
      ['resolved', 'closed'].includes(t.status)
    );
    
    const pendingEl = document.getElementById('pending-suggestions');
    const assignedEl = document.getElementById('assigned-tickets');
    const resolvedEl = document.getElementById('resolved-today');

    if (pendingEl) pendingEl.textContent = suggestions.length;
    if (assignedEl) assignedEl.textContent = assignedTickets.length;
    if (resolvedEl) resolvedEl.textContent = resolvedToday.length;
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
          <h4>${ticket?.title || `Ticket #${suggestion.ticketId}`}</h4>
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
    
    const autoCloseEl = document.getElementById('auto-close-enabled');
    const thresholdEl = document.getElementById('confidence-threshold');
    const thresholdValueEl = document.getElementById('threshold-value');
    const slaEl = document.getElementById('sla-hours');

    if (autoCloseEl) autoCloseEl.checked = config.autoCloseEnabled;
    if (thresholdEl) thresholdEl.value = config.confidenceThreshold;
    if (thresholdValueEl) thresholdValueEl.textContent = config.confidenceThreshold.toFixed(2);
    if (slaEl) slaEl.value = config.slaHours;
  }

  saveSettings(e) {
    e.preventDefault();
    
    const autoCloseEnabled = document.getElementById('auto-close-enabled')?.checked ?? true;
    const confidenceThreshold = parseFloat(document.getElementById('confidence-threshold')?.value) || 0.78;
    const slaHours = parseInt(document.getElementById('sla-hours')?.value) || 24;
    
    this.mockData.config = {
      autoCloseEnabled,
      confidenceThreshold,
      slaHours
    };
    
    this.saveData();
    this.showToast('Settings saved successfully!', 'success');
  }

  // Utility functions
  skipLoading() {
    this.clearAllTimeouts();
    this.hideLoading();
    this.showToast('Loading skipped', 'info');
  }

  clearAllTimeouts() {
    this.loadingTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    this.loadingTimeouts.clear();
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
      }, 3000);
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
    loadingOverlay?.classList.remove('hidden');
    
    // Auto-hide after 3 seconds
    setTimeout(() => this.hideLoading(), 3000);
  }

  hideLoading() {
    this.clearAllTimeouts();
    const loadingOverlay = document.getElementById('loading-overlay');
    loadingOverlay?.classList.add('hidden');
  }

  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    modal?.classList.add('hidden');
  }

  formatTime(timestamp) {
    return new Date(timestamp).toLocaleString();
  }
}

// Initialize app immediately
let app;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    app = new SmartHelpdeskApp();
    window.app = app;
  });
} else {
  app = new SmartHelpdeskApp();
  window.app = app;
}