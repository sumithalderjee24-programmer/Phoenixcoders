/**
 * CampusFix Core Application Logic
 */

// --- Impact Score Formula ---
// score = (upvotes x 3) + (severity_weight x 5) + min(days_open, 30)
// severity weight Low=1, Medium=2, High=3
function calculateImpactScore(upvotes, severity, daysOpen) {
  const sevWeight = { 'Low': 1, 'Medium': 2, 'High': 3 }[severity] || 1;
  const cappedDays = Math.min(daysOpen, 30);
  return (upvotes * 3) + (sevWeight * 5) + cappedDays;
}

function getImpactTier(score) {
  if (score >= 60) return 'critical';
  if (score >= 40) return 'elevated';
  return 'routine';
}

function getDaysSince(dateString, today = '2026-10-04') {
  const diffTime = Math.abs(new Date(today) - new Date(dateString));
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

// Mock Data
const mockIssues = [
  { id: 1, title: "Ceiling fans not working in Room 204, CS Block", category: "Electrical", severity: "High", location: "CS Block, Room 204", status: "Open", upvotes: 14, reportedAt: "2026-09-22", reportedBy: "Aarav Sen", desc: "None of the fans in this room have been working since yesterday. It gets very hot during afternoon lectures." },
  { id: 2, title: "Wi-Fi drops every evening in Boys Hostel Block C", category: "Wi-Fi", severity: "High", location: "Boys Hostel, Block C", status: "In Progress", upvotes: 22, reportedAt: "2026-09-25", reportedBy: "Karan Mehta", desc: "The connection completely drops around 8 PM every day. Making it impossible to do assignments." },
  { id: 3, title: "Washroom tap broken on 2nd floor of Library", category: "Washroom", severity: "Medium", location: "Central Library, 2nd floor", status: "Open", upvotes: 9, reportedAt: "2026-09-14", reportedBy: "Riya Banerjee", desc: "Water is constantly leaking from the left-most washbasin tap. Needs a new washer." },
  { id: 4, title: "Workstation 14 monitor flickering in Networks Lab", category: "Lab Equipment", severity: "Medium", location: "Networks Lab", status: "In Progress", upvotes: 6, reportedAt: "2026-09-19", reportedBy: "Sneha Rao", desc: "The screen flickers badly. Tried changing the HDMI cable but the issue persists with the monitor itself." },
  { id: 5, title: "Broken benches outside Mechanical canteen", category: "Furniture", severity: "Low", location: "Mechanical Dept canteen", status: "Open", upvotes: 4, reportedAt: "2026-08-29", reportedBy: "Dev Patel", desc: "Two of the wooden benches are cracked and dangerous to sit on." },
  { id: 6, title: "Water cooler leaking near Admin Block", category: "Plumbing", severity: "Low", location: "Admin Block, ground floor", status: "Resolved", upvotes: 5, reportedAt: "2026-09-26", resolvedAt: "2026-10-01", reportedBy: "Riya Banerjee", desc: "Pool of water forming around the cooler." }
];

// Enrich issues with scores
mockIssues.forEach(i => {
  i.daysOpen = getDaysSince(i.reportedAt);
  i.score = calculateImpactScore(i.upvotes, i.severity, i.daysOpen);
  i.tier = getImpactTier(i.score);
});

// Sort descending
mockIssues.sort((a, b) => b.score - a.score);

// --- Alpine Data Store ---
document.addEventListener('alpine:init', () => {
  
  Alpine.data('issueFeed', () => ({
    issues: [...mockIssues],
    searchQuery: '',
    filterCategory: '',
    filterStatus: '',
    filterSeverity: '',
    loading: true,
    
    init() {
      setTimeout(() => this.loading = false, 600);
    },
    
    get filteredIssues() {
      return this.issues.filter(i => {
        const matchesSearch = i.title.toLowerCase().includes(this.searchQuery.toLowerCase()) || 
                              i.desc.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                              i.location.toLowerCase().includes(this.searchQuery.toLowerCase());
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
      if(issue.reportedBy === 'Riya Banerjee') return; // Cannot upvote own
      
      const idx = this.issues.findIndex(x => x.id === issue.id);
      if(idx === -1) return;
      
      // Simulate toggle state logic (just adding 1 for demo simplicity, real app would track user ID)
      if (!issue.hasUpvoted) {
        this.issues[idx].upvotes++;
        this.issues[idx].hasUpvoted = true;
      } else {
        this.issues[idx].upvotes--;
        this.issues[idx].hasUpvoted = false;
      }
      
      this.issues[idx].score = calculateImpactScore(this.issues[idx].upvotes, this.issues[idx].severity, this.issues[idx].daysOpen);
      this.issues[idx].tier = getImpactTier(this.issues[idx].score);
      // Re-sort
      this.issues.sort((a, b) => b.score - a.score);
      
      if(this.issues[idx].hasUpvoted) {
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
      const id = parseInt(issueIdStr);
      this.issue = mockIssues.find(i => i.id === id) || mockIssues[0]; // fallback
      // Riya supports #2 and #4
      this.supported = (this.issue.id === 2 || this.issue.id === 4);
      
      this.$nextTick(() => {
        this.renderChart();
      });

      window.addEventListener('new-timeline-entry', (e) => {
        this.newEntries.push({
          id: Date.now(),
          status: e.detail.status,
          remark: e.detail.remark,
          date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        });
        this.issue.status = e.detail.status;
      });
    },
    
    get isOwn() { return this.issue.reportedBy === 'Riya Banerjee'; },
    
    toggleSupport() {
      if(this.isOwn) return;
      if(this.supported) {
        this.issue.upvotes--;
        this.supported = false;
      } else {
        this.issue.upvotes++;
        this.supported = true;
        window.dispatchEvent(new CustomEvent('toast', { detail: "You're now supporting this issue." }));
      }
      this.issue.score = calculateImpactScore(this.issue.upvotes, this.issue.severity, this.issue.daysOpen);
      this.issue.tier = getImpactTier(this.issue.score);
      this.updateChart();
    },
    
    renderChart() {
      const ctx = document.getElementById('scoreChart');
      if(!ctx) return;
      
      const v_upvotes = this.issue.upvotes * 3;
      const v_sev = { 'Low': 1, 'Medium': 2, 'High': 3 }[this.issue.severity] * 5;
      const v_time = Math.min(this.issue.daysOpen, 30);
      
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
          plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, font: { family: 'DM Sans' } } }, tooltip: { bodyFont: { family: 'DM Sans' } } },
          animation: { duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1000 }
        }
      });
    },
    
    updateChart() {
      if(!this.chart) return;
      const v_upvotes = this.issue.upvotes * 3;
      this.chart.data.datasets[0].data = [v_upvotes];
      this.chart.update();
    }
  }));

  // Simple token Jaccard similarity
  function getSimilarity(s1, s2) {
    const tokenize = s => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter(w => w.length > 2 && !['the','and','for','this'].includes(w));
    const t1 = new Set(tokenize(s1));
    const t2 = new Set(tokenize(s2));
    if(t1.size===0 || t2.size===0) return 0;
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
      if (this.title.length < 5 || this.title.length > 120) this.errors.title = "Title must be between 5 and 120 characters.";
      if (!this.category) this.errors.category = "Please select a category.";
      if (this.location.length < 3 || this.location.length > 100) this.errors.location = "Location must be between 3 and 100 characters.";
      if (!this.severity) this.errors.severity = "Please select a severity.";
      if (this.desc.length < 20 || this.desc.length > 2000) this.errors.desc = "Description must be between 20 and 2000 characters.";
      if (this.imageError) this.errors.image = this.imageError;
      
      return Object.keys(this.errors).length === 0;
    },
    
    submitForm() {
      this.submitted = true;
      if (this.validate()) {
        window.location.href = 'issue_detail.html?id=1';
      }
    },
    
    checkDuplicates() {
      if(this.title.length < 5 || this.dismissed) return;
      
      let bestMatches = [];
      mockIssues.forEach(i => {
        let sim = getSimilarity(this.title, i.title);
        if(this.category && i.category === this.category) sim += 0.15; // Category bonus
        if(sim > 0.25) {
          bestMatches.push({ ...i, matchPct: Math.round(sim * 100) });
        }
      });
      
      this.matches = bestMatches.sort((a,b) => b.matchPct - a.matchPct).slice(0,2);
    }
  }));

  Alpine.data('adminDash', () => ({
    issues: [...mockIssues],
    filterCategory: '', filterStatus: '', filterSeverity: '',
    
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
        highAlerts: this.issues.filter(i=>i.score >= 60).length
      }
    },
    
    isOverdue(issue) {
      if(issue.status !== 'Open') return false;
      const limits = { 'High': 3, 'Medium': 7, 'Low': 14 };
      return issue.daysOpen > (limits[issue.severity] || 7);
    }
  }));

  Alpine.data('adminAction', () => ({
    newStatus: 'In Progress',
    remark: '',
    
    saveUpdate() {
      if(!this.remark) return;
      window.dispatchEvent(new CustomEvent('new-timeline-entry', {
        detail: { status: this.newStatus, remark: this.remark }
      }));
      window.dispatchEvent(new CustomEvent('toast', { detail: "Issue updated successfully." }));
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
