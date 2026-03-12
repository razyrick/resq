// API Configuration
const API_BASE_URL = 'https://greenyellow-hawk-206191.hostingersite.com';
let userProfile = null;
let currentUsers = [];
let currentPagination = {};
let currentFilters = {
    status: 'pending',
    search: '',
    page: 1,
    limit: 20
};
let currentUserId = null;
let searchTimeout = null;

// Get stored user data from localStorage
function getStoredUserData() {
    const userDataStr = localStorage.getItem('userData');
    const userRole = localStorage.getItem('userRole');
    const csrfToken = localStorage.getItem('csrf_token');
    
    return userDataStr ? {
        user: JSON.parse(userDataStr),
        role: userRole,
        csrfToken: csrfToken
    } : null;
}

// API Headers
function getHeaders() {
    const storedData = getStoredUserData();
    if (!storedData) {
        throw new Error('No user data found. Please login again.');
    }

    return {
        'Authorization': `Bearer ${storedData.user.api_key}`,
        'X-CSRF-Token': storedData.csrfToken,
        'Content-Type': 'application/json'
    };
}

// API Request Helper
const apiRequest = async (endpoint, options = {}) => {
    const defaultOptions = {
        headers: getHeaders()
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API Request failed:', error);
        throw error;
    }
};

// Load users from API
async function loadUsers() {
    showLoading();
    try {
        // Build query string from filters
        const queryParams = new URLSearchParams();
        if (currentFilters.status) queryParams.append('status', currentFilters.status);
        if (currentFilters.search) queryParams.append('search', currentFilters.search);
        queryParams.append('page', currentFilters.page);
        queryParams.append('limit', currentFilters.limit);

        const data = await apiRequest(`/barangay/users?${queryParams.toString()}`);
        
        if (data.success && data.data) {
            currentUsers = data.data;
            currentPagination = data.pagination || {};
            
            updateStats(data.data);
            renderUsers(data.data);
            updatePaginationControls();
            showContent();
        } else {
            throw new Error(data.error || 'Failed to load users');
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showError('Failed to load users: ' + error.message);
    }
}

// Update user status
async function updateUserStatus(userId, status) {
    showLoadingOverlay();
    try {
        const response = await apiRequest('/barangay/users', {
            method: 'PUT',
            body: JSON.stringify({
                user_id: userId,
                status: status
            })
        });

        if (response.success) {
            return response;
        } else {
            throw new Error(response.error || 'Failed to update user status');
        }
    } catch (error) {
        console.error('Error updating user status:', error);
        throw error;
    } finally {
        hideLoadingOverlay();
    }
}

// Update statistics
function updateStats(users) {
    const totalCount = currentPagination.total_items || users.length;
    const pendingCount = users.filter(u => u.status === 'pending').length;
    const activeCount = users.filter(u => u.status === 'active').length;
    const bannedCount = users.filter(u => u.status === 'banned').length;

    document.getElementById('totalCount').textContent = totalCount;
    document.getElementById('pendingCount').textContent = pendingCount;
    document.getElementById('activeCount').textContent = activeCount;
    document.getElementById('bannedCount').textContent = bannedCount;

    document.getElementById('showingCount').textContent = users.length;
    document.getElementById('totalItems').textContent = totalCount;
}

// Render users list
function renderUsers(users) {
    const usersList = document.getElementById('usersList');
    usersList.innerHTML = '';

    if (users.length === 0) {
        usersList.innerHTML = `
            <div class="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                </div>
                <h3 class="text-lg font-semibold text-slate-900 mb-2">No Users Found</h3>
                <p class="text-slate-600">No users match your current filters.</p>
            </div>
        `;
        return;
    }

    users.forEach(user => {
        const userCard = createUserCard(user);
        usersList.appendChild(userCard);
    });
}

// Get user full name
function getUserFullName(user) {
    const middleInitial = user.middle_name ? ` ${user.middle_name.charAt(0)}.` : '';
    return `${user.first_name || ''}${middleInitial} ${user.last_name || ''}`.trim();
}

// Get user initials
function getUserInitials(user) {
    const first = user.first_name ? user.first_name.charAt(0).toUpperCase() : '';
    const last = user.last_name ? user.last_name.charAt(0).toUpperCase() : '';
    return first + last || 'U';
}

// Format date and time
function formatDateTime(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Format time ago
function formatTimeAgo(dateString) {
    if (!dateString) return 'Unknown time';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
}

// Update pagination controls
function updatePaginationControls() {
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    prevBtn.disabled = !currentPagination.has_prev;
    nextBtn.disabled = !currentPagination.has_next;
    
    prevBtn.onclick = () => {
        if (currentPagination.has_prev) {
            currentFilters.page--;
            loadUsers();
        }
    };
    
    nextBtn.onclick = () => {
        if (currentPagination.has_next) {
            currentFilters.page++;
            loadUsers();
        }
    };
}

// Create user card HTML
function createUserCard(user) {
    const card = document.createElement('div');
    card.className = 'user-card bg-white rounded-xl border border-slate-200 p-6';
    
    const statusColors = {
        pending: 'bg-yellow-100 text-yellow-700',
        active: 'bg-green-100 text-green-700',
        banned: 'bg-red-100 text-red-700'
    };

    const statusClass = statusColors[user.status] || statusColors.pending;
    const fullName = getUserFullName(user);
    const initials = getUserInitials(user);

    card.innerHTML = `
        <div class="flex items-start gap-6">
            <div class="w-16 h-16 bg-gradient-to-br from-blue-600 to-red-600 rounded-lg flex items-center justify-center text-white font-semibold text-xl flex-shrink-0">
                ${initials}
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-4 mb-3">
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <h3 class="text-xl font-bold text-slate-900">${fullName}</h3>
                            <span class="px-2 py-1 ${statusClass} text-xs font-medium rounded capitalize">${user.status}</span>
                        </div>
                        <p class="text-sm text-slate-500">User ID: ${user.user_id || 'N/A'}</p>
                    </div>
                    <span class="text-sm text-slate-500 whitespace-nowrap">Joined ${formatTimeAgo(user.created_at)}</span>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <p class="text-sm font-medium text-slate-700 mb-1">Contact Information</p>
                        <p class="text-sm text-slate-600">${user.email || 'No email provided'}</p>
                        <p class="text-sm text-slate-600">${user.phone || 'No phone provided'}</p>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-slate-700 mb-1">Account Details</p>
                        <p class="text-sm text-slate-600">Barangay ID: ${user.baranggay_id || 'Not assigned'}</p>
                        <p class="text-sm text-slate-600">Role: ${user.role || 'barangay'}</p>
                    </div>
                </div>

                <div class="mb-4">
                    <p class="text-sm font-medium text-slate-700 mb-1">Profile Information</p>
                    <p class="text-sm text-slate-600">${user.profile || 'No profile information provided.'}</p>
                </div>

                <div class="flex items-center gap-3">
                    ${user.status === 'pending' ? `
                        <button onclick="approveUser('${user.user_id}')" class="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors">
                            <i class="fas fa-check mr-2"></i>Approve
                        </button>
                        <button onclick="rejectUser('${user.user_id}')" class="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors">
                            <i class="fas fa-times mr-2"></i>Reject
                        </button>
                    ` : ''}
                    
                    ${user.status === 'active' ? `
                        <button onclick="banUser('${user.user_id}')" class="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors">
                            <i class="fas fa-ban mr-2"></i>Ban User
                        </button>
                    ` : ''}
                    
                    ${user.status === 'banned' ? `
                        <button onclick="activateUser('${user.user_id}')" class="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors">
                            <i class="fas fa-unlock mr-2"></i>Activate
                        </button>
                    ` : ''}
                    
                    <button onclick="viewUserDetails('${user.user_id}')" class="px-6 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors">
                        <i class="fas fa-eye mr-2"></i>View Details
                    </button>
                </div>
            </div>
        </div>
    `;

    return card;
}

// User action functions
async function approveUser(userId) {
    Swal.fire({
        title: 'Approve User?',
        text: 'Are you sure you want to approve this user? They will be able to access the barangay portal.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, approve',
        cancelButtonText: 'Cancel'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await updateUserStatus(userId, 'active');

                Swal.fire({
                    icon: 'success',
                    title: 'Approved!',
                    text: 'User has been approved and activated!',
                    confirmButtonColor: '#10b981',
                    timer: 1500,
                    showConfirmButton: false
                });
                
                loadUsers(); // Refresh the users list
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to approve user: ' + error.message,
                    confirmButtonColor: '#ef4444'
                });
            }
        }
    });
}

async function rejectUser(userId) {
    Swal.fire({
        title: 'Reject User?',
        text: 'Are you sure you want to reject this user? They will not be able to access the barangay portal.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, reject',
        cancelButtonText: 'Cancel'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await updateUserStatus(userId, 'banned');

                Swal.fire({
                    icon: 'success',
                    title: 'Rejected!',
                    text: 'User has been rejected and banned!',
                    confirmButtonColor: '#10b981',
                    timer: 1500,
                    showConfirmButton: false
                });
                
                loadUsers(); // Refresh the users list
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to reject user: ' + error.message,
                    confirmButtonColor: '#ef4444'
                });
            }
        }
    });
}

async function banUser(userId) {
    Swal.fire({
        title: 'Ban User?',
        text: 'Are you sure you want to ban this user? They will lose access to the barangay portal.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, ban user',
        cancelButtonText: 'Cancel'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await updateUserStatus(userId, 'banned');

                Swal.fire({
                    icon: 'success',
                    title: 'Banned!',
                    text: 'User has been banned!',
                    confirmButtonColor: '#10b981',
                    timer: 1500,
                    showConfirmButton: false
                });
                
                loadUsers(); // Refresh the users list
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to ban user: ' + error.message,
                    confirmButtonColor: '#ef4444'
                });
            }
        }
    });
}

async function activateUser(userId) {
    Swal.fire({
        title: 'Activate User?',
        text: 'Are you sure you want to activate this user? They will regain access to the barangay portal.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, activate',
        cancelButtonText: 'Cancel'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await updateUserStatus(userId, 'active');

                Swal.fire({
                    icon: 'success',
                    title: 'Activated!',
                    text: 'User has been activated!',
                    confirmButtonColor: '#10b981',
                    timer: 1500,
                    showConfirmButton: false
                });
                
                loadUsers(); // Refresh the users list
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to activate user: ' + error.message,
                    confirmButtonColor: '#ef4444'
                });
            }
        }
    });
}

// View user details
function viewUserDetails(userId) {
    const user = currentUsers.find(u => u.user_id === userId);
    if (!user) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'User not found',
            confirmButtonColor: '#ef4444'
        });
        return;
    }

    const fullName = getUserFullName(user);
    
    Swal.fire({
        title: `${fullName} - User Details`,
        html: `
            <div class="text-left space-y-3">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <strong class="text-slate-700">User ID:</strong>
                        <p class="text-slate-600">${user.user_id || 'N/A'}</p>
                    </div>
                    <div>
                        <strong class="text-slate-700">Status:</strong>
                        <span class="px-2 py-1 ${user.status === 'active' ? 'bg-green-100 text-green-700' : user.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'} text-xs font-medium rounded capitalize">${user.status}</span>
                    </div>
                </div>
                
                <div>
                    <strong class="text-slate-700">Full Name:</strong>
                    <p class="text-slate-600">${fullName}</p>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <strong class="text-slate-700">Email:</strong>
                        <p class="text-slate-600">${user.email || 'Not provided'}</p>
                    </div>
                    <div>
                        <strong class="text-slate-700">Phone:</strong>
                        <p class="text-slate-600">${user.phone || 'Not provided'}</p>
                    </div>
                </div>
                
                <div>
                    <strong class="text-slate-700">Barangay ID:</strong>
                    <p class="text-slate-600">${user.baranggay_id || 'Not assigned'}</p>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <strong class="text-slate-700">Role:</strong>
                        <p class="text-slate-600">${user.role || 'barangay'}</p>
                    </div>
                    <div>
                        <strong class="text-slate-700">Google ID:</strong>
                        <p class="text-slate-600">${user.google_id || 'Not linked'}</p>
                    </div>
                </div>
                
                <div>
                    <strong class="text-slate-700">Profile:</strong>
                    <p class="text-slate-600">${user.profile || 'No profile information'}</p>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <strong class="text-slate-700">Created:</strong>
                        <p class="text-slate-600">${formatDateTime(user.created_at)}</p>
                    </div>
                    <div>
                        <strong class="text-slate-700">Last Updated:</strong>
                        <p class="text-slate-600">${formatDateTime(user.updated_at)}</p>
                    </div>
                </div>
            </div>
        `,
        width: 600,
        showCloseButton: true,
        showConfirmButton: false
    });
}

// Debounced search function
function handleSearchInput(e) {
    const searchValue = e.target.value;
    
    // Clear previous timeout
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    // Show loading state immediately for better UX
    currentFilters.search = searchValue;
    currentFilters.page = 1;
    
    // Set new timeout - wait 500ms after user stops typing
    searchTimeout = setTimeout(() => {
        loadUsers();
    }, 500);
}

// Filter functionality
function setupFilters() {
    const searchInput = document.getElementById('searchInput');
    
    // Use input event for real-time search with debouncing
    searchInput.addEventListener('input', handleSearchInput);
    
    // Also allow Enter key to trigger immediate search
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            // Clear timeout and search immediately
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
            loadUsers();
        }
    });

    document.getElementById('statusFilter').addEventListener('change', (e) => {
        currentFilters.status = e.target.value;
        currentFilters.page = 1;
        loadUsers();
    });
}

// Notifications
function toggleNotifications() {
    const panel = document.getElementById('notificationsPanel');
    panel.classList.toggle('hidden');
}

// Close notifications when clicking outside
document.addEventListener('click', function(e) {
    const panel = document.getElementById('notificationsPanel');
    const button = e.target.closest('button[onclick="toggleNotifications()"]');
    if (!panel.contains(e.target) && !button) {
        panel.classList.add('hidden');
    }
});

// Loading overlay functions
function showLoadingOverlay() {
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoadingOverlay() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

// UI Helper Functions
function showLoading() {
    document.getElementById('loadingState').classList.remove('hidden');
    document.getElementById('usersContent').classList.add('hidden');
    document.getElementById('errorState').classList.add('hidden');
    document.body.classList.add('loading');
}

function showContent() {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('usersContent').classList.remove('hidden');
    document.getElementById('errorState').classList.add('hidden');
    document.body.classList.remove('loading');
}

function showError(message) {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('usersContent').classList.add('hidden');
    document.getElementById('errorState').classList.remove('hidden');
    document.getElementById('errorMessage').textContent = message;
    document.body.classList.remove('loading');
}

// Update user info in header
function updateUserInfo() {
    const storedData = getStoredUserData();
    if (storedData && storedData.user) {
        const user = storedData.user;
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        const initials = getUserInitials(user);
        
        document.getElementById('userName').textContent = fullName || 'User';
        document.getElementById('userInitials').textContent = initials;
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const storedData = getStoredUserData();
    if (!storedData) {
        showError('Please login to access users management.');
        return;
    }

    updateUserInfo();
    setupFilters();
    loadUsers();
});