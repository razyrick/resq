const API_BASE_URL = 'https://greenyellow-hawk-206191.hostingersite.com';
let incidentsDateScope = 'today';
let userData = null;
let currentPage = 1;
let currentLimit = 20;
let currentFilters = {
    status: '',
    severity: '',
    type: '',
    search: ''
};
let totalIncidents = 0;
let totalPages = 0;
let incidentMap = null;
let incidentMarker = null;
let currentIncident = null;
let createPatientIncidentId = null;
let dispatcherIncidentsListCache = [];

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

async function fetchIncidents(page = 1, limit = 20) {
    try {
        const params = new URLSearchParams({
            page: page,
            limit: limit
        });

        if (currentFilters.status) params.append('status', currentFilters.status);
        if (currentFilters.severity) params.append('severity', currentFilters.severity);
        if (currentFilters.type) params.append('type', currentFilters.type);
        if (currentFilters.search) params.append('search', currentFilters.search);
        params.append('date_scope', incidentsDateScope);

        const response = await fetch(`${API_BASE_URL}/dispatcher/incidents?${params}`, {
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
        console.error('Error fetching incidents:', error);
        throw error;
    }
}

function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getIncidentTypeInfo(type) {
    // If type is not provided or is empty, return default 'other' config
    if (!type || type.trim() === '') {
        return { 
            icon: 'fa-triangle-exclamation', 
            color: 'gray', 
            bgColor: 'bg-gray-100',
            textColor: 'text-gray-800',
            borderColor: 'border-gray-200',
            text: 'Other Emergency'
        };
    }
    
    const normalizedType = String(type).toLowerCase().trim();
    
    const types = {
        'flood': { 
            icon: 'fa-droplet', 
            color: 'blue', 
            bgColor: 'bg-blue-100',
            textColor: 'text-blue-800',
            borderColor: 'border-blue-200',
            text: 'Flood'
        },
        'fire': { 
            icon: 'fa-fire', 
            color: 'red', 
            bgColor: 'bg-red-100',
            textColor: 'text-red-800',
            borderColor: 'border-red-200',
            text: 'Fire'
        },
        'medical': { 
            icon: 'fa-heart-pulse', 
            color: 'green', 
            bgColor: 'bg-green-100',
            textColor: 'text-green-800',
            borderColor: 'border-green-200',
            text: 'Medical Emergency'
        },
        'accident': { 
            icon: 'fa-car-burst', 
            color: 'yellow', 
            bgColor: 'bg-yellow-100',
            textColor: 'text-yellow-800',
            borderColor: 'border-yellow-200',
            text: 'Accident'
        },
        'crime': { 
            icon: 'fa-shield-halved', 
            color: 'purple', 
            bgColor: 'bg-purple-100',
            textColor: 'text-purple-800',
            borderColor: 'border-purple-200',
            text: 'Crime'
        },
        'earthquake': { 
            icon: 'fa-hill-avalanche', 
            color: 'orange', 
            bgColor: 'bg-orange-100',
            textColor: 'text-orange-800',
            borderColor: 'border-orange-200',
            text: 'Earthquake'
        },
        'typhoon': { 
            icon: 'fa-wind', 
            color: 'indigo', 
            bgColor: 'bg-indigo-100',
            textColor: 'text-indigo-800',
            borderColor: 'border-indigo-200',
            text: 'Typhoon'
        },
        'landslide': { 
            icon: 'fa-mountain', 
            color: 'amber', 
            bgColor: 'bg-amber-100',
            textColor: 'text-amber-800',
            borderColor: 'border-amber-200',
            text: 'Landslide'
        },
        'tsunami': { 
            icon: 'fa-water', 
            color: 'cyan', 
            bgColor: 'bg-cyan-100',
            textColor: 'text-cyan-800',
            borderColor: 'border-cyan-200',
            text: 'Tsunami'
        },
        'volcanic': { 
            icon: 'fa-volcano', 
            color: 'rose', 
            bgColor: 'bg-rose-100',
            textColor: 'text-rose-800',
            borderColor: 'border-rose-200',
            text: 'Volcanic Eruption'
        },
        'rescue': { 
            icon: 'fa-person-falling', 
            color: 'emerald', 
            bgColor: 'bg-emerald-100',
            textColor: 'text-emerald-800',
            borderColor: 'border-emerald-200',
            text: 'Rescue Operation'
        },
        'hazard': { 
            icon: 'fa-biohazard', 
            color: 'lime', 
            bgColor: 'bg-lime-100',
            textColor: 'text-lime-800',
            borderColor: 'border-lime-200',
            text: 'Chemical Hazard'
        },
        'power': { 
            icon: 'fa-bolt', 
            color: 'yellow', 
            bgColor: 'bg-yellow-100',
            textColor: 'text-yellow-800',
            borderColor: 'border-yellow-200',
            text: 'Power Outage'
        },
        'water': { 
            icon: 'fa-faucet', 
            color: 'sky', 
            bgColor: 'bg-sky-100',
            textColor: 'text-sky-800',
            borderColor: 'border-sky-200',
            text: 'Water Emergency'
        },
        'gas': { 
            icon: 'fa-gas-pump', 
            color: 'stone', 
            bgColor: 'bg-stone-100',
            textColor: 'text-stone-800',
            borderColor: 'border-stone-200',
            text: 'Gas Leak'
        },
        'structural': { 
            icon: 'fa-building', 
            color: 'neutral', 
            bgColor: 'bg-neutral-100',
            textColor: 'text-neutral-800',
            borderColor: 'border-neutral-200',
            text: 'Structural Damage'
        },
        'animal': { 
            icon: 'fa-paw', 
            color: 'fuchsia', 
            bgColor: 'bg-fuchsia-100',
            textColor: 'text-fuchsia-800',
            borderColor: 'border-fuchsia-200',
            text: 'Animal Rescue'
        },
        'missing': { 
            icon: 'fa-person-walking', 
            color: 'pink', 
            bgColor: 'bg-pink-100',
            textColor: 'text-pink-800',
            borderColor: 'border-pink-200',
            text: 'Missing Person'
        },
        'traffic': { 
            icon: 'fa-traffic-light', 
            color: 'teal', 
            bgColor: 'bg-teal-100',
            textColor: 'text-teal-800',
            borderColor: 'border-teal-200',
            text: 'Traffic Incident'
        },
        'marine': { 
            icon: 'fa-ship', 
            color: 'blue', 
            bgColor: 'bg-blue-100',
            textColor: 'text-blue-800',
            borderColor: 'border-blue-200',
            text: 'Marine Emergency'
        },
        'aviation': { 
            icon: 'fa-plane', 
            color: 'violet', 
            bgColor: 'bg-violet-100',
            textColor: 'text-violet-800',
            borderColor: 'border-violet-200',
            text: 'Aviation Emergency'
        },
        'terrorism': { 
            icon: 'fa-bomb', 
            color: 'red', 
            bgColor: 'bg-red-100',
            textColor: 'text-red-800',
            borderColor: 'border-red-200',
            text: 'Terrorism'
        },
        'civil': { 
            icon: 'fa-people-group', 
            color: 'slate', 
            bgColor: 'bg-slate-100',
            textColor: 'text-slate-800',
            borderColor: 'border-slate-200',
            text: 'Civil Disturbance'
        },
        'evacuation': { 
            icon: 'fa-people-carry-box', 
            color: 'orange', 
            bgColor: 'bg-orange-100',
            textColor: 'text-orange-800',
            borderColor: 'border-orange-200',
            text: 'Evacuation'
        }
    };
    
    // Check if it's in our predefined types
    if (types[normalizedType]) {
        return types[normalizedType];
    }
    
    // If not found, create a dynamic configuration with the actual type value
    return {
        icon: 'fa-triangle-exclamation', 
        color: 'gray',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
        borderColor: 'border-gray-200',
        text: formatIncidentTypeName(type)
    };
}

// Helper function to format incident type name from snake_case to readable text
function formatIncidentTypeName(type) {
    if (!type) return 'Other Emergency';
    
    // Convert snake_case to readable text
    return type
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function normalizeIncidentStatusKey(status) {
    const s = String(status ?? '').trim().toLowerCase();
    if (s === 'complete' || s === 'closed') return 'resolved';
    return s;
}

function getStatusInfo(status) {
    const key = normalizeIncidentStatusKey(status);
    const statuses = {
        'pending': { 
            text: 'Pending Dispatch', 
            color: 'blue', 
            bgColor: 'bg-blue-100',
            textColor: 'text-blue-800',
            borderColor: 'border-blue-200',
            icon: 'fa-clock'
        },
        'ongoing': { 
            text: 'Ongoing', 
            color: 'yellow', 
            bgColor: 'bg-yellow-100',
            textColor: 'text-yellow-800',
            borderColor: 'border-yellow-200',
            icon: 'fa-spinner'
        },
        'resolved': { 
            text: 'Resolved', 
            color: '#16a34a', 
            bgColor: 'bg-green-100',
            textColor: 'text-green-800',
            borderColor: 'border-green-200',
            icon: 'fa-check-circle'
        },
        'dispatched': {
            text: 'Dispatched',
            color: 'orange',
            bgColor: 'bg-orange-100',
            textColor: 'text-orange-800',
            borderColor: 'border-orange-200',
            icon: 'fa-paper-plane'
        }
    };
    
    return statuses[key] || statuses['pending'];
}

function getSeverityInfo(severity) {
    const severities = {
        'low': { 
            text: 'Low', 
            bgColor: 'bg-green-100',
            textColor: 'text-green-800',
            borderColor: 'border-green-200',
            icon: 'fa-arrow-down'
        },
        'medium': { 
            text: 'Medium', 
            bgColor: 'bg-yellow-100',
            textColor: 'text-yellow-800',
            borderColor: 'border-yellow-200',
            icon: 'fa-minus'
        },
        'high': { 
            text: 'High', 
            bgColor: 'bg-red-100',
            textColor: 'text-red-800',
            borderColor: 'border-red-200',
            icon: 'fa-exclamation-triangle'
        }
    };
    
    return severities[severity] || severities['medium'];
}

function updateStatistics(incidents) {
    const statsContainer = document.getElementById('statsContainer');
    if (!statsContainer) return;

    const highCount = incidents.filter(inc => inc.severity_level === 'high').length;
    const mediumCount = incidents.filter(inc => inc.severity_level === 'medium').length;
    const lowCount = incidents.filter(inc => inc.severity_level === 'low').length;
    const totalCount = incidents.length;

    statsContainer.innerHTML = `
        <div class="bg-white rounded-xl border border-slate-200 p-6">
            <div class="flex items-center justify-between mb-4">
                <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <span class="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">High</span>
            </div>
            <h3 class="text-3xl font-bold text-slate-900 mb-1">${highCount}</h3>
            <p class="text-sm text-slate-500">High Priority</p>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 p-6">
            <div class="flex items-center justify-between mb-4">
                <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <span class="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded">Medium</span>
            </div>
            <h3 class="text-3xl font-bold text-slate-900 mb-1">${mediumCount}</h3>
            <p class="text-sm text-slate-500">Medium Priority</p>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 p-6">
            <div class="flex items-center justify-between mb-4">
                <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <span class="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">Low</span>
            </div>
            <h3 class="text-3xl font-bold text-slate-900 mb-1">${lowCount}</h3>
            <p class="text-sm text-slate-500">Low Priority</p>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 p-6">
            <div class="flex items-center justify-between mb-4">
                <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <span class="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">Total</span>
            </div>
            <h3 class="text-3xl font-bold text-slate-900 mb-1">${totalCount}</h3>
            <p class="text-sm text-slate-500">${incidentsDateScope === 'today' ? 'Active Incidents Today (this page)' : 'Incidents shown (this page)'}</p>
        </div>
    `;
}

function renderIncidents(incidents, pagination) {
    const container = document.getElementById('incidentsList');
    if (!container) return;
    
    if (incidents.length === 0) {
        dispatcherIncidentsListCache = [];
        document.getElementById('emptyState').classList.remove('hidden');
        container.innerHTML = '';
        return;
    }

    document.getElementById('emptyState').classList.add('hidden');

    dispatcherIncidentsListCache = incidents;
    
    let html = '';
    
    incidents.forEach(incident => {
        const typeInfo = getIncidentTypeInfo(incident.incident_type);
        const statusInfo = getStatusInfo(incident.status);
        const severityInfo = getSeverityInfo(incident.severity_level);
        
        const userName = incident.first_name || incident.last_name 
            ? `${incident.first_name || ''} ${incident.last_name || ''}`.trim()
            : 'Anonymous';
        
        html += `
            <div class="incident-card bg-white rounded-xl border border-slate-200">
                <div class="p-6">
                    <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                        <div class="flex items-start gap-4 flex-1">
                            <div class="w-12 h-12 ${typeInfo.bgColor} rounded-lg flex items-center justify-center flex-shrink-0">
                                <i class="fas ${typeInfo.icon} ${typeInfo.textColor} text-lg"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="flex flex-wrap items-center gap-2 mb-2">
                                    <h3 class="text-lg font-semibold text-slate-900 truncate">${typeInfo.text}</h3>
                                    <span class="severity-badge ${severityInfo.bgColor} ${severityInfo.textColor} ${severityInfo.borderColor} border">
                                        <i class="fas ${severityInfo.icon}"></i>
                                        ${severityInfo.text}
                                    </span>
                                    <span class="status-badge ${statusInfo.bgColor} ${statusInfo.textColor} ${statusInfo.borderColor} border">
                                        <i class="fas ${statusInfo.icon}"></i>
                                        ${statusInfo.text}
                                    </span>
                                </div>
                                <p class="text-slate-600 mb-2">${incident.description}</p>
                                <div class="flex flex-col sm:flex-row sm:flex-wrap gap-2 text-sm text-slate-600">
                                    <span class="flex items-center gap-1">
                                        <i class="fas fa-location-dot text-slate-400"></i>
                                        ${incident.baranggay ? `Barangay ${incident.baranggay}` : 'Unknown location'}
                                    </span>
                                    <span class="flex items-center gap-1">
                                        <i class="fas fa-clock text-slate-400"></i>
                                        ${formatDate(incident.created_at)}
                                    </span>
                                    <span class="flex items-center gap-1">
                                        <i class="fas fa-user text-slate-400"></i>
                                        ${userName}
                                    </span>
                                    <span class="flex items-center gap-1">
                                        <i class="fas fa-hashtag text-slate-400"></i>
                                        ${incident.incident_id}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="flex flex-col gap-2 lg:flex-shrink-0">
                            ${incident.status === 'pending' || incident.status === 'ongoing' ? `
                                <button onclick="deployToIncident('${incident.id}', '${incident.incident_id}')" class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap flex items-center justify-center gap-2">
                                    <i class="fas fa-paper-plane"></i>
                                    ${incident.status === 'ongoing' ? 'Deploy More' : 'Deploy Now'}
                                </button>
                            ` : `
                                <button class="px-4 py-2 bg-slate-200 text-slate-500 text-sm font-medium rounded-lg cursor-not-allowed whitespace-nowrap flex items-center justify-center gap-2" disabled>
                                    <i class="fas fa-check"></i>
                                    Resolved
                                </button>
                            `}
                            <button onclick="viewDetails('${incident.id}')" class="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap flex items-center justify-center gap-2">
                                <i class="fas fa-eye"></i>
                                View Details
                            </button>
                        </div>
                    </div>
                </div>
            </div>
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

function initIncidentMap(lat, lng) {
    const mapContainer = document.getElementById('incidentMap');
    if (!mapContainer) return;
    
    if (incidentMap) {
        incidentMap.remove();
    }
    
    try {
        incidentMap = L.map('incidentMap').setView([lat, lng], 15);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(incidentMap);
        
        if (incidentMarker) {
            incidentMap.removeLayer(incidentMarker);
        }
        
        incidentMarker = L.marker([lat, lng])
            .addTo(incidentMap)
            .bindPopup('Incident Location')
            .openPopup();

        setTimeout(() => {
            if (incidentMap) {
                incidentMap.invalidateSize();
            }
        }, 250);
    } catch (error) {
        console.error('Error initializing map:', error);
    }
}

function showIncidentModal(incidentId) {
    fetchIncidents().then(data => {
        if (data.success) {
            const incident = data.data.find(inc => inc.id == incidentId);
            if (!incident) {
                console.error('Incident not found:', incidentId);
                return;
            }

            currentIncident = incident;
            
            const typeInfo = getIncidentTypeInfo(incident.incident_type);
            const statusInfo = getStatusInfo(incident.status);
            const severityInfo = getSeverityInfo(incident.severity_level);
            
            const userName = incident.first_name || incident.last_name 
                ? `${incident.first_name || ''} ${incident.middle_name || ''} ${incident.last_name || ''}`.trim()
                : 'Anonymous';

            const typeIcon = document.getElementById('modalTypeIcon');
            if (typeIcon) {
                typeIcon.className = `w-12 h-12 ${typeInfo.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`;
                typeIcon.innerHTML = `<i class="fas ${typeInfo.icon} ${typeInfo.textColor} text-xl"></i>`;
            }

            const updateElement = (id, content) => {
                const element = document.getElementById(id);
                if (element) element.textContent = content;
            };

            updateElement('modalIncidentId', `Incident #${incident.incident_id}`);
            updateElement('modalType', typeInfo.text);
            updateElement('modalDescription', incident.description);
            updateElement('modalLocation', incident.baranggay ? `Barangay ${incident.baranggay}` : 'Unknown Location');
            updateElement('modalCoordinates', `${incident.latitude}, ${incident.longitude}`);
            updateElement('modalReporterName', userName);
            updateElement('modalReporterEmail', incident.email || 'N/A');
            updateElement('modalReporterPhone', incident.phone || 'N/A');
            updateElement('modalReported', formatDate(incident.created_at));
            updateElement('modalUpdated', formatDate(incident.updated_at));

            const severityBadge = document.getElementById('modalSeverity');
            const statusBadge = document.getElementById('modalStatus');
            
            if (severityBadge) {
                severityBadge.className = `severity-badge ${severityInfo.bgColor} ${severityInfo.textColor} ${severityInfo.borderColor} border`;
                severityBadge.innerHTML = `<i class="fas ${severityInfo.icon}"></i> ${severityInfo.text}`;
            }
            
            if (statusBadge) {
                statusBadge.className = `status-badge ${statusInfo.bgColor} ${statusInfo.textColor} ${statusInfo.borderColor} border`;
                statusBadge.innerHTML = `<i class="fas ${statusInfo.icon}"></i> ${statusInfo.text}`;
            }
            updateIncidentModalFooter(incident);

            const photoSection = document.getElementById('modalPhotoSection');
            const photoElement = document.getElementById('modalPhoto');
            
            if (incident.photo && incident.photo !== 'null' && incident.photo !== 'undefined' && incident.photo.trim() !== '') {
                photoSection.classList.remove('hidden');
                photoElement.src = incident.photo;
            } else {
                photoSection.classList.add('hidden');
            }

            if (typeof applyResolutionDetailPanel === 'function') {
                applyResolutionDetailPanel(incident, {
                    section: document.getElementById('dispatcherIncidentResolutionWrap'),
                    meta: document.getElementById('dispatcherIncidentResolutionMeta'),
                    notes: document.getElementById('dispatcherIncidentResolutionNotes'),
                    emptyHint: document.getElementById('dispatcherIncidentResolutionEmptyHint'),
                    photoWrap: document.getElementById('dispatcherIncidentResolutionPhotoWrap'),
                    proofImg: document.getElementById('dispatcherIncidentResolutionProofPhoto')
                }, { formatResolvedAt: formatDate });
            }

            const lat = parseFloat(incident.latitude);
            const lng = parseFloat(incident.longitude);
            
            if (!isNaN(lat) && !isNaN(lng)) {
                setTimeout(() => {
                    initIncidentMap(lat, lng);
                }, 100);
            }

            const modal = document.getElementById('incidentModal');
            if (modal) {
                modal.classList.remove('hidden');
            }
        }
    }).catch(error => {
        console.error('Error loading incident details:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load incident details',
            confirmButtonColor: '#ef4444'
        });
    });
}

// Add this function to fetch agencies
async function fetchAgencies() {
    try {
        const response = await fetch(`${API_BASE_URL}/dispatcher/agency?status=active&limit=100&page=1`, {
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

/**
 * Fills a select element with active agencies from GET /dispatcher/agency (routing is app-level; patients.agency_id has no DB FK).
 * @param {HTMLSelectElement|null} selectEl
 * @param {{ showUnits?: boolean }} opts
 */
async function loadDispatcherAgenciesForSelect(selectEl, opts = {}) {
    const showUnits = Boolean(opts.showUnits);
    if (!selectEl) return;

    selectEl.disabled = true;
    selectEl.innerHTML = '';
    const loadingOpt = document.createElement('option');
    loadingOpt.value = '';
    loadingOpt.disabled = true;
    loadingOpt.textContent = 'Loading agencies...';
    selectEl.appendChild(loadingOpt);

    const agenciesData = await fetchAgencies();

    selectEl.innerHTML = '<option value="">Select an agency...</option>';
    selectEl.disabled = false;

    if (agenciesData.success && Array.isArray(agenciesData.data) && agenciesData.data.length > 0) {
        agenciesData.data.forEach((agency) => {
            const option = document.createElement('option');
            option.value = agency.agency_id;
            option.textContent = showUnits
                ? `${agency.agency} (${agency.agency_type}) - ${agency.number_of_units} units available`
                : `${agency.agency} (${agency.agency_type})`;
            selectEl.appendChild(option);
        });
    } else {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No active agencies available';
        option.disabled = true;
        selectEl.appendChild(option);
    }
}

function closeCreatePatientModal() {
    const modal = document.getElementById('createPatientModal');
    if (modal) modal.classList.add('hidden');
    createPatientIncidentId = null;
}

async function openCreatePatientModal(options = {}) {
    const modal = document.getElementById('createPatientModal');
    const agencySelect = document.getElementById('createPatientAgencySelect');
    if (!modal || !agencySelect) return;

    const preselectedAgencyId =
        options && typeof options === 'object' && 'preselectedAgencyId' in options
            ? String(options.preselectedAgencyId || '')
            : '';
    createPatientIncidentId =
        options && typeof options === 'object' && 'incidentId' in options
            ? String(options.incidentId || '')
            : '';
    const fullNameInput = document.getElementById('createPatientFullName');
    const reasonInput = document.getElementById('createPatientReason');
    if (fullNameInput) fullNameInput.value = '';
    if (reasonInput) reasonInput.value = '';

    modal.classList.remove('hidden');

    try {
        await loadDispatcherAgenciesForSelect(agencySelect, { showUnits: false });
        if (preselectedAgencyId) {
            agencySelect.value = preselectedAgencyId;
        }
    } catch (error) {
        console.error('Error loading agencies for patient modal:', error);
        agencySelect.innerHTML = '';
        const errOpt = document.createElement('option');
        errOpt.value = '';
        errOpt.textContent = 'Could not load agencies';
        errOpt.disabled = true;
        agencySelect.appendChild(errOpt);
        agencySelect.disabled = true;
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Could not load agencies. Close and try again.',
            confirmButtonColor: '#ef4444'
        });
    }
}

function updateIncidentModalFooter(incident) {
    const deployBtn = document.getElementById('modalDeployMoreBtn');
    const addPatientBtn = document.getElementById('modalAddPatientBtn');
    const canDeploy = incident.status === 'pending' || incident.status === 'ongoing';

    if (deployBtn) {
        deployBtn.disabled = !canDeploy;
        deployBtn.className = canDeploy
            ? 'px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2'
            : 'px-4 py-3 bg-slate-200 text-slate-500 text-sm font-medium rounded-lg cursor-not-allowed flex items-center justify-center gap-2';
        deployBtn.innerHTML = `<i class="fas ${canDeploy ? 'fa-paper-plane' : 'fa-check'}"></i> ${
            canDeploy && incident.status === 'ongoing' ? 'Deploy More' : canDeploy ? 'Deploy Now' : 'Resolved'
        }`;
    }

    if (addPatientBtn) {
        addPatientBtn.disabled = false;
    }
}

function openCreatePatientFromIncident() {
    openCreatePatientModal({
        preselectedAgencyId: currentIncident ? currentIncident.agency_id : '',
        incidentId: currentIncident ? currentIncident.incident_id : ''
    });
}

function deployCurrentIncidentFromModal() {
    if (!currentIncident || !currentIncident.id || !currentIncident.incident_id) {
        Swal.fire({
            icon: 'error',
            title: 'No incident selected',
            text: 'Please reopen the incident details and try again.',
            confirmButtonColor: '#ef4444'
        });
        return;
    }

    if (!(currentIncident.status === 'pending' || currentIncident.status === 'ongoing')) {
        return;
    }

    deployToIncident(currentIncident.id, currentIncident.incident_id);
}

async function submitCreatePatient() {
    const fullName = (document.getElementById('createPatientFullName')?.value || '').trim();
    const reason = (document.getElementById('createPatientReason')?.value || '').trim();
    const agencySelect = document.getElementById('createPatientAgencySelect');
    const agencyId = agencySelect ? agencySelect.value : '';

    if (!fullName || !reason || !agencyId) {
        Swal.fire({
            icon: 'warning',
            title: 'Missing fields',
            text: 'Please enter name, reason, and select an agency.',
            confirmButtonColor: '#ca8a04'
        });
        return;
    }

    try {
        const payload = {
            full_name: fullName,
            reason: reason,
            agency_id: agencyId
        };

        if (createPatientIncidentId) {
            payload.incident_id = createPatientIncidentId;
        }

        const response = await fetch(`${API_BASE_URL}/dispatcher/patients`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.error || `HTTP ${response.status}`);
        }

        if (data.success) {
            Swal.fire({
                icon: 'success',
                title: 'Patient created',
                text: data.message || 'Saved to database.',
                confirmButtonColor: '#059669'
            });
            closeCreatePatientModal();
            createPatientIncidentId = null;
        } else {
            throw new Error(data.error || 'Failed to create patient');
        }
    } catch (error) {
        console.error('createPatient:', error);
        Swal.fire({
            icon: 'error',
            title: 'Could not save',
            text: error.message || 'Please try again.',
            confirmButtonColor: '#ef4444'
        });
    }
}

async function deployToIncident(incidentId, incidentCode) {
    const fromList = dispatcherIncidentsListCache.find((i) => String(i.id) === String(incidentId));
    currentIncident = fromList
        ? { ...fromList, id: incidentId, incident_id: incidentCode }
        : { id: incidentId, incident_id: incidentCode };
    
    const deployModal = document.getElementById('deployModal');
    const deployIncidentId = document.getElementById('deployIncidentId');
    
    if (deployIncidentId) {
        deployIncidentId.textContent = `Incident #${incidentCode}`;
    }
    
    const agencySelect = document.getElementById('deployAgencySelect');
    if (agencySelect) {
        try {
            await loadDispatcherAgenciesForSelect(agencySelect, { showUnits: true });
        } catch (error) {
            console.error('Error loading agencies:', error);
            agencySelect.innerHTML = '';
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Error loading agencies';
            option.disabled = true;
            agencySelect.appendChild(option);
            agencySelect.disabled = true;
        }
    }

    if (typeof applyResolutionDetailPanel === 'function') {
        applyResolutionDetailPanel(currentIncident, {
            section: document.getElementById('deployModalResolutionWrap'),
            meta: document.getElementById('deployModalResolutionMeta'),
            notes: document.getElementById('deployModalResolutionNotes'),
            emptyHint: document.getElementById('deployModalResolutionEmptyHint'),
            photoWrap: document.getElementById('deployModalResolutionPhotoWrap'),
            proofImg: document.getElementById('deployModalResolutionProofPhoto')
        }, { formatResolvedAt: formatDate });
    }
    
    if (deployModal) {
        deployModal.classList.remove('hidden');
    }
}

async function submitDeployment() {
    const agencySelect = document.getElementById('deployAgencySelect');
    const selectedAgencyId = agencySelect.value;
    const selectedAgencyText = agencySelect.options[agencySelect.selectedIndex].text;
    
    if (!selectedAgencyId) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Please select an agency to deploy',
            confirmButtonColor: '#ef4444'
        });
        return;
    }
    
    if (!currentIncident) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No incident selected',
            confirmButtonColor: '#ef4444'
        });
        return;
    }

    Swal.fire({
        title: 'Deploy Resources?',
        html: `Are you sure you want to deploy <strong>${selectedAgencyText}</strong> to <strong>Incident #${currentIncident.incident_id}</strong>?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, deploy now',
        cancelButtonText: 'Cancel'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch(`${API_BASE_URL}/dispatcher/incidents`, {
                    method: 'PUT',
                    headers: getHeaders(),
                    body: JSON.stringify({
                        incident_id: currentIncident.incident_id,
                        status: 'dispatched',
                        agency_id: selectedAgencyId
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                
                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Deployment Successful',
                        text: data.message || `${selectedAgencyText} has been deployed to the incident`,
                        confirmButtonColor: '#10b981'
                    });
                    
                    closeDeployModal();
                    closeIncidentModal();
                    loadIncidents();
                } else {
                    throw new Error(data.error || 'Failed to deploy');
                }
            } catch (error) {
                console.error('Error deploying resources:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Deployment Failed',
                    text: error.message,
                    confirmButtonColor: '#ef4444'
                });
            }
        }
    });
}

function closeIncidentModal() {
    const modal = document.getElementById('incidentModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    if (incidentMap) {
        incidentMap.remove();
        incidentMap = null;
        incidentMarker = null;
    }
}

function closeDeployModal() {
    const modal = document.getElementById('deployModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

async function loadIncidents() {
    try {
        showLoading();
        
        const data = await fetchIncidents(currentPage, currentLimit);
        
        if (data.success) {
            updateStatistics(data.data);
            renderIncidents(data.data, data.pagination);
            showContent();
        } else {
            throw new Error(data.error || 'Failed to load incidents');
        }
    } catch (error) {
        console.error('Error loading incidents:', error);
        showError(error.message);
    }
}

function showLoading() {
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const contentState = document.getElementById('incidentsList');
    const paginationContainer = document.getElementById('paginationContainer');
    
    if (loadingState) loadingState.classList.remove('hidden');
    if (errorState) errorState.classList.add('hidden');
    if (contentState) contentState.innerHTML = '';
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
        loadUserData();
        await loadIncidents();
    } catch (error) {
        console.error('Error initializing page:', error);
        showError(error.message);
    }
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

function viewDetails(incidentId) {
    showIncidentModal(incidentId);
}

document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    
    const searchInput = document.getElementById('searchInput');
    const severityFilter = document.getElementById('severityFilter');
    const typeFilter = document.getElementById('typeFilter');
    const statusFilter = document.getElementById('statusFilter');
    const retryButton = document.getElementById('retryButton');
    const closeModal = document.getElementById('closeModal');
    const closeDeployModalBtn = document.getElementById('closeDeployModal');
    const openInMaps = document.getElementById('openInMaps');
    const submitDeploymentBtn = document.getElementById('submitDeployment');
    const modalAddPatientBtn = document.getElementById('modalAddPatientBtn');
    const modalDeployMoreBtn = document.getElementById('modalDeployMoreBtn');

    [searchInput, severityFilter, typeFilter, statusFilter].forEach(element => {
        element.addEventListener('change', filterIncidents);
    });

    searchInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            filterIncidents();
        }
    });

    if (retryButton) {
        retryButton.addEventListener('click', initializePage);
    }

    if (closeModal) {
        closeModal.addEventListener('click', closeIncidentModal);
    }

    if (closeDeployModalBtn) {
        closeDeployModalBtn.addEventListener('click', closeDeployModal);
    }

    if (openInMaps) {
        openInMaps.addEventListener('click', function() {
            if (currentIncident && currentIncident.latitude && currentIncident.longitude) {
                const lat = parseFloat(currentIncident.latitude);
                const lng = parseFloat(currentIncident.longitude);
                if (!isNaN(lat) && !isNaN(lng)) {
                    window.open(`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`, '_blank');
                }
            }
        });
    }

    if (submitDeploymentBtn) {
        submitDeploymentBtn.addEventListener('click', submitDeployment);
    }

    if (modalAddPatientBtn) {
        modalAddPatientBtn.addEventListener('click', openCreatePatientFromIncident);
    }

    if (modalDeployMoreBtn) {
        modalDeployMoreBtn.addEventListener('click', deployCurrentIncidentFromModal);
    }

    const openCreatePatientBtn = document.getElementById('openCreatePatientBtn');
    const closeCreatePatientModalBtn = document.getElementById('closeCreatePatientModal');
    const submitCreatePatientBtn = document.getElementById('submitCreatePatient');
    const createPatientModal = document.getElementById('createPatientModal');
    const createPatientModalOverlay = document.getElementById('createPatientModalOverlay');

    if (openCreatePatientBtn) {
        openCreatePatientBtn.addEventListener('click', openCreatePatientModal);
    }
    if (closeCreatePatientModalBtn) {
        closeCreatePatientModalBtn.addEventListener('click', closeCreatePatientModal);
    }
    if (submitCreatePatientBtn) {
        submitCreatePatientBtn.addEventListener('click', submitCreatePatient);
    }
    if (createPatientModal) {
        createPatientModal.addEventListener('click', (event) => {
            if (event.target === createPatientModal || event.target === createPatientModalOverlay) {
                closeCreatePatientModal();
            }
        });
    }

    const incidentModal = document.getElementById('incidentModal');
    const deployModal = document.getElementById('deployModal');
    
    if (incidentModal) {
        incidentModal.addEventListener('click', function(event) {
            if (event.target === incidentModal) {
                closeIncidentModal();
            }
        });
    }
    
    if (deployModal) {
        deployModal.addEventListener('click', function(event) {
            if (event.target === deployModal) {
                closeDeployModal();
            }
        });
    }

    const scopeTodayBtn = document.getElementById('scopeTodayBtn');
    const scopeAllBtn = document.getElementById('scopeAllBtn');
    function refreshScopeButtons() {
        if (!scopeTodayBtn || !scopeAllBtn) return;
        if (incidentsDateScope === 'today') {
            scopeTodayBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white shadow-sm';
            scopeAllBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200';
        } else {
            scopeTodayBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200';
            scopeAllBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white shadow-sm';
        }
    }
    if (scopeTodayBtn) {
        scopeTodayBtn.addEventListener('click', () => {
            incidentsDateScope = 'today';
            currentPage = 1;
            refreshScopeButtons();
            loadIncidents();
        });
    }
    if (scopeAllBtn) {
        scopeAllBtn.addEventListener('click', () => {
            incidentsDateScope = 'all';
            currentPage = 1;
            refreshScopeButtons();
            loadIncidents();
        });
    }
    refreshScopeButtons();
});

document.addEventListener('click', function(e) {
    const panel = document.getElementById('notificationsPanel');
    const button = e.target.closest('button[onclick="toggleNotifications()"]');
    if (panel && !panel.contains(e.target) && !button) {
        panel.classList.add('hidden');
    }
});

window.deployToIncident = deployToIncident;
window.viewDetails = viewDetails;