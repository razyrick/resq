// resources.js - Main functionality for Emergency Resources page

// API Configuration
const API_BASE_URL = 'https://greenyellow-hawk-206191.hostingersite.com';
let barangays = [];
let municipalities = new Set();
let filteredBarangays = [];

/** Kept in sync with LDRRMO officer sections in resources.html (municipality → congressional district). */
const LAGUNA_MUNICIPALITY_DISTRICT = {
    'SAN PEDRO': 1,
    'BIÑAN': 1,
    'BINAN': 1,
    'STA. ROSA': 1,
    'CABUYAO': 2,
    'CALAMBA': 2,
    'LOS BAÑOS': 2,
    'LOS BANOS': 2,
    'BAY': 2,
    'CALAUAN': 3,
    'VICTORIA': 3,
    'ALAMINOS': 3,
    'RIZAL': 3,
    'NAGCARLAN': 3,
    'LILIW': 3,
    'SAN PABLO': 3,
    'PILA': 4,
    'STA. CRUZ': 4,
    'PAGSANJAN': 4,
    'MAGDALENA': 4,
    'MAJAYJAY': 4,
    'CAVINTI': 4,
    'LUISIANA': 4,
    'LUMBAN': 4,
    'KALAYAAN': 4,
    'PAETE': 4,
    'PAKIL': 4,
    'PANGIL': 4,
    'SINILOAN': 4,
    'FAMY': 4,
    'MABITAC': 4,
    'STA. MARIA': 4,
    'STA MARIA': 4
};

let activeDistrictId = '1';
let activeLdrrmoView = 'district';

// DOM Elements
let mainTabs = [];
let tabContents = [];
let districtTabs = [];
let districtContents = [];
let barangaySearch, municipalityFilter, barangayContactFilter, barangayToolbar, barangayLoading, barangayError, barangayErrorMessage;
let barangayRetryBtn, barangayList, barangayEmpty, barangayEmptyMessage;

// Initialize DOM elements
function initializeElements() {
    mainTabs = document.querySelectorAll('[data-tab]');
    tabContents = document.querySelectorAll('.tab-content');
    districtTabs = document.querySelectorAll('#district-tabs-bar [data-district]');
    districtContents = document.querySelectorAll('#ldrrmo-tab .district-content');

    barangaySearch = document.getElementById('barangaySearch');
    municipalityFilter = document.getElementById('municipalityFilter');
    barangayContactFilter = document.getElementById('barangayContactFilter');
    barangayToolbar = document.getElementById('barangayToolbar');
    barangayLoading = document.getElementById('barangayLoading');
    barangayError = document.getElementById('barangayError');
    barangayErrorMessage = document.getElementById('barangayErrorMessage');
    barangayRetryBtn = document.getElementById('barangayRetryBtn');
    barangayList = document.getElementById('barangayList');
    barangayEmpty = document.getElementById('barangayEmpty');
    barangayEmptyMessage = document.getElementById('barangayEmptyMessage');
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

function getMunicipalityDistrict(municipality) {
    if (!municipality || typeof municipality !== 'string') {
        return null;
    }
    const key = municipality.trim().toUpperCase();
    return LAGUNA_MUNICIPALITY_DISTRICT[key] ?? null;
}

function barangaysForActiveDistrict() {
    const d = parseInt(activeDistrictId, 10);
    if (Number.isNaN(d)) {
        return [...barangays];
    }
    return barangays.filter(b => {
        const bd = getMunicipalityDistrict(b.municipality);
        if (bd === null) {
            return true;
        }
        return bd === d;
    });
}

function onDistrictChange() {
    if (barangayContactFilter && barangays.length > 0) {
        populateBarangayContactFilter();
        filterBarangays();
    }
}

function setLdrrmoView(view) {
    const v = view === 'hotlines' ? 'hotlines' : 'district';
    activeLdrrmoView = v;

    const panelDistrict = document.getElementById('ldrrmo-panel-district');
    const panelHotlines = document.getElementById('ldrrmo-panel-hotlines');
    if (panelDistrict) {
        panelDistrict.classList.toggle('hidden', v !== 'district');
    }
    if (panelHotlines) {
        panelHotlines.classList.toggle('hidden', v !== 'hotlines');
    }

    document.querySelectorAll('.ldrrmo-subtab').forEach(btn => {
        const isMatch = btn.getAttribute('data-ldrrmo-view') === v;
        btn.classList.toggle('active', isMatch);
        btn.classList.toggle('border-b-2', isMatch);
        btn.classList.toggle('border-blue-600', isMatch);
        btn.classList.toggle('text-blue-600', isMatch);
        btn.classList.toggle('text-gray-600', !isMatch);
    });
}

function setupLdrrmoSubtabs() {
    document.querySelectorAll('.ldrrmo-subtab').forEach(btn => {
        btn.addEventListener('click', () => {
            const viewClicked = btn.getAttribute('data-ldrrmo-view');
            if (viewClicked) {
                setLdrrmoView(viewClicked);
            }
        });
    });
}

// Load user data to sidebar
function loadUserData() {
    const userDataStr = localStorage.getItem('userData');
    if (userDataStr) {
        try {
            const userData = JSON.parse(userDataStr);
            const sidebarUserName = document.getElementById('sidebarUserName');
            const sidebarUserEmail = document.getElementById('sidebarUserEmail');
            
            if (sidebarUserName) {
                sidebarUserName.textContent = `${userData.first_name || ''} ${userData.last_name || ''}`;
            }
            if (sidebarUserEmail) {
                sidebarUserEmail.textContent = userData.email || '';
            }
        } catch (error) {
            console.error('Error parsing user data:', error);
        }
    }
}

// Fetch all barangay pages from API (list is paginated)
async function fetchBarangaysFromApi() {
    const collected = [];
    let page = 1;
    const limit = 50;

    for (;;) {
        if (page > 200) {
            console.warn('fetchBarangaysFromApi: stopped after 200 pages');
            break;
        }
        const response = await fetch(
            `${API_BASE_URL}/user/barangay?page=${page}&limit=${limit}`,
            { method: 'GET', headers: getHeaders() }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to load barangays');
        }

        if (Array.isArray(data.data) && data.data.length > 0) {
            collected.push(...data.data);
        }

        const hasNext = data.pagination && data.pagination.has_next;
        if (!hasNext) {
            break;
        }
        page += 1;
    }

    return collected;
}

// Fetch barangays from API
async function fetchBarangays() {
    try {
        showBarangayLoading();

        barangays = await fetchBarangaysFromApi();
        processBarangays();
        showBarangayList();
    } catch (error) {
        console.error('Error fetching barangays:', error);
        showBarangayError(error.message);
    }
}

// Process barangay data
function processBarangays() {
    municipalities.clear();
    barangays.forEach(barangay => {
        if (barangay.municipality) {
            municipalities.add(barangay.municipality);
        }
    });

    if (municipalityFilter) {
        const sortedMunicipalities = Array.from(municipalities).sort();
        municipalityFilter.innerHTML = '<option value="">All Municipalities</option>';
        sortedMunicipalities.forEach(municipality => {
            const option = document.createElement('option');
            option.value = municipality;
            option.textContent = municipality;
            municipalityFilter.appendChild(option);
        });
    }

    filteredBarangays = [...barangays];
    populateBarangayContactFilter();
    filterBarangays();
}

function populateBarangayContactFilter() {
    if (!barangayContactFilter) {
        return;
    }

    const previous = barangayContactFilter.value;
    const pool = barangaysForActiveDistrict();
    barangayContactFilter.innerHTML = '<option value="">Select a barangay…</option>';

    const sorted = [...pool].sort((a, b) =>
        String(a.baranggay || '').localeCompare(String(b.baranggay || ''), undefined, { sensitivity: 'base' })
    );

    sorted.forEach(b => {
        const opt = document.createElement('option');
        opt.value = String(b.baranggay_id);
        opt.textContent = b.baranggay || `Barangay ${b.baranggay_id}`;
        barangayContactFilter.appendChild(opt);
    });

    const stored = getStoredUserData();
    const u = stored && stored.user ? stored.user : {};
    const rawProfileId = u.baranggay_id ?? u.barangay_id;
    const profileId = rawProfileId != null && rawProfileId !== '' ? String(rawProfileId) : '';

    if (previous && [...barangayContactFilter.options].some(o => o.value === previous)) {
        barangayContactFilter.value = previous;
    } else if (profileId && [...barangayContactFilter.options].some(o => o.value === profileId)) {
        barangayContactFilter.value = profileId;
    }
}

// Render barangay list
function renderBarangayList() {
    if (!barangayList) return;

    const container = barangayList.querySelector('.barangay-list');
    if (!container) return;

    const selectedId = barangayContactFilter ? barangayContactFilter.value : '';

    if (!selectedId) {
        if (barangayEmptyMessage) {
            barangayEmptyMessage.textContent = 'Select a barangay to view contacts.';
        }
        barangayList.classList.add('hidden');
        if (barangayEmpty) barangayEmpty.classList.remove('hidden');
        container.innerHTML = '';
        return;
    }

    if (barangayEmptyMessage) {
        barangayEmptyMessage.textContent = 'No barangays found';
    }

    if (filteredBarangays.length === 0) {
        barangayList.classList.add('hidden');
        if (barangayEmpty) barangayEmpty.classList.remove('hidden');
        container.innerHTML = '';
        return;
    }

    if (barangayEmpty) barangayEmpty.classList.add('hidden');
    if (barangayList) barangayList.classList.remove('hidden');

    let html = '';
    
    filteredBarangays.forEach(barangay => {
        const hasContact = barangay.contact_number || barangay.contact_person || barangay.email;
        
        html += `
            <div class="p-4 border-b border-gray-200 barangay-item">
                <div class="flex flex-col gap-3">
                    <div class="flex items-start justify-between">
                        <div>
                            <h3 class="font-semibold text-gray-900">${barangay.baranggay || 'Unknown Barangay'}</h3>
                        </div>
                        <div class="flex flex-col items-end">
                            <span class="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                                ID: ${barangay.baranggay_id || 'N/A'}
                            </span>
                        </div>
                    </div>
                    
                    ${hasContact ? `
                        <div class="mt-2 pt-3 border-t border-gray-100">
                            <div class="flex flex-col gap-2">
                                ${barangay.contact_person ? `
                                    <div class="flex items-center gap-2">
                                        <div class="w-6 h-6 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                                            <i class="fas fa-user text-blue-600 text-xs"></i>
                                        </div>
                                        <span class="text-sm text-gray-700">${barangay.contact_person}</span>
                                    </div>
                                ` : ''}
                                
                                ${barangay.contact_number ? `
                                    <div class="flex items-center gap-2">
                                        <div class="w-6 h-6 bg-green-100 rounded flex items-center justify-center flex-shrink-0">
                                            <i class="fas fa-phone text-green-600 text-xs"></i>
                                        </div>
                                        <span class="text-sm text-gray-700">${barangay.contact_number}</span>
                                        ${barangay.contact_number.match(/\d{10,}/) ? `
                                            <button class="ml-2 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors call-btn" data-number="${barangay.contact_number}">
                                                <i class="fas fa-phone mr-1"></i>Call
                                            </button>
                                        ` : ''}
                                    </div>
                                ` : ''}
                                
                                ${barangay.email ? `
                                    <div class="flex items-center gap-2">
                                        <div class="w-6 h-6 bg-yellow-100 rounded flex items-center justify-center flex-shrink-0">
                                            <i class="fas fa-envelope text-yellow-600 text-xs"></i>
                                        </div>
                                        <span class="text-sm text-blue-600">${barangay.email}</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    ` : `
                        <div class="mt-2 pt-3 border-t border-gray-100">
                            <div class="flex items-center justify-center p-2 bg-gray-50 rounded">
                                <span class="text-sm text-gray-500">
                                    <i class="fas fa-info-circle mr-1"></i>
                                    No contact information available
                                </span>
                            </div>
                        </div>
                    `}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Add event listeners to call buttons
    container.querySelectorAll('.call-btn').forEach(button => {
        button.addEventListener('click', function() {
            const barangayItem = this.closest('.barangay-item');
            const barangayName = barangayItem.querySelector('h3')?.textContent || 'Barangay';
            const municipalityElement = barangayItem.querySelector('.text-sm.text-gray-600');
            const municipality = municipalityElement ? municipalityElement.textContent.split('•')[0].trim() : 'Location';
            const phoneNumber = this.getAttribute('data-number');
            
            if (confirm(`Call ${barangayName} in ${municipality}? This will open your phone dialer.`)) {
                alert(`Calling ${barangayName} at ${phoneNumber}...`);
                // In a real app, this would initiate a phone call
                // window.location.href = `tel:${phoneNumber}`;
            }
        });
    });
}

// Apply Barangay tab filters (per-barangay selection; dropdown is scoped by district tab)
function filterBarangays() {
    const selectedId = barangayContactFilter ? barangayContactFilter.value : '';

    if (!selectedId) {
        filteredBarangays = [];
        renderBarangayList();
        return;
    }

    filteredBarangays = barangaysForActiveDistrict().filter(b => String(b.baranggay_id) === selectedId);

    const searchTerm = barangaySearch ? barangaySearch.value.toLowerCase().trim() : '';
    if (searchTerm && filteredBarangays.length > 0) {
        const b = filteredBarangays[0];
        const municipalityName = (b.municipality || '').toLowerCase();
        const haystack = [
            b.baranggay,
            b.contact_person,
            b.contact_number,
            b.email,
            municipalityName
        ].filter(Boolean).join(' ').toLowerCase();

        if (!haystack.includes(searchTerm)) {
            filteredBarangays = [];
        }
    }

    renderBarangayList();
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
    });
}

// Barangay tab states
function showBarangayLoading() {
    if (barangayToolbar) barangayToolbar.classList.add('hidden');
    if (barangayLoading) barangayLoading.classList.remove('hidden');
    if (barangayError) barangayError.classList.add('hidden');
    if (barangayList) barangayList.classList.add('hidden');
    if (barangayEmpty) barangayEmpty.classList.add('hidden');
}

function showBarangayError(message) {
    if (barangayToolbar) barangayToolbar.classList.add('hidden');
    if (barangayLoading) barangayLoading.classList.add('hidden');
    if (barangayError) barangayError.classList.remove('hidden');
    if (barangayList) barangayList.classList.add('hidden');
    if (barangayEmpty) barangayEmpty.classList.add('hidden');
    if (barangayErrorMessage) barangayErrorMessage.textContent = message || 'Failed to load barangay information';
}

function showBarangayList() {
    if (barangayToolbar) barangayToolbar.classList.remove('hidden');
    if (barangayLoading) barangayLoading.classList.add('hidden');
    if (barangayError) barangayError.classList.add('hidden');
    if (barangayList) barangayList.classList.remove('hidden');
    if (barangayEmpty) barangayEmpty.classList.add('hidden');
    renderBarangayList();
}

// Main tab functionality
function switchTab(tabName) {
    const districtBar = document.getElementById('district-tabs-bar');
    if (districtBar) {
        districtBar.classList.toggle('hidden', tabName === 'barangay');
    }

    // Update active main tab
    mainTabs.forEach(tab => {
        tab.classList.remove('active', 'border-blue-600', 'text-blue-600');
        tab.classList.add('text-gray-600');
    });
    
    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeTab) {
        activeTab.classList.add('active', 'border-blue-600', 'text-blue-600');
        activeTab.classList.remove('text-gray-600');
    }
    
    // Show corresponding content
    tabContents.forEach(content => {
        content.classList.add('hidden');
    });
    
    const activeContent = document.getElementById(`${tabName}-tab`);
    if (activeContent) {
        activeContent.classList.remove('hidden');
    }

    if (tabName === 'ldrrmo') {
        setLdrrmoView(activeLdrrmoView);
    }

    // If switching to barangay tab and data hasn't been loaded, fetch it
    if (tabName === 'barangay' && barangays.length === 0) {
        fetchBarangays();
    } else if (tabName === 'barangay' && barangays.length > 0) {
        populateBarangayContactFilter();
        filterBarangays();
    }
}

// District tabs: shared strip above LDRRMO / Barangay panels
function setupDistrictTabs() {
    districtTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const districtId = tab.getAttribute('data-district');
            if (!districtId) {
                return;
            }

            activeDistrictId = districtId;

            districtTabs.forEach(t => {
                t.classList.remove('active', 'border-blue-600', 'text-blue-600');
                t.classList.add('text-gray-600');
            });
            tab.classList.add('active', 'border-blue-600', 'text-blue-600');
            tab.classList.remove('text-gray-600');

            districtContents.forEach(content => {
                content.classList.add('hidden');
            });
            const districtContent = document.getElementById(`district-${districtId}`);
            if (districtContent) {
                districtContent.classList.remove('hidden');
            }

            onDistrictChange();
        });
    });
}

// Call functionality for LDRRMO contacts
function setupCallButtons() {
    document.addEventListener('click', function(event) {
        if (event.target.closest('.call-btn')) {
            const button = event.target.closest('.call-btn');
            const contactItem = button.closest('.contact-item, .barangay-item');
            
            if (contactItem) {
                const contactName = contactItem.querySelector('h3')?.textContent || 'Contact';
                const locationElement = contactItem.querySelector('p') || contactItem.querySelector('.text-gray-600');
                const location = locationElement?.textContent || 'Location';
                const phoneNumber = button.getAttribute('data-number');
                
                if (confirm(`Call ${contactName} in ${location}? This will open your phone dialer.`)) {
                    alert(`Calling ${contactName} at ${phoneNumber}...`);
                    // In a real app, this would initiate a phone call
                    // window.location.href = `tel:${phoneNumber}`;
                }
            }
        }
    });
}

// Sidebar functionality
function setupSidebar() {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');
    const closeSidebar = document.getElementById('closeSidebar');

    function openSidebar() {
        if (sidebar) sidebar.classList.remove('-translate-x-full');
    }

    function closeSidebarFunc() {
        if (sidebar) sidebar.classList.add('-translate-x-full');
    }

    if (menuToggle) menuToggle.addEventListener('click', openSidebar);
    if (closeSidebar) closeSidebar.addEventListener('click', closeSidebarFunc);

    // Close sidebar when clicking outside
    document.addEventListener('click', (event) => {
        if (!sidebar) return;
        
        const isClickInsideSidebar = sidebar.contains(event.target);
        const isClickOnMenuToggle = (menuToggle && menuToggle.contains(event.target));
        
        if (!isClickInsideSidebar && !isClickOnMenuToggle && !sidebar.classList.contains('-translate-x-full')) {
            closeSidebarFunc();
        }
    });
}

// Barangay tab event listeners
function setupBarangayTabListeners() {
    if (barangaySearch) {
        barangaySearch.addEventListener('input', filterBarangays);
    }

    if (municipalityFilter) {
        municipalityFilter.addEventListener('change', filterBarangays);
    }

    if (barangayContactFilter) {
        barangayContactFilter.addEventListener('change', filterBarangays);
    }

    if (barangayRetryBtn) {
        barangayRetryBtn.addEventListener('click', fetchBarangays);
    }
}

// Main tab event listeners
function setupMainTabListeners() {
    mainTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('userData');
        localStorage.removeItem('userRole');
        localStorage.removeItem('csrf_token');
        window.location.href = '../index.html';
    }
}

// Setup event listeners for logout
function setupLogoutListener() {
    const sidebarLogoutBtn = document.querySelector('a[href="../index.html"]');
    if (sidebarLogoutBtn) {
        sidebarLogoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
}

// Initialize everything
function initialize() {
    // Initialize DOM elements
    initializeElements();
    
    // Setup all functionality
    loadUserData();
    setupSidebar();
    setupDistrictTabs();
    setupLdrrmoSubtabs();
    setupCallButtons();
    setupBarangayTabListeners();
    setupMainTabListeners();
    setupLogoutListener();
    
    // Default to LDRRMO tab
    switchTab('ldrrmo');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initialize);