// resources.js - Main functionality for Emergency Resources page

// API Configuration
const API_BASE_URL = 'https://greenyellow-hawk-206191.hostingersite.com';
let barangays = [];
let municipalities = new Set();
let filteredBarangays = [];

// DOM Elements
let mainTabs = [];
let tabContents = [];
let districtTabs = [];
let districtContents = [];
let barangaySearch, municipalityFilter, barangayLoading, barangayError, barangayErrorMessage;
let barangayRetryBtn, barangayList, barangayEmpty;

// Initialize DOM elements
function initializeElements() {
    mainTabs = document.querySelectorAll('[data-tab]');
    tabContents = document.querySelectorAll('.tab-content');
    districtTabs = document.querySelectorAll('.district-tab');
    districtContents = document.querySelectorAll('.district-content');
    
    // Barangay Tab Elements
    barangaySearch = document.getElementById('barangaySearch');
    municipalityFilter = document.getElementById('municipalityFilter');
    barangayLoading = document.getElementById('barangayLoading');
    barangayError = document.getElementById('barangayError');
    barangayErrorMessage = document.getElementById('barangayErrorMessage');
    barangayRetryBtn = document.getElementById('barangayRetryBtn');
    barangayList = document.getElementById('barangayList');
    barangayEmpty = document.getElementById('barangayEmpty');
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

// Fetch barangays from API
async function fetchBarangays() {
    try {
        showBarangayLoading();
        
        const response = await fetch(`${API_BASE_URL}/user/barangay`, {
            method: 'GET',
            headers: getHeaders()
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
            barangays = data.data;
            processBarangays();
            showBarangayList();
        } else {
            throw new Error(data.error || 'Failed to load barangays');
        }
    } catch (error) {
        console.error('Error fetching barangays:', error);
        showBarangayError(error.message);
    }
}

// Process barangay data
function processBarangays() {
    // Extract unique municipalities
    municipalities.clear();
    barangays.forEach(barangay => {
        if (barangay.municipality) {
            municipalities.add(barangay.municipality);
        }
    });
    
    // Sort municipalities alphabetically
    const sortedMunicipalities = Array.from(municipalities).sort();
    
    // Populate municipality filter
    if (municipalityFilter) {
        municipalityFilter.innerHTML = '<option value="">All Municipalities</option>';
        sortedMunicipalities.forEach(municipality => {
            const option = document.createElement('option');
            option.value = municipality;
            option.textContent = municipality;
            municipalityFilter.appendChild(option);
        });
    }
    
    // Initial filtered list
    filteredBarangays = [...barangays];
}

// Render barangay list
function renderBarangayList() {
    if (!barangayList) return;
    
    const container = barangayList.querySelector('.barangay-list');
    if (!container) return;
    
    if (filteredBarangays.length === 0) {
        barangayList.classList.add('hidden');
        if (barangayEmpty) barangayEmpty.classList.remove('hidden');
        return;
    }
    
    if (barangayEmpty) barangayEmpty.classList.add('hidden');
    
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

// Filter barangays based on search and municipality
function filterBarangays() {
    const searchTerm = barangaySearch ? barangaySearch.value.toLowerCase() : '';
    const selectedMunicipality = municipalityFilter ? municipalityFilter.value : '';
    
    filteredBarangays = barangays.filter(barangay => {
        // Filter by municipality
        if (selectedMunicipality && barangay.municipality !== selectedMunicipality) {
            return false;
        }
        
        // Filter by search term
        if (searchTerm) {
            const barangayName = (barangay.baranggay || '').toLowerCase();
            const municipalityName = (barangay.municipality || '').toLowerCase();
            const contactPerson = (barangay.contact_person || '').toLowerCase();
            
            return barangayName.includes(searchTerm) || 
                   municipalityName.includes(searchTerm) || 
                   contactPerson.includes(searchTerm);
        }
        
        return true;
    });
    
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
    if (barangayLoading) barangayLoading.classList.remove('hidden');
    if (barangayError) barangayError.classList.add('hidden');
    if (barangayList) barangayList.classList.add('hidden');
    if (barangayEmpty) barangayEmpty.classList.add('hidden');
}

function showBarangayError(message) {
    if (barangayLoading) barangayLoading.classList.add('hidden');
    if (barangayError) barangayError.classList.remove('hidden');
    if (barangayList) barangayList.classList.add('hidden');
    if (barangayEmpty) barangayEmpty.classList.add('hidden');
    if (barangayErrorMessage) barangayErrorMessage.textContent = message || 'Failed to load barangay information';
}

function showBarangayList() {
    if (barangayLoading) barangayLoading.classList.add('hidden');
    if (barangayError) barangayError.classList.add('hidden');
    if (barangayList) barangayList.classList.remove('hidden');
    if (barangayEmpty) barangayEmpty.classList.add('hidden');
    renderBarangayList();
}

// Main tab functionality
function switchTab(tabName) {
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
    
    // If switching to barangay tab and data hasn't been loaded, fetch it
    if (tabName === 'barangay' && barangays.length === 0) {
        fetchBarangays();
    }
}

// District tab functionality
function setupDistrictTabs() {
    districtTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const districtId = tab.getAttribute('data-district');
            
            // Update active district tab
            districtTabs.forEach(t => {
                t.classList.remove('active', 'border-blue-600', 'text-blue-600');
                t.classList.add('text-gray-600');
            });
            tab.classList.add('active', 'border-blue-600', 'text-blue-600');
            tab.classList.remove('text-gray-600');
            
            // Show corresponding content
            districtContents.forEach(content => {
                content.classList.add('hidden');
            });
            const districtContent = document.getElementById(`district-${districtId}`);
            if (districtContent) {
                districtContent.classList.remove('hidden');
            }
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
    setupCallButtons();
    setupBarangayTabListeners();
    setupMainTabListeners();
    setupLogoutListener();
    
    // Default to LDRRMO tab
    switchTab('ldrrmo');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initialize);