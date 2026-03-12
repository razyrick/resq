// API Configuration
const API_BASE_URL = 'https://greenyellow-hawk-206191.hostingersite.com';
let dashboardMap = null;
let fullscreenMapInstance = null;
let currentStats = null;

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

// Load dashboard data
async function loadDashboardData() {
    showLoading();
    try {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        let url = '/barangay/dashboard';
        const params = new URLSearchParams();
        
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        
        if (params.toString()) {
            url += '?' + params.toString();
        }

        const response = await apiRequest(url);
        
        if (response.success && response.data) {
            currentStats = response.data;
            updateDashboardUI();
            showContent();
            
            // Initialize map with live incidents
            if (response.data.recent_incidents) {
                initializeMap(response.data.recent_incidents);
            }
        } else {
            throw new Error(response.error || 'Failed to load dashboard data');
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showError('Failed to load dashboard: ' + error.message);
    }
}

// Update dashboard UI with data
function updateDashboardUI() {
    if (!currentStats) return;

    const { stats, incidents_by_type, recent_incidents } = currentStats;

    // Update stats cards
    document.getElementById('totalIncidents').textContent = stats.total_incidents || 0;
    document.getElementById('pendingCases').textContent = stats.pending_cases || 0;
    document.getElementById('ongoingCases').textContent = stats.ongoing_cases || 0;
    document.getElementById('resolvedCases').textContent = stats.resolved_cases || 0;

    // Update severity score
    document.getElementById('avgSeverityScore').textContent = (stats.avg_severity_score || 0).toFixed(2);
    const severityWidth = Math.min((stats.avg_severity_score || 0) * 100, 100);
    document.getElementById('severityProgressBar').style.width = `${severityWidth}%`;

    // Update incidents by type
    updateIncidentsByType(incidents_by_type);

    // Update recent incidents
    updateRecentIncidents(recent_incidents);
}

// Initialize map with live incidents
function initializeMap(liveIncidents) {
    // Check if we have valid coordinates in the incidents
    const validIncidents = liveIncidents.filter(incident => 
        incident.latitude && incident.longitude && 
        !isNaN(parseFloat(incident.latitude)) && 
        !isNaN(parseFloat(incident.longitude))
    );

    let centerLat = 14.15905280; // Default Laguna coordinates
    let centerLng = 121.26126080;
    let zoom = 12;

    // If we have valid incidents, calculate center point
    if (validIncidents.length > 0) {
        const lats = validIncidents.map(i => parseFloat(i.latitude));
        const lngs = validIncidents.map(i => parseFloat(i.longitude));
        centerLat = lats.reduce((a, b) => a + b) / lats.length;
        centerLng = lngs.reduce((a, b) => a + b) / lngs.length;
        zoom = 14;
    }

    // Initialize or reinitialize dashboard map
    if (dashboardMap) {
        dashboardMap.remove();
    }
    
    dashboardMap = L.map('dashboardMap').setView([centerLat, centerLng], zoom);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(dashboardMap);

    // Add incident markers
    const incidentColors = {
        'fire': '#dc2626',
        'flood': '#2563eb',
        'medical': '#ef4444',
        'accident': '#f59e0b',
        'crime': '#7c3aed',
        'other': '#6b7280'
    };

    validIncidents.forEach(incident => {
        const lat = parseFloat(incident.latitude);
        const lng = parseFloat(incident.longitude);
        const color = incidentColors[incident.incident_type] || '#6b7280';
        
        const marker = L.circleMarker([lat, lng], {
            radius: 8,
            fillColor: color,
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(dashboardMap).bindPopup(`
            <div style="min-width: 200px; font-family: 'Inter', sans-serif;">
                <b class="capitalize">${incident.incident_type || 'Unknown'} Incident</b><br>
                <strong>ID:</strong> ${incident.incident_id || 'N/A'}<br>
                <strong>Status:</strong> ${incident.status || 'Unknown'}<br>
                <strong>Severity:</strong> ${incident.severity_level || 'Unknown'}<br>
                <strong>Reported:</strong> ${formatDate(incident.created_at)}<br>
                ${incident.description ? `<strong>Description:</strong> ${incident.description.substring(0, 100)}${incident.description.length > 100 ? '...' : ''}` : ''}
            </div>
        `);
        
        // Optional: Open popup on hover
        marker.on('mouseover', function(e) {
            this.openPopup();
        });
        
        marker.on('mouseout', function(e) {
            this.closePopup();
        });
    });

    // Update map info
    document.getElementById('mapInfo').textContent = 
        `Showing ${validIncidents.length} incident${validIncidents.length !== 1 ? 's' : ''} on map`;
}

// Fullscreen map
function openFullscreenMap() {
    if (!currentStats || !currentStats.recent_incidents) return;

    document.getElementById('fullscreenMapModal').classList.remove('hidden');
    
    // Wait a bit for the modal to be visible before initializing map
    setTimeout(() => {
        // Clean up existing map if any
        if (fullscreenMapInstance) {
            fullscreenMapInstance.remove();
        }
        
        // Get valid incidents with coordinates
        const validIncidents = currentStats.recent_incidents.filter(incident => 
            incident.latitude && incident.longitude && 
            !isNaN(parseFloat(incident.latitude)) && 
            !isNaN(parseFloat(incident.longitude))
        );
        
        let centerLat = 14.15905280;
        let centerLng = 121.26126080;
        let zoom = 11;
        
        if (validIncidents.length > 0) {
            const lats = validIncidents.map(i => parseFloat(i.latitude));
            const lngs = validIncidents.map(i => parseFloat(i.longitude));
            centerLat = lats.reduce((a, b) => a + b) / lats.length;
            centerLng = lngs.reduce((a, b) => a + b) / lngs.length;
            zoom = 13;
        }
        
        fullscreenMapInstance = L.map('fullscreenMap').setView([centerLat, centerLng], zoom);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(fullscreenMapInstance);

        // Add incident markers
        const incidentColors = {
            'fire': '#dc2626',
            'flood': '#2563eb',
            'medical': '#ef4444',
            'accident': '#f59e0b',
            'crime': '#7c3aed',
            'other': '#6b7280'
        };

        validIncidents.forEach(incident => {
            const lat = parseFloat(incident.latitude);
            const lng = parseFloat(incident.longitude);
            const color = incidentColors[incident.incident_type] || '#6b7280';
            
            L.circleMarker([lat, lng], {
                radius: 10,
                fillColor: color,
                color: '#ffffff',
                weight: 3,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(fullscreenMapInstance).bindPopup(`
                <div style="min-width: 250px; font-family: 'Inter', sans-serif;">
                    <b class="capitalize" style="font-size: 16px;">${incident.incident_type || 'Unknown'} Incident</b><br>
                    <strong>ID:</strong> ${incident.incident_id || 'N/A'}<br>
                    <strong>Status:</strong> ${incident.status || 'Unknown'}<br>
                    <strong>Severity:</strong> ${incident.severity_level || 'Unknown'}<br>
                    <strong>Reported:</strong> ${formatDate(incident.created_at)}<br>
                    <strong>Description:</strong> ${incident.description || 'No description provided'}
                </div>
            `);
        });

        // Fit bounds to show all markers if we have any
        if (validIncidents.length > 0) {
            const bounds = L.latLngBounds(validIncidents.map(i => 
                [parseFloat(i.latitude), parseFloat(i.longitude)]
            ));
            fullscreenMapInstance.fitBounds(bounds, { padding: [50, 50] });
        }
        
        // Trigger resize to ensure map renders correctly
        fullscreenMapInstance.invalidateSize();
    }, 100);
}

function closeFullscreenMap() {
    document.getElementById('fullscreenMapModal').classList.add('hidden');
    if (fullscreenMapInstance) {
        fullscreenMapInstance.remove();
        fullscreenMapInstance = null;
    }
}

// Update incidents by type section
function updateIncidentsByType(incidentsByType) {
    const container = document.getElementById('incidentsByTypeList');
    container.innerHTML = '';

    if (!incidentsByType || incidentsByType.length === 0) {
        container.innerHTML = '<p class="text-sm text-slate-500 text-center">No incident data available</p>';
        return;
    }

    // Calculate total for percentage calculation
    const total = incidentsByType.reduce((sum, item) => sum + parseInt(item.count || 0), 0);

    incidentsByType.forEach(item => {
        const percentage = total > 0 ? (parseInt(item.count || 0) / total) * 100 : 0;
        const color = getIncidentTypeColor(item.incident_type);

        const element = document.createElement('div');
        element.className = 'pb-4 border-b border-slate-100 last:border-0 last:pb-0';
        element.innerHTML = `
            <div>
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium text-slate-700 capitalize">${item.incident_type || 'Unknown'}</span>
                    <span class="text-sm text-slate-600">${item.count || 0}</span>
                </div>
                <div class="w-full bg-slate-200 rounded-full h-2 mb-1">
                    <div class="h-2 rounded-full ${color}" style="width: ${percentage}%"></div>
                </div>
                <div class="flex justify-between text-xs text-slate-500">
                    <span>Pending: ${item.pending || 0}</span>
                    <span>Active: ${item.ongoing || 0}</span>
                    <span>Resolved: ${item.resolved || 0}</span>
                </div>
            </div>
        `;
        container.appendChild(element);
    });
}

// Update recent incidents section
function updateRecentIncidents(recentIncidents) {
    const container = document.getElementById('recentIncidentsList');
    container.innerHTML = '';

    if (!recentIncidents || recentIncidents.length === 0) {
        container.innerHTML = '<p class="text-sm text-slate-500 text-center">No recent incidents</p>';
        return;
    }

    recentIncidents.forEach(incident => {
        const severityColor = getSeverityColor(incident.severity_level);
        const typeIcon = getIncidentTypeIcon(incident.incident_type);

        const element = document.createElement('div');
        element.className = 'flex items-start gap-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition';
        element.innerHTML = `
            <div class="w-12 h-12 ${severityColor.bg} rounded-lg flex items-center justify-center flex-shrink-0">
                ${typeIcon}
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-2">
                    <h4 class="font-semibold text-slate-900 capitalize">${incident.incident_type || 'Unknown'} Incident</h4>
                    <span class="px-2 py-1 ${severityColor.text} text-xs font-medium rounded capitalize">${incident.severity_level || 'Unknown'}</span>
                </div>
                <p class="text-sm text-slate-600 mb-2 line-clamp-2">${incident.description || 'No description provided'}</p>
                <div class="flex items-center gap-4 text-xs text-slate-500">
                    <span class="flex items-center gap-1">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        ${formatTimeAgo(incident.created_at)}
                    </span>
                    <span>•</span>
                    <span>ID: ${incident.incident_id || 'N/A'}</span>
                </div>
            </div>
            <button onclick="viewIncidentDetails('${incident.incident_id}')" class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap">
                View Details
            </button>
        `;
        container.appendChild(element);
    });
}

// Helper functions
function getIncidentTypeColor(type) {
    const colors = {
        fire: 'bg-red-600',
        flood: 'bg-blue-600',
        medical: 'bg-green-600',
        accident: 'bg-yellow-500',
        crime: 'bg-purple-600',
        other: 'bg-gray-600'
    };
    return colors[type] || 'bg-gray-600';
}

function getSeverityColor(severity) {
    const colors = {
        high: { bg: 'bg-red-100', text: 'bg-red-100 text-red-700', map: '#dc2626' },
        medium: { bg: 'bg-yellow-100', text: 'bg-yellow-100 text-yellow-700', map: '#f59e0b' },
        low: { bg: 'bg-green-100', text: 'bg-green-100 text-green-700', map: '#10b981' }
    };
    return colors[severity] || { bg: 'bg-gray-100', text: 'bg-gray-100 text-gray-700', map: '#6b7280' };
}

function getIncidentTypeIcon(type) {
    const icons = {
        fire: '<svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /></svg>',
        flood: '<svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>',
        medical: '<svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>',
        accident: '<svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" /></svg>',
        crime: '<svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>'
    };
    return icons[type] || '<svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>';
}

function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

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

function viewIncidentDetails(incidentId) {
    window.location.href = `cases.html?view=${incidentId}`;
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

// Update user info in header
function updateUserInfo() {
    const storedData = getStoredUserData();
    if (storedData && storedData.user) {
        const user = storedData.user;
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        const initials = getInitials(user.first_name, user.last_name);
        
        document.getElementById('userName').textContent = fullName || 'User';
        document.getElementById('userInitials').textContent = initials;
        document.getElementById('userRole').textContent = storedData.role || 'Barangay Official';
    }
}

function getInitials(firstName, lastName) {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last || 'U';
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
        showError('Please login to access dashboard.');
        return;
    }

    updateUserInfo();
    
    // Set default dates to current month
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    document.getElementById('startDate').value = firstDay.toISOString().split('T')[0];
    document.getElementById('endDate').value = today.toISOString().split('T')[0];
    
    // Load dashboard data
    loadDashboardData();
});