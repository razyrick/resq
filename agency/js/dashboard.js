// API Configuration
const API_BASE_URL = 'https://greenyellow-hawk-206191.hostingersite.com';
let dashboardMap = null;
let fullscreenMapInstance = null;
let currentStats = null;
let agencyDashboardPollSignature = '';

function fingerprintAgencyDashboardPayload(stats) {
    if (!stats || typeof stats !== 'object') return '';
    const live = (stats.live_incidents || []).map((i) =>
        [i.incident_id, i.status, i.latitude, i.longitude, i.updated_at || i.created_at || ''].join('\u001f')
    );
    live.sort();
    const head = [
        stats.total_incidents,
        stats.total_users,
        stats.total_dispatchers,
        stats.resolved_cases
    ].join('|');
    const rs = JSON.stringify(stats.reports_by_status || []);
    const it = JSON.stringify(stats.incidents_by_type || []);
    return head + '\u0000' + rs + '\u0000' + it + '\u0000' + live.join('\u0000');
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

// API Request Helper — read body as text first so empty/HTML responses don't break response.json()
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

        const text = await response.text();
        if (text == null || String(text).trim() === '') {
            throw new Error(`Empty response from server (HTTP ${response.status})`);
        }
        let data;
        try {
            data = JSON.parse(text);
        } catch {
            throw new Error(
                `Non-JSON response (HTTP ${response.status}): ${String(text).slice(0, 160)}`
            );
        }

        if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('API Request failed:', error);
        throw error;
    }
};

// Load dashboard stats
async function loadDashboardStats(options = {}) {
    const silent = Boolean(options.silent);
    if (!silent) {
        showLoading();
    }
    try {
        const response = await apiRequest('/agency/dashboard');
        
        if (response.success) {
            const nextSig = fingerprintAgencyDashboardPayload(response.data);
            if (silent && nextSig === agencyDashboardPollSignature) {
                return;
            }
            agencyDashboardPollSignature = nextSig;
            currentStats = response.data;
            renderDashboardStats(response.data);
            showContent();
            initializeMap(response.data.live_incidents);
        } else {
            throw new Error(response.error || 'Failed to load dashboard stats');
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        if (!silent) {
            showError('Failed to load dashboard: ' + error.message);
        }
    }
}

// Render dashboard statistics
function renderDashboardStats(stats) {
    // Update main stats
    document.getElementById('totalIncidents').textContent = stats.total_incidents.toLocaleString();
    document.getElementById('totalUsers').textContent = stats.total_users.toLocaleString();
    document.getElementById('totalDispatchers').textContent = stats.total_dispatchers.toLocaleString();
    document.getElementById('resolvedCases').textContent = stats.resolved_cases.toLocaleString();

    // Render reports by status
    renderStatusReports(stats.reports_by_status);

    // Render incidents by type
    renderIncidentTypes(stats.incidents_by_type);
}

// Render status reports
function renderStatusReports(statusReports) {
    const container = document.getElementById('statusReports');
    container.innerHTML = '';

    const statusConfig = {
        'pending': { color: 'bg-yellow-500', label: 'Pending' },
        'dispatched': { color: 'bg-blue-600', label: 'Dispatched' },
        'in-progress': { color: 'bg-orange-500', label: 'In Progress' },
        'resolved': { color: 'bg-green-600', label: 'Resolved' }
    };

    const total = statusReports.reduce((sum, item) => sum + item.count, 0);

    statusReports.forEach(item => {
        const percentage = total > 0 ? (item.count / total) * 100 : 0;
        const config = statusConfig[item.status] || { color: 'bg-gray-500', label: item.status };

        const statusElement = document.createElement('div');
        statusElement.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-slate-600">${config.label}</span>
                <span class="text-sm font-bold text-slate-900">${item.count}</span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-2">
                <div class="${config.color} h-2 rounded-full" style="width: ${percentage}%"></div>
            </div>
        `;
        container.appendChild(statusElement);
    });
}

// Render incident types
function renderIncidentTypes(incidentTypes) {
    const container = document.getElementById('incidentTypes');
    container.innerHTML = '';

    const typeConfig = {
        'fire': { icon: '🔥', bgColor: 'bg-red-100', textColor: 'text-red-600' },
        'flood': { icon: '💧', bgColor: 'bg-blue-100', textColor: 'text-blue-600' },
        'medical': { icon: '🚑', bgColor: 'bg-red-100', textColor: 'text-red-600' },
        'other': { icon: '⚠️', bgColor: 'bg-slate-200', textColor: 'text-slate-600' }
    };

    incidentTypes.forEach(item => {
        const config = typeConfig[item.incident_type] || { 
            icon: '📝', 
            bgColor: 'bg-slate-200', 
            textColor: 'text-slate-600' 
        };

        const typeElement = document.createElement('div');
        typeElement.className = 'flex items-center gap-3 p-3 bg-slate-50 rounded-lg';
        typeElement.innerHTML = `
            <div class="w-10 h-10 ${config.bgColor} rounded-lg flex items-center justify-center text-lg">
                ${config.icon}
            </div>
            <div>
                <p class="text-2xl font-bold text-slate-900">${item.count}</p>
                <p class="text-xs text-slate-500 capitalize">${item.incident_type}</p>
            </div>
        `;
        container.appendChild(typeElement);
    });
}

// Initialize map with live incidents
function initializeMap(liveIncidents) {
    // Initialize dashboard map
    dashboardMap = L.map('dashboardMap').setView([14.2691, 121.4113], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(dashboardMap);

    // Add incident markers
    const incidentColors = {
        'fire': '#dc2626',
        'flood': '#2563eb',
        'medical': '#ef4444',
        'other': '#6b7280'
    };

    let activeIncidents = 0;

    liveIncidents.forEach(incident => {
        activeIncidents++;
        const color = incidentColors[incident.incident_type] || '#6b7280';
        
        L.circleMarker([incident.latitude, incident.longitude], {
            radius: 8,
            fillColor: color,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(dashboardMap).bindPopup(`
            <b>${incident.incident_type.toUpperCase()} INCIDENT</b><br>
            ID: ${incident.incident_id}<br>
            Status: ${incident.status}<br>
            Severity: ${incident.severity_level}<br>
            Reported: ${new Date(incident.created_at).toLocaleString()}
        `);
    });

    // Update map info
    document.getElementById('mapInfo').textContent = 
        `Showing ${activeIncidents} active incident${activeIncidents !== 1 ? 's' : ''} on map`;
}

// Fullscreen map
function openFullscreenMap() {
    if (!currentStats) return;

    document.getElementById('fullscreenMapModal').classList.remove('hidden');
    
    fullscreenMapInstance = L.map('fullscreenMap').setView([14.2691, 121.4113], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(fullscreenMapInstance);

    const incidentColors = {
        'fire': '#dc2626',
        'flood': '#2563eb',
        'medical': '#ef4444',
        'other': '#6b7280'
    };

    currentStats.live_incidents.forEach(incident => {
        const color = incidentColors[incident.incident_type] || '#6b7280';
        
        L.circleMarker([incident.latitude, incident.longitude], {
            radius: 10,
            fillColor: color,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(fullscreenMapInstance).bindPopup(`
            <b>${incident.incident_type.toUpperCase()} INCIDENT</b><br>
            ID: ${incident.incident_id}<br>
            Status: ${incident.status}<br>
            Severity: ${incident.severity_level}<br>
            Reported: ${new Date(incident.created_at).toLocaleString()}
        `);
    });

    setTimeout(() => fullscreenMapInstance.invalidateSize(), 100);
}

function closeFullscreenMap() {
    document.getElementById('fullscreenMapModal').classList.add('hidden');
    if (fullscreenMapInstance) {
        fullscreenMapInstance.remove();
        fullscreenMapInstance = null;
    }
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

// UI Helper Functions
function showLoading() {
    document.getElementById('loadingState').classList.remove('hidden');
    document.getElementById('dashboardContent').classList.add('hidden');
    document.getElementById('errorState').classList.add('hidden');
}

function showContent() {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('dashboardContent').classList.remove('hidden');
    document.getElementById('errorState').classList.add('hidden');
}

function showError(message) {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('dashboardContent').classList.add('hidden');
    document.getElementById('errorState').classList.remove('hidden');
    document.getElementById('errorMessage').textContent = message;
}

// Logout
function logout() {
    localStorage.clear();
    window.location.href = '../index.html';
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    updateUserInfo();
    loadDashboardStats();
    setInterval(function () {
        loadDashboardStats({ silent: true });
    }, 5000);
});