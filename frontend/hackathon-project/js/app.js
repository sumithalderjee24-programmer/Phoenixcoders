/**
 * CampusFix Core Application Logic
 */

// --- Impact Score Formula ---
// score = (upvotes x 3) + (severity_weight x 5) + min(days_open, 30)
// severity weight Low=1, Medium=2, High=3
function calculateImpactScore(upvotes, severity, daysOpen) {
  const sevWeight = { 'Low': 1, 'Medium': 2, 'High': 3 }[severity] || 1;
  const cappedDays = Math.min(Math.max(0, daysOpen || 0), 30);
  return (upvotes * 3) + (sevWeight * 5) + cappedDays;
}

function getImpactTier(score) {
  if (score >= 60) return 'critical';
  if (score >= 40) return 'elevated';
  return 'routine';
}

function getDaysSince(dateString, today) {
  if (!dateString) return 0;
  const past = new Date(dateString);
  const now = today ? new Date(today) : new Date();
  const diffTime = Math.max(0, now - past);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

// Initial Seed Issues
const initialSeedIssues = [
  { id: 1, title: "Ceiling fans not working in Room 204, CS Block", category: "Electrical", severity: "High", location: "CS Block, Room 204", status: "Open", upvotes: 14, reportedAt: "2026-09-22", reportedBy: "Aarav Sen", desc: "None of the fans in this room have been working since yesterday. It gets very hot during afternoon lectures." },
  { id: 2, title: "Wi-Fi drops every evening in Boys Hostel Block C", category: "Wi-Fi", severity: "High", location: "Boys Hostel, Block C", status: "In Progress", upvotes: 22, reportedAt: "2026-09-25", reportedBy: "Karan Mehta", desc: "The connection completely drops around 8 PM every day. Making it impossible to do assignments." },
  { id: 3, title: "Washroom tap broken on 2nd floor of Library", category: "Washroom", severity: "Medium", location: "Central Library, 2nd floor", status: "Open", upvotes: 9, reportedAt: "2026-09-14", reportedBy: "Riya Banerjee", desc: "Water is constantly leaking from the left-most washbasin tap. Needs a new washer." },
  { id: 4, title: "Workstation 14 monitor flickering in Networks Lab", category: "Lab Equipment", severity: "Medium", location: "Networks Lab", status: "In Progress", upvotes: 6, reportedAt: "2026-09-19", reportedBy: "Sneha Rao", desc: "The screen flickers badly. Tried changing the HDMI cable but the issue persists with the monitor itself." },
  { id: 5, title: "Broken benches outside Mechanical canteen", category: "Furniture", severity: "Low", location: "Mechanical Dept canteen", status: "Open", upvotes: 4, reportedAt: "2026-08-29", reportedBy: "Dev Patel", desc: "Two of the wooden benches are cracked and dangerous to sit on." },
  { id: 6, title: "Water cooler leaking near Admin Block", category: "Plumbing", severity: "Low", location: "Admin Block, ground floor", status: "Resolved", upvotes: 5, reportedAt: "2026-09-26", resolvedAt: "2026-10-01", reportedBy: "Riya Banerjee", desc: "Pool of water forming around the cooler." }
];

// Persistent localStorage helper
function getStoredIssues() {
  try {
    const raw = localStorage.getItem('campusfix_issues');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Storage read error:', e);
  }
  saveStoredIssues(initialSeedIssues);
  return [...initialSeedIssues];
}

function saveStoredIssues(issues) {
  try {
    localStorage.setItem('campusfix_issues', JSON.stringify(issues));
  } catch (e) {
    console.error('Storage write error:', e);
  }
}

// Compute score and tier for an issue
function enrichIssue(i) {
  i.daysOpen = getDaysSince(i.reportedAt);
  i.score = calculateImpactScore(i.upvotes || 0, i.severity || 'Low', i.daysOpen);
  i.tier = getImpactTier(i.score);
  return i;
}

// Global active issues array (read & sorted)
function getPreparedIssues() {
  const issues = getStoredIssues();
  issues.forEach(enrichIssue);
  issues.sort((a, b) => b.score - a.score);
  return issues;
}

// Global mockIssues reference for backwards-compatibility
let mockIssues = getPreparedIssues();

// Theme Initializer (Sun / Moon)
function applyCurrentTheme() {
  const saved = localStorage.getItem('campusfix_theme') || 'bright';
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}
applyCurrentTheme();

function toggleGlobalTheme() {
  const current = localStorage.getItem('campusfix_theme') || 'bright';
  const next = current === 'dark' ? 'bright' : 'dark';
  localStorage.setItem('campusfix_theme', next);
  applyCurrentTheme();
  window.dispatchEvent(new CustomEvent('theme-changed', { detail: next }));
  return next;
}

// --- Alpine Data Store ---
document.addEventListener('alpine:init', () => {

  Alpine.store('theme', {
    mode: localStorage.getItem('campusfix_theme') || 'bright',
    toggle() {
      this.mode = toggleGlobalTheme();
    }
  });

  // Profile & Auth Store for Navbar Logo and Verification
  Alpine.store('auth', {
    user: {
      name: 'Hriddesh Roy',
      major: 'Computer Science',
      role: 'Student',
      studentId: 'CS2026-9042',
      avatar: null,
      idCard: null,
      signature: null
    },
    init() {
      try {
        const saved = localStorage.getItem('campusfix_profile');
        if (saved) {
          this.user = { ...this.user, ...JSON.parse(saved) };
        }
      } catch (e) {}
    },
    get initials() {
      if (!this.user.name) return 'HR';
      return this.user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    },
    save(data) {
      this.user = { ...this.user, ...data };
      try {
        localStorage.setItem('campusfix_profile', JSON.stringify(this.user));
      } catch (e) {}
    }
  });
  
  Alpine.data('issueFeed', () => ({
    issues: [],
    searchQuery: '',
    filterCategory: '',
    filterStatus: '',
    filterSeverity: '',
    loading: true,
    
    init() {
      this.refreshIssues();
      setTimeout(() => this.loading = false, 400);
      window.addEventListener('storage', () => this.refreshIssues());
    },

    refreshIssues() {
      this.issues = getPreparedIssues();
      mockIssues = this.issues;
    },
    
    get filteredIssues() {
      return this.issues.filter(i => {
        const matchesSearch = !this.searchQuery ||
                              i.title.toLowerCase().includes(this.searchQuery.toLowerCase()) || 
                              (i.desc && i.desc.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
                              (i.location && i.location.toLowerCase().includes(this.searchQuery.toLowerCase()));
        const matchesCat = this.filterCategory === '' || i.category === this.filterCategory;
        const matchesStat = this.filterStatus === '' || i.status === this.filterStatus;
        const matchesSev = this.filterSeverity === '' || i.severity === this.filterSeverity;
        return matchesSearch && matchesCat && matchesStat && matchesSev;
      });
    },

    clearFilters() {
      this.searchQuery = ''; this.filterCategory = ''; this.filterStatus = ''; this.filterSeverity = '';
    },
    
    toggleUpvote(issue) {
      if(issue.reportedBy === 'Riya Banerjee') return;
      
      const all = getStoredIssues();
      const idx = all.findIndex(x => x.id === issue.id);
      if(idx === -1) return;
      
      if (!all[idx].hasUpvoted) {
        all[idx].upvotes = (all[idx].upvotes || 0) + 1;
        all[idx].hasUpvoted = true;
      } else {
        all[idx].upvotes = Math.max(0, (all[idx].upvotes || 0) - 1);
        all[idx].hasUpvoted = false;
      }
      
      saveStoredIssues(all);
      this.refreshIssues();
      
      const updated = this.issues.find(x => x.id === issue.id);
      if(updated && updated.hasUpvoted) {
        window.dispatchEvent(new CustomEvent('toast', { detail: "You're now supporting this issue." }));
      }
    }
  }));

  Alpine.data('issueDetail', (issueIdStr) => ({
    issue: null,
    supported: false,
    chart: null,
    newEntries: [],
    
    init() {
      const id = parseInt(issueIdStr, 10);
      const all = getPreparedIssues();
      this.issue = all.find(i => i.id === id) || all[0];
      this.supported = Boolean(this.issue.hasUpvoted || this.issue.id === 2 || this.issue.id === 4);
      
      this.$nextTick(() => {
        this.renderChart();
      });

      window.addEventListener('new-timeline-entry', (e) => {
        const entry = {
          id: Date.now(),
          status: e.detail.status,
          remark: e.detail.remark,
          date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        };
        this.newEntries.push(entry);
        this.issue.status = e.detail.status;
        
        const allIssues = getStoredIssues();
        const fIdx = allIssues.findIndex(x => x.id === this.issue.id);
        if (fIdx !== -1) {
          allIssues[fIdx].status = e.detail.status;
          saveStoredIssues(allIssues);
        }
      });
    },
    
    get isOwn() { return this.issue && this.issue.reportedBy === 'Riya Banerjee'; },
    
    toggleSupport() {
      if(this.isOwn || !this.issue) return;
      
      const all = getStoredIssues();
      const idx = all.findIndex(x => x.id === this.issue.id);
      
      if(this.supported) {
        this.issue.upvotes = Math.max(0, (this.issue.upvotes || 0) - 1);
        this.supported = false;
        if(idx !== -1) {
          all[idx].upvotes = this.issue.upvotes;
          all[idx].hasUpvoted = false;
        }
      } else {
        this.issue.upvotes = (this.issue.upvotes || 0) + 1;
        this.supported = true;
        if(idx !== -1) {
          all[idx].upvotes = this.issue.upvotes;
          all[idx].hasUpvoted = true;
        }
        window.dispatchEvent(new CustomEvent('toast', { detail: "You're now supporting this issue." }));
      }
      
      saveStoredIssues(all);
      enrichIssue(this.issue);
      this.updateChart();
    },
    
    renderChart() {
      const ctx = document.getElementById('scoreChart');
      if(!ctx || typeof Chart === 'undefined') return;
      
      const v_upvotes = (this.issue.upvotes || 0) * 3;
      const v_sev = { 'Low': 1, 'Medium': 2, 'High': 3 }[this.issue.severity] * 5;
      const v_time = Math.min(this.issue.daysOpen || 0, 30);
      
      if(this.chart) {
        this.chart.destroy();
      }

      this.chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Score Breakdown'],
          datasets: [
            { label: 'Community (x3)', data: [v_upvotes], backgroundColor: '#4F46E5', borderRadius: 4 },
            { label: 'Severity (x5)', data: [v_sev], backgroundColor: '#F59E0B', borderRadius: 4 },
            { label: 'Time (max 30)', data: [v_time], backgroundColor: '#6B7280', borderRadius: 4 }
          ]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          scales: { x: { stacked: true, max: 100, display: false }, y: { stacked: true, display: false } },
          plugins: { 
            legend: { 
              position: 'bottom', 
              labels: { usePointStyle: true, boxWidth: 8, font: { family: 'DM Sans', size: 11 } } 
            }, 
            tooltip: { bodyFont: { family: 'DM Sans' } } 
          },
          animation: { duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 800 }
        }
      });
    },
    
    updateChart() {
      if(!this.chart) return;
      const v_upvotes = (this.issue.upvotes || 0) * 3;
      this.chart.data.datasets[0].data = [v_upvotes];
      this.chart.update();
    }
  }));

  // Jaccard similarity for duplicate detection
  function getSimilarity(s1, s2) {
    if(!s1 || !s2) return 0;
    const tokenize = s => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter(w => w.length > 2 && !['the','and','for','this'].includes(w));
    const t1 = new Set(tokenize(s1));
    const t2 = new Set(tokenize(s2));
    if(t1.size === 0 || t2.size === 0) return 0;
    const intersection = new Set([...t1].filter(x => t2.has(x)));
    const union = new Set([...t1, ...t2]);
    return intersection.size / union.size;
  }

  Alpine.data('reportForm', () => ({
    title: '', desc: '', category: '', location: '', severity: '',
    matches: [], dismissed: false,
    
    // File state
    imagePreview: null,
    imageError: '',
    isDragging: false,
    
    // Validation state
    errors: {},
    submitted: false,
    
    handleFile(e) {
      const file = e.target.files ? e.target.files[0] : (e.dataTransfer ? e.dataTransfer.files[0] : null);
      if (!file) return;
      
      this.imageError = '';
      
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        this.imageError = 'File must be JPG, PNG, or WEBP.';
        this.imagePreview = null;
        return;
      }
      
      if (file.size > 2 * 1024 * 1024) {
        this.imageError = 'File must be under 2 MB.';
        this.imagePreview = null;
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (ev) => {
        this.imagePreview = ev.target.result;
      };
      reader.readAsDataURL(file);
    },
    
    validate() {
      this.errors = {};
      if (this.title.trim().length < 5 || this.title.trim().length > 120) {
        this.errors.title = "Title must be between 5 and 120 characters.";
      }
      if (!this.category) {
        this.errors.category = "Please select a category.";
      }
      if (this.location.trim().length < 3 || this.location.length > 100) {
        this.errors.location = "Location must be between 3 and 100 characters.";
      }
      if (!this.severity) {
        this.errors.severity = "Please select a severity.";
      }
      if (this.desc.trim().length < 20 || this.desc.length > 2000) {
        this.errors.desc = "Description must be between 20 and 2000 characters.";
      }
      if (this.imageError) {
        this.errors.image = this.imageError;
      }
      
      return Object.keys(this.errors).length === 0;
    },
    
    submitForm() {
      this.submitted = true;
      if (!this.validate()) return;
      
      const all = getStoredIssues();
      const newId = Date.now();
      const todayStr = new Date().toISOString().split('T')[0];
      
      const newIssue = {
        id: newId,
        title: this.title.trim(),
        category: this.category,
        location: this.location.trim(),
        severity: this.severity,
        desc: this.desc.trim(),
        image: this.imagePreview || null,
        status: 'Open',
        upvotes: 0,
        reportedAt: todayStr,
        reportedBy: 'You (Student)'
      };
      
      all.unshift(newIssue);
      saveStoredIssues(all);
      mockIssues = getPreparedIssues();
      
      // Navigate to the newly submitted issue's detail page
      window.location.href = `issue_detail.html?id=${newId}`;
    },
    
    checkDuplicates() {
      if(this.title.length < 5 || this.dismissed) return;
      
      const all = getStoredIssues();
      let bestMatches = [];
      all.forEach(i => {
        let sim = getSimilarity(this.title, i.title);
        if(this.category && i.category === this.category) sim += 0.15;
        if(sim > 0.25) {
          bestMatches.push({ ...i, matchPct: Math.round(sim * 100) });
        }
      });
      
      this.matches = bestMatches.sort((a,b) => b.matchPct - a.matchPct).slice(0,2);
    }
  }));

  Alpine.data('adminDash', () => ({
    issues: [],
    filterCategory: '', filterStatus: '', filterSeverity: '',
    
    init() {
      this.refreshIssues();
    },

    refreshIssues() {
      this.issues = getPreparedIssues();
    },
    
    get filtered() {
      return this.issues.filter(i => {
        return (this.filterCategory === '' || i.category === this.filterCategory) &&
               (this.filterStatus === '' || i.status === this.filterStatus) &&
               (this.filterSeverity === '' || i.severity === this.filterSeverity);
      });
    },
    
    get stats() {
      return {
        total: this.issues.length,
        open: this.issues.filter(i=>i.status==='Open').length,
        prog: this.issues.filter(i=>i.status==='In Progress').length,
        res: this.issues.filter(i=>i.status==='Resolved').length,
        highAlerts: this.issues.filter(i=> (i.score || 0) >= 60).length
      }
    },
    
    isOverdue(issue) {
      if(issue.status !== 'Open') return false;
      const limits = { 'High': 3, 'Medium': 7, 'Low': 14 };
      return (issue.daysOpen || 0) > (limits[issue.severity] || 7);
    }
  }));

  Alpine.data('adminAction', () => ({
    newStatus: 'In Progress',
    remark: '',
    
    saveUpdate() {
      if(!this.remark.trim()) return;
      window.dispatchEvent(new CustomEvent('new-timeline-entry', {
        detail: { status: this.newStatus, remark: this.remark.trim() }
      }));
      window.dispatchEvent(new CustomEvent('toast', { detail: "Status & Official Remark recorded!" }));
      this.remark = '';
    }
  }));

  Alpine.data('toastManager', () => ({
    toasts: [],
    init() {
      window.addEventListener('toast', (e) => {
        const id = Date.now();
        this.toasts.push({ id, msg: e.detail });
        setTimeout(() => { this.toasts = this.toasts.filter(t => t.id !== id); }, 3000);
      });
    }
  }));
});
