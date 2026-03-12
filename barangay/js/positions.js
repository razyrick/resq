
// API Configuration
const API_BASE_URL = 'https://greenyellow-hawk-206191.hostingersite.com';
let currentEditingId = null;
let positionsData = [];

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

// Load positions from API
async function loadPositions() {
    showLoading();
    try {
        const data = await apiRequest('/barangay/officials');
        
        if (data.success && data.data) {
            positionsData = data.data;
            updatePositionsUI();
            showContent();
        } else {
            throw new Error(data.error || 'Failed to load positions');
        }
    } catch (error) {
        console.error('Error loading positions:', error);
        showError('Failed to load positions: ' + error.message);
    }
}

// Update positions UI
function updatePositionsUI() {
    const container = document.getElementById('positionsGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (positionsData.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    container.innerHTML = '';

    positionsData.forEach(position => {
        const initials = getInitials(position.first_name, position.last_name);
        
        const card = document.createElement('div');
        card.className = 'position-card bg-white rounded-xl border border-slate-200 p-6';
        card.innerHTML = `
            <div class="flex flex-col items-center text-center">
                <div class="w-20 h-20 bg-gradient-to-br from-blue-600 to-red-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">
                    ${initials}
                </div>
                <h3 class="font-semibold text-slate-900 text-lg mb-1">${position.first_name} ${position.last_name}</h3>
                <p class="text-blue-600 font-medium mb-2">${position.position}</p>
                <div class="w-full space-y-2 text-sm text-slate-600">
                    <div class="flex items-center justify-between">
                        <span>Contact:</span>
                        <span class="font-medium">${position.contact_number || 'N/A'}</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span>Email:</span>
                        <span class="font-medium truncate ml-2">${position.email || 'N/A'}</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span>Term Start:</span>
                        <span class="font-medium">${position.term_start || 'N/A'}</span>
                    </div>
                </div>
                <div class="flex gap-2 mt-4 w-full">
                    <button onclick="editPosition(${position.id})" class="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                        Edit
                    </button>
                    <button onclick="deletePosition(${position.id})" class="flex-1 px-3 py-2 border border-red-300 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors">
                        Delete
                    </button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Open add position modal
function openAddPositionModal() {
    currentEditingId = null;
    document.getElementById('modalTitle').textContent = 'Add Position';
    resetModalForm();
    document.getElementById('positionModal').classList.remove('hidden');
}

// Edit position
function editPosition(id) {
    const position = positionsData.find(p => p.id === id);
    if (!position) return;

    currentEditingId = id;
    document.getElementById('modalTitle').textContent = 'Edit Position';
    
    // Fill form with position data - ALL FIELDS
    document.getElementById('modalFirstName').value = position.first_name || '';
    document.getElementById('modalMiddleName').value = position.middle_name || '';
    document.getElementById('modalLastName').value = position.last_name || '';
    document.getElementById('modalSuffix').value = position.suffix || '';
    document.getElementById('modalPosition').value = position.position || '';
    document.getElementById('modalContact').value = position.contact_number || '';
    document.getElementById('modalEmail').value = position.email || '';
    document.getElementById('modalResponsibilities').value = position.responsibilities || '';
    document.getElementById('modalTermStart').value = position.term_start || '';

    // Handle image if exists
    if (position.image_path) {
        const imagePreview = document.getElementById('imagePreview');
        imagePreview.innerHTML = `<img src="${position.image_path}" alt="Preview" class="rounded-lg">`;
    }

    document.getElementById('positionModal').classList.remove('hidden');
}

// Save position - FIXED FIELD MAPPING
async function savePosition() {
    // Get ALL form values
    const formData = {
        first_name: document.getElementById('modalFirstName').value.trim(),
        middle_name: document.getElementById('modalMiddleName').value.trim(),
        last_name: document.getElementById('modalLastName').value.trim(),
        suffix: document.getElementById('modalSuffix').value,
        position: document.getElementById('modalPosition').value.trim(),
        contact: document.getElementById('modalContact').value.trim(), // This maps to contact_number in backend
        email: document.getElementById('modalEmail').value.trim(),
        responsibilities: document.getElementById('modalResponsibilities').value.trim(),
        termStart: document.getElementById('modalTermStart').value, // This maps to term_start in backend
        image_path: '' // You can add image handling here if needed
    };

    // Basic validation
    if (!formData.first_name || !formData.last_name || !formData.position) {
        Swal.fire({
            icon: 'error',
            title: 'Missing Information',
            text: 'Please fill in all required fields (First Name, Last Name, and Position)',
            confirmButtonColor: '#ef4444'
        });
        return;
    }

    showLoadingOverlay();

    try {
        let response;
        if (currentEditingId) {
            // Update existing position
            response = await apiRequest('/barangay/officials', {
                method: 'PUT',
                body: JSON.stringify({
                    id: currentEditingId,
                    ...formData
                })
            });
        } else {
            // Add new position
            response = await apiRequest('/barangay/officials', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
        }

        if (response.success) {
            hideLoadingOverlay();
            closeModal('positionModal');
            
            document.getElementById('successMessage').textContent = 
                `Position ${currentEditingId ? 'updated' : 'added'} successfully`;
            document.getElementById('successModal').classList.remove('hidden');
            
            // Reload positions
            loadPositions();
        } else {
            throw new Error(response.error || 'Failed to save position');
        }
    } catch (error) {
        hideLoadingOverlay();
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to save position: ' + error.message,
            confirmButtonColor: '#ef4444'
        });
    }
}

// Delete position
async function deletePosition(id) {
    Swal.fire({
        title: 'Delete Position?',
        text: 'Are you sure you want to delete this position? This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, delete it',
        cancelButtonText: 'Cancel'
    }).then(async (result) => {
        if (result.isConfirmed) {
            showLoadingOverlay();
            try {
                const response = await apiRequest('/barangay/officials', {
                    method: 'DELETE',
                    body: JSON.stringify({ id: id })
                });

                if (response.success) {
                    // Remove from local data and update UI
                    positionsData = positionsData.filter(p => p.id !== id);
                    updatePositionsUI();
                    
                    Swal.fire({
                        icon: 'success',
                        title: 'Deleted!',
                        text: 'Position has been deleted successfully.',
                        confirmButtonColor: '#10b981',
                        timer: 1500,
                        showConfirmButton: false
                    });
                } else {
                    throw new Error(response.error || 'Failed to delete position');
                }
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to delete position: ' + error.message,
                    confirmButtonColor: '#ef4444'
                });
            } finally {
                hideLoadingOverlay();
            }
        }
    });
}

// Reset modal form
function resetModalForm() {
    document.getElementById('modalFirstName').value = '';
    document.getElementById('modalMiddleName').value = '';
    document.getElementById('modalLastName').value = '';
    document.getElementById('modalSuffix').value = '';
    document.getElementById('modalPosition').value = '';
    document.getElementById('modalContact').value = '';
    document.getElementById('modalEmail').value = '';
    document.getElementById('modalResponsibilities').value = '';
    document.getElementById('modalTermStart').value = '';
    
    // Reset image preview
    const imagePreview = document.getElementById('imagePreview');
    imagePreview.innerHTML = `
        <div class="text-center text-slate-400">
            <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span class="text-xs">No image</span>
        </div>
    `;
}

// Helper functions
function getInitials(firstName, lastName) {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last || 'NA';
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

function showLoadingOverlay() {
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoadingOverlay() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

// UI Helper Functions
function showLoading() {
    document.getElementById('loadingState').classList.remove('hidden');
    document.getElementById('positionsContent').classList.add('hidden');
    document.getElementById('errorState').classList.add('hidden');
}

function showContent() {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('positionsContent').classList.remove('hidden');
    document.getElementById('errorState').classList.add('hidden');
}

function showError(message) {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('positionsContent').classList.add('hidden');
    document.getElementById('errorState').classList.remove('hidden');
    document.getElementById('errorMessage').textContent = message;
}

// Update user info in header
function updateUserInfo() {
    const storedData = getStoredUserData();
    if (storedData && storedData.user) {
        const user = storedData.user;
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        const initials = getInitials(user.first_name, user.last_name);
        
        document.getElementById('userName').textContent = fullName || 'User';
        document.getElementById('userInitials').textContent = initials;
    }
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

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const storedData = getStoredUserData();
    if (!storedData) {
        showError('Please login to access positions.');
        return;
    }

    updateUserInfo();
    loadPositions();

    // Handle image upload preview
    document.getElementById('positionImage').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const imagePreview = document.getElementById('imagePreview');
                imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview" class="rounded-lg">`;
            };
            reader.readAsDataURL(file);
        }
    });
});