const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyPg8Vcuh5ewXgT5sB9q1bo2_z2CbH2_e7dkzpZ_gnSxQu4ZY6e8OAstK5H2woYDGItOQ/exec';

// DOM Elements
const issueList = document.getElementById('issueList');
const modal = document.getElementById('issueFormModal');
const issueForm = document.getElementById('issueForm');
const openBtn = document.getElementById('openFormBtn');
const closeBtn = document.querySelector('.close');
const refreshBtn = document.getElementById('refreshBtn');
const imgInput = document.getElementById('imageInput');
const preview = document.getElementById('preview');
const submitBtn = issueForm.querySelector('button[type="submit"]');

// State
let imgBase64 = '';
let isLoading = false;

// Fetch and render issues
async function loadIssues() {
  if (isLoading) return;
  
  try {
    // Show loading state
    isLoading = true;
    refreshBtn.classList.add('loading');
    
    // Create loading indicator
    const loadingContainer = document.createElement('div');
    loadingContainer.className = 'loading-container';
    loadingContainer.innerHTML = '<div class="loader"></div>';
    issueList.appendChild(loadingContainer);
    
    // Fetch data
    const res = await fetch(`${WEB_APP_URL}?action=getIssues`);
    const data = await res.json();
    
    // Clear the list
    issueList.innerHTML = '';
    
    // Show empty state if no issues
    if (data.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p>No issues reported yet</p>
        <small>Click the + button to report a new issue</small>
      `;
      issueList.appendChild(emptyState);
      return;
    }
    
    // Render each issue
    data.forEach(issue => {
      // Determine status class
      const statusClass = getStatusClass(issue.Status);
      
      const card = document.createElement('div');
      card.className = 'issue-card';
      card.innerHTML = `
        <h3>
          ${issue.IssueType}
          <span class="issue-status ${statusClass}">${issue.Status}</span>
        </h3>
        <small>Reported by ${issue.ReporterName} (${issue.ReporterRole}) on ${formatDate(issue.Timestamp)}</small>
        <p>${issue.Description}</p>
        <img src="${issue.ImageURL}" alt="Issue image" loading="lazy" />
      `;
      
      // Add animation effect
      card.style.animation = 'fadeIn 0.3s ease-in-out';
      
      issueList.appendChild(card);
    });
  } catch (error) {
    console.error('Error loading issues:', error);
    showToast('Failed to load issues. Please try again.');
    
    // Show error state
    issueList.innerHTML = `
      <div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#e74c3c">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p>Error loading issues</p>
        <small>Check your connection and try again</small>
      </div>
    `;
  } finally {
    // Remove loading state
    isLoading = false;
    refreshBtn.classList.remove('loading');
  }
}

// Helper function to format date
function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Helper function to get status class
function getStatusClass(status) {
  switch(status) {
    case 'New': return 'status-new';
    case 'In Progress': return 'status-in-progress';
    case 'Resolved': return 'status-resolved';
    default: return 'status-new';
  }
}

// Toast notification
function showToast(message, type = 'info') {
  // Create toast container if it doesn't exist
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  // Add to container
  toastContainer.appendChild(toast);
  
  // Remove after animation
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Form modal logic
function openModal() {
  modal.style.display = 'block';
  setTimeout(() => modal.classList.add('show'), 10);
  document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closeModal() {
  modal.classList.remove('show');
  setTimeout(() => {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }, 300);
}

// Image preview & base64
function handleImageInput(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  // Validate file type
  if (!file.type.match('image.*')) {
    showToast('Please select an image file', 'error');
    imgInput.value = '';
    return;
  }
  
  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    showToast('Image size should be less than 5MB', 'error');
    imgInput.value = '';
    return;
  }
  
  const reader = new FileReader();
  reader.onload = e => { 
    imgBase64 = e.target.result; 
    preview.src = imgBase64;
    preview.classList.add('show');
  };
  reader.readAsDataURL(file);
}

// Submit form
async function submitIssueForm(e) {
  e.preventDefault();
  
  if (isLoading) return;
  
  try {
    // Form validation
    const form = e.target;
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
      if (!field.value) {
        isValid = false;
        field.style.borderColor = 'var(--danger)';
        
        // Reset border on input
        field.addEventListener('input', function() {
          this.style.borderColor = '';
        }, { once: true });
      }
    });
    
    if (!isValid) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    
    // Show loading state
    isLoading = true;
    submitBtn.classList.add('loading');
    submitBtn.textContent = 'Submitting...';
    
    // Prepare payload
    const payload = {
      action: 'submitIssue',
      reporterName: form.reporterName.value,
      reporterRole: form.reporterRole.value,
      issueType: form.issueType.value,
      description: form.description.value,
      imageData: imgBase64
    };
    
    // Submit data
    await fetch(WEB_APP_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    // Reset form
    form.reset();
    preview.src = '';
    preview.classList.remove('show');
    imgBase64 = '';
    
    // Close modal and refresh list
    closeModal();
    showToast('Issue reported successfully', 'success');
    
    // Reload issues after a short delay
    setTimeout(loadIssues, 1000);
    
  } catch (error) {
    console.error('Error submitting issue:', error);
    showToast('Failed to submit issue. Please try again.', 'error');
  } finally {
    // Remove loading state
    isLoading = false;
    submitBtn.classList.remove('loading');
    submitBtn.textContent = 'Submit';
  }
}

// Initialize
function init() {
  // Event listeners
  refreshBtn.addEventListener('click', loadIssues);
  openBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  imgInput.addEventListener('change', handleImageInput);
  issueForm.addEventListener('submit', submitIssueForm);
  
  // Close modal on outside click
  window.addEventListener('click', e => {
    if (e.target === modal) closeModal();
  });
  
  // Support for Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.style.display === 'block') closeModal();
  });
  
  // Load issues on page load
  loadIssues();
  
  // Add toast container
  const toastContainer = document.createElement('div');
  toastContainer.className = 'toast-container';
  document.body.appendChild(toastContainer);
}

// Run initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', init);