/**
 * DigiLocker Redesign Prototype - Core Application Controller
 * Handles Screen Navigation, Task Flows, Live Search, Document Previews,
 * Modals, Audio Feedback, Multi-Language, and Presentation Tools.
 */

import { DEMO_USER, DOCUMENT_CATEGORIES, DEMO_DOCUMENTS, DEMO_ACTIVITIES, I18N } from './data.js';
import { getIcon } from './icons.js';
import { sound } from './audio.js';

class DigiLockerApp {
  constructor() {
    this.currentLanguage = 'en';
    this.currentScreen = 'screen-welcome';
    this.isLoggedIn = false;
    this.documents = [...DEMO_DOCUMENTS];
    this.activities = [...DEMO_ACTIVITIES];
    this.selectedDoc = this.documents[0]; // default: Class 12 Marksheet
    this.currentCategoryFilter = 'all';
    this.searchQuery = '';
    this.deviceMode = 'desktop'; // 'mobile' | 'tablet' | 'desktop' | 'fullscreen'
    
    // Share modal state
    this.sharePermissions = { view: true, verify: true, download: false };
    this.shareExpiry = '1 hour';

    this.init();
  }

  init() {
    this.bindEvents();
    this.renderAll();
    this.setLanguage(this.currentLanguage);
    this.setDeviceMode(this.deviceMode);
  }

  // ==========================================
  // NAVIGATION & ROUTING
  // ==========================================
  navigateTo(screenId, params = {}) {
    sound.playTap();
    if (params.docId) {
      const doc = this.documents.find(d => d.id === params.docId);
      if (doc) this.selectedDoc = doc;
    }
    if (params.category) {
      this.currentCategoryFilter = params.category;
    }

    this.currentScreen = screenId;

    // Update screen views
    document.querySelectorAll('.screen-view').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) {
      target.classList.add('active');
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Update active nav links (sidebar & bottom nav)
    document.querySelectorAll('[data-nav-screen]').forEach(btn => {
      const btnScreen = btn.getAttribute('data-nav-screen');
      if (btnScreen === screenId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Re-render specific screen content when opened
    if (screenId === 'screen-my-docs') this.renderMyDocuments();
    if (screenId === 'screen-doc-details') this.renderDocDetails();
    if (screenId === 'screen-search') this.renderSearchScreen();
    if (screenId === 'screen-activity') this.renderActivityScreen();
    if (screenId === 'screen-profile') this.renderProfileScreen();
  }

  setDeviceMode(mode) {
    this.deviceMode = mode;
    const frame = document.getElementById('device-frame');
    if (!frame) return;

    frame.className = `device-frame mode-${mode}`;
    document.querySelectorAll('.device-btn').forEach(btn => {
      if (btn.getAttribute('data-mode') === mode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  setLanguage(lang) {
    if (!I18N[lang]) return;
    this.currentLanguage = lang;
    const t = I18N[lang];

    // Update language dropdown
    const langSelect = document.getElementById('lang-select');
    if (langSelect) langSelect.value = lang;

    // Update static translated elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (t[key]) el.textContent = t[key];
    });

    // Update search placeholders
    const searchInputs = document.querySelectorAll('.search-input-field');
    searchInputs.forEach(input => {
      input.placeholder = t.searchPlaceholder;
    });

    // Re-render dynamic components
    this.renderHome();
    this.renderMyDocuments();
    this.renderDocCategories();
  }

  // ==========================================
  // RENDER METHODS
  // ==========================================
  renderAll() {
    this.renderHome();
    this.renderDocCategories();
    this.renderMyDocuments();
    this.renderActivityScreen();
    this.renderProfileScreen();
    this.renderEmptyAndErrorStates();
  }

  renderHome() {
    const t = I18N[this.currentLanguage];

    // Render 4 Prominent Hero Task Cards
    const taskContainer = document.getElementById('home-task-cards');
    if (taskContainer) {
      taskContainer.innerHTML = `
        <div class="task-card task-find" id="task-btn-find">
          <div class="task-card-icon-wrap">${getIcon('file-search', 24)}</div>
          <div>
            <div class="task-card-title">${t.taskFindTitle}</div>
            <div class="task-card-desc">${t.taskFindSub}</div>
          </div>
        </div>

        <div class="task-card task-share" id="task-btn-share">
          <div class="task-card-icon-wrap">${getIcon('share-2', 24)}</div>
          <div>
            <div class="task-card-title">${t.taskShareTitle}</div>
            <div class="task-card-desc">${t.taskShareSub}</div>
          </div>
        </div>

        <div class="task-card task-verify" id="task-btn-verify">
          <div class="task-card-icon-wrap">${getIcon('check-circle', 24)}</div>
          <div>
            <div class="task-card-title">${t.taskVerifyTitle}</div>
            <div class="task-card-desc">${t.taskVerifySub}</div>
          </div>
        </div>

        <div class="task-card task-upload" id="task-btn-upload">
          <div class="task-card-icon-wrap">${getIcon('upload-cloud', 24)}</div>
          <div>
            <div class="task-card-title">${t.taskUploadTitle}</div>
            <div class="task-card-desc">${t.taskUploadSub}</div>
          </div>
        </div>
      `;

      document.getElementById('task-btn-find')?.addEventListener('click', () => this.navigateTo('screen-categories'));
      document.getElementById('task-btn-share')?.addEventListener('click', () => this.openShareModal(this.selectedDoc));
      document.getElementById('task-btn-verify')?.addEventListener('click', () => this.navigateTo('screen-verify'));
      document.getElementById('task-btn-upload')?.addEventListener('click', () => this.openUploadModal());
    }

    // Render Recently Used Documents (Top 3)
    const recentContainer = document.getElementById('home-recent-docs');
    if (recentContainer) {
      const recents = this.documents.slice(0, 3);
      recentContainer.innerHTML = recents.map(doc => this.createDocCardHTML(doc)).join('');
      this.attachDocCardListeners(recentContainer);
    }

    // Render Horizontal Category Chips on Home
    const catChipsContainer = document.getElementById('home-category-chips');
    if (catChipsContainer) {
      catChipsContainer.innerHTML = `
        <button class="category-chip-btn active" data-cat-id="all">
          ${getIcon('files', 16)} All (${this.documents.length})
        </button>
        ${DOCUMENT_CATEGORIES.map(cat => `
          <button class="category-chip-btn" data-cat-id="${cat.id}">
            ${getIcon(cat.icon, 16)} ${this.getCategoryName(cat)}
          </button>
        `).join('')}
      `;

      catChipsContainer.querySelectorAll('.category-chip-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const catId = btn.getAttribute('data-cat-id');
          this.navigateTo('screen-my-docs', { category: catId });
        });
      });
    }
  }

  renderDocCategories() {
    const container = document.getElementById('categories-grid');
    if (!container) return;

    container.innerHTML = DOCUMENT_CATEGORIES.map(cat => `
      <div class="task-card" style="border-left: 4px solid ${cat.color};" data-cat-id="${cat.id}">
        <div class="task-card-icon-wrap" style="background: ${cat.color};">
          ${getIcon(cat.icon, 24)}
        </div>
        <div>
          <div class="task-card-title">${this.getCategoryName(cat)}</div>
          <div class="task-card-desc">${cat.desc}</div>
        </div>
        <div style="margin-top: 8px; font-size: 12px; font-weight: 600; color: ${cat.color}; display: flex; align-items: center; gap: 4px;">
          View ${cat.count} documents ${getIcon('chevron-right', 14)}
        </div>
      </div>
    `).join('');

    container.querySelectorAll('[data-cat-id]').forEach(card => {
      card.addEventListener('click', () => {
        const catId = card.getAttribute('data-cat-id');
        this.navigateTo('screen-my-docs', { category: catId });
      });
    });
  }

  renderMyDocuments() {
    const filterTabsContainer = document.getElementById('my-docs-filter-tabs');
    if (filterTabsContainer) {
      filterTabsContainer.innerHTML = `
        <button class="category-chip-btn ${this.currentCategoryFilter === 'all' ? 'active' : ''}" data-filter="all">
          All (${this.documents.length})
        </button>
        ${DOCUMENT_CATEGORIES.map(cat => `
          <button class="category-chip-btn ${this.currentCategoryFilter === cat.id ? 'active' : ''}" data-filter="${cat.id}">
            ${getIcon(cat.icon, 15)} ${this.getCategoryName(cat)}
          </button>
        `).join('')}
        <button class="category-chip-btn ${this.currentCategoryFilter === 'uploaded' ? 'active' : ''}" data-filter="uploaded">
          ${getIcon('upload-cloud', 15)} Uploaded by you
        </button>
      `;

      filterTabsContainer.querySelectorAll('[data-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
          this.currentCategoryFilter = btn.getAttribute('data-filter');
          this.renderMyDocuments();
        });
      });
    }

    const container = document.getElementById('my-docs-list');
    if (!container) return;

    let filtered = this.documents;
    if (this.currentCategoryFilter === 'uploaded') {
      filtered = this.documents.filter(d => d.source === 'uploaded');
    } else if (this.currentCategoryFilter !== 'all') {
      filtered = this.documents.filter(d => d.category === this.currentCategoryFilter);
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px;">
          <img src="assets/images/empty.jpg" alt="Empty" style="width: 140px; height: 140px; border-radius: 16px; margin-bottom: 14px; opacity: 0.85;">
          <h4 style="font-size: 16px; font-weight: 700; color: var(--gov-navy); margin-bottom: 6px;">No documents in this category</h4>
          <p style="font-size: 13px; color: var(--neutral-500); margin-bottom: 16px;">You can upload new files or check other categories.</p>
          <button class="btn-primary" id="empty-cat-upload-btn" style="padding: 10px 18px; font-size: 13px;">
            ${getIcon('upload-cloud', 16)} Upload a Document
          </button>
        </div>
      `;
      document.getElementById('empty-cat-upload-btn')?.addEventListener('click', () => this.openUploadModal());
      return;
    }

    container.innerHTML = filtered.map(doc => this.createDocCardHTML(doc)).join('');
    this.attachDocCardListeners(container);
  }

  createDocCardHTML(doc) {
    const cat = DOCUMENT_CATEGORIES.find(c => c.id === doc.category) || DOCUMENT_CATEGORIES[0];
    const isVerified = doc.isVerified;
    const badgeHTML = isVerified
      ? `<span class="badge-verified">${getIcon('check-circle', 13)} Verified • Official Issuer</span>`
      : `<span class="badge-uploaded">${getIcon('info', 13)} Uploaded by you • Not verified</span>`;

    const title = this.getDocTitle(doc);

    return `
      <div class="doc-card" data-doc-id="${doc.id}">
        <div class="doc-card-header">
          <div class="doc-icon-badge" style="background: ${cat.bgLight}; color: ${cat.color};">
            ${getIcon(cat.icon, 22)}
          </div>
          <div class="doc-info">
            <div class="doc-title">${title}</div>
            <div class="doc-issuer">${doc.issuer}</div>
          </div>
        </div>
        <div class="doc-card-footer">
          ${badgeHTML}
          <div class="doc-accessed-time">
            ${getIcon('clock', 12)} ${doc.lastAccessed}
          </div>
        </div>
      </div>
    `;
  }

  attachDocCardListeners(parentEl) {
    parentEl.querySelectorAll('[data-doc-id]').forEach(card => {
      card.addEventListener('click', () => {
        const docId = card.getAttribute('data-doc-id');
        this.navigateTo('screen-doc-details', { docId });
      });
    });
  }

  renderDocDetails() {
    const doc = this.selectedDoc;
    if (!doc) return;

    const title = this.getDocTitle(doc);
    const titleEl = document.getElementById('details-doc-title');
    const issuerEl = document.getElementById('details-doc-issuer');
    const statusEl = document.getElementById('details-doc-status-badge');
    const metaGridEl = document.getElementById('details-meta-grid');

    if (titleEl) titleEl.textContent = title;
    if (issuerEl) issuerEl.textContent = doc.issuer;
    if (statusEl) {
      statusEl.innerHTML = doc.isVerified
        ? `<span class="badge-verified" style="font-size: 13px; padding: 5px 12px;">${getIcon('check-circle', 16)} Verified • Fetched from Issuer</span>`
        : `<span class="badge-uploaded" style="font-size: 13px; padding: 5px 12px;">${getIcon('info', 16)} Uploaded by you • Not Issuer-verified</span>`;
    }

    if (metaGridEl) {
      metaGridEl.innerHTML = `
        <div class="meta-item">
          <div class="meta-label">Document ID</div>
          <div class="meta-value" style="font-family: var(--font-mono); font-size: 13px;">${doc.docId}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Issue / Upload Date</div>
          <div class="meta-value">${doc.issueDate}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Source & Verification</div>
          <div class="meta-value">${doc.source === 'fetched' ? 'Direct Issuer API Link' : 'Citizen Vault Upload'}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Last Accessed</div>
          <div class="meta-value">${doc.lastAccessed}</div>
        </div>
      `;
    }

    // Render Preview Box inside details
    const previewBox = document.getElementById('details-mini-preview');
    if (previewBox) {
      if (doc.id === 'doc-12-marksheet') {
        previewBox.innerHTML = this.getMarksheetHTML(doc);
      } else {
        previewBox.innerHTML = `
          <div style="background: white; border: 1.5px solid var(--neutral-300); border-radius: 12px; padding: 24px; text-align: center; position: relative;">
            <div style="font-size: 40px; margin-bottom: 10px;">${doc.category === 'identity' ? '🪪' : doc.category === 'driving' ? '🚗' : '📄'}</div>
            <h4 style="font-size: 16px; font-weight: 700; color: var(--gov-navy); margin-bottom: 6px;">${title}</h4>
            <p style="font-size: 13px; color: var(--neutral-600); max-width: 400px; margin: 0 auto 14px;">${doc.description}</p>
            <div style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--status-verified); font-weight: 600; background: var(--status-verified-bg); padding: 4px 12px; border-radius: 20px;">
              ${getIcon('shield-check', 14)} Cryptographically Signed & Tamper-Evident
            </div>
          </div>
        `;
      }
    }
  }

  getMarksheetHTML(doc) {
    return `
      <div class="marksheet-preview-container">
        <div class="marksheet-watermark">DEMO PROTOTYPE</div>
        <div class="marksheet-top-banner">
          <h3>Central Board of Secondary Education</h3>
          <p>ALL INDIA SENIOR SCHOOL CERTIFICATE EXAMINATION (CLASS XII) - 2026</p>
          <p style="font-size: 11px; color: #64748B;">MARKS STATEMENT / CUM CERTIFICATE (PROTOTYPE SAMPLE)</p>
        </div>

        <div class="marksheet-student-grid">
          <div><strong>Candidate Name:</strong> Disha Patil</div>
          <div><strong>Roll Number:</strong> 26194820</div>
          <div><strong>Institution:</strong> Demo Senior Secondary School</div>
          <div><strong>Examination Year:</strong> 2026</div>
        </div>

        <table class="marksheet-table">
          <thead>
            <tr>
              <th>Sub Code</th>
              <th>Subject Name</th>
              <th>Max Marks</th>
              <th>Marks Obtained</th>
              <th>Grade</th>
            </tr>
          </thead>
          <tbody>
            ${doc.marks.map(m => `
              <tr>
                <td>${m.code}</td>
                <td><strong>${m.subject}</strong></td>
                <td>${m.max}</td>
                <td><strong>${m.obtained}</strong></td>
                <td><span style="color: #15803D; font-weight: bold;">${m.grade}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="display: flex; justify-content: space-between; align-items: center; background: #F8FAFC; padding: 10px 14px; border-radius: 8px; font-family: var(--font-sans); font-size: 13px; margin-bottom: 12px;">
          <div><strong>Total: ${doc.totalMarks}</strong> (${doc.percentage})</div>
          <div style="color: #15803D; font-weight: 800; font-size: 14px;">RESULT: ${doc.result}</div>
        </div>

        <div class="marksheet-footer-seal">
          <div class="digi-seal-badge">
            ${getIcon('shield-check', 20)}
            <div>
              <div>✓ Digitally Verified by CBSE Digital Repository</div>
              <div style="font-size: 10px; color: #64748B;">SHA256: 8f49a20b12e847c2938104d91823901b...</div>
            </div>
          </div>
          <div style="text-align: right; color: #475569; font-size: 11px;">
            Controller of Examinations<br>
            <strong>Date: 15-09-2026</strong>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================
  // SEARCH FUNCTIONALITY (Instant & Partial Match)
  // ==========================================
  renderSearchScreen() {
    const input = document.getElementById('search-screen-input');
    const resultsContainer = document.getElementById('search-results-list');
    const countLabel = document.getElementById('search-results-count');
    const query = input ? input.value.trim().toLowerCase() : '';

    if (!resultsContainer) return;

    let results = this.documents;
    if (query) {
      results = this.documents.filter(doc => {
        const titleMatch = doc.title.toLowerCase().includes(query) ||
                           (doc.titleHi && doc.titleHi.toLowerCase().includes(query)) ||
                           (doc.titleMr && doc.titleMr.toLowerCase().includes(query));
        const issuerMatch = doc.issuer.toLowerCase().includes(query) || doc.issuerShort.toLowerCase().includes(query);
        const catMatch = doc.category.toLowerCase().includes(query);
        return titleMatch || issuerMatch || catMatch;
      });
    }

    if (countLabel) {
      countLabel.textContent = query
        ? `Found ${results.length} document${results.length === 1 ? '' : 's'} matching "${query}"`
        : `Showing all ${results.length} documents in your account`;
    }

    if (results.length === 0) {
      resultsContainer.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; grid-column: 1 / -1;">
          <img src="assets/images/empty.jpg" alt="Empty" style="width: 140px; height: 140px; border-radius: 16px; margin-bottom: 14px; opacity: 0.85;">
          <h4 style="font-size: 16px; font-weight: 700; color: var(--gov-navy); margin-bottom: 6px;">No documents found for "${query}"</h4>
          <p style="font-size: 13px; color: var(--neutral-500); margin-bottom: 16px;">Try searching for "marksheet", "PAN", "driving", or "degree".</p>
          <button class="btn-secondary" id="search-reset-btn" style="padding: 8px 16px; font-size: 13px;">
            Clear Search Filter
          </button>
        </div>
      `;
      document.getElementById('search-reset-btn')?.addEventListener('click', () => {
        if (input) input.value = '';
        this.renderSearchScreen();
      });
      return;
    }

    resultsContainer.innerHTML = results.map(doc => this.createDocCardHTML(doc)).join('');
    this.attachDocCardListeners(resultsContainer);
  }

  // ==========================================
  // ACTIVITY & PROFILE SCREENS
  // ==========================================
  renderActivityScreen() {
    const container = document.getElementById('activity-timeline-list');
    if (!container) return;

    container.innerHTML = this.activities.map(act => `
      <div class="activity-item">
        <div class="activity-icon-wrap" style="background: ${act.color}15; color: ${act.color};">
          ${getIcon(act.icon, 20)}
        </div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 14px; font-weight: 700; color: var(--gov-navy); margin-bottom: 2px;">
            ${this.getActivityTitle(act)}
          </div>
          <div style="font-size: 12px; color: var(--neutral-600);">${act.desc}</div>
        </div>
        <div style="text-align: right; font-size: 11px; color: var(--neutral-400); white-space: nowrap;">
          <strong>${act.time}</strong><br>
          <span>${act.date}</span>
        </div>
      </div>
    `).join('');
  }

  renderProfileScreen() {
    const container = document.getElementById('profile-content-wrap');
    if (!container) return;

    container.innerHTML = `
      <div style="background: white; border: 1px solid var(--neutral-200); border-radius: var(--radius-xl); padding: 24px; box-shadow: var(--shadow-sm); margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 18px;">
          <div style="width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #0284C7, #0369A1); color: white; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 800;">
            ${DEMO_USER.avatarInitials}
          </div>
          <div>
            <h3 style="font-size: 18px; font-weight: 800; color: var(--gov-navy); margin-bottom: 4px;">${this.getUserName()}</h3>
            <span class="verified-citizen-pill">${getIcon('check-circle', 13)} ${DEMO_USER.status}</span>
          </div>
        </div>

        <div class="meta-grid" style="margin-bottom: 0;">
          <div class="meta-item">
            <div class="meta-label">DigiLocker ID</div>
            <div class="meta-value" style="font-family: var(--font-mono); font-size: 13px;">${DEMO_USER.id}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Linked Aadhaar</div>
            <div class="meta-value" style="font-family: var(--font-mono); font-size: 13px;">${DEMO_USER.aadhaarMasked}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Registered Phone</div>
            <div class="meta-value">${DEMO_USER.phone}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Date of Birth</div>
            <div class="meta-value">${DEMO_USER.dob}</div>
          </div>
        </div>
      </div>

      <!-- Settings & Options List -->
      <div style="background: white; border: 1px solid var(--neutral-200); border-radius: var(--radius-xl); padding: 8px 16px; box-shadow: var(--shadow-sm); margin-bottom: 24px;">
        <div class="nav-link" id="btn-profile-security" style="color: var(--neutral-800); border-bottom: 1px solid var(--neutral-100);">
          ${getIcon('lock', 18)} <span>Security & 2-Factor Authentication</span>
          <span style="margin-left: auto; color: var(--status-verified); font-size: 12px; font-weight: 600;">Active</span>
        </div>
        <div class="nav-link" id="btn-profile-privacy" style="color: var(--neutral-800); border-bottom: 1px solid var(--neutral-100);">
          ${getIcon('shield-check', 18)} <span>Data Privacy & Consent Ledger</span>
          <span style="margin-left: auto; color: var(--neutral-400);">${getIcon('chevron-right', 16)}</span>
        </div>
        <div class="nav-link" id="btn-profile-language" style="color: var(--neutral-800); border-bottom: 1px solid var(--neutral-100);">
          ${getIcon('info', 18)} <span>App Language</span>
          <span style="margin-left: auto; font-size: 12px; font-weight: 600; color: var(--gov-blue-dark); text-transform: uppercase;">${this.currentLanguage}</span>
        </div>
        <div class="nav-link" id="btn-profile-case-study" style="color: var(--neutral-800); border-bottom: 1px solid var(--neutral-100);">
          ${getIcon('sparkles', 18)} <span>Why this Redesign? (Case Study Rationale)</span>
          <span style="margin-left: auto; color: #0284C7; font-size: 12px; font-weight: 700;">Read Specs</span>
        </div>
        <div class="nav-link" id="btn-profile-logout" style="color: var(--status-error);">
          ${getIcon('x', 18)} <span>Logout of Demo Session</span>
        </div>
      </div>
    `;

    document.getElementById('btn-profile-case-study')?.addEventListener('click', () => this.openCaseStudyModal());
    document.getElementById('btn-profile-logout')?.addEventListener('click', () => {
      this.showToast('Logged out of demo session');
      this.navigateTo('screen-welcome');
    });
  }

  renderEmptyAndErrorStates() {
    const errorContainer = document.getElementById('error-states-content');
    if (!errorContainer) return;

    errorContainer.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
        <!-- Error State 1: Issuer Server Timeout -->
        <div style="background: white; border: 1.5px solid #FECACA; border-radius: 16px; padding: 20px; text-align: center;">
          <div style="width: 48px; height: 48px; background: #FEE2E2; color: #DC2626; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px;">
            ${getIcon('alert-triangle', 24)}
          </div>
          <h4 style="font-size: 16px; font-weight: 700; color: var(--gov-navy); margin-bottom: 6px;">Document couldn't be fetched</h4>
          <p style="font-size: 13px; color: var(--neutral-600); margin-bottom: 16px;">Something went wrong while connecting to the issuer repository. Please try again.</p>
          <button class="btn-primary" style="padding: 10px 18px; font-size: 13px; margin-right: 8px;">
            ${getIcon('refresh-cw', 14)} Try Again
          </button>
          <button class="btn-secondary" style="padding: 10px 14px; font-size: 13px;">Choose Another</button>
        </div>

        <!-- Error State 2: Verification Failed -->
        <div style="background: white; border: 1.5px solid #FECACA; border-radius: 16px; padding: 20px; text-align: center;">
          <div style="width: 48px; height: 48px; background: #FEE2E2; color: #DC2626; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px;">
            ${getIcon('x', 24)}
          </div>
          <h4 style="font-size: 16px; font-weight: 700; color: var(--gov-navy); margin-bottom: 6px;">Verification Failed</h4>
          <p style="font-size: 13px; color: var(--neutral-600); margin-bottom: 16px;">We couldn't verify this document cryptographic signature. The file might have been altered.</p>
          <button class="btn-primary" style="padding: 10px 18px; font-size: 13px;">Re-scan QR Code</button>
        </div>
      </div>
    `;
  }

  // ==========================================
  // MODALS & FLOW INTERACTIONS
  // ==========================================
  openShareModal(doc) {
    sound.playTap();
    this.selectedDoc = doc || this.documents[0];
    const modal = document.getElementById('modal-share');
    const docTitle = document.getElementById('share-modal-doc-title');
    const docIssuer = document.getElementById('share-modal-doc-issuer');

    if (docTitle) docTitle.textContent = this.getDocTitle(this.selectedDoc);
    if (docIssuer) docIssuer.textContent = this.selectedDoc.issuer;

    // Reset share flow view to step 1
    document.getElementById('share-step-config').style.display = 'block';
    document.getElementById('share-step-success').style.display = 'none';

    if (modal) modal.classList.add('active');
  }

  generateShareLink() {
    sound.playSuccess();
    const demoUrl = `digilocker-demo.gov/share/DL-9482-CB12`;
    const urlDisplay = document.getElementById('share-generated-url');
    if (urlDisplay) urlDisplay.textContent = demoUrl;

    document.getElementById('share-step-config').style.display = 'none';
    document.getElementById('share-step-success').style.display = 'block';

    // Add activity log
    this.activities.unshift({
      id: `act-${Date.now()}`,
      type: "share",
      title: `Shared ${this.selectedDoc.title}`,
      titleHi: `${this.selectedDoc.title} साझा किया`,
      titleMr: `${this.selectedDoc.title} शेअर केले`,
      desc: `Created ${this.shareExpiry} secure share link with custom permissions`,
      time: "Just now",
      date: "Today",
      icon: "link",
      color: "#2563EB"
    });
    this.renderActivityScreen();
  }

  openUploadModal() {
    sound.playTap();
    const modal = document.getElementById('modal-upload');
    const stepPicker = document.getElementById('upload-step-picker');
    const stepSuccess = document.getElementById('upload-step-success');
    const progressFill = document.getElementById('upload-progress-bar-fill');
    const progressText = document.getElementById('upload-progress-percent');

    if (stepPicker) stepPicker.style.display = 'block';
    if (stepSuccess) stepSuccess.style.display = 'none';
    if (progressFill) progressFill.style.width = '0%';
    if (progressText) progressText.textContent = '0%';

    if (modal) modal.classList.add('active');
  }

  simulateFileUpload(fileName = "Degree_Certificate.pdf") {
    sound.playScan();
    const progressFill = document.getElementById('upload-progress-bar-fill');
    const progressText = document.getElementById('upload-progress-percent');
    const statusWrap = document.getElementById('upload-progress-wrapper');

    if (statusWrap) statusWrap.style.display = 'block';

    let percent = 0;
    const interval = setInterval(() => {
      percent += 25;
      if (progressFill) progressFill.style.width = `${percent}%`;
      if (progressText) progressText.textContent = `${percent}%`;

      if (percent >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          sound.playSuccess();
          document.getElementById('upload-step-picker').style.display = 'none';
          document.getElementById('upload-step-success').style.display = 'block';

          // Add to documents list if not already present
          const newDoc = {
            id: `doc-upl-${Date.now()}`,
            title: fileName,
            titleHi: fileName,
            titleMr: fileName,
            category: "other",
            issuer: "Uploaded by you",
            issuerShort: "Self-Uploaded",
            isVerified: false,
            source: "uploaded",
            lastAccessed: "Just now",
            issueDate: "Uploaded on 06 Oct 2026",
            docId: `UPL-${Math.floor(10000 + Math.random() * 90000)}`,
            fileSize: "2.4 MB",
            qrPayload: `DIGILOCKER_DEMO_UPLOADED:SELF:${fileName}:NOT_VERIFIED`,
            description: "Uploaded document stored securely in your cloud vault. Not verified by government issuer."
          };

          this.documents.unshift(newDoc);
          this.activities.unshift({
            id: `act-${Date.now()}`,
            type: "upload",
            title: `Uploaded ${fileName}`,
            titleHi: `${fileName} अपलोड किया`,
            titleMr: `${fileName} अपलोड केले`,
            desc: "Saved 2.4 MB document to Private Cloud Vault",
            time: "Just now",
            date: "Today",
            icon: "upload-cloud",
            color: "#D97706"
          });

          this.renderHome();
          this.renderMyDocuments();
          this.renderActivityScreen();
          this.showToast(`Successfully uploaded ${fileName}`);
        }, 400);
      }
    }, 180);
  }

  simulateQRScanVerification() {
    sound.playScan();
    const scanBtn = document.getElementById('btn-trigger-scan');
    const scanningAnim = document.getElementById('verify-scanning-state');
    const resultBox = document.getElementById('verify-result-box');

    if (scanBtn) scanBtn.disabled = true;
    if (scanningAnim) scanningAnim.style.display = 'flex';
    if (resultBox) resultBox.style.display = 'none';

    setTimeout(() => {
      sound.playSuccess();
      if (scanningAnim) scanningAnim.style.display = 'none';
      if (resultBox) {
        resultBox.style.display = 'block';
        resultBox.scrollIntoView({ behavior: 'smooth' });
      }
      if (scanBtn) scanBtn.disabled = false;

      // Add to activities
      this.activities.unshift({
        id: `act-${Date.now()}`,
        type: "verify",
        title: "Verified Class 12 Marksheet",
        titleHi: "कक्षा 12वीं की अंकतालिका सत्यापित की",
        titleMr: "इयत्ता १२ वी गुणपत्रिका पडताळली",
        desc: "Instant QR check completed successfully via CBSE registry",
        time: "Just now",
        date: "Today",
        icon: "check-circle",
        color: "#16A34A"
      });
      this.renderActivityScreen();
      this.showToast("✓ Document Verified & Authentic!");
    }, 1200);
  }

  openCaseStudyModal() {
    sound.playTap();
    const modal = document.getElementById('modal-case-study');
    if (modal) modal.classList.add('active');
  }

  closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.innerHTML = `
      ${getIcon(type === 'error' ? 'alert-triangle' : 'check-circle', 18)}
      <span>${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = '0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ==========================================
  // EVENT BINDINGS
  // ==========================================
  bindEvents() {
    // Global navigation buttons
    document.querySelectorAll('[data-nav-screen]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const screen = btn.getAttribute('data-nav-screen');
        this.navigateTo(screen);
      });
    });

    // Language dropdown
    document.getElementById('lang-select')?.addEventListener('change', (e) => {
      this.setLanguage(e.target.value);
    });

    // Device switcher buttons
    document.querySelectorAll('.device-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        this.setDeviceMode(mode);
      });
    });

    // Sound toggle
    document.getElementById('sound-toggle-btn')?.addEventListener('click', (e) => {
      const isEnabled = sound.toggle();
      const icon = document.getElementById('sound-toggle-icon');
      if (icon) {
        icon.innerHTML = isEnabled ? '🔔 Sound ON' : '🔕 Sound OFF';
      }
      this.showToast(isEnabled ? 'Sound effects enabled' : 'Sound effects muted');
    });

    // Quick Presentation Tour Flow selector
    document.getElementById('demo-flow-select')?.addEventListener('change', (e) => {
      const flow = e.target.value;
      this.runDemoFlow(flow);
    });

    // Welcome Screen Buttons
    document.getElementById('btn-welcome-demo')?.addEventListener('click', () => {
      sound.playSuccess();
      this.isLoggedIn = true;
      this.showToast('Logged in as Disha Patil (Demo Mode)');
      this.navigateTo('screen-home');
    });

    document.getElementById('btn-welcome-login')?.addEventListener('click', () => {
      sound.playTap();
      this.navigateTo('screen-home');
    });

    // Live search input
    const searchInput = document.getElementById('search-screen-input');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        this.renderSearchScreen();
      });
    }

    // Search suggestion pills
    document.querySelectorAll('.search-suggestion-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const query = pill.getAttribute('data-query');
        if (searchInput) {
          searchInput.value = query;
          this.renderSearchScreen();
        }
      });
    });

    // Share Modal Actions
    document.getElementById('btn-create-share-link')?.addEventListener('click', () => {
      this.generateShareLink();
    });

    document.getElementById('btn-copy-share-url')?.addEventListener('click', () => {
      sound.playSuccess();
      navigator.clipboard?.writeText('https://digilocker-demo.gov/share/DL-9482-CB12');
      this.showToast('Copied secure share link to clipboard!');
    });

    // Expiry pill choices
    document.querySelectorAll('.expiry-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.expiry-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.shareExpiry = pill.getAttribute('data-expiry');
      });
    });

    // Verification Scan Trigger
    document.getElementById('btn-trigger-scan')?.addEventListener('click', () => {
      this.simulateQRScanVerification();
    });

    // Upload simulation trigger
    document.getElementById('btn-trigger-upload-file')?.addEventListener('click', () => {
      this.simulateFileUpload('Degree_Certificate.pdf');
    });

    // Document Details action buttons
    document.getElementById('btn-details-view-full')?.addEventListener('click', () => {
      this.navigateTo('screen-doc-preview', { docId: this.selectedDoc.id });
    });

    document.getElementById('btn-details-share')?.addEventListener('click', () => {
      this.openShareModal(this.selectedDoc);
    });

    document.getElementById('btn-details-verify')?.addEventListener('click', () => {
      this.navigateTo('screen-qr-display', { docId: this.selectedDoc.id });
    });

    document.getElementById('btn-details-download')?.addEventListener('click', () => {
      sound.playSuccess();
      this.showToast(`Downloaded ${this.selectedDoc.title} (Encrypted Demo PDF)`);
    });

    // Marksheet preview buttons
    document.getElementById('btn-preview-share')?.addEventListener('click', () => {
      this.openShareModal(this.selectedDoc);
    });

    document.getElementById('btn-preview-close')?.addEventListener('click', () => {
      this.navigateTo('screen-doc-details', { docId: this.selectedDoc.id });
    });

    // Modal Close Buttons
    document.querySelectorAll('.modal-close-btn, .btn-modal-cancel').forEach(btn => {
      btn.addEventListener('click', () => this.closeAllModals());
    });

    // Open Case Study Spec
    document.getElementById('btn-open-case-study')?.addEventListener('click', () => {
      this.openCaseStudyModal();
    });
  }

  runDemoFlow(flowId) {
    if (flowId === 'flow-share') {
      this.navigateTo('screen-home');
      setTimeout(() => this.navigateTo('screen-categories'), 200);
      setTimeout(() => this.navigateTo('screen-doc-details', { docId: 'doc-12-marksheet' }), 500);
      setTimeout(() => this.openShareModal(this.documents[0]), 800);
    } else if (flowId === 'flow-verify') {
      this.navigateTo('screen-verify');
      setTimeout(() => this.simulateQRScanVerification(), 400);
    } else if (flowId === 'flow-upload') {
      this.navigateTo('screen-home');
      setTimeout(() => this.openUploadModal(), 300);
    } else if (flowId === 'flow-search') {
      this.navigateTo('screen-search');
      const input = document.getElementById('search-screen-input');
      if (input) {
        input.value = 'marksheet';
        this.renderSearchScreen();
      }
    } else if (flowId === 'flow-preview') {
      this.selectedDoc = this.documents[0];
      this.navigateTo('screen-doc-preview', { docId: 'doc-12-marksheet' });
    } else if (flowId === 'flow-case-study') {
      this.openCaseStudyModal();
    }
  }

  // ==========================================
  // HELPERS
  // ==========================================
  getCategoryName(cat) {
    if (this.currentLanguage === 'hi' && cat.nameHi) return cat.nameHi;
    if (this.currentLanguage === 'mr' && cat.nameMr) return cat.nameMr;
    return cat.name;
  }

  getDocTitle(doc) {
    if (this.currentLanguage === 'hi' && doc.titleHi) return doc.titleHi;
    if (this.currentLanguage === 'mr' && doc.titleMr) return doc.titleMr;
    return doc.title;
  }

  getActivityTitle(act) {
    if (this.currentLanguage === 'hi' && act.titleHi) return act.titleHi;
    if (this.currentLanguage === 'mr' && act.titleMr) return act.titleMr;
    return act.title;
  }

  getUserName() {
    if (this.currentLanguage === 'hi') return DEMO_USER.nameHi;
    if (this.currentLanguage === 'mr') return DEMO_USER.nameMr;
    return DEMO_USER.name;
  }
}

// Initialize on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.app = new DigiLockerApp();
});
