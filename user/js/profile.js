// API Configuration
const API_BASE_URL = 'https://greenyellow-hawk-206191.hostingersite.com';
let userData = null;
let barangays = [];

// Cloudinary Configuration
const CLOUDINARY_CLOUD_NAME = 'dgwp7j5l3'; 
const CLOUDINARY_UPLOAD_PRESET = 'resq-profile'; 
let cloudinaryWidget = null;
let newProfilePhotoUrl = null;

// DOM Elements
const editProfileModal = document.getElementById('editProfileModal');
const editProfileBtn = document.getElementById('editProfileBtn');
const closeModal = document.getElementById('closeModal');
const cancelEdit = document.getElementById('cancelEdit');
const saveProfile = document.getElementById('saveProfile');
const changePhotoBtn = document.getElementById('changePhotoBtn');
const loadingState = document.getElementById('loadingState');
const profileContent = document.getElementById('profileContent');
const errorState = document.getElementById('errorState');
const retryButton = document.getElementById('retryButton');

// Profile photo elements
const currentProfilePhoto = document.getElementById('currentProfilePhoto');
const profilePhotoPreview = document.getElementById('profilePhotoPreview');

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

// Fetch user profile
async function fetchUserProfile() {
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE_URL}/user/profile`, {
            method: 'GET',
            headers: getHeaders()
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
            userData = data.data;
            loadUserData();
            showContent();
            
            // Fetch barangays after profile is loaded
            await fetchBarangays();
        } else {
            throw new Error(data.error || 'Failed to load profile');
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
        showError(error.message);
    }
}

// Fetch barangays
async function fetchBarangays() {
    try {
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
            populateBarangayDropdown();
        }
    } catch (error) {
        console.error('Error fetching barangays:', error);
    }
}

// Update user profile
async function updateUserProfile(updateData) {
    try {
        const response = await fetch(`${API_BASE_URL}/user/profile`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(updateData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
            return data;
        } else {
            throw new Error(data.error || 'Failed to update profile');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
}

// Load user data to UI
function loadUserData() {
    if (!userData) return;

    // Header section
    document.getElementById('userName').textContent = `${userData.first_name} ${userData.last_name}`;
    document.getElementById('userEmail').textContent = userData.email;
    document.getElementById('memberSince').textContent = `Member since ${formatDate(userData.created_at)}`;
    
    // Sidebar
    document.getElementById('sidebarUserName').textContent = `${userData.first_name} ${userData.last_name}`;
    document.getElementById('sidebarUserEmail').textContent = userData.email;
    
    // Modal fields
    document.getElementById('modalFirstName').value = userData.first_name || '';
    document.getElementById('modalMiddleName').value = userData.middle_name || '';
    document.getElementById('modalLastName').value = userData.last_name || '';
    document.getElementById('modalUserEmail').value = userData.email || '';
    
    // Information sections
    document.getElementById('infoFirstName').textContent = userData.first_name || '-';
    document.getElementById('infoLastName').textContent = userData.last_name || '-';
    document.getElementById('infoMiddleName').textContent = userData.middle_name || '-';
    document.getElementById('infoEmail').textContent = userData.email || '-';
    document.getElementById('infoRole').textContent = userData.role || '-';
    document.getElementById('infoStatus').textContent = userData.status || '-';
    document.getElementById('infoCreatedAt').textContent = formatDateTime(userData.created_at);
    document.getElementById('infoUpdatedAt').textContent = formatDateTime(userData.updated_at);
    
    // Profile photo
    if (userData.profile) {
        currentProfilePhoto.src = userData.profile;
        currentProfilePhoto.classList.remove('hidden');
        // Also update sidebar photo if exists
        const sidebarPhoto = document.getElementById('sidebarUserImage');
        if (sidebarPhoto) {
            sidebarPhoto.src = userData.profile;
        }
    }
    
    // Google badge
    const googleBadge = document.getElementById('googleBadge');
    if (userData.google_id) {
        googleBadge.innerHTML = '<i class="fas fa-google"></i> Google Account';
    }
}

// Get barangay name from ID
function getBarangayName(barangayId) {
    if (!barangayId || !barangays.length) return null;
    const barangay = barangays.find(b => b.baranggay_id == barangayId);
    return barangay ? barangay.baranggay : null;
}

// Populate barangay dropdown
function populateBarangayDropdown() {
    const dropdown = document.getElementById('modalBarangay');
    dropdown.innerHTML = '<option value="">Select Barangay</option>';
    
    barangays.forEach(barangay => {
        const option = document.createElement('option');
        option.value = barangay.baranggay_id;
        option.textContent = barangay.baranggay;
        if (userData && userData.baranggay_id == barangay.baranggay_id) {
            option.selected = true;
        }
        dropdown.appendChild(option);
    });
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
}

// Format date and time for display
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

// Show loading state
function showLoading() {
    loadingState.classList.remove('hidden');
    profileContent.classList.add('hidden');
    errorState.classList.add('hidden');
}

// Show content
function showContent() {
    loadingState.classList.add('hidden');
    profileContent.classList.remove('hidden');
    errorState.classList.add('hidden');
}

// Show error state
function showError(message) {
    loadingState.classList.add('hidden');
    profileContent.classList.add('hidden');
    errorState.classList.remove('hidden');
    document.getElementById('errorMessage').textContent = message;
}

// Modal Functions
function openModal() {
    // Reset photo preview
    profilePhotoPreview.classList.add('hidden');
    currentProfilePhoto.classList.remove('hidden');
    newProfilePhotoUrl = null;
    
    editProfileModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeModalFunc() {
    editProfileModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// Initialize Cloudinary Upload Widget for profile photos
function initializeCloudinaryWidget() {
    cloudinaryWidget = cloudinary.createUploadWidget({
        cloudName: CLOUDINARY_CLOUD_NAME,
        uploadPreset: CLOUDINARY_UPLOAD_PRESET,
        sources: ['local', 'camera', 'url'],
        multiple: false,
        maxFileSize: 2000000, // 2MB for profile photos
        clientAllowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        maxImageWidth: 1000,
        maxImageHeight: 1000,
        cropping: true, // Enable cropping for profile photos
        croppingAspectRatio: 1, // Square aspect ratio for profile photos
        croppingShowDimensions: true,
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
            newProfilePhotoUrl = imageUrl;
            
            // Show preview of new photo
            profilePhotoPreview.src = imageUrl;
            profilePhotoPreview.classList.remove('hidden');
            currentProfilePhoto.classList.add('hidden');
            
            // Show success message
            Swal.fire({
                icon: 'success',
                title: 'Photo Uploaded',
                text: 'Profile photo has been uploaded successfully!',
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

// Change profile photo
function changeProfilePhoto() {
    if (cloudinaryWidget) {
        cloudinaryWidget.open();
    }
}

// Save profile changes with photo upload
async function saveProfileChanges() {
    const saveButton = document.getElementById('saveProfile');
    const saveButtonText = document.getElementById('saveButtonText');
    const saveButtonSpinner = document.getElementById('saveButtonSpinner');
    
    const firstName = document.getElementById('modalFirstName').value.trim();
    const middleName = document.getElementById('modalMiddleName').value.trim();
    const lastName = document.getElementById('modalLastName').value.trim();
    const baranggayId = document.getElementById('modalBarangay').value;

    // Validation
    if (!firstName || !lastName) {
        Swal.fire({
            icon: 'error',
            title: 'Validation Error',
            text: 'First name and last name are required.',
            confirmButtonColor: '#2563eb'
        });
        return;
    }

    const updateData = {
        first_name: firstName,
        last_name: lastName
    };

    if (middleName) {
        updateData.middle_name = middleName;
    }

    if (baranggayId) {
        updateData.baranggay_id = baranggayId;
    }

    // Add profile photo URL if new photo was uploaded
    if (newProfilePhotoUrl) {
        updateData.profile = newProfilePhotoUrl;
    }

    try {
        // Show loading state
        saveButton.disabled = true;
        saveButtonText.textContent = 'Saving...';
        saveButtonSpinner.classList.remove('hidden');

        const result = await updateUserProfile(updateData);
        
        if (result.success) {
            // Update local user data
            userData = result.data;
            loadUserData();
            
            // Update localStorage with new photo if exists
            if (newProfilePhotoUrl) {
                const storedUserData = getStoredUserData();
                if (storedUserData && storedUserData.user) {
                    storedUserData.user.profile = newProfilePhotoUrl;
                    localStorage.setItem('userData', JSON.stringify(storedUserData.user));
                }
            }
            
            // Reset photo variables
            newProfilePhotoUrl = null;
            
            // Show success message
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Profile updated successfully!',
                confirmButtonColor: '#10b981',
                timer: 2000,
                showConfirmButton: false
            });
            
            closeModalFunc();
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Update Failed',
            text: error.message,
            confirmButtonColor: '#ef4444'
        });
    } finally {
        // Restore button state
        saveButton.disabled = false;
        saveButtonText.textContent = 'Save Changes';
        saveButtonSpinner.classList.add('hidden');
    }
}

// Remove profile photo
function removeProfilePhoto() {
    Swal.fire({
        title: 'Remove Profile Photo?',
        text: 'Are you sure you want to remove your profile photo?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, remove it',
        cancelButtonText: 'Cancel'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const updateData = {
                    profile: '' // Empty string to remove photo
                };

                const response = await updateUserProfile(updateData);
                
                if (response.success) {
                    // Update local user data
                    userData = response.data;
                    loadUserData();
                    
                    // Update localStorage
                    const storedUserData = getStoredUserData();
                    if (storedUserData && storedUserData.user) {
                        storedUserData.user.profile = '';
                        localStorage.setItem('userData', JSON.stringify(storedUserData.user));
                    }
                    
                    // Close modal if open
                    if (!editProfileModal.classList.contains('hidden')) {
                        profilePhotoPreview.classList.add('hidden');
                        currentProfilePhoto.classList.remove('hidden');
                        newProfilePhotoUrl = null;
                    }
                    
                    Swal.fire({
                        icon: 'success',
                        title: 'Photo Removed',
                        text: 'Profile photo has been removed successfully',
                        timer: 2000,
                        showConfirmButton: false
                    });
                }
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Failed to Remove',
                    text: error.message,
                    confirmButtonColor: '#ef4444'
                });
            }
        }
    });
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

// Event Listeners
editProfileBtn.addEventListener('click', openModal);
closeModal.addEventListener('click', closeModalFunc);
cancelEdit.addEventListener('click', closeModalFunc);
saveProfile.addEventListener('click', saveProfileChanges);
changePhotoBtn.addEventListener('click', changeProfilePhoto);
retryButton.addEventListener('click', fetchUserProfile);
document.getElementById('logoutBtn').addEventListener('click', logout);
document.getElementById('sidebarLogoutBtn').addEventListener('click', logout);

// Add remove photo button listener if exists
const removePhotoBtn = document.getElementById('removePhotoBtn');
if (removePhotoBtn) {
    removePhotoBtn.addEventListener('click', removeProfilePhoto);
}

// Close modal when clicking outside
editProfileModal.addEventListener('click', (e) => {
    if (e.target === editProfileModal) {
        closeModalFunc();
    }
});

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

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    fetchUserProfile();
    initializeCloudinaryWidget();
});