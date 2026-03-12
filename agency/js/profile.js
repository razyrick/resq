// API Configuration
const API_BASE_URL = 'https://greenyellow-hawk-206191.hostingersite.com';
let userProfile = null;
let agencies = [];

// Cloudinary Configuration (use the same as user side)
const CLOUDINARY_CLOUD_NAME = 'dgwp7j5l3'; 
const CLOUDINARY_UPLOAD_PRESET = 'resq-profile'; 
let cloudinaryWidget = null;
let newProfilePhotoUrl = null;

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

// Load user profile from API
async function loadUserProfile() {
    showLoading();
    try {
        const storedData = getStoredUserData();
        if (!storedData) {
            throw new Error('No user data found. Please login again.');
        }

        // Get user profile from API
        const response = await apiRequest('/agency/profile');
        
        if (response.success) {
            userProfile = response.data;
            console.log('User Profile loaded:', userProfile);
            
            updateUserInfo();

            // Load agencies list for the modal dropdown
            await loadAgencies();
            
            // Check if user has agency data
            if (userProfile.agency_id) {
                displayAgencyInfo(userProfile);
                document.getElementById('agencyInfoSection').classList.remove('hidden');
                document.getElementById('noAgencyState').classList.add('hidden');
            } else {
                showNoAgencyState();
            }
            
            showContent();
        } else {
            throw new Error(response.error || 'Failed to load user profile');
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
        showError('Failed to load profile: ' + error.message);
    }
}

// Load agencies list for dropdown
async function loadAgencies() {
    try {
        const data = await apiRequest('/agency/agencies');
        
        if (data.success && data.data) {
            agencies = data.data;
        } else {
            throw new Error(data.error || 'Failed to load agencies');
        }
    } catch (error) {
        console.error('Error loading agencies:', error);
        agencies = [];
    }
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
            const modalUserPhotoPreview = document.getElementById('modalUserPhotoPreview');
            const modalUserAvatarImg = document.getElementById('modalUserAvatarImg');
            const modalUserAvatar = document.getElementById('modalUserAvatar');
            
            if (modalUserPhotoPreview && modalUserAvatarImg && modalUserAvatar) {
                modalUserPhotoPreview.src = imageUrl;
                modalUserPhotoPreview.classList.remove('hidden');
                modalUserAvatarImg.classList.add('hidden');
                modalUserAvatar.classList.add('hidden');
            }
            
            // Show success message
            Swal.fire({
                icon: 'success',
                title: 'Photo Uploaded',
                text: 'Profile photo has been uploaded successfully! Click "Save Changes" to update your profile.',
                timer: 3000,
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
    } else {
        console.error('Cloudinary widget not initialized');
        Swal.fire({
            icon: 'error',
            title: 'Upload Error',
            text: 'Photo upload is not available at the moment. Please try again later.',
            confirmButtonColor: '#ef4444'
        });
    }
}

// Display agency information - now using userProfile data directly
function displayAgencyInfo(profile) {
    // Update header
    document.getElementById('agencyName').textContent = profile.agency;
    document.getElementById('agencyType').textContent = getAgencyTypeDisplay(profile.agency_type);
    document.getElementById('agencyStatus').textContent = (profile.agency_status || 'active').charAt(0).toUpperCase() + (profile.agency_status || 'active').slice(1);
    document.getElementById('agencyId').textContent = profile.agency_id;
    document.getElementById('agencyAvatar').textContent = getAgencyInitials(profile.agency_name || 'Agency');

    // Update basic info
    document.getElementById('infoAgencyName').textContent = profile.agency;
    document.getElementById('infoAgencyType').textContent = getAgencyTypeDisplay(profile.agency_type);
    document.getElementById('infoAgencyId').textContent = profile.agency_id;
    document.getElementById('infoContactPerson').textContent = profile.contact_person || 'Not specified';
    document.getElementById('infoAddress').textContent = profile.agency_address || 'Not specified';

    // Update contact info
    document.getElementById('infoEmail').textContent = profile.agency_email || 'Not specified';
    document.getElementById('infoPhone').textContent = profile.agency_phone || 'Not specified';
    document.getElementById('infoHotline').textContent = profile.agency_phone || 'Not specified';
    document.getElementById('infoUnits').textContent = (profile.number_of_units || '0') + ' units';

    // Update timeline
    document.getElementById('infoCreatedAt').textContent = formatDate(profile.agency_created_at);
    document.getElementById('infoUpdatedAt').textContent = formatDate(profile.agency_updated_at);
}

// Show no agency state
function showNoAgencyState() {
    document.getElementById('agencyInfoSection').classList.add('hidden');
    document.getElementById('noAgencyState').classList.remove('hidden');
}

// Edit User Profile Modal
function editUserProfile() {
    if (!userProfile) return;
    
    // Populate modal with current user data
    document.getElementById('modalFirstName').value = userProfile.first_name || '';
    document.getElementById('modalLastName').value = userProfile.last_name || '';
    document.getElementById('modalMiddleName').value = userProfile.middle_name || '';
    document.getElementById('modalUserEmail').value = userProfile.email || '';
    document.getElementById('modalUserPhone').value = userProfile.phone || '';
    
    // Set modal user avatar - check if profile photo exists
    const modalUserAvatar = document.getElementById('modalUserAvatar');
    const modalUserAvatarImg = document.getElementById('modalUserAvatarImg');
    const modalUserPhotoPreview = document.getElementById('modalUserPhotoPreview');
    const initials = getInitials(userProfile.first_name, userProfile.last_name);
    
    // Get profile photo URL - check both possible field names
    const profilePhotoUrl = userProfile.profile || userProfile.profile_photo || '';
    
    if (profilePhotoUrl && profilePhotoUrl.trim() !== '') {
        // Show existing profile photo
        if (modalUserAvatarImg) {
            modalUserAvatarImg.src = profilePhotoUrl;
            modalUserAvatarImg.classList.remove('hidden');
        }
        if (modalUserAvatar) {
            modalUserAvatar.classList.add('hidden');
        }
        // Set preview with existing photo
        if (modalUserPhotoPreview) {
            modalUserPhotoPreview.src = profilePhotoUrl;
            modalUserPhotoPreview.classList.add('hidden');
        }
    } else {
        // Show initials
        if (modalUserAvatar) {
            modalUserAvatar.textContent = initials;
            modalUserAvatar.classList.remove('hidden');
        }
        if (modalUserAvatarImg) {
            modalUserAvatarImg.classList.add('hidden');
        }
        if (modalUserPhotoPreview) {
            modalUserPhotoPreview.classList.add('hidden');
        }
    }
    
    // Populate agency dropdown in modal
    const agencySelect = document.getElementById('modalUserAgency');
    agencySelect.innerHTML = '<option value="">Select an agency...</option>';
    agencies.forEach(agency => {
        const option = document.createElement('option');
        option.value = agency.agency_id;
        option.textContent = agency.agency;
        if (userProfile.agency_id === agency.agency_id) {
            option.selected = true;
        }
        agencySelect.appendChild(option);
    });
    
    document.getElementById('editUserProfileModal').classList.remove('hidden');
}

function closeUserModal() {
    document.getElementById('editUserProfileModal').classList.add('hidden');
}

// Save user profile to API
async function saveUserProfile() {
    try {
        const updateData = {
            first_name: document.getElementById('modalFirstName').value,
            last_name: document.getElementById('modalLastName').value,
            middle_name: document.getElementById('modalMiddleName').value || '',
            email: document.getElementById('modalUserEmail').value,
            phone: document.getElementById('modalUserPhone').value,
            agency_id: document.getElementById('modalUserAgency').value,
            profile: newProfilePhotoUrl || userProfile.profile || '' // Always include profile field
        };

        console.log('Sending update data:', updateData); // Debug log

        // Validate required fields
        if (!updateData.first_name || !updateData.last_name || !updateData.email || !updateData.phone || !updateData.agency_id) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Information',
                text: 'Please fill in all required fields including agency.',
                confirmButtonColor: '#f59e0b'
            });
            return;
        }

        const response = await apiRequest('/agency/profile', {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });

        if (response.success) {
            // Update local user profile
            userProfile = response.data;
            
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
            
            updateUserInfo();
            
            // Reload the page to get updated agency details
            await loadUserProfile();
            
            Swal.fire({
                icon: 'success',
                title: 'Profile Updated!',
                text: 'Your profile has been updated successfully.',
                confirmButtonColor: '#2563eb',
                timer: 2000,
                showConfirmButton: false
            });
            
            closeUserModal();
        } else {
            throw new Error(response.error || 'Failed to update user profile');
        }
    } catch (error) {
        console.error('Error saving user profile:', error);
        Swal.fire({
            icon: 'error',
            title: 'Update Failed',
            text: 'Failed to update profile: ' + error.message,
            confirmButtonColor: '#ef4444'
        });
    }
}

// Helper functions
function getAgencyTypeDisplay(type) {
    const types = {
        'fire': 'Fire Department',
        'police': 'Police Station',
        'medical': 'Medical/EMS',
        'rescue': 'Rescue Team',
        'disaster': 'Disaster Management',
        'other': 'Other Agency'
    };
    return types[type] || type;
}

function getAgencyInitials(agencyName) {
    if (!agencyName) return 'AG';
    return agencyName.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
}

function formatDate(dateString) {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Update user info in header and profile
function updateUserInfo() {
    if (userProfile) {
        const fullName = `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim();
        const initials = getInitials(userProfile.first_name, userProfile.last_name);
        
        console.log('Updating user info with profile:', userProfile); // Debug log
        
        document.getElementById('userName').textContent = fullName || 'User';
        document.getElementById('userRole').textContent = 'Agency Administrator';
        document.getElementById('displayUserName').textContent = fullName || 'User';
        document.getElementById('displayUserEmail').textContent = userProfile.email || 'No email';
        document.getElementById('displayUserPhone').textContent = userProfile.phone || 'No phone';
        
        // Update agency name - use agency_name from profile
        const agencyName = userProfile.agency_name || 'No agency assigned';
        document.getElementById('userAgency').textContent = agencyName;
        document.getElementById('memberSince').textContent = `Member since ${new Date(userProfile.created_at).getFullYear()}`;
        
        // Update user avatar with photo or initials
        const userInitials = document.getElementById('userInitials');
        const userProfileImage = document.getElementById('userProfileImage');
        const userAvatar = document.getElementById('userAvatar');
        const userAvatarImg = document.getElementById('userAvatarImg');
        
        // Check if profile photo exists - handle different possible field names
        const profilePhotoUrl = userProfile.profile || userProfile.profile_photo || '';
        
        if (profilePhotoUrl && profilePhotoUrl.trim() !== '') {
            console.log('Profile photo URL found:', profilePhotoUrl); // Debug log
            
            // Show photo in navbar
            if (userProfileImage) {
                userProfileImage.src = profilePhotoUrl;
                userProfileImage.classList.remove('hidden');
                console.log('Set navbar image src to:', profilePhotoUrl);
            }
            if (userInitials) {
                userInitials.classList.add('hidden');
            }
            
            // Show photo in main profile section
            if (userAvatarImg) {
                userAvatarImg.src = profilePhotoUrl;
                userAvatarImg.classList.remove('hidden');
                console.log('Set main profile image src to:', profilePhotoUrl);
            }
            if (userAvatar) {
                userAvatar.classList.add('hidden');
            }
        } else {
            console.log('No profile photo found, showing initials'); // Debug log
            
            // Show initials in navbar
            if (userInitials) {
                userInitials.textContent = initials;
                userInitials.classList.remove('hidden');
            }
            if (userProfileImage) {
                userProfileImage.classList.add('hidden');
            }
            
            // Show initials in main profile section
            if (userAvatar) {
                userAvatar.textContent = initials;
                userAvatar.classList.remove('hidden');
            }
            if (userAvatarImg) {
                userAvatarImg.classList.add('hidden');
            }
        }
    }
}

function getInitials(firstName, lastName) {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last || 'U';
}

function toggleNotifications() {
    const panel = document.getElementById('notificationsPanel');
    panel.classList.toggle('hidden');
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
            localStorage.clear();
            window.location.href = '../index.html';
        }
    });
}

// UI Helper Functions
function showLoading() {
    document.getElementById('loadingState').classList.remove('hidden');
    document.getElementById('profileContent').classList.add('hidden');
    document.getElementById('errorState').classList.add('hidden');
}

function showContent() {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('profileContent').classList.remove('hidden');
    document.getElementById('errorState').classList.add('hidden');
}

function showError(message) {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('profileContent').classList.add('hidden');
    document.getElementById('errorState').classList.remove('hidden');
    document.getElementById('errorMessage').textContent = message;
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Cloudinary widget
    initializeCloudinaryWidget();
    
    // Add event listener for change photo button
    const changePhotoBtn = document.getElementById('changePhotoBtn');
    if (changePhotoBtn) {
        changePhotoBtn.addEventListener('click', changeProfilePhoto);
    }
    
    loadUserProfile();
});

// Close notifications when clicking outside
document.addEventListener('click', function(e) {
    const panel = document.getElementById('notificationsPanel');
    const button = e.target.closest('button[onclick="toggleNotifications()"]');
    if (!panel.contains(e.target) && !button) {
        panel.classList.add('hidden');
    }
});

// Close modal when clicking outside
const editUserProfileModal = document.getElementById('editUserProfileModal');
if (editUserProfileModal) {
    editUserProfileModal.addEventListener('click', (e) => {
        if (e.target === editUserProfileModal) {
            closeUserModal();
        }
    });
}

// Escape key to close modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const editModal = document.getElementById('editUserProfileModal');
        if (editModal && !editModal.classList.contains('hidden')) {
            closeUserModal();
        }
        const notificationsPanel = document.getElementById('notificationsPanel');
        if (notificationsPanel && !notificationsPanel.classList.contains('hidden')) {
            notificationsPanel.classList.add('hidden');
        }
    }
});