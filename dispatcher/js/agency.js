const API_BASE_URL = 'https://greenyellow-hawk-206191.hostingersite.com';
let userData = null;
let currentPage = 1;
let currentLimit = 10;
let currentFilters = {
    status: '',
    search: ''
};
let totalAgencies = 0;
let totalPages = 0;
let agenciesData = [];
let agencyToDelete = null;

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

        if (currentFilters.status) params.append('status', currentFilters.status);
        if (currentFilters.search) params.append('search', currentFilters.search);

        const response = await fetch(`${API_BASE_URL}/dispatcher/agency?${params}`, {
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

async function createAgency(agencyData) {
    try {
        const response = await fetch(`${API_BASE_URL}/dispatcher/agency`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(agencyData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error creating agency:', error);
        throw error;
    }
}

async function updateAgency(agencyId, agencyData) {
    try {
        // Include agency_id in the request body
        const requestData = {
            ...agencyData,
            agency_id: agencyId
        };

        console.log('Sending update request:', requestData);

        const response = await fetch(`${API_BASE_URL}/dispatcher/agency`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(requestData)
        });

        // First, get the response as text to see what's actually being returned
        const responseText = await response.text();
        console.log('Raw response:', responseText);

        // Try to parse as JSON
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Failed to parse JSON:', parseError);
            throw new Error(`Server returned invalid JSON: ${responseText.substring(0, 100)}`);
        }

        if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('Error updating agency:', error);
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
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex items-center gap-2">
                        <button onclick="editAgency('${agency.agency_id}')" class="text-blue-600 hover:text-blue-900">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button onclick="openDeleteModal('${agency.agency_id}', '${agency.agency}')" class="text-red-600 hover:text-red-900">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
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
        status: document.getElementById('statusFilter').value,
        search: document.getElementById('searchInput').value
    };
    
    loadAgencies();
}

function openAddAgencyModal() {
    document.getElementById('modalTitle').textContent = 'Add New Agency';
    document.getElementById('agencyForm').reset();
    document.getElementById('agencyId').value = '';
    document.getElementById('agencyModal').classList.remove('hidden');
}

function editAgency(agencyId) {
    const agency = agenciesData.find(a => a.agency_id === agencyId);
    if (!agency) return;
    
    document.getElementById('modalTitle').textContent = 'Edit Agency';
    document.getElementById('agencyId').value = agency.agency_id;
    document.getElementById('agencyName').value = agency.agency;
    document.getElementById('agencyType').value = agency.agency_type;
    document.getElementById('contactPerson').value = agency.contact_person;
    document.getElementById('phoneNumber').value = agency.phone_number;
    document.getElementById('emailAddress').value = agency.email_address;
    document.getElementById('agencyAddress').value = agency.address;
    document.getElementById('unitCount').value = agency.number_of_units;
    document.getElementById('agencyStatus').value = agency.status;
    
    document.getElementById('agencyModal').classList.remove('hidden');
}

function closeAgencyModal() {
    document.getElementById('agencyModal').classList.add('hidden');
}

function openDeleteModal(agencyId, agencyName) {
    agencyToDelete = agencyId;
    document.getElementById('deleteAgencyName').textContent = agencyName;
    document.getElementById('deleteModal').classList.remove('hidden');
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.add('hidden');
    agencyToDelete = null;
}

async function confirmDelete() {
  if (!agencyToDelete) return;
  
  try {
    const response = await fetch(`${API_BASE_URL}/dispatcher/agency?agency_id=${agencyToDelete}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      closeDeleteModal();
      loadAgencies();
      
      // Show success message
      Swal.fire({
        icon: 'success',
        title: 'Agency Deleted',
        text: 'Agency has been deleted successfully',
        confirmButtonColor: '#10b981'
      });
    } else {
      throw new Error(data.error || 'Failed to delete agency');
    }
  } catch (error) {
    console.error('Error deleting agency:', error);
    Swal.fire({
      icon: 'error',
      title: 'Deletion Failed',
      text: error.message,
      confirmButtonColor: '#ef4444'
    });
  }
}

// Handle form submission
document.getElementById('agencyForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const agencyId = document.getElementById('agencyId').value;
    const agencyData = {
        agency: document.getElementById('agencyName').value,
        agency_type: document.getElementById('agencyType').value,
        contact_person: document.getElementById('contactPerson').value,
        phone_number: document.getElementById('phoneNumber').value,
        email_address: document.getElementById('emailAddress').value,
        address: document.getElementById('agencyAddress').value,
        number_of_units: parseInt(document.getElementById('unitCount').value),
        status: document.getElementById('agencyStatus').value
    };

    try {
        let data;
        if (agencyId) {
            // Update existing agency using the new updateAgency function
            data = await updateAgency(agencyId, agencyData);
        } else {
            // Create new agency
            data = await createAgency(agencyData);
        }
        
        if (data.success) {
            closeAgencyModal();
            loadAgencies();
            
            // Show success message
            Swal.fire({
                icon: 'success',
                title: agencyId ? 'Agency Updated' : 'Agency Created',
                text: data.message || 'Agency has been saved successfully',
                confirmButtonColor: '#10b981'
            });
        } else {
            throw new Error(data.error || 'Failed to save agency');
        }
    } catch (error) {
        console.error('Error saving agency:', error);
        Swal.fire({
            icon: 'error',
            title: 'Save Failed',
            text: error.message,
            confirmButtonColor: '#ef4444'
        });
    }
});

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
    const statusFilter = document.getElementById('statusFilter');
    const retryButton = document.getElementById('retryButton');

    [searchInput, statusFilter].forEach(element => {
        element.addEventListener('change', filterAgencies);
    });

    searchInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            filterAgencies();
        }
    });

    if (retryButton) {
        retryButton.addEventListener('click', initializePage);
    }

    const agencyModal = document.getElementById('agencyModal');
    const deleteModal = document.getElementById('deleteModal');
    
    if (agencyModal) {
        agencyModal.addEventListener('click', function(event) {
            if (event.target === agencyModal) {
                closeAgencyModal();
            }
        });
    }
    
    if (deleteModal) {
        deleteModal.addEventListener('click', function(event) {
            if (event.target === deleteModal) {
                closeDeleteModal();
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

window.editAgency = editAgency;
window.openDeleteModal = openDeleteModal;