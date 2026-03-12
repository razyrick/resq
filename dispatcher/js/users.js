const API_BASE_URL = 'https://greenyellow-hawk-206191.hostingersite.com';
let userData = null;
let currentPage = 1;
let currentLimit = 10;
let currentFilters = {
    status: 'pending',
    search: ''
};
let totalDispatchers = 0;
let totalPages = 0;
let dispatchersData = [];

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

function loadUserData() {
    const storedData = getStoredUserData();
    if (storedData && storedData.user) {
        userData = storedData.user;
        document.getElementById('userName').textContent = `${userData.first_name || ''} ${userData.last_name || ''}`;
    }
}

async function fetchDispatchers(page = 1, limit = 10) {
    try {
        const params = new URLSearchParams({
            page: page,
            limit: limit
        });

        if (currentFilters.status) params.append('status', currentFilters.status);
        if (currentFilters.search) params.append('search', currentFilters.search);

        const response = await fetch(`${API_BASE_URL}/dispatcher/users?${params}`, {
            method: 'GET',
            headers: getHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching dispatchers:', error);
        throw error;
    }
}

async function updateDispatcherStatus(userId, status) {
    try {
        const response = await fetch(`${API_BASE_URL}/dispatcher/users`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({
                user_id: userId,
                status: status
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error updating dispatcher status:', error);
        throw error;
    }
}

function getUserFullName(user) {
    const middleInitial = user.middle_name ? ` ${user.middle_name.charAt(0)}.` : '';
    return `${user.first_name || ''}${middleInitial} ${user.last_name || ''}`.trim();
}

function getUserInitials(user) {
    const first = user.first_name ? user.first_name.charAt(0).toUpperCase() : '';
    const last = user.last_name ? user.last_name.charAt(0).toUpperCase() : '';
    return first + last || 'U';
}

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

function getStatusClass(status) {
    switch (status) {
        case 'active': return 'bg-green-100 text-green-800';
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'banned': return 'bg-red-100 text-red-800';
        default: return 'bg-slate-100 text-slate-800';
    }
}

function getStatusLabel(status) {
    switch (status) {
        case 'active': return 'Active';
        case 'pending': return 'Pending';
        case 'banned': return 'Banned';
        default: return status;
    }
}

function renderDispatchers(dispatchers, pagination) {
    const container = document.getElementById('dispatchersTableBody');
    if (!container) return;
    
    if (dispatchers.length === 0) {
        document.getElementById('emptyState').classList.remove('hidden');
        document.getElementById('contentState').classList.add('hidden');
        return;
    }

    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('contentState').classList.remove('hidden');
    
    let html = '';
    
    dispatchers.forEach(dispatcher => {
        const fullName = getUserFullName(dispatcher);
        const initials = getUserInitials(dispatcher);
        
        html += `
            <tr class="hover:bg-slate-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="w-10 h-10 bg-gradient-to-br from-blue-600 to-red-600 rounded-lg flex items-center justify-center mr-3">
                            <span class="text-white font-semibold text-sm">${initials}</span>
                        </div>
                        <div>
                            <div class="text-sm font-medium text-slate-900">${fullName}</div>
                            <div class="text-sm text-slate-500">${dispatcher.user_id}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    <div>${dispatcher.email || 'No email'}</div>
                    <div class="text-slate-500">${dispatcher.phone || 'No phone'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    ${dispatcher.baranggay_id || 'Not assigned'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(dispatcher.status)}">
                        ${getStatusLabel(dispatcher.status)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    ${formatTimeAgo(dispatcher.created_at)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex items-center gap-2">
                        ${dispatcher.status === 'pending' ? `
                            <button onclick="approveDispatcher('${dispatcher.user_id}')" class="text-green-600 hover:text-green-900" title="Approve">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </button>
                            <button onclick="rejectDispatcher('${dispatcher.user_id}')" class="text-red-600 hover:text-red-900" title="Reject">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        ` : ''}
                        
                        ${dispatcher.status === 'active' ? `
                            <button onclick="banDispatcher('${dispatcher.user_id}')" class="text-red-600 hover:text-red-900" title="Ban">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </button>
                        ` : ''}
                        
                        ${dispatcher.status === 'banned' ? `
                            <button onclick="activateDispatcher('${dispatcher.user_id}')" class="text-green-600 hover:text-green-900" title="Activate">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </button>
                        ` : ''}
                        
                        <button onclick="viewDispatcherDetails('${dispatcher.user_id}')" class="text-blue-600 hover:text-blue-900" title="View Details">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    container.innerHTML = html;
    updatePagination(pagination);
    updateStats(dispatchers, pagination);
}

function updateStats(dispatchers, pagination) {
    const totalCount = pagination.total_items || dispatchers.length;
    const pendingCount = dispatchers.filter(d => d.status === 'pending').length;
    const activeCount = dispatchers.filter(d => d.status === 'active').length;
    const bannedCount = dispatchers.filter(d => d.status === 'banned').length;

    document.getElementById('totalCount').textContent = totalCount;
    document.getElementById('pendingCount').textContent = pendingCount;
    document.getElementById('activeCount').textContent = activeCount;
    document.getElementById('bannedCount').textContent = bannedCount;
}

function updatePagination(pagination) {
    const paginationContainer = document.getElementById('paginationContainer');
    const paginationInfo = document.getElementById('paginationInfo');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    
    if (!paginationContainer || !paginationInfo || !prevPageBtn || !nextPageBtn) return;
    
    if (pagination.total_pages > 1) {
        paginationContainer.classList.remove('hidden');
        
        const startItem = (pagination.current_page - 1) * pagination.per_page + 1;
        const endItem = Math.min(pagination.current_page * pagination.per_page, pagination.total_items);
        
        paginationInfo.textContent = `Showing ${startItem}-${endItem} of ${pagination.total_items} dispatchers`;
        
        prevPageBtn.disabled = !pagination.has_prev;
        nextPageBtn.disabled = !pagination.has_next;
        
        prevPageBtn.onclick = () => {
            if (pagination.has_prev) {
                currentPage = pagination.current_page - 1;
                loadDispatchers();
            }
        };
        
        nextPageBtn.onclick = () => {
            if (pagination.has_next) {
                currentPage = pagination.current_page + 1;
                loadDispatchers();
            }
        };
    } else {
        paginationContainer.classList.add('hidden');
    }
}

async function loadDispatchers() {
    try {
        showLoading();
        
        const data = await fetchDispatchers(currentPage, currentLimit);
        
        if (data.success) {
            dispatchersData = data.data;
            renderDispatchers(data.data, data.pagination);
            showContent();
        } else {
            throw new Error(data.error || 'Failed to load dispatchers');
        }
    } catch (error) {
        console.error('Error loading dispatchers:', error);
        showError(error.message);
    }
}

function showLoading() {
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const contentState = document.getElementById('contentState');
    const emptyState = document.getElementById('emptyState');
    
    if (loadingState) loadingState.classList.remove('hidden');
    if (errorState) errorState.classList.add('hidden');
    if (contentState) contentState.classList.add('hidden');
    if (emptyState) emptyState.classList.add('hidden');
}

function showContent() {
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    
    if (loadingState) loadingState.classList.add('hidden');
    if (errorState) errorState.classList.add('hidden');
}

function showError(message) {
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const errorMessage = document.getElementById('errorMessage');
    
    if (loadingState) loadingState.classList.add('hidden');
    if (errorState) errorState.classList.remove('hidden');
    if (errorMessage) errorMessage.textContent = message;
}

function filterDispatchers() {
    currentPage = 1;
    currentFilters = {
        status: document.getElementById('statusFilter').value,
        search: document.getElementById('searchInput').value
    };
    
    loadDispatchers();
}

// Dispatcher Action Functions
async function approveDispatcher(userId) {
    Swal.fire({
        title: 'Approve Dispatcher?',
        text: 'Are you sure you want to approve this dispatcher? They will be able to access the dispatcher portal.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, approve',
        cancelButtonText: 'Cancel'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await updateDispatcherStatus(userId, 'active');

                Swal.fire({
                    icon: 'success',
                    title: 'Approved!',
                    text: 'Dispatcher has been approved and activated!',
                    confirmButtonColor: '#10b981',
                    timer: 1500,
                    showConfirmButton: false
                });
                
                loadDispatchers();
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to approve dispatcher: ' + error.message,
                    confirmButtonColor: '#ef4444'
                });
            }
        }
    });
}

async function rejectDispatcher(userId) {
    Swal.fire({
        title: 'Reject Dispatcher?',
        text: 'Are you sure you want to reject this dispatcher? They will not be able to access the dispatcher portal.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, reject',
        cancelButtonText: 'Cancel'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await updateDispatcherStatus(userId, 'banned');

                Swal.fire({
                    icon: 'success',
                    title: 'Rejected!',
                    text: 'Dispatcher has been rejected and banned!',
                    confirmButtonColor: '#10b981',
                    timer: 1500,
                    showConfirmButton: false
                });
                
                loadDispatchers();
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to reject dispatcher: ' + error.message,
                    confirmButtonColor: '#ef4444'
                });
            }
        }
    });
}

async function banDispatcher(userId) {
    Swal.fire({
        title: 'Ban Dispatcher?',
        text: 'Are you sure you want to ban this dispatcher? They will lose access to the dispatcher portal.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, ban dispatcher',
        cancelButtonText: 'Cancel'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await updateDispatcherStatus(userId, 'banned');

                Swal.fire({
                    icon: 'success',
                    title: 'Banned!',
                    text: 'Dispatcher has been banned!',
                    confirmButtonColor: '#10b981',
                    timer: 1500,
                    showConfirmButton: false
                });
                
                loadDispatchers();
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to ban dispatcher: ' + error.message,
                    confirmButtonColor: '#ef4444'
                });
            }
        }
    });
}

async function activateDispatcher(userId) {
    Swal.fire({
        title: 'Activate Dispatcher?',
        text: 'Are you sure you want to activate this dispatcher? They will regain access to the dispatcher portal.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, activate',
        cancelButtonText: 'Cancel'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await updateDispatcherStatus(userId, 'active');

                Swal.fire({
                    icon: 'success',
                    title: 'Activated!',
                    text: 'Dispatcher has been activated!',
                    confirmButtonColor: '#10b981',
                    timer: 1500,
                    showConfirmButton: false
                });
                
                loadDispatchers();
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to activate dispatcher: ' + error.message,
                    confirmButtonColor: '#ef4444'
                });
            }
        }
    });
}

function viewDispatcherDetails(userId) {
    const dispatcher = dispatchersData.find(d => d.user_id === userId);
    if (!dispatcher) return;
    
    const fullName = getUserFullName(dispatcher);
    const initials = getUserInitials(dispatcher);
    
    document.getElementById('userInitials').textContent = initials;
    document.getElementById('userFullName').textContent = fullName;
    document.getElementById('detailUserId').textContent = dispatcher.user_id || 'N/A';
    document.getElementById('detailEmail').textContent = dispatcher.email || 'Not provided';
    document.getElementById('detailPhone').textContent = dispatcher.phone || 'Not provided';
    document.getElementById('detailBarangayId').textContent = dispatcher.baranggay_id || 'Not assigned';
    document.getElementById('detailProfile').textContent = dispatcher.profile || 'No profile information provided.';
    document.getElementById('detailGoogleId').textContent = dispatcher.google_id || 'Not linked';
    document.getElementById('detailCreatedAt').textContent = formatDateTime(dispatcher.created_at);
    document.getElementById('detailUpdatedAt').textContent = formatDateTime(dispatcher.updated_at);
    
    const statusElement = document.getElementById('detailStatus');
    statusElement.className = `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(dispatcher.status)}`;
    statusElement.textContent = getStatusLabel(dispatcher.status);
    
    document.getElementById('userModal').classList.remove('hidden');
}

function closeUserModal() {
    document.getElementById('userModal').classList.add('hidden');
}

function toggleNotifications() {
    const panel = document.getElementById('notificationsPanel');
    panel.classList.toggle('hidden');
}

function logout() {
    Swal.fire({
        title: 'Logout?',
        text: 'Are you sure you want to logout?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, logout',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('userData');
            localStorage.removeItem('userRole');
            localStorage.removeItem('csrf_token');
            window.location.href = '../index.html';
        }
    });
}

async function initializePage() {
    try {
        loadUserData();
        await loadDispatchers();
    } catch (error) {
        console.error('Error initializing page:', error);
        showError(error.message);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');

    [searchInput, statusFilter].forEach(element => {
        element.addEventListener('change', filterDispatchers);
    });

    searchInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            filterDispatchers();
        }
    });

    const userModal = document.getElementById('userModal');
    
    if (userModal) {
        userModal.addEventListener('click', function(event) {
            if (event.target === userModal) {
                closeUserModal();
            }
        });
    }
});

document.addEventListener('click', function(e) {
    const panel = document.getElementById('notificationsPanel');
    const button = e.target.closest('button[onclick="toggleNotifications()"]');
    if (panel && !panel.contains(e.target) && !button) {
        panel.classList.add('hidden');
    }
});

// Make functions globally available
window.approveDispatcher = approveDispatcher;
window.rejectDispatcher = rejectDispatcher;
window.banDispatcher = banDispatcher;
window.activateDispatcher = activateDispatcher;
window.viewDispatcherDetails = viewDispatcherDetails;
window.loadDispatchers = loadDispatchers;