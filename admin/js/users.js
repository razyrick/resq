const API_BASE_URL = 'https://greenyellow-hawk-206191.hostingersite.com';
let currentPage = 1;
let currentLimit = 10;
let currentFilters = {
    role: '',
    search: ''
};
let totalUsers = 0;
let totalPages = 0;
let currentUser = null;

function getStoredUserData() {
    const userDataStr = localStorage.getItem('userData');
    const csrfToken = localStorage.getItem('csrf_token');
    
    return userDataStr ? {
        user: JSON.parse(userDataStr),
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

async function fetchUsers(page = 1, limit = 20) {
    try {
        const params = new URLSearchParams({
            page: page,
            limit: limit
        });

        if (currentFilters.role) params.append('role', currentFilters.role);
        if (currentFilters.search) params.append('search', currentFilters.search);

        const response = await fetch(`${API_BASE_URL}/admin/users?${params}`, {
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
        throw error;
    }
}

function formatDate(dateString) {
    if (!dateString || dateString === '0000-00-00 00:00:00') return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getStatusInfo(status) {
    const statuses = {
        'pending': { 
            text: 'Pending', 
            bgColor: 'bg-yellow-100',
            textColor: 'text-yellow-800',
            borderColor: 'border-yellow-200',
            icon: 'fa-clock'
        },
        'active': { 
            text: 'Active', 
            bgColor: 'bg-green-100',
            textColor: 'text-green-800',
            borderColor: 'border-green-200',
            icon: 'fa-check-circle'
        },
        'verify': { 
            text: 'Verify', 
            bgColor: 'bg-red-100',
            textColor: 'text-red-800',
            borderColor: 'border-red-200',
            icon: 'fa-ban'
        },
        'banned': { 
            text: 'Declined', 
            bgColor: 'bg-slate-100',
            textColor: 'text-slate-800',
            borderColor: 'border-slate-200',
            icon: 'fa-times-circle'
        }
    };
    
    return statuses[status] || statuses['pending'];
}

function getRoleInfo(role) {
    const roles = {
        'user': { 
            text: 'User', 
            bgColor: 'bg-blue-100',
            textColor: 'text-blue-800',
            borderColor: 'border-blue-200',
            icon: 'fa-user'
        },
        'barangay': { 
            text: 'Barangay', 
            bgColor: 'bg-purple-100',
            textColor: 'text-purple-800',
            borderColor: 'border-purple-200',
            icon: 'fa-building'
        },
        'dispatcher': { 
            text: 'Dispatcher', 
            bgColor: 'bg-indigo-100',
            textColor: 'text-indigo-800',
            borderColor: 'border-indigo-200',
            icon: 'fa-headset'
        },
        'agency': { 
            text: 'Agency', 
            bgColor: 'bg-green-100',
            textColor: 'text-green-800',
            borderColor: 'border-green-200',
            icon: 'fa-ambulance'
        },
        'admin': { 
            text: 'Administrator', 
            bgColor: 'bg-red-100',
            textColor: 'text-red-800',
            borderColor: 'border-red-200',
            icon: 'fa-crown'
        }
    };
    
    return roles[role] || roles['user'];
}

function getInitials(firstName, lastName) {
    const first = firstName ? firstName.charAt(0).toUpperCase() : 'U';
    const last = lastName ? lastName.charAt(0).toUpperCase() : 'S';
    return first + last;
}

function renderUsers(users, pagination) {
    const container = document.getElementById('usersTableBody');
    if (!container) return;
    
    if (users.length === 0) {
        document.getElementById('emptyState').classList.remove('hidden');
        container.innerHTML = '';
        return;
    }

    document.getElementById('emptyState').classList.add('hidden');
    
    let html = '';
    
    users.forEach(user => {
        const statusInfo = getStatusInfo(user.status);
        const roleInfo = getRoleInfo(user.role);
        const initials = getInitials(user.first_name, user.last_name);
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        
        html += `
          <tr class="hover:bg-slate-50 transition-colors">
              <td class="py-4 px-6">
                  <div class="flex items-center gap-3">
                      <div class="w-10 h-10 user-avatar rounded-full flex items-center justify-center text-white font-semibold">
                          ${initials}
                      </div>
                      <div>
                          <p class="font-medium text-slate-900">${fullName || 'Unknown User'}</p>
                          <p class="text-sm text-slate-500">${user.email || 'No email'}</p>
                      </div>
                  </div>
              </td>
              <td class="py-4 px-6">
                  <div class="space-y-1">
                      <p class="text-sm text-slate-900">${user.phone || 'N/A'}</p>
                  </div>
              </td>
              <td class="py-4 px-6">
                  <span class="role-badge ${roleInfo.bgColor} ${roleInfo.textColor} ${roleInfo.borderColor} border">
                      <i class="fas ${roleInfo.icon}"></i>
                      ${roleInfo.text}
                  </span>
              </td>
              <td class="py-4 px-6">
                  <span class="status-badge ${statusInfo.bgColor} ${statusInfo.textColor} ${statusInfo.borderColor} border">
                      <i class="fas ${statusInfo.icon}"></i>
                      ${statusInfo.text}
                  </span>
              </td>
              <td class="py-4 px-6">
                  <p class="text-sm text-slate-900">${formatDate(user.created_at)}</p>
              </td>
              <td class="py-4 px-6">
                  <div class="flex gap-2">
                      <button onclick="approveUser('${user.user_id}', '${fullName}')" class="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded hover:bg-green-200 transition-colors">
                          <i class="fas fa-check mr-1"></i> Approve
                      </button>
                      <button onclick="declineUser('${user.user_id}', '${fullName}')" class="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded hover:bg-red-200 transition-colors">
                          <i class="fas fa-times mr-1"></i> Decline
                      </button>
                  </div>
              </td>
          </tr>
      `;
    });

    container.innerHTML = html;
    updatePagination(pagination);
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
        
        paginationInfo.textContent = `Showing ${startItem}-${endItem} of ${pagination.total_items} users`;
        
        prevPageBtn.disabled = !pagination.has_prev;
        nextPageBtn.disabled = !pagination.has_next;
        
        prevPageBtn.classList.toggle('opacity-50', !pagination.has_prev);
        nextPageBtn.classList.toggle('opacity-50', !pagination.has_next);
        
        prevPageBtn.onclick = () => {
            if (pagination.has_prev) {
                currentPage = pagination.current_page - 1;
                loadUsers();
            }
        };
        
        nextPageBtn.onclick = () => {
            if (pagination.has_next) {
                currentPage = pagination.current_page + 1;
                loadUsers();
            }
        };
    } else {
        paginationContainer.classList.add('hidden');
    }
}

function showUserModal(user) {
    currentUser = user;
    
    const statusInfo = getStatusInfo(user.status);
    const roleInfo = getRoleInfo(user.role);
    const initials = getInitials(user.first_name, user.last_name);
    const fullName = `${user.first_name || ''} ${user.middle_name || ''} ${user.last_name || ''}`.trim();
    
    // Update modal elements
    document.getElementById('modalUserAvatar').textContent = initials;
    document.getElementById('modalUserName').textContent = fullName || 'Unknown User';
    document.getElementById('modalUserEmail').textContent = user.email || 'No email';
    document.getElementById('modalUserFullName').textContent = fullName || 'N/A';
    document.getElementById('modalUserPhone').textContent = user.phone || 'N/A';
    document.getElementById('modalUserEmailDetail').textContent = user.email || 'N/A';
    document.getElementById('modalUserId').textContent = user.user_id || 'N/A';
    document.getElementById('modalUserCreated').textContent = formatDate(user.created_at);
    
    // Update badges
    const roleBadge = document.getElementById('modalUserRole');
    const statusBadge = document.getElementById('modalUserStatus');
    
    if (roleBadge) {
        roleBadge.className = `role-badge ${roleInfo.bgColor} ${roleInfo.textColor} ${roleInfo.borderColor} border`;
        roleBadge.innerHTML = `<i class="fas ${roleInfo.icon}"></i> ${roleInfo.text}`;
    }
    
    if (statusBadge) {
        statusBadge.className = `status-badge ${statusInfo.bgColor} ${statusInfo.textColor} ${statusInfo.borderColor} border`;
        statusBadge.innerHTML = `<i class="fas ${statusInfo.icon}"></i> ${statusInfo.text}`;
    }
    
    // Update action buttons based on status
    const actionNote = document.getElementById('modalActionNote');
    const declineBtn = document.getElementById('declineUserBtn');
    const approveBtn = document.getElementById('approveUserBtn');
    
    if (user.status === 'pending') {
        actionNote.textContent = 'This account is pending approval.';
        declineBtn.classList.remove('hidden');
        approveBtn.classList.remove('hidden');
    } else {
        actionNote.textContent = 'This account has been processed.';
        declineBtn.classList.add('hidden');
        approveBtn.classList.add('hidden');
    }
    
    // Show modal
    const modal = document.getElementById('userModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

async function updateUserStatus(userId, status, message = '') {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({
                user_id: userId,
                status: status,
                message: message
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        throw error;
    }
}

async function approveUser(userId, userName) {
    Swal.fire({
        title: 'Approve User?',
        html: `Are you sure you want to approve <strong>${userName}</strong>?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, approve',
        cancelButtonText: 'Cancel',
        input: 'textarea',
        inputLabel: 'Optional Message',
        inputPlaceholder: 'Add a welcome message...',
        inputAttributes: {
            maxlength: 200
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const data = await updateUserStatus(userId, 'active', result.value);
                
                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'User Approved',
                        text: data.message || 'User has been approved successfully',
                        confirmButtonColor: '#10b981'
                    });
                    
                    loadUsers(); // Refresh the user list
                } else {
                    throw new Error(data.error || 'Failed to approve user');
                }
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Approval Failed',
                    text: error.message,
                    confirmButtonColor: '#ef4444'
                });
            }
        }
    });
}

async function declineUser(userId, userName) {
    Swal.fire({
        title: 'Decline User?',
        html: `Are you sure you want to decline <strong>${userName}</strong>?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, decline',
        cancelButtonText: 'Cancel',
        input: 'textarea',
        inputLabel: 'Reason for Declining',
        inputPlaceholder: 'Please provide a reason...',
        inputAttributes: {
            maxlength: 200,
            required: true
        },
        inputValidator: (value) => {
            if (!value) {
                return 'Please provide a reason for declining';
            }
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const data = await updateUserStatus(userId, 'banned', result.value);
                
                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'User Declined',
                        text: data.message || 'User has been declined successfully',
                        confirmButtonColor: '#10b981'
                    });
                    
                    loadUsers(); // Refresh the user list
                } else {
                    throw new Error(data.error || 'Failed to decline user');
                }
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Decline Failed',
                    text: error.message,
                    confirmButtonColor: '#ef4444'
                });
            }
        }
    });
}

function closeUserModal() {
    const modal = document.getElementById('userModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    currentUser = null;
}

async function loadUsers() {
    try {
        showLoading();
        
        const data = await fetchUsers(currentPage, currentLimit);
        
        if (data.success) {
            renderUsers(data.data, data.pagination);
            showContent();
        } else {
            throw new Error(data.error || 'Failed to load users');
        }
    } catch (error) {
        showError(error.message);
    }
}

function showLoading() {
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const tableBody = document.getElementById('usersTableBody');
    const paginationContainer = document.getElementById('paginationContainer');
    
    if (loadingState) loadingState.classList.remove('hidden');
    if (errorState) errorState.classList.add('hidden');
    if (tableBody) tableBody.innerHTML = '';
    if (paginationContainer) paginationContainer.classList.add('hidden');
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

function filterUsers() {
    currentPage = 1;
    currentFilters = {
        role: document.getElementById('roleFilter').value,
        search: document.getElementById('searchInput').value
    };
    
    loadUsers();
}

async function initializePage() {
    try {
        await loadUsers();
    } catch (error) {
        showError(error.message);
    }
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

document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    
    const retryButton = document.getElementById('retryButton');
    const closeModal = document.getElementById('closeModal');
    const declineBtn = document.getElementById('declineUserBtn');
    const approveBtn = document.getElementById('approveUserBtn');

    if (retryButton) {
        retryButton.addEventListener('click', initializePage);
    }

    if (closeModal) {
        closeModal.addEventListener('click', closeUserModal);
    }

    if (declineBtn) {
        declineBtn.addEventListener('click', function() {
            if (currentUser) {
                declineUser(currentUser.user_id, `${currentUser.first_name} ${currentUser.last_name}`);
            }
        });
    }

    if (approveBtn) {
        approveBtn.addEventListener('click', function() {
            if (currentUser) {
                approveUser(currentUser.user_id, `${currentUser.first_name} ${currentUser.last_name}`);
            }
        });
    }

    const userModal = document.getElementById('userModal');
    if (userModal) {
        userModal.addEventListener('click', function(event) {
            if (event.target === userModal) {
                closeUserModal();
            }
        });
    }

    // Add search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                filterUsers();
            }
        });
    }
});

window.viewUserDetails = viewUserDetails;
window.approveUser = approveUser;
window.declineUser = declineUser;