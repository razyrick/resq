// API Configuration
const API_BASE_URL = 'https://greenyellow-hawk-206191.hostingersite.com';
let userData = null;
let map, marker;
let selectedType = null;
let selectedSeverity = null;
let photoAttached = false;
let currentLatitude = null;
let currentLongitude = null;

// Cloudinary Configuration
const CLOUDINARY_CLOUD_NAME = 'dgwp7j5l3';
const CLOUDINARY_UPLOAD_PRESET = 'resq-laguna';
let cloudinaryWidget = null;

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

// Load user data
function loadUserData() {
    const storedData = getStoredUserData();
    if (storedData && storedData.user) {
        userData = storedData.user;
        document.getElementById('sidebarUserName').textContent = `${userData.first_name || ''} ${userData.last_name || ''}`;
        document.getElementById('sidebarUserEmail').textContent = userData.email || '';
    }
}

// Initialize map
function initMap() {
    map = L.map('reportMap').setView([14.2769, 121.4164], 15);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add draggable marker
    marker = L.marker([14.2769, 121.4164], { draggable: true }).addTo(map);
    
    marker.on('dragend', function(e) {
        const position = marker.getLatLng();
        currentLatitude = position.lat;
        currentLongitude = position.lng;
        updateAddress(position.lat, position.lng);
    });

    // Try to get user's location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            currentLatitude = lat;
            currentLongitude = lng;
            map.setView([lat, lng], 15);
            marker.setLatLng([lat, lng]);
            updateAddress(lat, lng);
        });
    }
}

function updateAddress(lat, lng) {
    // In a real app, use reverse geocoding API
    document.getElementById('address').value = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
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

// Incident type selection
document.querySelectorAll('.incident-icon').forEach(button => {
    button.addEventListener('click', function() {
        document.querySelectorAll('.incident-icon').forEach(btn => {
            btn.classList.remove('bg-blue-600', 'text-white', 'border-blue-600');
            btn.classList.add('border-gray-200');
            
            // Reset icon colors
            const icon = btn.querySelector('i');
            if (icon.classList.contains('fa-water')) icon.classList.add('text-blue-600');
            if (icon.classList.contains('fa-fire')) icon.classList.add('text-red-600');
            if (icon.classList.contains('fa-heartbeat')) icon.classList.add('text-green-600');
            if (icon.classList.contains('fa-car-crash')) icon.classList.add('text-yellow-600');
            if (icon.classList.contains('fa-shield-alt')) icon.classList.add('text-purple-600');
            if (icon.classList.contains('fa-mountain')) icon.classList.add('text-orange-600');
            if (icon.classList.contains('fa-bolt')) icon.classList.add('text-gray-600');
            if (icon.classList.contains('fa-ellipsis-h')) icon.classList.add('text-gray-600');
        });
        
        this.classList.add('bg-blue-600', 'text-white', 'border-blue-600');
        this.classList.remove('border-gray-200');
        
        // Make icon white when selected
        const icon = this.querySelector('i');
        icon.classList.remove('text-blue-600', 'text-red-600', 'text-green-600', 'text-yellow-600', 'text-purple-600', 'text-orange-600', 'text-gray-600');
        icon.classList.add('text-white');
        
        selectedType = this.dataset.type;
        document.getElementById('incidentType').value = selectedType;
    });
});

// Severity selection
document.querySelectorAll('.severity-option').forEach(button => {
    button.addEventListener('click', function() {
        document.querySelectorAll('.severity-option').forEach(btn => {
            btn.classList.remove('border-blue-500', 'ring-2', 'ring-blue-200');
        });
        
        this.classList.add('border-blue-500', 'ring-2', 'ring-blue-200');
        selectedSeverity = this.dataset.severity;
        document.getElementById('severity').value = selectedSeverity;
    });
});

// Character counter
document.getElementById('description').addEventListener('input', function() {
    const count = this.value.length;
    document.getElementById('charCount').textContent = count;
    if (count > 500) {
        this.value = this.value.substring(0, 500);
        document.getElementById('charCount').textContent = 500;
    }
});

// Initialize Cloudinary Upload Widget
function initializeCloudinaryWidget() {
    cloudinaryWidget = cloudinary.createUploadWidget({
        cloudName: CLOUDINARY_CLOUD_NAME,
        uploadPreset: CLOUDINARY_UPLOAD_PRESET,
        sources: ['local', 'camera', 'url'],
        multiple: false,
        maxFileSize: 5000000, // 5MB
        clientAllowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        maxImageWidth: 2000,
        maxImageHeight: 2000,
        theme: 'minimal',
        styles: {
            palette: {
                window: "#FFFFFF",
                windowBorder: "#90A0B3",
                tabIcon: "#0078FF",
                menuIcons: "#5A616A",
                textDark: "#000000",
                textLight: "#FFFFFF",
                link: "#0078FF",
                action: "#FF620C",
                inactiveTabIcon: "#0E2F5A",
                error: "#F44235",
                inProgress: "#0078FF",
                complete: "#20B832",
                sourceBg: "#E4EBF1"
            }
        }
    }, (error, result) => {
        if (!error && result && result.event === "success") {
            // Photo uploaded successfully
            const imageUrl = result.info.secure_url;
            
            // Display the uploaded photo
            document.getElementById('cameraPreview').src = imageUrl;
            document.getElementById('cameraPreview').classList.remove('hidden');
            document.getElementById('cameraPlaceholder').classList.add('hidden');
            document.getElementById('removePhotoBtn').classList.remove('hidden');
            document.getElementById('photoInput').value = imageUrl; // Store the URL in hidden input
            photoAttached = true;
            
            // Show success message
            Swal.fire({
                icon: 'success',
                title: 'Photo Uploaded',
                text: 'Photo has been uploaded successfully!',
                timer: 2000,
                showConfirmButton: false
            });
        }
        
        if (error) {
            console.error('Cloudinary upload error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Upload Failed',
                text: 'Failed to upload photo. Please try again.',
                confirmButtonColor: '#ef4444'
            });
        }
    });
}

// Photo handling
document.getElementById('takePhotoBtn').addEventListener('click', function() {
    // Open Cloudinary widget instead of file input
    if (cloudinaryWidget) {
        cloudinaryWidget.open();
    } else {
        // Fallback to file input if Cloudinary not initialized
        document.getElementById('photoInputFile').click();
    }
});

// Fallback file input for browsers without Cloudinary support
document.getElementById('photoInputFile').addEventListener('change', function(e) {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        
        // Check file size (max 5MB)
        if (file.size > 5000000) {
            Swal.fire({
                icon: 'error',
                title: 'File Too Large',
                text: 'File size must be less than 5MB',
                confirmButtonColor: '#ef4444'
            });
            this.value = '';
            return;
        }
        
        // Check file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid File Type',
                text: 'Please upload a valid image file (JPEG, PNG, GIF, WebP)',
                confirmButtonColor: '#ef4444'
            });
            this.value = '';
            return;
        }
        
        // Upload to Cloudinary
        uploadToCloudinary(file);
    }
});

// Upload file to Cloudinary
async function uploadToCloudinary(file) {
    try {
        // Show loading
        const loadingSwal = Swal.fire({
            title: 'Uploading...',
            text: 'Please wait while we upload your photo',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Create FormData
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);
        
        // Upload to Cloudinary
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`Upload failed with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Close loading
        await loadingSwal.close();
        
        // Display the uploaded photo
        document.getElementById('cameraPreview').src = data.secure_url;
        document.getElementById('cameraPreview').classList.remove('hidden');
        document.getElementById('cameraPlaceholder').classList.add('hidden');
        document.getElementById('removePhotoBtn').classList.remove('hidden');
        document.getElementById('photoInput').value = data.secure_url; // Store the URL in hidden input
        photoAttached = true;
        
        // Show success message
        Swal.fire({
            icon: 'success',
            title: 'Photo Uploaded',
            text: 'Photo has been uploaded successfully!',
            timer: 2000,
            showConfirmButton: false
        });
        
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        Swal.fire({
            icon: 'error',
            title: 'Upload Failed',
            text: 'Failed to upload photo. Please try again.',
            confirmButtonColor: '#ef4444'
        });
    }
}

document.getElementById('removePhotoBtn').addEventListener('click', function() {
    document.getElementById('cameraPreview').src = '';
    document.getElementById('cameraPreview').classList.add('hidden');
    document.getElementById('cameraPlaceholder').classList.remove('hidden');
    document.getElementById('photoInput').value = '';
    document.getElementById('photoInputFile').value = '';
    this.classList.add('hidden');
    photoAttached = false;
});

// Submit report to API
async function submitReport(reportData) {
    try {
        const response = await fetch(`${API_BASE_URL}/user/incident`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(reportData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error submitting report:', error);
        throw error;
    }
}

// Form submission
document.getElementById('reportForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    // Validation
    if (!selectedType) {
        Swal.fire({
            icon: 'error',
            title: 'Validation Error',
            text: 'Please select an incident type',
            confirmButtonColor: '#2563eb'
        });
        return;
    }

    if (!selectedSeverity) {
        Swal.fire({
            icon: 'error',
            title: 'Validation Error',
            text: 'Please select a severity level',
            confirmButtonColor: '#2563eb'
        });
        return;
    }

    if (!currentLatitude || !currentLongitude) {
        Swal.fire({
            icon: 'error',
            title: 'Validation Error',
            text: 'Please ensure location is set',
            confirmButtonColor: '#2563eb'
        });
        return;
    }

    const description = document.getElementById('description').value.trim();
    if (!description) {
        Swal.fire({
            icon: 'error',
            title: 'Validation Error',
            text: 'Please provide a description of the incident',
            confirmButtonColor: '#2563eb'
        });
        return;
    }

    // Show loading state
    document.getElementById('loadingOverlay').classList.remove('hidden');
    document.getElementById('submitBtn').disabled = true;

    try {
        // Prepare report data
        const reportData = {
            latitude: currentLatitude,
            longitude: currentLongitude,
            incident_type: selectedType,
            severity_level: selectedSeverity,
            description: description,
            photo: document.getElementById('photoInput').value || '' // Cloudinary URL or empty string
        };

        // Submit report
        const result = await submitReport(reportData);

        // Hide loading state
        document.getElementById('loadingOverlay').classList.add('hidden');

        if (result.success) {
            // Show success modal
            const confirmationModal = document.getElementById('confirmationModal');
            const confirmationMessage = document.getElementById('confirmationMessage');
            
            confirmationMessage.textContent = 'Your report has been successfully submitted and will be reviewed by our team.';
            confirmationModal.classList.remove('hidden');
            
            // Update confirmation message with barangay info if available
            if (result.data && result.data.baranggay_name) {
                confirmationMessage.textContent = `Your report has been successfully submitted to ${result.data.baranggay_name} and will be reviewed by our team.`;
            }
        } else {
            throw new Error(result.error || 'Failed to submit report');
        }
    } catch (error) {
        // Hide loading state
        document.getElementById('loadingOverlay').classList.add('hidden');
        document.getElementById('submitBtn').disabled = false;
        
        // Show error message
        Swal.fire({
            icon: 'error',
            title: 'Submission Failed',
            text: error.message,
            confirmButtonColor: '#ef4444'
        });
    }
});

// Mesh status simulation
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

// Logout function
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
            // Clear local storage
            localStorage.removeItem('userData');
            localStorage.removeItem('userRole');
            localStorage.removeItem('csrf_token');
            
            // Redirect to login page
            window.location.href = '../index.html';
        }
    });
}

// Event listeners for logout
// document.getElementById('sidebarLogoutBtn').addEventListener('click', logout);

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    updateMeshStatus();
    updateOnlineStatus();
    loadUserData();
    initializeCloudinaryWidget();
    setInterval(updateMeshStatus, 5000);
});

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);