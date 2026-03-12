const API_BASE_URL = 'https://greenyellow-hawk-206191.hostingersite.com';
let userData = null;
let currentPage = 1;
let currentLimit = 10;
let currentFilters = {
    search: '' // Removed status filter
};
let totalAgencies = 0;
let totalPages = 0;
let agenciesData = [];
// Removed agencyToDelete variable

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

async function fetchAgencies(page = 1, limit = 10) {
    try {
        const params = new URLSearchParams({
            page: page,
            limit: limit
        });

        // Only keep search filter, remove status filter
        if (currentFilters.search) params.append('search', currentFilters.search);

        const response = await fetch(`${API_BASE_URL}/barangay/agency?${params}`, {
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
        console.error('Error fetching agencies:', error);
        throw error;
    }
}

function getTypeClass(type) {
    const typeLower = type.toLowerCase();
    if (typeLower.includes('fire')) return 'bg-red-100 text-red-800';
    if (typeLower.includes('medical') || typeLower.includes('health')) return 'bg-green-100 text-green-800';
    if (typeLower.includes('police')) return 'bg-blue-100 text-blue-800';
    if (typeLower.includes('rescue')) return 'bg-purple-100 text-purple-800';
    return 'bg-slate-100 text-slate-800';
}

function getTypeLabel(type) {
    return type || 'Other';
}

function renderAgencies(agencies, pagination) {
    const container = document.getElementById('agenciesTableBody');
    if (!container) return;
    
    if (agencies.length === 0) {
        document.getElementById('emptyState').classList.remove('hidden');
        document.getElementById('contentState').classList.add('hidden');
        return;
    }

    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('contentState').classList.remove('hidden');
    
    let html = '';
    
    agencies.forEach(agency => {
        html += `
            <tr class="hover:bg-slate-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="w-10 h-10 bg-gradient-to-br from-blue-600 to-red-600 rounded-lg flex items-center justify-center mr-3">
                            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <div>
                            <div class="text-sm font-medium text-slate-900">${agency.agency}</div>
                            <div class="text-sm text-slate-500">${agency.address}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeClass(agency.agency_type)}">
                        ${getTypeLabel(agency.agency_type)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    <div>${agency.contact_person}</div>
                    <div class="text-slate-500">${agency.phone_number}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    ${agency.number_of_units} units
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${agency.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}">
                        ${agency.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <!-- Removed Actions column -->
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
        
        paginationInfo.textContent = `Showing ${startItem}-${endItem} of ${pagination.total_items} agencies`;
        
        prevPageBtn.disabled = !pagination.has_prev;
        nextPageBtn.disabled = !pagination.has_next;
        
        prevPageBtn.onclick = () => {
            if (pagination.has_prev) {
                currentPage = pagination.current_page - 1;
                loadAgencies();
            }
        };
        
        nextPageBtn.onclick = () => {
            if (pagination.has_next) {
                currentPage = pagination.current_page + 1;
                loadAgencies();
            }
        };
    } else {
        paginationContainer.classList.add('hidden');
    }
}

async function loadAgencies() {
    try {
        showLoading();
        
        const data = await fetchAgencies(currentPage, currentLimit);
        
        if (data.success) {
            agenciesData = data.data;
            renderAgencies(data.data, data.pagination);
            showContent();
        } else {
            throw new Error(data.error || 'Failed to load agencies');
        }
    } catch (error) {
        console.error('Error loading agencies:', error);
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

function filterAgencies() {
    currentPage = 1;
    currentFilters = {
        search: document.getElementById('searchInput').value
        // Removed status filter
    };
    
    loadAgencies();
}

// Removed all modal-related functions:
// - openAddAgencyModal()
// - editAgency()
// - closeAgencyModal()
// - openDeleteModal()
// - closeDeleteModal()
// - confirmDelete()
// - Agency form submission handler

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
        await loadAgencies();
    } catch (error) {
        console.error('Error initializing page:', error);
        showError(error.message);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    
    const searchInput = document.getElementById('searchInput');
    const retryButton = document.getElementById('retryButton');

    // Only keep search input listener
    searchInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            filterAgencies();
        }
    });

    searchInput.addEventListener('change', filterAgencies);

    if (retryButton) {
        retryButton.addEventListener('click', initializePage);
    }
});

document.addEventListener('click', function(e) {
    const panel = document.getElementById('notificationsPanel');
    const button = e.target.closest('button[onclick="toggleNotifications()"]');
    if (panel && !panel.contains(e.target) && !button) {
        panel.classList.add('hidden');
    }
});

// Removed global functions:
// window.editAgency = editAgency;
// window.openDeleteModal = openDeleteModal;