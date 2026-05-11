// API Configuration
const API_BASE_URL = 'https://greenyellow-hawk-206191.hostingersite.com';
let userData = null;
let dashboardMap = null;
let fullscreenMapInstance = null;
let monthlyChart = null;
/** @type {L.Map[]} */
let dashboardMiniMaps = [];
let dispatcherDashboardPollSignature = '';

function fingerprintDispatcherDashboardBundle(statsPayload, sidebarRows) {
    const st = statsPayload && statsPayload.stats ? statsPayload.stats : {};
    const statPart = ['total_incidents', 'active_incidents', 'total_agencies', 'resolved_cases']
        .map((k) => `${k}:${st[k] ?? ''}`)
        .join('|');
    const monthPart = JSON.stringify(statsPayload && statsPayload.monthly_incidents ? statsPayload.monthly_incidents : []);
    const coordPart = (statsPayload && statsPayload.incident_coordinates ? statsPayload.incident_coordinates : [])
        .map((c) => [c.incident_id, c.latitude, c.longitude, c.status, c.severity_level].join('\u001f'))
        .sort()
        .join('\u0000');
    const side = (Array.isArray(sidebarRows) ? sidebarRows : []).map((inc) => {
        const id = inc.incident_id ?? inc.id ?? '';
        return [id, inc.status ?? '', inc.updated_at ?? inc.created_at ?? '', inc.severity_level ?? ''].join('\u001f');
    });
    side.sort();
    return statPart + '\u0000' + monthPart + '\u0000' + coordPart + '\u0000' + side.join('\u0000');
}

// Get stored user data
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

// Get headers for API requests
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

// Load user data
function loadUserData() {
    const storedData = getStoredUserData();
    if (storedData && storedData.user) {
        userData = storedData.user;
        document.getElementById('userName').textContent = `${userData.first_name || ''} ${userData.last_name || ''}`;
    }
}

/** Parse body once; avoids "Unexpected end of JSON input" on empty/HTML responses. */
async function parseResponseJson(response) {
    const text = await response.text();
    if (text == null || String(text).trim() === '') {
        throw new Error(`Empty response from server (HTTP ${response.status}). Check API / PHP errors.`);
    }
    try {
        return JSON.parse(text);
    } catch {
        throw new Error(
            `Non-JSON response (HTTP ${response.status}). First bytes: ${String(text).slice(0, 200)}`
        );
    }
}

// Fetch dashboard stats
async function fetchDashboardStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/dispatcher/dashboard?stats_scope=today`, {
            method: 'GET',
            headers: getHeaders()
        });

        const data = await parseResponseJson(response);

        if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        throw error;
    }
}

/** Same endpoint & query defaults as `dispatcher/js/incidents.js` (today, no extra filters). */
async function fetchSidebarIncidentsSameAsActiveIncidentsPage() {
    const params = new URLSearchParams({
        page: '1',
        limit: '12',
        date_scope: 'today'
    });
    const response = await fetch(`${API_BASE_URL}/dispatcher/incidents?${params}`, {
        method: 'GET',
        headers: getHeaders()
    });

    const data = await parseResponseJson(response);
    if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    return data;
}

// Update statistics
function updateStatistics(stats) {
    const statsContainer = document.getElementById('statsContainer');
    if (!statsContainer) return;

    statsContainer.innerHTML = `
        <!-- Total Incidents -->
        <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div class="flex items-center justify-between mb-4">
                <div class="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <i class="fas fa-list-check text-white text-xl"></i>
                </div>
            </div>
            <h3 class="text-3xl font-bold mb-1">${stats.total_incidents}</h3>
            <p class="text-blue-100">Total Incidents</p>
        </div>

        <!-- Active Incidents -->
        <div class="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
            <div class="flex items-center justify-between mb-4">
                <div class="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <i class="fas fa-triangle-exclamation text-white text-xl"></i>
                </div>
            </div>
            <h3 class="text-3xl font-bold mb-1">${stats.active_incidents}</h3>
            <p class="text-red-100">Active Incidents Today</p>
        </div>

        <!-- Available Agencies -->
        <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div class="flex items-center justify-between mb-4">
                <div class="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <i class="fas fa-building-shield text-white text-xl"></i>
                </div>
            </div>
            <h3 class="text-3xl font-bold mb-1">${stats.total_agencies}</h3>
            <p class="text-green-100">Available Agencies</p>
        </div>

        <!-- Resolved Cases -->
        <div class="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-6 text-white">
            <div class="flex items-center justify-between mb-4">
                <div class="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <i class="fas fa-check-circle text-white text-xl"></i>
                </div>
            </div>
            <h3 class="text-3xl font-bold mb-1">${stats.resolved_cases}</h3>
            <p class="text-emerald-100">Resolved Cases</p>
        </div>
    `;
}

// Create monthly incidents line chart
function createMonthlyIncidentsChart(monthlyData) {
    const ctx = document.getElementById('monthlyIncidentsChart').getContext('2d');
    
    if (monthlyChart) {
        monthlyChart.destroy();
    }

    const months = monthlyData.map(item => item.month_name.substring(0, 3));
    const totals = monthlyData.map(item => item.total);
    const resolved = monthlyData.map(item => item.resolved);

    // Create gradient for the line
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(79, 70, 229, 0.6)');
    gradient.addColorStop(1, 'rgba(79, 70, 229, 0.1)');

    const resolvedGradient = ctx.createLinearGradient(0, 0, 0, 400);
    resolvedGradient.addColorStop(0, 'rgba(16, 185, 129, 0.6)');
    resolvedGradient.addColorStop(1, 'rgba(16, 185, 129, 0.1)');

    monthlyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Total Incidents',
                    data: totals,
                    borderColor: 'rgb(79, 70, 229)',
                    backgroundColor: gradient,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: 'rgb(79, 70, 229)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                },
                {
                    label: 'Resolved',
                    data: resolved,
                    borderColor: 'rgb(16, 185, 129)',
                    backgroundColor: resolvedGradient,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: 'rgb(16, 185, 129)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        precision: 0
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#1f2937',
                    bodyColor: '#1f2937',
                    borderColor: '#e5e7eb',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

function formatLocationLine(incident) {
    const barangayLabel = incident.baranggay
        ? `Barangay: ${incident.baranggay}`
        : 'Barangay: unknown';
    let coordPart = '';
    const lat = incident.latitude != null ? parseFloat(incident.latitude) : NaN;
    const lng = incident.longitude != null ? parseFloat(incident.longitude) : NaN;
    if (!isNaN(lat) && !isNaN(lng)) {
        coordPart = ` · ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
    return `${barangayLabel}${coordPart}`;
}

function destroyDashboardMiniMaps() {
    dashboardMiniMaps.forEach((m) => {
        try {
            m.remove();
        } catch (e) {
            /* ignore */
        }
    });
    dashboardMiniMaps = [];
}

/**
 * One small non-interactive map per sidebar row (Leaflet).
 * @param {Array<{ latitude?: unknown, longitude?: unknown }>} incidents Same rows as rendered cards (same order).
 */
function initDashboardMiniMaps(incidents) {
    destroyDashboardMiniMaps();
    if (typeof L === 'undefined') return;

    incidents.forEach((incident, index) => {
        const el = document.getElementById(`dash-mini-map-${index}`);
        if (!el) return;

        const lat = incident.latitude != null ? parseFloat(String(incident.latitude)) : NaN;
        const lng = incident.longitude != null ? parseFloat(String(incident.longitude)) : NaN;
        const coordsOk = !isNaN(lat) && !isNaN(lng) && !(lat === 0 && lng === 0);

        if (!coordsOk) {
            el.innerHTML =
                '<div class="flex items-center justify-center h-full text-xs text-slate-400 bg-slate-100 rounded-lg">No location</div>';
            return;
        }

        const map = L.map(el, {
            zoomControl: false,
            dragging: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            boxZoom: false,
            keyboard: false,
            attributionControl: false,
        }).setView([lat, lng], 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
        }).addTo(map);

        L.circleMarker([lat, lng], {
            radius: 6,
            fillColor: '#2563eb',
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9,
        }).addTo(map);

        dashboardMiniMaps.push(map);
        requestAnimationFrame(() => {
            map.invalidateSize();
        });
    });
}

// Sidebar preview cards for today's incidents.
function renderPriorityIncidents(incidents) {
    const container = document.getElementById('priorityIncidentsList');
    if (!container) return;

    destroyDashboardMiniMaps();

    const rows = Array.isArray(incidents) ? incidents.slice(0, 6) : [];

    if (rows.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-slate-500">
                <i class="fas fa-check-circle text-slate-400 text-3xl mb-2"></i>
                <p class="mt-2">No incidents for today</p>
            </div>
        `;
        return;
    }

    let html = '';

    rows.forEach((incident, index) => {
        const typeInfo = getIncidentTypeInfo(incident.incident_type);
        const severityInfo = getSeverityInfo(incident.severity_level);
        const statusInfo = getStatusInfo(incident.status);

        html += `
            <div class="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer relative z-0" onclick="viewIncidentDetails(${JSON.stringify(incident.incident_id)})">
                <div class="flex items-start gap-3">
                    <div class="w-10 h-10 ${typeInfo.bgColor} rounded-lg flex items-center justify-center flex-shrink-0">
                        <i class="fas ${typeInfo.icon} ${typeInfo.textColor}"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1 flex-wrap">
                            <span class="font-semibold text-slate-900 truncate">${typeInfo.text}</span>
                            <span class="px-2 py-0.5 ${severityInfo.bgColor} ${severityInfo.textColor} text-xs font-medium rounded flex-shrink-0">
                                <i class="fas ${severityInfo.icon} mr-1"></i>${severityInfo.text}
                            </span>
                            <span class="px-2 py-0.5 ${statusInfo.bgColor} ${statusInfo.textColor} text-xs font-medium rounded flex-shrink-0">
                                <i class="fas ${statusInfo.icon} mr-1"></i>${statusInfo.text}
                            </span>
                        </div>
                        <p class="text-sm text-slate-600 mb-2 line-clamp-2">${incident.description ?? ''}</p>
                        <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mb-3">
                            <span class="flex items-center gap-1 min-w-0">
                                <i class="fas fa-location-dot flex-shrink-0"></i>
                                <span class="truncate">${formatLocationLine(incident)}</span>
                            </span>
                            <span class="flex items-center gap-1">
                                <i class="fas fa-clock"></i>
                                ${formatDate(incident.created_at)}
                            </span>
                            <span class="flex items-center gap-1 font-mono truncate">
                                <i class="fas fa-hashtag"></i>
                                ${incident.incident_id}
                            </span>
                        </div>
                        <div id="dash-mini-map-${index}" class="dispatcher-mini-map w-full rounded-lg overflow-hidden border border-slate-200 pointer-events-none"></div>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;

    setTimeout(() => initDashboardMiniMaps(rows), 80);
}

// Helper functions
function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
    });
}

function getIncidentTypeInfo(type) {
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
        },
        'other': { 
            icon: 'fa-triangle-exclamation', 
            color: 'gray', 
            bgColor: 'bg-gray-100',
            textColor: 'text-gray-800',
            borderColor: 'border-gray-200',
            text: 'Other Emergency'
        }
    };
    
    return types[normalizedType] || types['other'];
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
            text: 'Pending', 
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
            color: 'purple', 
            bgColor: 'bg-purple-100',
            textColor: 'text-purple-800',
            borderColor: 'border-purple-200',
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

// Initialize dashboard map with incident coordinates
function initDashboardMap(incidentCoordinates) {
    const mapEl = document.getElementById('dashboardMap');
    if (!mapEl) return;

    if (dashboardMap) {
        dashboardMap.remove();
        dashboardMap = null;
    }

    dashboardMap = L.map('dashboardMap').setView([14.2691, 121.4113], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(dashboardMap);

    // Add incident markers
    incidentCoordinates.forEach(incident => {
        const typeInfo = getIncidentTypeInfo(incident.incident_type);
        const statusInfo = getStatusInfo(incident.status);
        const color = statusInfo.color || 'red';
        
        const marker = L.circleMarker([incident.latitude, incident.longitude], {
            radius: 8,
            fillColor: color,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(dashboardMap);

        marker.bindPopup(`
            <div class="p-2 min-w-64">
                <div class="flex items-center gap-2 mb-2">
                    <div class="w-6 h-6 ${typeInfo.bgColor} rounded flex items-center justify-center">
                        <i class="${typeInfo.icon} ${typeInfo.textColor} text-xs"></i>
                    </div>
                    <strong class="text-slate-900">${typeInfo.text}</strong>
                </div>
                <p class="text-sm mb-2 text-slate-600">${incident.description}</p>
                <div class="text-xs space-y-1 text-slate-500">
                    <div class="flex justify-between">
                        <span>Status:</span>
                        <span class="px-1 ${statusInfo.bgColor} ${statusInfo.textColor} rounded">${statusInfo.text}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Severity:</span>
                        <span class="font-medium">${incident.severity_level}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Reported:</span>
                        <span>${formatDate(incident.created_at)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>ID:</span>
                        <span class="font-mono">${incident.incident_id}</span>
                    </div>
                </div>
            </div>
        `);
    });

    setTimeout(() => {
        if (dashboardMap) {
            dashboardMap.invalidateSize();
        }
    }, 250);
}

// Fullscreen map
function openFullscreenMap() {
    document.getElementById('fullscreenMapModal').classList.remove('hidden');
    if (!fullscreenMapInstance) {
        fullscreenMapInstance = L.map('fullscreenMap').setView([14.2691, 121.4113], 11);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(fullscreenMapInstance);
    }
    setTimeout(() => {
        if (fullscreenMapInstance) {
            fullscreenMapInstance.invalidateSize();
        }
    }, 250);
}

function closeFullscreenMap() {
    document.getElementById('fullscreenMapModal').classList.add('hidden');
}

// View incident details
function viewIncidentDetails(incidentId) {
    // Redirect to incidents page with the specific incident
    window.location.href = `incidents.html?incident=${incidentId}`;
}

// Logout
function logout() {
    localStorage.clear();
    window.location.href = '../index.html';
}

// Load dashboard data
async function loadDashboardData(options = {}) {
    const silent = Boolean(options.silent);
    if (!silent) {
        dispatcherDashboardPollSignature = '';
    }
    try {
        const data = await fetchDashboardStats();

        if (!data.success) {
            throw new Error(data.error || 'Failed to load dashboard data');
        }

        let sidebarList = [];
        try {
            const incidentsPayload = await fetchSidebarIncidentsSameAsActiveIncidentsPage();
            sidebarList =
                incidentsPayload.success && Array.isArray(incidentsPayload.data)
                    ? incidentsPayload.data
                    : [];
        } catch (sidebarErr) {
            console.error('Error loading sidebar incidents:', sidebarErr);
            sidebarList = [];
        }

        const nextSig = fingerprintDispatcherDashboardBundle(data.data, sidebarList);
        if (silent && nextSig === dispatcherDashboardPollSignature) {
            return;
        }
        dispatcherDashboardPollSignature = nextSig;

        updateStatistics(data.data.stats);
        createMonthlyIncidentsChart(data.data.monthly_incidents);
        initDashboardMap(data.data.incident_coordinates);

        renderPriorityIncidents(sidebarList);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        if (!silent) {
            document.getElementById('statsContainer').innerHTML = `
            <div class="col-span-4 bg-white rounded-xl border border-slate-200 p-6 text-center">
                <p class="text-red-600">Error loading dashboard data: ${error.message}</p>
                <button onclick="loadDashboardData()" class="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Retry
                </button>
            </div>
        `;
        }
    }
}

// Initialize page
function initializePage() {
    loadUserData();
    loadDashboardData();
    setInterval(function () {
        loadDashboardData({ silent: true });
    }, 5000);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePage);