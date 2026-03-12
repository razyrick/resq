// API Configuration
const API_BASE_URL = 'https://greenyellow-hawk-206191.hostingersite.com';
let map;
let incidents = [];

// Sta. Cruz, Laguna Coordinates
const STA_CRUZ_CENTER = [14.2769, 121.4164];

// Sta. Cruz, Laguna Boundary Coordinates (approximate polygon)
const STA_CRUZ_BOUNDARY = [
    // [14.3110, 121.3600], // Northwest
    // [14.3060, 121.3950], // North
    // [14.2950, 121.4300], // Northeast
    // [14.2650, 121.4500], // East
    // [14.2400, 121.4400], // Southeast
    // [14.2250, 121.4100], // South
    // [14.2350, 121.3800], // Southwest
    // [14.2650, 121.3650], // West
    // [14.2950, 121.3750]  // Northwest (close the polygon)
];

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

// Fetch dashboard statistics
async function fetchDashboardStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/user/dashboard`, {
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
        console.error('Error fetching dashboard stats:', error);
        throw error;
    }
}

// Fetch incidents from API
async function fetchIncidents() {
    try {
        const response = await fetch(`${API_BASE_URL}/user/incidents`, {
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

// Get color based on incident status
function getStatusColor(status) {
    const colors = {
        'pending': '#f59e0b', // yellow-500
        'ongoing': '#3b82f6', // blue-500
        'resolved': '#10b981' // green-500
    };
    return colors[status] || colors['pending'];
}

// Get incident type icon
function getIncidentTypeIcon(type) {
    const icons = {
        'flood': 'fa-water',
        'fire': 'fa-fire',
        'medical': 'fa-heartbeat',
        'accident': 'fa-car-crash',
        'crime': 'fa-shield-alt',
        'landslide': 'fa-mountain',
        'power': 'fa-bolt',
        'other': 'fa-exclamation-triangle'
    };
    return icons[type] || icons['other'];
}

// Update dashboard stats in the UI
function updateDashboardStats(stats) {
    document.getElementById('statsReportsSubmitted').textContent = stats.reports_submitted || 0;
    document.getElementById('statsResolved').textContent = stats.resolved || 0;
    document.getElementById('statsPending').textContent = stats.pending || 0;
    document.getElementById('statsTotalIncidents').textContent = stats.total_incidents || 0;
}

// Create custom pin markers
function createPinMarker(lat, lng, color, icon) {
    // Create a custom icon with pin shape
    const pinIcon = L.divIcon({
        className: 'custom-pin-marker',
        html: `
            <div style="
                position: relative;
                width: 24px;
                height: 32px;
                transform: translate(-12px, -32px);
            ">
                <!-- Pin body -->
                <div style="
                    position: absolute;
                    width: 24px;
                    height: 24px;
                    background: ${color};
                    border: 2px solid white;
                    border-radius: 50% 50% 50% 0;
                    transform: rotate(-45deg);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">
                    <i class="fas ${icon}" style="
                        color: white;
                        font-size: 10px;
                        transform: rotate(45deg);
                    "></i>
                </div>
                <!-- Pin point -->
                <div style="
                    position: absolute;
                    bottom: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 4px;
                    height: 8px;
                    background: ${color};
                    border-radius: 0 0 2px 2px;
                "></div>
            </div>
        `,
        iconSize: [24, 32],
        iconAnchor: [12, 32]
    });

    return L.marker([lat, lng], { icon: pinIcon });
}

// Create Sta. Cruz boundary polygon
function createStaCruzBoundary() {
    // Create the polygon
    const polygon = L.polygon(STA_CRUZ_BOUNDARY, {
        color: '#2563eb', // Blue color
        weight: 3,
        opacity: 0.8,
        fillColor: '#3b82f6',
        fillOpacity: 0.1,
        className: 'sta-cruz-boundary'
    }).addTo(map);

    // Add label at center
    L.marker(STA_CRUZ_CENTER, {
        icon: L.divIcon({
            className: 'sta-cruz-label',
            html: `
                <div style="
                    background: rgba(59, 130, 246, 0.9);
                    color: white;
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-weight: bold;
                    font-size: 12px;
                    white-space: nowrap;
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                ">
                    <i class="fas fa-map-marker-alt mr-1"></i>
                    Sta. Cruz, Laguna
                </div>
            `,
            iconSize: [150, 40],
            iconAnchor: [75, 20]
        })
    }).addTo(map);

    // Add boundary coordinates marker for reference
    STA_CRUZ_BOUNDARY.forEach((coord, index) => {
        L.circleMarker(coord, {
            radius: 4,
            fillColor: '#2563eb',
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(map).bindTooltip(`Boundary Point ${index + 1}`, {
            permanent: false,
            direction: 'top'
        });
    });

    return polygon;
}

// Check if coordinates are within Sta. Cruz boundary
function isWithinStaCruzBoundary(lat, lng) {
    // Simple bounding box check for performance
    const minLat = Math.min(...STA_CRUZ_BOUNDARY.map(c => c[0]));
    const maxLat = Math.max(...STA_CRUZ_BOUNDARY.map(c => c[0]));
    const minLng = Math.min(...STA_CRUZ_BOUNDARY.map(c => c[1]));
    const maxLng = Math.max(...STA_CRUZ_BOUNDARY.map(c => c[1]));
    
    return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
}

// Initialize map with pin markers
async function initializeMap() {
    // Initialize map centered on Sta. Cruz, Laguna
    map = L.map('map').setView(STA_CRUZ_CENTER, 13);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
        minZoom: 10
    }).addTo(map);

    // Create Sta. Cruz boundary
    createStaCruzBoundary();

    try {
        // Fetch dashboard stats
        const statsResponse = await fetchDashboardStats();
        if (statsResponse.success) {
            updateDashboardStats(statsResponse.data);
        }

        // Fetch incidents from API
        const data = await fetchIncidents();
        console.log(data);
        
        if (data.success) {
            incidents = data.data;
            
            // Update incident counts
            updateIncidentCounts(incidents);
            
            // Add incident pin markers to map
            incidents.forEach(incident => {
                const lat = parseFloat(incident.latitude);
                const lng = parseFloat(incident.longitude);
                
                if (!isNaN(lat) && !isNaN(lng)) {
                    const color = getStatusColor(incident.status);
                    const icon = getIncidentTypeIcon(incident.incident_type);
                    
                    const marker = createPinMarker(lat, lng, color, icon).addTo(map);
                    
                    // Add boundary check indicator to popup
                    const withinBoundary = isWithinStaCruzBoundary(lat, lng);
                    
                    marker.bindPopup(`
                        <div class="p-2 min-w-[200px]">
                            <div class="flex items-center justify-between mb-2">
                                <div class="flex items-center gap-2">
                                    <i class="fas ${icon} text-gray-600"></i>
                                    <strong class="text-sm capitalize">${incident.incident_type}</strong>
                                </div>
                                <span class="px-2 py-1 text-xs rounded-full ${withinBoundary ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                                    <i class="fas ${withinBoundary ? 'fa-check-circle' : 'fa-exclamation-triangle'} mr-1"></i>
                                    ${withinBoundary ? 'Within Sta. Cruz' : 'Outside Sta. Cruz'}
                                </span>
                            </div>
                            <p class="text-xs text-gray-600 mb-1">${incident.description}</p>
                            <div class="flex items-center gap-2 mb-2">
                                <span class="px-2 py-1 text-xs rounded-full text-white" style="background-color: ${color}">
                                    ${incident.status.toUpperCase()}
                                </span>
                                <span class="text-xs text-gray-500 capitalize">${incident.severity_level} severity</span>
                            </div>
                            <p class="text-xs text-gray-500">${incident.baranggay?.baranggay_name || incident.baranggay?.baranggay || 'Unknown location'}</p>
                            <div class="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                                <p class="text-xs text-gray-400">${new Date(incident.created_at).toLocaleString()}</p>
                                <button onclick="zoomToIncident(${lat}, ${lng})" class="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                    <i class="fas fa-search-location"></i>
                                    Zoom
                                </button>
                            </div>
                        </div>
                    `);
                }
            });

            // Adjust map view to show all markers if there are incidents
            if (incidents.length > 0) {
                const markers = incidents.map(incident => {
                    const lat = parseFloat(incident.latitude);
                    const lng = parseFloat(incident.longitude);
                    return !isNaN(lat) && !isNaN(lng) ? L.marker([lat, lng]) : null;
                }).filter(Boolean);
                
                if (markers.length > 0) {
                    const group = new L.featureGroup(markers);
                    map.fitBounds(group.getBounds().pad(0.1));
                }
            }
        }
    } catch (error) {
        console.error('Error loading incidents:', error);
    }

    // Add map controls
    addMapControls();
}

// Add map controls
function addMapControls() {
    // Add zoom to Sta. Cruz button
    L.Control.zoomToStaCruz = L.Control.extend({
        onAdd: function(map) {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
            container.innerHTML = `
                <button class="bg-white hover:bg-gray-100 text-gray-800 font-bold py-2 px-3 rounded-l border-r border-gray-300" 
                        title="Zoom to Sta. Cruz" 
                        style="border-radius: 4px 0 0 4px;">
                    <i class="fas fa-home text-blue-600"></i>
                </button>
            `;
            
            L.DomEvent.on(container, 'click', function() {
                map.setView(STA_CRUZ_CENTER, 13);
            });
            
            L.DomEvent.disableClickPropagation(container);
            return container;
        }
    });

    // Add toggle boundary button
    L.Control.toggleBoundary = L.Control.extend({
        onAdd: function(map) {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
            container.innerHTML = `
                <button class="bg-white hover:bg-gray-100 text-gray-800 font-bold py-2 px-3 rounded-r" 
                        title="Toggle Sta. Cruz Boundary" 
                        style="border-radius: 0 4px 4px 0;">
                    <i class="fas fa-map text-blue-600"></i>
                </button>
            `;
            
            let boundaryVisible = true;
            const boundaryLayer = document.querySelector('.sta-cruz-boundary');
            
            L.DomEvent.on(container, 'click', function() {
                boundaryVisible = !boundaryVisible;
                if (boundaryLayer) {
                    boundaryLayer.style.display = boundaryVisible ? 'block' : 'none';
                }
                this.innerHTML = `
                    <i class="fas ${boundaryVisible ? 'fa-eye' : 'fa-eye-slash'} text-blue-600"></i>
                `;
            });
            
            L.DomEvent.disableClickPropagation(container);
            return container;
        }
    });

    // Add controls to map
    new L.Control.zoomToStaCruz({ position: 'topleft' }).addTo(map);
    new L.Control.toggleBoundary({ position: 'topleft' }).addTo(map);
}

// Zoom to specific incident
function zoomToIncident(lat, lng) {
    map.setView([lat, lng], 16);
    L.popup()
        .setLatLng([lat, lng])
        .setContent('Incident Location')
        .openOn(map);
}

// Update incident counts in the UI
function updateIncidentCounts(incidents) {
    const pendingCount = incidents.filter(inc => inc.status === 'pending').length;
    const ongoingCount = incidents.filter(inc => inc.status === 'ongoing').length;
    const resolvedCount = incidents.filter(inc => inc.status === 'resolved').length;

    document.getElementById('pendingCount').textContent = pendingCount;
    document.getElementById('ongoingCount').textContent = ongoingCount;
    document.getElementById('resolvedCount').textContent = resolvedCount;
}

// Sidebar functionality
const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menuToggle');
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const closeSidebar = document.getElementById('closeSidebar');

function openSidebar() {
    sidebar.classList.remove('-translate-x-full');
}

function closeSidebarFunc() {
    sidebar.classList.add('-translate-x-full');
}

menuToggle.addEventListener('click', openSidebar);
mobileMenuToggle.addEventListener('click', openSidebar);
closeSidebar.addEventListener('click', closeSidebarFunc);

// Close sidebar when clicking outside
document.addEventListener('click', (event) => {
    const isClickInsideSidebar = sidebar.contains(event.target);
    const isClickOnMenuToggle = menuToggle.contains(event.target) || mobileMenuToggle.contains(event.target);
    
    if (!isClickInsideSidebar && !isClickOnMenuToggle && !sidebar.classList.contains('-translate-x-full')) {
        closeSidebarFunc();
    }
});

// Simulate mesh network status
function updateMeshStatus() {
    const statuses = [
        { color: 'bg-green-500', text: 'Connected', class: 'mesh-status' },
        { color: 'bg-yellow-500', text: 'Searching', class: 'mesh-status' },
        { color: 'bg-red-500', text: 'Offline', class: '' }
    ];
    
    const status = statuses[0]; // Default to connected
    
    document.getElementById('meshStatus').className = `w-2.5 h-2.5 rounded-full ${status.color} ${status.class}`;
    document.getElementById('meshStatusText').textContent = status.text;
    document.getElementById('meshStatusSidebar').className = `w-2.5 h-2.5 rounded-full ${status.color} ${status.class}`;
}

// Check online/offline status
function updateOnlineStatus() {
    const offlineBanner = document.getElementById('offlineBanner');
    if (!navigator.onLine) {
        offlineBanner.classList.remove('hidden');
    } else {
        offlineBanner.classList.add('hidden');
    }
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// Initialize
initializeMap();
updateMeshStatus();
updateOnlineStatus();

// Update mesh status every 5 seconds
setInterval(updateMeshStatus, 5000);

// Notification button handler
document.getElementById('notificationBtn').addEventListener('click', function() {
    window.location.href = 'alerts.html';
});

// Add CSS for the map elements
const style = document.createElement('style');
style.textContent = `
    .custom-pin-marker {
        background: transparent !important;
        border: none !important;
    }
    
    .custom-pin-marker:hover {
        transform: scale(1.1);
        transition: transform 0.2s ease;
    }
    
    .leaflet-popup-content {
        margin: 8px 12px !important;
    }
    
    .leaflet-popup-content-wrapper {
        border-radius: 8px !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
    }
    
    .sta-cruz-boundary {
        stroke-dasharray: 10, 10;
    }
    
    .leaflet-control-custom {
        background: none !important;
        border: none !important;
    }
    
    .leaflet-control-custom button {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
    }
    
    .leaflet-control-custom button:hover {
        background-color: #f3f4f6 !important;
    }
`;
document.head.appendChild(style);

// Make functions global for onclick handlers
window.zoomToIncident = zoomToIncident;