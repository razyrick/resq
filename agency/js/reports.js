// API Configuration
const API_BASE_URL = 'https://greenyellow-hawk-206191.hostingersite.com';
let currentPage = 1;
let currentFilters = {
    status: '',
    severity: '',
    type: '',
    search: ''
};
let currentIncident = null;
let currentReportsData = [];
let incidentMap = null;
let incidentMarker = null;

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

// Get incident type info with dynamic handling for unknown types
function getIncidentTypeInfo(type) {
    const typeIcons = {
        'fire': '<svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /></svg>',
        'flood': '<svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>',
        'medical': '<svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>',
        'other': '<svg class="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>'
    };
    
    const modalIcons = {
        'fire': '🔥',
        'flood': '💧',
        'medical': '🚑',
        'other': '⚠️'
    };

    // If type is not provided or is empty, return 'other'
    if (!type || type.trim() === '') {
        return {
            tableIcon: typeIcons.other,
            modalIcon: modalIcons.other,
            displayName: 'Other'
        };
    }
    
    const typeKey = type.toLowerCase();
    
    // Check if it's in our predefined types
    if (typeIcons[typeKey]) {
        return {
            tableIcon: typeIcons[typeKey],
            modalIcon: modalIcons[typeKey] || modalIcons.other,
            displayName: formatIncidentTypeName(type)
        };
    }
    
    // If not found, use 'other' icon but display the actual type name
    return {
        tableIcon: typeIcons.other,
        modalIcon: modalIcons.other,
        displayName: formatIncidentTypeName(type)
    };
}

// Helper function to format incident type name from snake_case to readable text
function formatIncidentTypeName(type) {
    if (!type) return 'Other';
    
    // Convert snake_case to readable text
    return type
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Load reports from API
async function loadReports(page = 1, filters = {}) {
    showLoading();
    try {
        // Build query parameters
        const params = new URLSearchParams({
            page: page,
            limit: 20, // Match the PHP default limit
            ...filters
        });

        const response = await apiRequest(`/agency/reports?${params}`);
        
        if (response.success) {
            currentReportsData = response.data;
            renderReports(response.data, response.pagination);
            showContent();
            openIncidentFromQuery();
        } else {
            throw new Error(response.error || 'Failed to load reports');
        }
    } catch (error) {
        console.error('Error loading reports:', error);
        showError('Failed to load reports: ' + error.message);
    }
}

// Render reports table
function renderReports(reports, pagination) {
    const tbody = document.getElementById('reportsTableBody');
    tbody.innerHTML = '';

    reports.forEach(report => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-slate-50 transition';
        
        const statusColors = {
            'pending': 'bg-yellow-100 text-yellow-800',
            'dispatched': 'bg-blue-100 text-blue-800',
            'in-progress': 'bg-orange-100 text-orange-800',
            'resolved': 'bg-green-100 text-green-800'
        };

        const priorityColors = {
            'low': 'bg-slate-100 text-slate-800',
            'medium': 'bg-blue-100 text-blue-800',
            'high': 'bg-orange-100 text-orange-800',
            'critical': 'bg-red-100 text-red-800'
        };

        // Get incident type info
        const typeInfo = getIncidentTypeInfo(report.incident_type);
        
        const formattedDate = new Date(report.created_at).toLocaleString();
        const hasMedia = report.photo && report.photo !== 'null' && report.photo !== '';

        // Escape quotes in the JSON string for the onclick attribute
        const reportData = JSON.stringify(report).replace(/"/g, '&quot;');

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm text-slate-600">${formattedDate}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-2">
                    ${typeInfo.tableIcon}
                    <span class="text-sm text-slate-900">${typeInfo.displayName}</span>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm text-slate-600">${report.baranggay || 'Unknown'}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-3 py-1 text-xs font-medium rounded-full ${statusColors[report.status] || statusColors.pending}">${report.status.replace('-', ' ')}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-3 py-1 text-xs font-medium rounded-full ${priorityColors[report.severity_level] || priorityColors.medium}">${report.severity_level}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                ${hasMedia ? 
                    `<div class="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center cursor-pointer" onclick="viewMedia('${report.photo}')">
                        <img 
                            src="${report.photo}" 
                            alt="Incident photo" 
                            class="w-full h-full object-cover hover:scale-110 transition-transform duration-200"
                        >
                    </div>` : 
                    `<div class="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center cursor-pointer" onclick="viewMedia('${report.photo}')">
                        <svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>`
                }
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <button onclick="viewIncidentDetails('${reportData}')" class="px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition">
                    View
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });

    // Update pagination
    updatePagination(pagination);
}

// View incident details in modal - using passed data
function viewIncidentDetails(incidentData) {
    try {
        const incident = JSON.parse(incidentData.replace(/&quot;/g, '"'));
        currentIncident = incident;
        populateIncidentModal(currentIncident);
        document.getElementById('incidentModal').classList.remove('hidden');
        
        // Initialize map after a short delay to ensure modal is visible
        setTimeout(() => {
            initializeMap(incident.latitude, incident.longitude, incident.baranggay);
        }, 100);
    } catch (error) {
        console.error('Error parsing incident data:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load incident details',
            confirmButtonColor: '#ef4444'
        });
    }
}

// Initialize OpenStreetMap
function initializeMap(lat, lng, locationName) {
    // Clean up existing map
    if (incidentMap) {
        incidentMap.remove();
    }

    // Create new map
    incidentMap = L.map('incidentMap').setView([lat, lng], 15);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(incidentMap);

    // Add custom marker
    const incidentIcon = L.divIcon({
        html: `<div class="w-6 h-6 bg-red-600 border-2 border-white rounded-full shadow-lg flex items-center justify-center">
                 <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                   <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
                 </svg>
               </div>`,
        className: 'incident-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });

    incidentMarker = L.marker([lat, lng], { icon: incidentIcon })
        .addTo(incidentMap)
        .bindPopup(`<b>${locationName || 'Incident Location'}</b><br>Lat: ${lat}<br>Lng: ${lng}`)
        .openPopup();

    setTimeout(() => {
        if (incidentMap) {
            incidentMap.invalidateSize();
        }
    }, 250);
}

// Open directions in new tab
function openDirections() {
    if (currentIncident && currentIncident.latitude && currentIncident.longitude) {
        const url = `https://www.openstreetmap.org/directions?from=&to=${currentIncident.latitude},${currentIncident.longitude}`;
        window.open(url, '_blank');
    }
}

// Populate incident modal with data
function populateIncidentModal(incident) {
    // Header
    document.getElementById('modalIncidentId').textContent = `ID: ${incident.incident_id}`;

    // Basic Information
    document.getElementById('modalIncidentId').textContent = incident.incident_id;
    
    // Get incident type info
    const typeInfo = getIncidentTypeInfo(incident.incident_type);
    document.getElementById('modalType').textContent = typeInfo.displayName;
    
    // Set type icon
    document.getElementById('modalTypeIcon').textContent = typeInfo.modalIcon;

    // Status with appropriate color
    const statusElement = document.getElementById('modalStatus');
    statusElement.textContent = incident.status.replace('-', ' ');
    statusElement.className = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ';
    switch(incident.status) {
        case 'pending': statusElement.className += 'bg-yellow-100 text-yellow-800'; break;
        case 'dispatched': statusElement.className += 'bg-blue-100 text-blue-800'; break;
        case 'in-progress': statusElement.className += 'bg-orange-100 text-orange-800'; break;
        case 'resolved': statusElement.className += 'bg-green-100 text-green-800'; break;
        default: statusElement.className += 'bg-gray-100 text-gray-800';
    }

    // Priority with appropriate color
    const priorityElement = document.getElementById('modalPriority');
    priorityElement.textContent = incident.severity_level;
    priorityElement.className = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ';
    switch(incident.severity_level) {
        case 'low': priorityElement.className += 'bg-slate-100 text-slate-800'; break;
        case 'medium': priorityElement.className += 'bg-blue-100 text-blue-800'; break;
        case 'high': priorityElement.className += 'bg-orange-100 text-orange-800'; break;
        case 'critical': priorityElement.className += 'bg-red-100 text-red-800'; break;
        default: priorityElement.className += 'bg-gray-100 text-gray-800';
    }

    document.getElementById('modalDescription').textContent = incident.description || 'No description provided';

    // Location Information
    document.getElementById('modalBarangay').textContent = incident.baranggay || 'Unknown';
    document.getElementById('modalCoordinates').textContent = `${incident.latitude}, ${incident.longitude}`;

    // Reporter Information
    const reporterName = `${incident.first_name || ''} ${incident.middle_name || ''} ${incident.last_name || ''}`.trim();
    document.getElementById('modalReporterName').textContent = reporterName || 'Unknown';
    document.getElementById('modalReporterEmail').textContent = incident.email || 'Unknown';
    document.getElementById('modalReporterPhone').textContent = incident.phone || 'Unknown';

    // Timeline
    const createdDate = new Date(incident.created_at);
    const updatedDate = new Date(incident.updated_at);
    document.getElementById('modalCreatedAt').textContent = createdDate.toLocaleDateString();
    document.getElementById('modalCreatedAtDetailed').textContent = createdDate.toLocaleString();
    document.getElementById('modalUpdatedAt').textContent = updatedDate.toLocaleString();
    renderLinkedPatientCard(incident);

    // Media
    const mediaContainer = document.getElementById('modalMedia');
    mediaContainer.innerHTML = '';
    
    if (incident.photo && incident.photo !== 'null' && incident.photo !== '') {
        const img = document.createElement('img');
        img.src = `${incident.photo}`;
        img.alt = 'Incident Photo';
        img.className = 'max-w-full h-48 object-cover rounded-lg cursor-pointer shadow-md';
        img.onclick = () => window.open(`${incident.photo}`, '_blank');
        mediaContainer.appendChild(img);
    } else {
        mediaContainer.innerHTML = `
            <div class="text-center py-8">
                <svg class="w-12 h-12 text-slate-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p class="text-slate-500 text-sm">No media available</p>
            </div>
        `;
    }

    // Show/hide mark as resolved button based on current status
    const markResolvedBtn = document.getElementById('markResolvedBtn');
    if (incident.status === 'resolved') {
        markResolvedBtn.disabled = true;
        markResolvedBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg> Already Resolved';
        markResolvedBtn.className = 'flex-1 px-6 py-3 bg-gray-400 text-white rounded-lg font-medium cursor-not-allowed flex items-center justify-center gap-2';
    } else {
        markResolvedBtn.disabled = false;
        markResolvedBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg> Mark as Resolved';
        markResolvedBtn.className = 'flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2';
    }

    if (typeof applyResolutionDetailPanel === 'function') {
        applyResolutionDetailPanel(incident, {
            section: document.getElementById('agencyResolutionSection'),
            meta: document.getElementById('agencyResolutionMeta'),
            notes: document.getElementById('agencyResolutionNotes'),
            emptyHint: document.getElementById('agencyResolutionEmptyHint'),
            photoWrap: document.getElementById('agencyResolutionPhotoWrap'),
            proofImg: document.getElementById('agencyResolutionProofPhoto')
        });
    }
}

function renderLinkedPatientCard(incident) {
    const card = document.getElementById('linkedPatientCard');
    if (!card) return;

    const patientId = incident.linked_patient_id || incident.patient_id || '';
    if (!patientId) {
        card.classList.add('hidden');
        return;
    }

    card.classList.remove('hidden');
    document.getElementById('linkedPatientName').textContent = incident.linked_patient_name || 'Unknown patient';
    document.getElementById('linkedPatientReason').textContent = incident.linked_patient_reason || 'No reason provided';
    document.getElementById('linkedPatientId').textContent = patientId;
    document.getElementById('linkedPatientStatus').textContent = incident.linked_patient_status || 'Unknown';
}

function openIncidentFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const incidentId = params.get('incident_id');
    if (!incidentId || !Array.isArray(currentReportsData) || currentReportsData.length === 0) {
        return;
    }

    const incident = currentReportsData.find((item) => item.incident_id === incidentId);
    if (!incident) {
        return;
    }

    const reportData = JSON.stringify(incident).replace(/"/g, '&quot;');
    viewIncidentDetails(reportData);
    params.delete('incident_id');
    const nextUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.replaceState({}, '', nextUrl);
}

// Close incident modal
function closeIncidentModal() {
    document.getElementById('incidentModal').classList.add('hidden');
    currentIncident = null;
    // Clean up map
    if (incidentMap) {
        incidentMap.remove();
        incidentMap = null;
    }
}

// Mark incident as resolved (proof photo required; notes optional for reporter history)
async function markAsResolved() {
    if (!currentIncident) return;

    const { isConfirmed, value } = await Swal.fire({
        title: 'Mark as resolved',
        customClass: {
            popup: 'swal-resolve-case'
        },
        html: `
            <div class="swal-resolve-fields w-full max-w-full box-border overflow-x-hidden text-left">
                <p class="text-sm text-slate-600 mb-3">A proof photo is required. Resolution notes are optional.</p>
                <label class="block text-xs font-medium text-slate-600 mb-1" for="swal-agency-res-photo">Proof photo (required)</label>
                <input type="file" id="swal-agency-res-photo" accept="image/*" class="mb-3 rounded border border-slate-200 bg-white px-2 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm" />
                <label class="block text-xs font-medium text-slate-600 mb-1" for="swal-agency-res-notes">Resolution notes (optional)</label>
                <textarea id="swal-agency-res-notes" class="rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400" rows="3" placeholder="What was done on scene"></textarea>
            </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Submit resolution',
        cancelButtonText: 'Cancel',
        preConfirm: async () => {
            const notesEl = document.getElementById('swal-agency-res-notes');
            const fileEl = document.getElementById('swal-agency-res-photo');
            const notes = notesEl ? notesEl.value.trim() : '';
            let photoUrl = '';
            if (!fileEl || !fileEl.files || !fileEl.files[0]) {
                Swal.showValidationMessage('Please upload a proof photo.');
                return false;
            }
            if (typeof uploadResolutionImageToCloudinary !== 'function') {
                Swal.showValidationMessage('Upload helper not loaded. Refresh the page.');
                return false;
            }
            try {
                photoUrl = await uploadResolutionImageToCloudinary(fileEl.files[0]);
            } catch (err) {
                Swal.showValidationMessage(err.message || 'Image upload failed');
                return false;
            }
            return { photoUrl, notes };
        }
    });

    if (!isConfirmed || !value) {
        return;
    }

    try {
        const body = {
            incident_id: currentIncident.incident_id,
            status: 'resolved',
            resolution_photo: value.photoUrl
        };
        if (value.notes) {
            body.resolution_notes = value.notes;
        }

        const response = await apiRequest('/agency/reports', {
            method: 'PUT',
            body: JSON.stringify(body)
        });

        if (response.success) {
            Swal.fire({
                icon: 'success',
                title: 'Incident Resolved!',
                text: 'The incident has been marked as resolved.',
                confirmButtonColor: '#10b981',
                timer: 2000,
                showConfirmButton: false
            });

            closeIncidentModal();
            loadReports(currentPage, currentFilters);
        } else {
            throw new Error(response.error || 'Failed to mark incident as resolved');
        }
    } catch (error) {
        console.error('Error marking incident as resolved:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to mark incident as resolved: ' + error.message,
            confirmButtonColor: '#ef4444'
        });
    }
}

// Update pagination controls
function updatePagination(pagination) {
    document.getElementById('showingStart').textContent = ((pagination.current_page - 1) * pagination.per_page) + 1;
    document.getElementById('showingEnd').textContent = Math.min(pagination.current_page * pagination.per_page, pagination.total_items);
    document.getElementById('totalReports').textContent = pagination.total_items;

    const paginationContainer = document.getElementById('paginationButtons');
    paginationContainer.innerHTML = '';

    // Previous button
    if (pagination.has_prev) {
        const prevButton = document.createElement('button');
        prevButton.textContent = 'Previous';
        prevButton.className = 'px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-white transition';
        prevButton.onclick = () => loadReports(pagination.current_page - 1, currentFilters);
        paginationContainer.appendChild(prevButton);
    }

    // Page numbers
    for (let i = 1; i <= pagination.total_pages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.className = `px-4 py-2 border rounded-lg text-sm font-medium transition ${
            i === pagination.current_page 
            ? 'bg-blue-600 text-white border-blue-600' 
            : 'border-slate-200 text-slate-600 hover:bg-white'
        }`;
        pageButton.onclick = () => loadReports(i, currentFilters);
        paginationContainer.appendChild(pageButton);
    }

    // Next button
    if (pagination.has_next) {
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Next';
        nextButton.className = 'px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-white transition';
        nextButton.onclick = () => loadReports(pagination.current_page + 1, currentFilters);
        paginationContainer.appendChild(nextButton);
    }
}

// Apply filters
function applyFilters() {
    const search = document.getElementById('searchInput').value;
    const status = document.getElementById('statusFilter').value;
    const type = document.getElementById('typeFilter').value;

    currentFilters = {
        search: search,
        status: status,
        type: type,
        severity: '' // You can add severity filter if needed
    };

    loadReports(1, currentFilters);
}

function getInitialReportFilters() {
    const params = new URLSearchParams(window.location.search);
    const search = params.get('search') || '';
    if (search) {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = search;
        }
    }

    currentFilters = {
        search: search,
        status: '',
        type: '',
        severity: ''
    };

    return currentFilters;
}

// View media
function viewMedia(photoUrl) {
    if (photoUrl) {
        window.open(`${photoUrl}`, '_blank');
    }
}

// Toggle notifications
function toggleNotifications() {
    alert('Notifications panel');
}

// UI Helper Functions
function showLoading() {
    document.getElementById('loadingState').classList.remove('hidden');
    document.getElementById('filtersSection').classList.add('hidden');
    document.getElementById('reportsSection').classList.add('hidden');
    document.getElementById('errorState').classList.add('hidden');
}

function showContent() {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('filtersSection').classList.remove('hidden');
    document.getElementById('reportsSection').classList.remove('hidden');
    document.getElementById('errorState').classList.add('hidden');
}

function showError(message) {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('filtersSection').classList.add('hidden');
    document.getElementById('reportsSection').classList.add('hidden');
    document.getElementById('errorState').classList.remove('hidden');
    document.getElementById('errorMessage').textContent = message;
}

// Update user info
function updateUserInfo() {
    const storedData = getStoredUserData();
    if (storedData && storedData.user) {
        const user = storedData.user;
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        const initials = (user.first_name?.charAt(0) || '') + (user.last_name?.charAt(0) || '') || 'U';
        
        document.getElementById('userName').textContent = fullName || 'User';
        document.getElementById('userRole').textContent = storedData.role || 'Administrator';
        document.getElementById('userInitials').textContent = initials;
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    updateUserInfo();
    loadReports(1, getInitialReportFilters());
});