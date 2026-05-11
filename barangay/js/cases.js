// API Configuration
const API_BASE_URL = 'https://greenyellow-hawk-206191.hostingersite.com';

// Incident type configuration with icons and colors
const INCIDENT_TYPES = {
    flood: { 
        icon: 'fas fa-water', 
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800',
        borderColor: 'border-blue-200',
        name: 'Flood'
    },
    fire: { 
        icon: 'fas fa-fire', 
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        borderColor: 'border-red-200',
        name: 'Fire'
    },
    medical: { 
        icon: 'fas fa-heart-pulse', 
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        borderColor: 'border-green-200',
        name: 'Medical Emergency'
    },
    accident: { 
        icon: 'fas fa-car-burst', 
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        borderColor: 'border-yellow-200',
        name: 'Accident'
    },
    crime: { 
        icon: 'fas fa-shield-halved', 
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-800',
        borderColor: 'border-purple-200',
        name: 'Crime'
    },
    earthquake: { 
        icon: 'fas fa-hill-avalanche', 
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-800',
        borderColor: 'border-orange-200',
        name: 'Earthquake'
    },
    typhoon: { 
        icon: 'fas fa-wind', 
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-100',
        textColor: 'text-indigo-800',
        borderColor: 'border-indigo-200',
        name: 'Typhoon'
    },
    landslide: { 
        icon: 'fas fa-mountain', 
        color: 'text-amber-600',
        bgColor: 'bg-amber-100',
        textColor: 'text-amber-800',
        borderColor: 'border-amber-200',
        name: 'Landslide'
    },
    tsunami: { 
        icon: 'fas fa-water', 
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-100',
        textColor: 'text-cyan-800',
        borderColor: 'border-cyan-200',
        name: 'Tsunami'
    },
    volcanic: { 
        icon: 'fas fa-volcano', 
        color: 'text-rose-600',
        bgColor: 'bg-rose-100',
        textColor: 'text-rose-800',
        borderColor: 'border-rose-200',
        name: 'Volcanic Eruption'
    },
    rescue: { 
        icon: 'fas fa-person-falling', 
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-100',
        textColor: 'text-emerald-800',
        borderColor: 'border-emerald-200',
        name: 'Rescue Operation'
    },
    hazard: { 
        icon: 'fas fa-biohazard', 
        color: 'text-lime-600',
        bgColor: 'bg-lime-100',
        textColor: 'text-lime-800',
        borderColor: 'border-lime-200',
        name: 'Chemical Hazard'
    },
    power: { 
        icon: 'fas fa-bolt', 
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        borderColor: 'border-yellow-200',
        name: 'Power Outage'
    },
    water: { 
        icon: 'fas fa-faucet', 
        color: 'text-sky-600',
        bgColor: 'bg-sky-100',
        textColor: 'text-sky-800',
        borderColor: 'border-sky-200',
        name: 'Water Emergency'
    },
    gas: { 
        icon: 'fas fa-gas-pump', 
        color: 'text-stone-600',
        bgColor: 'bg-stone-100',
        textColor: 'text-stone-800',
        borderColor: 'border-stone-200',
        name: 'Gas Leak'
    },
    structural: { 
        icon: 'fas fa-building', 
        color: 'text-neutral-600',
        bgColor: 'bg-neutral-100',
        textColor: 'text-neutral-800',
        borderColor: 'border-neutral-200',
        name: 'Structural Damage'
    },
    animal: { 
        icon: 'fas fa-paw', 
        color: 'text-fuchsia-600',
        bgColor: 'bg-fuchsia-100',
        textColor: 'text-fuchsia-800',
        borderColor: 'border-fuchsia-200',
        name: 'Animal Rescue'
    },
    missing: { 
        icon: 'fas fa-person-walking', 
        color: 'text-pink-600',
        bgColor: 'bg-pink-100',
        textColor: 'text-pink-800',
        borderColor: 'border-pink-200',
        name: 'Missing Person'
    },
    traffic: { 
        icon: 'fas fa-traffic-light', 
        color: 'text-teal-600',
        bgColor: 'bg-teal-100',
        textColor: 'text-teal-800',
        borderColor: 'border-teal-200',
        name: 'Traffic Incident'
    },
    marine: { 
        icon: 'fas fa-ship', 
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800',
        borderColor: 'border-blue-200',
        name: 'Marine Emergency'
    },
    aviation: { 
        icon: 'fas fa-plane', 
        color: 'text-violet-600',
        bgColor: 'bg-violet-100',
        textColor: 'text-violet-800',
        borderColor: 'border-violet-200',
        name: 'Aviation Emergency'
    },
    terrorism: { 
        icon: 'fas fa-bomb', 
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        borderColor: 'border-red-200',
        name: 'Terrorism'
    },
    civil: { 
        icon: 'fas fa-people-group', 
        color: 'text-slate-600',
        bgColor: 'bg-slate-100',
        textColor: 'text-slate-800',
        borderColor: 'border-slate-200',
        name: 'Civil Disturbance'
    },
    evacuation: { 
        icon: 'fas fa-people-carry-box', 
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-800',
        borderColor: 'border-orange-200',
        name: 'Evacuation'
    },
    other: { 
        icon: 'fas fa-triangle-exclamation', 
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
        borderColor: 'border-gray-200',
        name: 'Other Emergency'
    }
};

let userProfile = null;
let currentIncidents = [];
let currentPagination = {};
let currentFilters = {
    status: '',
    severity: '',
    type: '',
    search: '',
    page: 1,
    limit: 20
};
let currentCaseId = null;
let currentIncidentId = null;
let map = null;
let currentMarker = null;
let searchTimeout = null;
let barangayCasesListPollSignature = '';

function fingerprintBarangayCasesPage(incidents, pagination) {
    const filt = JSON.stringify({
        status: currentFilters.status,
        severity: currentFilters.severity,
        type: currentFilters.type,
        search: currentFilters.search,
        page: currentFilters.page,
        limit: currentFilters.limit
    });
    if (!Array.isArray(incidents)) return filt + '|';
    const pag = pagination && typeof pagination === 'object'
        ? `ti:${pagination.total_items ?? ''}|cp:${pagination.current_page ?? ''}|pp:${pagination.per_page ?? ''}`
        : '';
    const parts = incidents.map((inc) => {
        const id = inc.incident_id ?? inc.id ?? '';
        return [
            id,
            inc.status ?? '',
            inc.updated_at ?? inc.created_at ?? '',
            inc.severity_level ?? '',
            String(inc.latitude ?? ''),
            String(inc.longitude ?? ''),
            (inc.description ?? '').slice(0, 120)
        ].join('\u001f');
    });
    parts.sort();
    return filt + '\u0000' + pag + '\u0000' + parts.join('\u0000');
}

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

// Function to get incident type configuration
function getIncidentTypeConfig(type) {
    if (!type) {
        return INCIDENT_TYPES.other; 
    }
    
    const typeKey = type.toLowerCase();
    
    if (INCIDENT_TYPES[typeKey]) {
        return INCIDENT_TYPES[typeKey];
    }
    
    return {
        icon: 'fas fa-triangle-exclamation', 
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
        borderColor: 'border-gray-200',
        name: formatIncidentTypeName(type)
    };
}

function formatIncidentTypeName(type) {
    if (!type) return 'Other Emergency';
    
    return type
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function getIncidentTypeName(type) {
    if (!type) return 'Other Emergency';
    
    const typeKey = type.toLowerCase();
    
    if (INCIDENT_TYPES[typeKey]) {
        return INCIDENT_TYPES[typeKey].name;
    }
    
    return formatIncidentTypeName(type);
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

// Update incident status with dispatcher_id and agency_id
async function updateIncidentStatus(incidentId, updateData) {
    showLoadingOverlay();
    try {
        const response = await apiRequest('/barangay/incidents', {
            method: 'PUT',
            body: JSON.stringify({
                incident_id: incidentId,
                ...updateData
            })
        });

        if (response.success) {
            return response;
        } else {
            throw new Error(response.error || 'Failed to update incident status');
        }
    } catch (error) {
        console.error('Error updating incident status:', error);
        throw error;
    } finally {
        hideLoadingOverlay();
    }
}

// Load incidents from API
async function loadCases(options) {
    const silent = Boolean(options && options.silent);
    if (!silent) {
        showLoading();
    }
    try {
        // Build query string from filters
        const queryParams = new URLSearchParams();
        if (currentFilters.status) queryParams.append('status', currentFilters.status);
        if (currentFilters.severity) queryParams.append('severity', currentFilters.severity);
        if (currentFilters.type) queryParams.append('type', currentFilters.type);
        if (currentFilters.search) queryParams.append('search', currentFilters.search);
        queryParams.append('page', currentFilters.page);
        queryParams.append('limit', currentFilters.limit);

        const data = await apiRequest(`/barangay/incidents?${queryParams.toString()}`);
        
        if (data.success && data.data) {
            const rows = data.data;
            const nextSig = fingerprintBarangayCasesPage(rows, data.pagination || {});
            if (silent && nextSig === barangayCasesListPollSignature) {
                return;
            }
            barangayCasesListPollSignature = nextSig;
            currentIncidents = rows;
            currentPagination = data.pagination || {};
            
            updateStats(rows);
            renderCases(rows);
            updatePaginationControls();
            showContent();
        } else {
            throw new Error(data.error || 'Failed to load incidents');
        }
    } catch (error) {
        console.error('Error loading incidents:', error);
        if (!silent) {
            showError('Failed to load incidents: ' + error.message);
        }
    }
}

// Update statistics
function updateStats(incidents) {
    const totalCount = currentPagination.total_items || incidents.length;
    const pendingCount = incidents.filter(i => normalizeIncidentStatusKey(i.status) === 'pending').length;
    const activeCount = incidents.filter(i => normalizeIncidentStatusKey(i.status) === 'ongoing').length;
    const resolvedCount = incidents.filter(i => normalizeIncidentStatusKey(i.status) === 'resolved').length;

    document.getElementById('totalCount').textContent = totalCount;
    document.getElementById('pendingCount').textContent = pendingCount;
    document.getElementById('activeCount').textContent = activeCount;
    document.getElementById('resolvedCount').textContent = resolvedCount;

    document.getElementById('showingCount').textContent = incidents.length;
    document.getElementById('totalItems').textContent = totalCount;
}

// Render cases list
function renderCases(incidents) {
    const casesList = document.getElementById('casesList');
    if (!casesList) return;
    
    casesList.innerHTML = '';

    if (incidents.length === 0) {
        casesList.innerHTML = `
            <div class="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <h3 class="text-lg font-semibold text-slate-900 mb-2">No Cases Found</h3>
                <p class="text-slate-600">No incidents match your current filters.</p>
            </div>
        `;
        return;
    }

    incidents.forEach(incident => {
        const caseCard = createCaseCard(incident);
        casesList.appendChild(caseCard);
    });
}

// Get reporter name from user information
function getReporterName(incident) {
    if (incident.first_name && incident.last_name) {
        const middleInitial = incident.middle_name ? ` ${incident.middle_name.charAt(0)}.` : '';
        return `${incident.first_name}${middleInitial} ${incident.last_name}`;
    }
    return 'Anonymous User';
}

// Get reporter contact information
function getReporterContact(incident) {
    if (incident.email) {
        return incident.email;
    }
    if (incident.phone) {
        return incident.phone;
    }
    return 'No contact info';
}

// Update pagination controls
function updatePaginationControls() {
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (!prevBtn || !nextBtn) return;
    
    prevBtn.disabled = !currentPagination.has_prev;
    nextBtn.disabled = !currentPagination.has_next;
    
    prevBtn.onclick = () => {
        if (currentPagination.has_prev) {
            currentFilters.page--;
            loadCases();
        }
    };
    
    nextBtn.onclick = () => {
        if (currentPagination.has_next) {
            currentFilters.page++;
            loadCases();
        }
    };
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

function normalizeIncidentStatusKey(status) {
    const s = String(status ?? '').trim().toLowerCase();
    if (s === 'complete' || s === 'closed') return 'resolved';
    return s;
}

// Create status progress bar
function createStatusProgress(status) {
    const raw = normalizeIncidentStatusKey(status);
    const st = raw === 'dispatched' ? 'ongoing' : raw;
    const steps = [
        { id: 'pending', label: 'Pending', icon: 'fa-clock' },
        { id: 'ongoing', label: 'Ongoing', icon: 'fa-spinner' },
        { id: 'resolved', label: 'Resolved', icon: 'fa-check-circle' }
    ];

    let html = '<div class="flex items-center justify-between w-full px-4">';
    
    steps.forEach((step, index) => {
        const isActive = step.id === st;
        const isCompleted = 
            (st === 'ongoing' && step.id === 'pending') ||
            (st === 'resolved' && (step.id === 'pending' || step.id === 'ongoing'));

        // Dot colors and styles
        let dotClass = "w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-300 ";
        let labelClass = "text-xs font-medium mt-1 ";
        
        if (isActive) {
            if (st === 'resolved' && step.id === 'resolved') {
                dotClass += "bg-green-600 text-white ring-4 ring-green-100 scale-110";
                labelClass += "text-green-700 font-semibold";
            } else {
                dotClass += "bg-blue-600 text-white ring-4 ring-blue-100 scale-110";
                labelClass += "text-blue-600 font-semibold";
            }
        } else if (isCompleted) {
            dotClass += "bg-green-500 text-white";
            labelClass += "text-green-600 font-semibold";
        } else {
            dotClass += "bg-gray-200 text-gray-400";
            labelClass += "text-gray-500";
        }

        html += `
            <div class="flex flex-col items-center relative flex-1">
                <div class="${dotClass}">
                    <i class="fas ${isCompleted && !isActive ? 'fa-check' : step.icon}"></i>
                </div>
                <span class="${labelClass}">${step.label}</span>
            </div>
            ${index < steps.length - 1 ? `
                <div class="flex-1 h-1 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}"></div>
            ` : ''}
        `;
    });

    html += '</div>';
    return html;
}

// Initialize OpenStreetMap
function initializeMap(latitude, longitude, incidentType) {
    const mapContainer = document.getElementById('map');
    
    // Check if map container exists
    if (!mapContainer) {
        console.error('Map container not found');
        return;
    }

    // Destroy existing map if it exists
    if (map) {
        map.remove();
        map = null;
    }

    // Clear map container
    mapContainer.innerHTML = '';

    // Default coordinates (Laguna, Philippines)
    const defaultLat = 14.1667;
    const defaultLng = 121.2167;

    const mapLat = latitude ? parseFloat(latitude) : defaultLat;
    const mapLng = longitude ? parseFloat(longitude) : defaultLng;

    try {
        // Create map
        map = L.map('map').setView([mapLat, mapLng], 15);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Add marker if coordinates are valid
        if (latitude && longitude && !isNaN(mapLat) && !isNaN(mapLng)) {
            const marker = L.marker([mapLat, mapLng]).addTo(map);
            
            // Customize marker based on incident type
            let popupText = `<b>${incidentType ? incidentType.charAt(0).toUpperCase() + incidentType.slice(1) : 'Incident'} Location</b><br>`;
            popupText += `Lat: ${mapLat}<br>Lng: ${mapLng}`;
            
            marker.bindPopup(popupText).openPopup();
        } else {
            console.warn('Invalid coordinates for map:', latitude, longitude);
        }

        setTimeout(() => {
            if (map) {
                map.invalidateSize();
            }
        }, 250);
    } catch (error) {
        console.error('Error initializing map:', error);
        mapContainer.innerHTML = `
            <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p class="text-red-700 text-sm">Unable to load map</p>
                <p class="text-red-600 text-xs mt-1">Coordinates: ${latitude || 'N/A'}, ${longitude || 'N/A'}</p>
            </div>
        `;
    }
}

function hasValidResolutionPhoto(photo) {
    if (photo === null || photo === undefined) return false;
    const s = String(photo).trim();
    return s !== '' && s !== 'null' && s !== 'undefined';
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

// Action functions from detail modal
function acceptIncidentFromDetail() {
    const detailId = document.getElementById('detailId');
    if (!detailId) return;
    
    const incidentId = detailId.textContent.replace('ID: ', '');
    acceptIncident(incidentId);
}

function resolveCaseFromDetail() {
    const detailId = document.getElementById('detailId');
    if (!detailId) return;
    
    const incidentId = detailId.textContent.replace('ID: ', '');
    resolveCase(incidentId);
}

// Incoming Cases Functions
function acceptIncident(incidentId) {
    currentIncidentId = incidentId;
    const acceptModal = document.getElementById('acceptModal');
    if (acceptModal) {
        acceptModal.classList.remove('hidden');
    }
}

async function escalateIncident(incidentId) {
    Swal.fire({
        title: 'Escalate Incident?',
        text: 'Are you sure you want to escalate this incident to the dispatcher?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, escalate it',
        cancelButtonText: 'Cancel'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await updateIncidentStatus(incidentId, {
                    dispatcher_id: BARANGAY_DISPATCHER_ESCALATION_PLACEHOLDER_ID
                });

                Swal.fire({
                    icon: 'success',
                    title: 'Escalated!',
                    text: `Incident ${incidentId} escalated to dispatcher!`,
                    confirmButtonColor: '#10b981',
                    timer: 1500,
                    showConfirmButton: false
                });
                
                loadCases(); // Refresh the cases list
                closeModal('detailsModal');
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to escalate incident: ' + error.message,
                    confirmButtonColor: '#ef4444'
                });
            }
        }
    });
}

async function confirmAccept() {
    try {
        // Update incident status to ongoing
        const response = await updateIncidentStatus(currentIncidentId, {
            status: 'ongoing'
        });

        Swal.fire({
            icon: 'success',
            title: 'Accepted!',
            text: `Incident ${currentIncidentId} accepted and marked as ongoing!`,
            confirmButtonColor: '#10b981',
            timer: 1500,
            showConfirmButton: false
        });
        
        closeModal('acceptModal');
        closeModal('detailsModal');
        loadCases(); // Refresh the cases list
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to accept incident: ' + error.message,
            confirmButtonColor: '#ef4444'
        });
    }
}

// Active Cases Functions
async function resolveCase(caseId) {
    const { isConfirmed, value } = await Swal.fire({
        title: 'Resolve case',
        customClass: {
            popup: 'swal-resolve-case'
        },
        html: `
            <div class="swal-resolve-fields w-full max-w-full box-border overflow-x-hidden text-left">
                <p class="text-sm text-slate-600 mb-3">A proof photo is required. Resolution notes are optional.</p>
                <label class="block text-xs font-medium text-slate-600 mb-1" for="swal-res-photo">Proof photo (required)</label>
                <input type="file" id="swal-res-photo" accept="image/*" class="mb-3 rounded border border-slate-200 bg-white px-2 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm" />
                <label class="block text-xs font-medium text-slate-600 mb-1" for="swal-res-notes">Resolution notes (optional)</label>
                <textarea id="swal-res-notes" class="rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400" rows="3" placeholder="What was done, units involved, etc."></textarea>
            </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Submit resolution',
        cancelButtonText: 'Cancel',
        preConfirm: async () => {
            const notesEl = document.getElementById('swal-res-notes');
            const fileEl = document.getElementById('swal-res-photo');
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
        const payload = { status: 'resolved', resolution_photo: value.photoUrl };
        if (value.notes) {
            payload.resolution_notes = value.notes;
        }
        await updateIncidentStatus(caseId, payload);

        Swal.fire({
            icon: 'success',
            title: 'Resolved!',
            text: `Case ${caseId} marked as resolved.`,
            confirmButtonColor: '#10b981',
            timer: 1500,
            showConfirmButton: false
        });

        loadCases();
        closeModal('detailsModal');
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to resolve case: ' + error.message,
            confirmButtonColor: '#ef4444'
        });
    }
}

// Create case card HTML with incident type icons - FIXED VERSION
function createCaseCard(incident) {
    const card = document.createElement('div');
    card.className = 'case-card bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-300';
    
    const severityColors = {
        high: 'bg-red-100 text-red-700 border-red-200',
        medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        low: 'bg-green-100 text-green-700 border-green-200'
    };

    const statusColors = {
        pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        ongoing: 'bg-blue-100 text-blue-700 border-blue-200',
        dispatched: 'bg-orange-100 text-orange-700 border-orange-200',
        resolved: 'bg-green-100 text-green-700 border-green-200'
    };

    // Get incident type configuration
    const typeConfig = getIncidentTypeConfig(incident.incident_type);
    
    const severityClass = severityColors[incident.severity_level] || severityColors.medium;
    const statusKey = normalizeIncidentStatusKey(incident.status);
    const statusClass = statusColors[statusKey] || statusColors.pending;

    // Get reporter information
    const reporterName = getReporterName(incident);
    const reporterContact = getReporterContact(incident);

    const dispatcherNorm = dispatcherIdNormalizedFromIncident(incident);
    const claimableQueue = incidentIsClaimableTimedDispatcherEscalation(incident);
    const lockedByDispatcher = incidentBarangayActionsLockedByDispatcher(incident);

    const showAccept = claimableQueue || (statusKey === 'pending' && !dispatcherNorm);
    const showEscalate = statusKey === 'pending' && !dispatcherNorm;
    const showResolve = statusKey === 'ongoing' && !claimableQueue && !lockedByDispatcher;

    const escalationBadgeHtml = claimableQueue ? `
                                <span class="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
                                    <i class="fas fa-clock mr-1"></i>Awaiting dispatcher — you can claim
                                </span>
                            ` : (dispatcherNorm !== '' ? `
                                <span class="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                                    <i class="fas fa-user-shield mr-1"></i>Escalated to Dispatcher
                                </span>
                            ` : '');

    card.innerHTML = `
        <div class="flex items-start gap-6">
            <div class="w-16 h-16 ${typeConfig.bgColor} rounded-lg flex items-center justify-center flex-shrink-0">
                <i class="${typeConfig.icon} ${typeConfig.color} text-2xl"></i>
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-4 mb-3">
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <h3 class="text-xl font-bold text-slate-900">${typeConfig.name} Incident</h3>
                            <span class="px-2 py-1 ${severityClass} text-xs font-medium rounded-full capitalize">${incident.severity_level}</span>
                            <span class="px-2 py-1 ${statusClass} text-xs font-medium rounded-full capitalize">${statusKey}</span>
                            ${escalationBadgeHtml ? escalationBadgeHtml : ''}
                        </div>
                        <p class="text-sm text-slate-500">ID: ${incident.incident_id || 'N/A'}</p>
                    </div>
                    <span class="text-sm text-slate-500 whitespace-nowrap">${formatTimeAgo(incident.created_at)}</span>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <p class="text-sm font-medium text-slate-700 mb-1">Location</p>
                        <p class="text-sm text-slate-600">${incident.latitude && incident.longitude ? `Lat: ${incident.latitude}, Lng: ${incident.longitude}` : 'Location not specified'}</p>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-slate-700 mb-1">Reporter</p>
                        <p class="text-sm text-slate-600">${reporterName}</p>
                        <p class="text-xs text-slate-500">${reporterContact}</p>
                    </div>
                </div>

                <div class="mb-4">
                    <p class="text-sm font-medium text-slate-700 mb-1">Description</p>
                    <p class="text-sm text-slate-600 line-clamp-2">${incident.description || 'No description provided.'}</p>
                </div>

                <div class="flex items-center gap-3">
                    ${showAccept ? `
                            <button onclick="acceptIncident('${incident.incident_id}')" class="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                                ${claimableQueue ? 'Claim & Respond' : 'Accept & Respond'}
                            </button>
                        ` : ''}
                    ${showEscalate ? `
                            <button onclick="escalateIncident('${incident.incident_id}')" class="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors">
                                Escalate to Dispatcher
                            </button>
                        ` : ''}
                    ${showResolve ? `
                            <button onclick="resolveCase('${incident.incident_id}')" class="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors">
                                Mark Resolved
                            </button>
                        ` : ''}
                    
                    <button onclick="viewDetails('${incident.incident_id}')" class="px-6 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors">
                        View Details
                    </button>
                </div>
            </div>
        </div>
    `;

    return card;
}

// View Details Function - FIXED VERSION
function viewDetails(incidentId) {
    // Check if modal exists first
    const detailsModal = document.getElementById('detailsModal');
    if (!detailsModal) {
        console.error('Details modal not found');
        return;
    }

    const incident = currentIncidents.find(i => i.incident_id === incidentId);
    if (!incident) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Incident not found',
            confirmButtonColor: '#ef4444'
        });
        return;
    }

    try {
        // Get incident type configuration
        const typeConfig = getIncidentTypeConfig(incident.incident_type);
        
        // Populate modal with incident data
        const detailTitle = document.getElementById('detailTitle');
        const detailId = document.getElementById('detailId');
        const detailType = document.getElementById('detailType');
        const detailSeverityText = document.getElementById('detailSeverityText');
        const detailStatusText = document.getElementById('detailStatusText');
        const detailCreated = document.getElementById('detailCreated');
        const detailUpdated = document.getElementById('detailUpdated');
        const detailUserId = document.getElementById('detailUserId');
        const detailDescription = document.getElementById('detailDescription');
        const detailCoordinates = document.getElementById('detailCoordinates');
        const detailReporterName = document.getElementById('detailReporterName');
        const detailReporterEmail = document.getElementById('detailReporterEmail');
        const detailReporterPhone = document.getElementById('detailReporterPhone');
        const statusProgress = document.getElementById('statusProgress');
        const severityBadge = document.getElementById('detailSeverity');
        const statusBadge = document.getElementById('detailStatus');
        const photoSection = document.getElementById('photoSection');
        const detailPhoto = document.getElementById('detailPhoto');
        const detailAcceptBtn = document.getElementById('detailAcceptBtn');
        const detailResolveBtn = document.getElementById('detailResolveBtn');
        const resolutionSection = document.getElementById('resolutionSection');
        const resolutionMeta = document.getElementById('resolutionMeta');
        const resolutionNotes = document.getElementById('resolutionNotes');
        const resolutionEmptyHint = document.getElementById('resolutionEmptyHint');
        const resolutionPhotoWrap = document.getElementById('resolutionPhotoWrap');
        const resolutionProofPhoto = document.getElementById('resolutionProofPhoto');

        // Check if all required elements exist
        if (!detailTitle || !detailId || !detailType || !detailSeverityText || !detailStatusText || 
            !detailCreated || !detailUpdated || !detailUserId || !detailDescription || !detailCoordinates ||
            !detailReporterName || !detailReporterEmail || !detailReporterPhone || !statusProgress ||
            !severityBadge || !statusBadge || !photoSection || !detailPhoto || !detailAcceptBtn || !detailResolveBtn ||
            !resolutionSection || !resolutionMeta || !resolutionNotes || !resolutionEmptyHint ||
            !resolutionPhotoWrap || !resolutionProofPhoto) {
            throw new Error('One or more modal elements not found');
        }

        // Populate data
        detailTitle.textContent = `${typeConfig.name} Incident`;
        detailId.textContent = `ID: ${incident.incident_id || 'N/A'}`;
        detailType.innerHTML = `
            <div class="flex items-center gap-2">
                <div class="w-6 h-6 ${typeConfig.bgColor} rounded flex items-center justify-center">
                    <i class="${typeConfig.icon} ${typeConfig.color} text-sm"></i>
                </div>
                <span>${typeConfig.name} Incident</span>
            </div>
        `;
        detailSeverityText.textContent = incident.severity_level || 'Not specified';
        detailStatusText.textContent = incident.status || 'Not specified';
        detailCreated.textContent = formatDateTime(incident.created_at);
        detailUpdated.textContent = formatDateTime(incident.updated_at);
        detailUserId.textContent = incident.user_id || 'Not specified';
        detailDescription.textContent = incident.description || 'No description provided.';
        detailCoordinates.textContent = `Coordinates: ${incident.latitude || 'N/A'}, ${incident.longitude || 'N/A'}`;

        // Populate reporter information
        detailReporterName.textContent = getReporterName(incident);
        detailReporterEmail.textContent = incident.email || 'Not provided';
        detailReporterPhone.textContent = incident.phone || 'Not provided';

        // Update status progress
        statusProgress.innerHTML = createStatusProgress(incident.status);
        const detailStatusKey = normalizeIncidentStatusKey(incident.status);
        const dispatcherNormDetail = dispatcherIdNormalizedFromIncident(incident);
        const claimableQueueDetail = incidentIsClaimableTimedDispatcherEscalation(incident);

        // Update severity and status badges
        const severityColors = {
            high: 'bg-red-100 text-red-700 border-red-200',
            medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            low: 'bg-green-100 text-green-700 border-green-200'
        };

        const statusColors = {
            pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            ongoing: 'bg-blue-100 text-blue-700 border-blue-200',
            dispatched: 'bg-orange-100 text-orange-700 border-orange-200',
            resolved: 'bg-green-100 text-green-700 border-green-200'
        };

        severityBadge.className = `px-3 py-1 text-xs font-medium rounded-full ${severityColors[incident.severity_level] || severityColors.medium}`;
        statusBadge.className = `px-3 py-1 text-xs font-medium rounded-full ${statusColors[detailStatusKey] || statusColors.pending}`;

        severityBadge.textContent = incident.severity_level || 'Medium';
        statusBadge.textContent = detailStatusKey;

        const headerBadgesContainer = document.querySelector('#detailsModal .flex.items-start.justify-between .flex.gap-2');
        if (headerBadgesContainer) {
            const existingBadges = headerBadgesContainer.querySelectorAll('span');
            existingBadges.forEach((badge, index) => {
                if (index >= 2) {
                    badge.remove();
                }
            });
        }

        if (claimableQueueDetail && headerBadgesContainer) {
            const claimBadge = document.createElement('span');
            claimBadge.className = 'px-3 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full';
            claimBadge.innerHTML = '<i class="fas fa-clock mr-1"></i>Awaiting dispatcher — you can claim';
            headerBadgesContainer.appendChild(claimBadge);
        } else if (dispatcherNormDetail !== '' && headerBadgesContainer) {
            const escalatedBadge = document.createElement('span');
            escalatedBadge.className = 'px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full';
            escalatedBadge.innerHTML = '<i class="fas fa-user-shield mr-1"></i>Escalated to Dispatcher';
            headerBadgesContainer.appendChild(escalatedBadge);
        }

        // Handle photo
        if (incident.photo && incident.photo !== 'null' && incident.photo !== 'undefined') {
            photoSection.classList.remove('hidden');
            detailPhoto.src = incident.photo;
            detailPhoto.onerror = function() {
                photoSection.classList.add('hidden');
            };
        } else {
            photoSection.classList.add('hidden');
        }

        if (detailStatusKey === 'resolved') {
            resolutionSection.classList.remove('hidden');

            const roleRaw = incident.resolved_by_role;
            const roleLabel = roleRaw === 'agency'
                ? 'Agency'
                : (roleRaw === 'barangay' ? 'Barangay' : (roleRaw ? String(roleRaw) : ''));
            const resolvedAtStr = incident.resolved_at ? formatDateTime(incident.resolved_at) : '';

            const metaParts = [];
            if (roleLabel) {
                metaParts.push(`Resolved by: ${roleLabel}`);
            }
            if (resolvedAtStr && resolvedAtStr !== 'Unknown') {
                metaParts.push(`Completed: ${resolvedAtStr}`);
            }
            if (metaParts.length > 0) {
                resolutionMeta.textContent = metaParts.join(' · ');
                resolutionMeta.classList.remove('hidden');
            } else {
                resolutionMeta.textContent = '';
                resolutionMeta.classList.add('hidden');
            }

            const notesTrimmed = incident.resolution_notes && String(incident.resolution_notes).trim()
                ? String(incident.resolution_notes).trim()
                : '';
            if (notesTrimmed) {
                resolutionNotes.textContent = notesTrimmed;
                resolutionNotes.classList.remove('hidden');
            } else {
                resolutionNotes.textContent = '';
                resolutionNotes.classList.add('hidden');
            }

            const proofUrl = hasValidResolutionPhoto(incident.resolution_photo)
                ? String(incident.resolution_photo).trim()
                : '';
            if (proofUrl) {
                resolutionProofPhoto.src = proofUrl;
                resolutionPhotoWrap.classList.remove('hidden');
                resolutionProofPhoto.onerror = function () {
                    resolutionPhotoWrap.classList.add('hidden');
                    resolutionProofPhoto.removeAttribute('src');
                };
            } else {
                resolutionPhotoWrap.classList.add('hidden');
                resolutionProofPhoto.removeAttribute('src');
            }

            const hasAnyDetail = metaParts.length > 0 || notesTrimmed || proofUrl;
            if (hasAnyDetail) {
                resolutionEmptyHint.classList.add('hidden');
            } else {
                resolutionEmptyHint.classList.remove('hidden');
            }
        } else {
            resolutionSection.classList.add('hidden');
            resolutionMeta.classList.add('hidden');
            resolutionMeta.textContent = '';
            resolutionNotes.classList.add('hidden');
            resolutionNotes.textContent = '';
            resolutionEmptyHint.classList.add('hidden');
            resolutionPhotoWrap.classList.add('hidden');
            resolutionProofPhoto.removeAttribute('src');
        }

        const showAcceptDetail = claimableQueueDetail || (detailStatusKey === 'pending' && !dispatcherNormDetail);
        const showResolveDetail = detailStatusKey === 'ongoing'
            && !claimableQueueDetail
            && !incidentBarangayActionsLockedByDispatcher(incident);

        detailAcceptBtn.classList.add('hidden');
        detailResolveBtn.classList.add('hidden');

        if (showAcceptDetail) {
            detailAcceptBtn.classList.remove('hidden');
            detailAcceptBtn.textContent = claimableQueueDetail ? 'Claim & Respond' : 'Accept & Respond';
        } else if (showResolveDetail) {
            detailResolveBtn.classList.remove('hidden');
        }

        // Initialize map
        initializeMap(incident.latitude, incident.longitude, incident.incident_type);

        // Show modal
        detailsModal.classList.remove('hidden');
    } catch (error) {
        console.error('Error showing details:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load incident details',
            confirmButtonColor: '#ef4444'
        });
    }
}

// Clean up details modal when closing
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
    currentCaseId = null;
    currentIncidentId = null;
    
    // Remove any dynamically added badges from details modal
    if (modalId === 'detailsModal') {
        const headerBadges = document.querySelector('#detailsModal .flex.items-start.justify-between .flex.gap-2');
        if (headerBadges) {
            const badges = headerBadges.querySelectorAll('span');
            badges.forEach((badge, index) => {
                if (index >= 2) { // Keep only severity and status badges
                    badge.remove();
                }
            });
        }
    }
}

// Loading overlay functions
function showLoadingOverlay() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.remove('hidden');
    }
}

function hideLoadingOverlay() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
    }
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
        loadCases();
    }, 500);
}

// Filter functionality
function setupFilters() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        // Use input event for real-time search with debouncing
        searchInput.addEventListener('input', handleSearchInput);
        
        // Also allow Enter key to trigger immediate search
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                // Clear timeout and search immediately
                if (searchTimeout) {
                    clearTimeout(searchTimeout);
                }
                loadCases();
            }
        });
    }

    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
            currentFilters.status = e.target.value;
            currentFilters.page = 1;
            loadCases();
        });
    }

    const severityFilter = document.getElementById('severityFilter');
    if (severityFilter) {
        severityFilter.addEventListener('change', (e) => {
            currentFilters.severity = e.target.value;
            currentFilters.page = 1;
            loadCases();
        });
    }

    const typeFilter = document.getElementById('typeFilter');
    if (typeFilter) {
        typeFilter.addEventListener('change', (e) => {
            currentFilters.type = e.target.value;
            currentFilters.page = 1;
            loadCases();
        });
    }
}

// Notifications
function toggleNotifications() {
    const panel = document.getElementById('notificationsPanel');
    if (panel) {
        panel.classList.toggle('hidden');
    }
}

// Close notifications when clicking outside
document.addEventListener('click', function(e) {
    const panel = document.getElementById('notificationsPanel');
    const button = e.target.closest('button[onclick="toggleNotifications()"]');
    if (panel && !panel.contains(e.target) && !button) {
        panel.classList.add('hidden');
    }
});

// UI Helper Functions
function showLoading() {
    const loadingState = document.getElementById('loadingState');
    const casesContent = document.getElementById('casesContent');
    const errorState = document.getElementById('errorState');
    
    if (loadingState) loadingState.classList.remove('hidden');
    if (casesContent) casesContent.classList.add('hidden');
    if (errorState) errorState.classList.add('hidden');
}

function showContent() {
    const loadingState = document.getElementById('loadingState');
    const casesContent = document.getElementById('casesContent');
    const errorState = document.getElementById('errorState');
    
    if (loadingState) loadingState.classList.add('hidden');
    if (casesContent) casesContent.classList.remove('hidden');
    if (errorState) errorState.classList.add('hidden');
}

function showError(message) {
    const loadingState = document.getElementById('loadingState');
    const casesContent = document.getElementById('casesContent');
    const errorState = document.getElementById('errorState');
    const errorMessage = document.getElementById('errorMessage');
    
    if (loadingState) loadingState.classList.add('hidden');
    if (casesContent) casesContent.classList.add('hidden');
    if (errorState) errorState.classList.remove('hidden');
    if (errorMessage) errorMessage.textContent = message;
}

// Update user info in header
function updateUserInfo() {
    const storedData = getStoredUserData();
    if (storedData && storedData.user) {
        const user = storedData.user;
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        const initials = getInitials(user.first_name, user.last_name);
        
        const userName = document.getElementById('userName');
        const userInitials = document.getElementById('userInitials');
        
        if (userName) userName.textContent = fullName || 'User';
        if (userInitials) userInitials.textContent = initials;
    }
}

// Get initials from name
function getInitials(firstName, lastName) {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last || 'U';
}

// Initialize modal event listeners
function initializeModals() {
    // Close modal when clicking outside
    document.addEventListener('click', function(e) {
        const detailsModal = document.getElementById('detailsModal');
        const acceptModal = document.getElementById('acceptModal');
        
        if (detailsModal && !detailsModal.classList.contains('hidden') && e.target === detailsModal) {
            closeModal('detailsModal');
        }
        
        if (acceptModal && !acceptModal.classList.contains('hidden') && e.target === acceptModal) {
            closeModal('acceptModal');
        }
    });

    // Close modal with escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const detailsModal = document.getElementById('detailsModal');
            const acceptModal = document.getElementById('acceptModal');
            
            if (detailsModal && !detailsModal.classList.contains('hidden')) {
                closeModal('detailsModal');
            }
            
            if (acceptModal && !acceptModal.classList.contains('hidden')) {
                closeModal('acceptModal');
            }
        }
    });
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const storedData = getStoredUserData();
    if (!storedData) {
        showError('Please login to access cases.');
        return;
    }

    updateUserInfo();
    setupFilters();
    initializeModals();
    loadCases();
    setInterval(function () {
        loadCases({ silent: true });
    }, 5000);
});