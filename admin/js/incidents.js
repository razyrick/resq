const API_BASE_URL = 'https://greenyellow-hawk-206191.hostingersite.com';
let currentPage = 1;
let currentLimit = 10;
let currentFilters = {
    status: '',
    severity: '',
    type: '',
    search: ''
};
let totalIncidents = 0;
let totalPages = 0;
let currentIncident = null;
let allIncidents = []; // Store all incidents for quick access

// Leaflet Map variables
let incidentMap = null;
let incidentMarker = null;

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

async function fetchIncidents(page = 1, limit = 10) {
    try {
        const params = new URLSearchParams({
            page: page,
            limit: limit
        });

        if (currentFilters.status) params.append('status', currentFilters.status);
        if (currentFilters.severity) params.append('severity', currentFilters.severity);
        if (currentFilters.type) params.append('type', currentFilters.type);
        if (currentFilters.search) params.append('search', currentFilters.search);

        const response = await fetch(`${API_BASE_URL}/admin/incidents?${params}`, {
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
    
    // Format: January 4, 2026 at 09:50 PM
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    };
    
    return date.toLocaleDateString('en-US', options);
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
        'ongoing': { 
            text: 'Ongoing', 
            bgColor: 'bg-blue-100',
            textColor: 'text-blue-800',
            borderColor: 'border-blue-200',
            icon: 'fa-play-circle'
        },
        'resolved': { 
            text: 'Resolved', 
            bgColor: 'bg-green-100',
            textColor: 'text-green-800',
            borderColor: 'border-green-200',
            icon: 'fa-check-circle'
        },
        'cancelled': { 
            text: 'Cancelled', 
            bgColor: 'bg-red-100',
            textColor: 'text-red-800',
            borderColor: 'border-red-200',
            icon: 'fa-times-circle'
        }
    };
    
    return statuses[status] || statuses['pending'];
}

function getSeverityInfo(severity) {
    const severities = {
        'low': { 
            text: 'Low', 
            bgColor: 'bg-green-100',
            textColor: 'text-green-800',
            borderColor: 'border-green-200',
            icon: 'fa-info-circle'
        },
        'medium': { 
            text: 'Medium', 
            bgColor: 'bg-yellow-100',
            textColor: 'text-yellow-800',
            borderColor: 'border-yellow-200',
            icon: 'fa-exclamation-triangle'
        },
        'high': { 
            text: 'High', 
            bgColor: 'bg-orange-100',
            textColor: 'text-orange-800',
            borderColor: 'border-orange-200',
            icon: 'fa-exclamation-circle'
        },
        'critical': { 
            text: 'Critical', 
            bgColor: 'bg-red-100',
            textColor: 'text-red-800',
            borderColor: 'border-red-200',
            icon: 'fa-skull-crossbones'
        }
    };
    
    return severities[severity] || severities['medium'];
}

function getTypeInfo(type) {
    const types = {
        'fire': { 
            text: 'Fire', 
            bgColor: 'bg-red-100',
            textColor: 'text-red-800',
            borderColor: 'border-red-200',
            icon: 'fa-fire'
        },
        'medical': { 
            text: 'Medical', 
            bgColor: 'bg-blue-100',
            textColor: 'text-blue-800',
            borderColor: 'border-blue-200',
            icon: 'fa-ambulance'
        },
        'police': { 
            text: 'Police', 
            bgColor: 'bg-indigo-100',
            textColor: 'text-indigo-800',
            borderColor: 'border-indigo-200',
            icon: 'fa-shield-alt'
        },
        'natural': { 
            text: 'Natural Disaster', 
            bgColor: 'bg-purple-100',
            textColor: 'text-purple-800',
            borderColor: 'border-purple-200',
            icon: 'fa-cloud-showers-heavy'
        },
        'accident': { 
            text: 'Accident', 
            bgColor: 'bg-orange-100',
            textColor: 'text-orange-800',
            borderColor: 'border-orange-200',
            icon: 'fa-car-crash'
        },
        'other': { 
            text: 'Other', 
            bgColor: 'bg-slate-100',
            textColor: 'text-slate-800',
            borderColor: 'border-slate-200',
            icon: 'fa-exclamation'
        }
    };
    
    return types[type] || types['other'];
}

function truncateText(text, maxLength = 100) {
    if (!text) return 'No description';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function getInitials(firstName, lastName) {
    const first = firstName ? firstName.charAt(0).toUpperCase() : 'U';
    const last = lastName ? lastName.charAt(0).toUpperCase() : 'S';
    return first + last;
}

function renderIncidents(incidents, pagination) {
    const container = document.getElementById('incidentsTableBody');
    if (!container) return;
    
    if (incidents.length === 0) {
        document.getElementById('emptyState').classList.remove('hidden');
        container.innerHTML = '';
        return;
    }

    document.getElementById('emptyState').classList.add('hidden');
    
    // Store incidents for quick access
    allIncidents = incidents;
    
    let html = '';
    
    incidents.forEach((incident, index) => {
        const statusInfo = getStatusInfo(incident.status);
        const severityInfo = getSeverityInfo(incident.severity_level);
        const typeInfo = getTypeInfo(incident.incident_type);
        const reporterInitials = getInitials(incident.first_name, incident.last_name);
        const reporterName = `${incident.first_name || ''} ${incident.last_name || ''}`.trim();
        
        html += `
          <tr class="hover:bg-slate-50 transition-colors">
              <td class="py-4 px-6">
                  <div class="space-y-1">
                      <div class="flex items-center gap-3">
                          <div class="type-icon ${typeInfo.bgColor} ${typeInfo.textColor}">
                              <i class="fas ${typeInfo.icon} text-xs"></i>
                          </div>
                          <div>
                              <p class="font-medium text-slate-900">${incident.incident_type || 'Unknown Type'}</p>
                              <p class="text-sm text-slate-500">${truncateText(incident.description, 80)}</p>
                          </div>
                      </div>
                      <div class="flex items-center gap-2 text-xs text-slate-500">
                          <i class="fas fa-user"></i>
                          <span>${reporterName || 'Anonymous'}</span>
                      </div>
                  </div>
              </td>
              <td class="py-4 px-6">
                  <div class="space-y-1">
                      <p class="text-sm text-slate-900">${incident.baranggay || 'Unknown Barangay'}</p>
                  </div>
              </td>
              <td class="py-4 px-6">
                  <span class="severity-badge ${severityInfo.bgColor} ${severityInfo.textColor} ${severityInfo.borderColor} border">
                      <i class="fas ${severityInfo.icon}"></i>
                      ${severityInfo.text}
                  </span>
              </td>
              <td class="py-4 px-6">
                  <span class="status-badge ${statusInfo.bgColor} ${statusInfo.textColor} ${statusInfo.borderColor} border">
                      <i class="fas ${statusInfo.icon}"></i>
                      ${statusInfo.text}
                  </span>
              </td>
              <td class="py-4 px-6">
                  <p class="text-sm text-slate-900">${formatDate(incident.created_at)}</p>
              </td>
              <td class="py-4 px-6">
                  <div class="flex gap-2">
                      <button onclick="viewIncidentDetails(${index})" class="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded hover:bg-blue-200 transition-colors">
                          <i class="fas fa-eye mr-1"></i> View
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
        
        paginationInfo.textContent = `Showing ${startItem}-${endItem} of ${pagination.total_items} incidents`;
        
        prevPageBtn.disabled = !pagination.has_prev;
        nextPageBtn.disabled = !pagination.has_next;
        
        prevPageBtn.classList.toggle('opacity-50', !pagination.has_prev);
        nextPageBtn.classList.toggle('opacity-50', !pagination.has_next);
        
        prevPageBtn.onclick = () => {
            if (pagination.has_prev) {
                currentPage = pagination.current_page - 1;
                loadIncidents();
            }
        };
        
        nextPageBtn.onclick = () => {
            if (pagination.has_next) {
                currentPage = pagination.current_page + 1;
                loadIncidents();
            }
        };
    } else {
        paginationContainer.classList.add('hidden');
    }
}

function hasValidIncidentCoordinates(incident) {
    const lat = parseFloat(incident.latitude);
    const lng = parseFloat(incident.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return false;
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function getIncidentPhotoUrl(incident) {
    const candidates = [
        incident.photo_url,
        incident.photo,
        incident.resolution_photo
    ];
    for (let i = 0; i < candidates.length; i++) {
        const raw = candidates[i];
        if (raw === null || raw === undefined) continue;
        const s = String(raw).trim();
        if (!s || s === 'null' || s === 'undefined') continue;
        return s;
    }
    return '';
}

function viewIncidentDetails(index) {
    if (allIncidents[index]) {
        showIncidentModal(allIncidents[index]);
    }
}

function showIncidentModal(incident) {
    currentIncident = incident;

    if (incidentMap) {
        incidentMap.remove();
        incidentMap = null;
        incidentMarker = null;
    }
    
    const statusInfo = getStatusInfo(incident.status);
    const severityInfo = getSeverityInfo(incident.severity_level);
    const reporterName = `${incident.first_name || ''} ${incident.last_name || ''}`.trim();
    
    // Helper function to safely set text content
    function setTextContent(id, text) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = text;
        }
    }
    
    // Helper function to safely set image source
    function setImageSource(id, src, alt = '') {
        const element = document.getElementById(id);
        if (element) {
            element.src = src;
            element.alt = alt;
        }
    }
    
    // Update modal title
    setTextContent('modalIncidentTitle', incident.incident_type || 'Incident Details');
    
    // Description Section
    setTextContent('modalIncidentDescription', incident.description || 'No description provided');
    
    // Location Information
    setTextContent('modalIncidentBarangay', incident.baranggay || 'N/A');
    
    // Coordinates text display (optional element in template)
    if (hasValidIncidentCoordinates(incident)) {
        setTextContent('modalIncidentCoordinatesText', `${incident.latitude}, ${incident.longitude}`);
    } else {
        setTextContent('modalIncidentCoordinatesText', 'Coordinates not available');
    }
    
    // Reporter Information
    setTextContent('modalReporterName', reporterName || 'Anonymous');
    setTextContent('modalReporterEmail', incident.email || 'N/A');
    setTextContent('modalReporterPhone', incident.phone || 'N/A');
    
    // Timeline
    setTextContent('modalIncidentReported', formatDate(incident.created_at));
    setTextContent('modalIncidentUpdated', formatDate(incident.updated_at) || 'N/A');
    
    // Status and Severity badges
    const severityBadge = document.getElementById('modalIncidentSeverity');
    const statusBadge = document.getElementById('modalIncidentStatus');
    
    if (severityBadge) {
        severityBadge.className = `severity-badge ${severityInfo.bgColor} ${severityInfo.textColor} ${severityInfo.borderColor} border`;
        severityBadge.innerHTML = `<i class="fas ${severityInfo.icon}"></i> ${severityInfo.text}`;
    }
    
    if (statusBadge) {
        statusBadge.className = `status-badge ${statusInfo.bgColor} ${statusInfo.textColor} ${statusInfo.borderColor} border`;
        statusBadge.innerHTML = `<i class="fas ${statusInfo.icon}"></i> ${statusInfo.text}`;
    }
    
    // Handle incident photo (reporter or resolution proof from API)
    const photoSection = document.getElementById('incidentPhotoSection');
    const incidentPhoto = document.getElementById('incidentPhoto');
    const incidentPhotoEmpty = document.getElementById('incidentPhotoEmpty');
    const photoUrl = getIncidentPhotoUrl(incident);
    if (photoSection && incidentPhoto && incidentPhotoEmpty) {
        if (photoUrl) {
            incidentPhoto.classList.remove('hidden');
            incidentPhotoEmpty.classList.add('hidden');
            setImageSource('incidentPhoto', photoUrl, `Incident photo for ${incident.incident_type || 'incident'}`);
        } else {
            incidentPhoto.classList.add('hidden');
            incidentPhoto.removeAttribute('src');
            incidentPhotoEmpty.classList.remove('hidden');
        }
    }

    // Show modal first so the map container has real dimensions for Leaflet
    const modal = document.getElementById('incidentModal');
    if (modal) {
        modal.classList.remove('hidden');
    }

    const mapContainerEl = document.getElementById('incidentMap');
    if (mapContainerEl) {
        mapContainerEl.innerHTML = '';
    }

    requestAnimationFrame(() => {
        setTimeout(() => {
            const mapEl = document.getElementById('incidentMap');
            if (!mapEl) return;
            if (hasValidIncidentCoordinates(incident)) {
                const lat = parseFloat(incident.latitude);
                const lng = parseFloat(incident.longitude);
                initializeMap(lat, lng, incident.incident_type);
                if (incidentMap) {
                    incidentMap.invalidateSize();
                    incidentMap.setView([lat, lng], 16);
                }
            } else {
                mapEl.innerHTML = `
                <div class="flex items-center justify-center h-full min-h-[280px] bg-slate-50 text-slate-500 rounded-lg">
                    <div class="text-center p-4">
                        <i class="fas fa-map-marker-alt text-2xl mb-2"></i>
                        <p>No coordinates available</p>
                    </div>
                </div>
            `;
            }
        }, 50);
    });
}

// Leaflet Map initialization function
function initializeMap(latitude, longitude, title = 'Incident Location') {
    // Clean up previous map if it exists
    if (incidentMap) {
        incidentMap.remove();
        incidentMap = null;
    }
    
    const mapContainer = document.getElementById('incidentMap');
    if (!mapContainer) return;
    
    // Clear any previous content
    mapContainer.innerHTML = '';
    
    try {
        // Parse coordinates to numbers
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        
        // Validate coordinates
        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            throw new Error('Invalid coordinates');
        }
        
        // Initialize map (single default zoom control; do not add a second control)
        incidentMap = L.map('incidentMap').setView([lat, lng], 16);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(incidentMap);
        
        // Add marker with custom red icon
        const redIcon = L.divIcon({
            html: `
                <div class="relative">
                    <div class="w-8 h-8 bg-red-500 rounded-full border-2 border-white shadow-lg"></div>
                    <div class="w-8 h-8 bg-red-500 rounded-full absolute top-0 left-0 opacity-30 animate-ping"></div>
                </div>
            `,
            className: 'custom-marker',
            iconSize: [32, 32],
            iconAnchor: [16, 32]
        });
        
        incidentMarker = L.marker([lat, lng], { icon: redIcon })
            .addTo(incidentMap)
            .bindPopup(`<b>${title || 'Incident Location'}</b><br>Latitude: ${lat.toFixed(6)}<br>Longitude: ${lng.toFixed(6)}`)
            .openPopup();
        
    } catch (error) {
        console.error('Map initialization error:', error);
        mapContainer.innerHTML = `
            <div class="flex items-center justify-center h-full bg-slate-50 text-slate-500 rounded-lg">
                <div class="text-center p-4">
                    <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                    <p>Failed to load map</p>
                    <p class="text-xs">${error.message}</p>
                </div>
            </div>
        `;
    }
}

// Clean up map when modal closes
function closeIncidentModal() {
    // Remove Leaflet map to prevent memory leaks
    if (incidentMap) {
        incidentMap.remove();
        incidentMap = null;
        incidentMarker = null;
    }
    
    const modal = document.getElementById('incidentModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    currentIncident = null;
}

async function loadIncidents() {
    try {
        showLoading();
        
        const data = await fetchIncidents(currentPage, currentLimit);
        
        if (data.success) {
            renderIncidents(data.data, data.pagination);
            showContent();
        } else {
            throw new Error(data.error || 'Failed to load incidents');
        }
    } catch (error) {
        showError(error.message);
    }
}

function showLoading() {
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const tableBody = document.getElementById('incidentsTableBody');
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

function filterIncidents() {
    currentPage = 1;
    currentFilters = {
        status: document.getElementById('statusFilter').value,
        severity: document.getElementById('severityFilter').value,
        type: document.getElementById('typeFilter').value,
        search: document.getElementById('searchInput').value
    };
    
    loadIncidents();
}

async function initializePage() {
    try {
        await loadIncidents();
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
    const closeModalBtn = document.getElementById('closeModalBtn');

    if (retryButton) {
        retryButton.addEventListener('click', initializePage);
    }

    if (closeModal) {
        closeModal.addEventListener('click', closeIncidentModal);
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeIncidentModal);
    }

    const incidentModal = document.getElementById('incidentModal');
    if (incidentModal) {
        incidentModal.addEventListener('click', function(event) {
            if (event.target === incidentModal) {
                closeIncidentModal();
            }
        });
    }

    // Add search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                filterIncidents();
            }
        });
    }
});

// Make functions globally available
window.viewIncidentDetails = viewIncidentDetails;
window.filterIncidents = filterIncidents;