// API Configuration
const API_BASE_URL = 'https://greenyellow-hawk-206191.hostingersite.com';
let userData = null;
let notifications = [];

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
        document.getElementById('sidebarUserName').textContent = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'User';
        document.getElementById('sidebarUserEmail').textContent = userData.email || 'Verified Citizen';
    }
}

// Get notification type styling
function getNotificationStyle(type) {
    const styles = {
        'incident': { border: 'border-red-600', bg: 'bg-red-100', icon: 'fa-exclamation-triangle', iconColor: 'text-red-600', badge: 'bg-red-100 text-red-700' },
        'alert': { border: 'border-yellow-500', bg: 'bg-yellow-100', icon: 'fa-bolt', iconColor: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-700' },
        'update': { border: 'border-blue-600', bg: 'bg-blue-100', icon: 'fa-info-circle', iconColor: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' },
        'system': { border: 'border-gray-400', bg: 'bg-gray-100', icon: 'fa-cog', iconColor: 'text-gray-600', badge: 'bg-gray-100 text-gray-700' }
    };
    return styles[type] || styles.system;
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
}

// Fetch notifications from API
async function fetchNotifications() {
    try {
        showLoadingState();
        
        const response = await fetch(`${API_BASE_URL}/user/notifications`, {
            method: 'GET',
            headers: getHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
            notifications = data.data || [];
            renderNotifications();
            updateUnreadCount();
        } else {
            throw new Error(data.error || 'Failed to fetch notifications');
        }
    } catch (error) {
        console.error('Error fetching notifications:', error);
        showErrorState(error.message);
    }
}

// Mark notification as read
async function markAsRead(notificationId) {
    try {
        const response = await fetch(`${API_BASE_URL}/user/notifications/mark-read`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ notification_id: notificationId })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to mark as read');
        }

        const data = await response.json();
        if (data.success) {
            // Update local state
            const notification = notifications.find(n => n.notification_id === notificationId);
            if (notification) {
                notification.is_read = 1;
                updateNotificationUI(notificationId);
                updateUnreadCount();
            }
        }
    } catch (error) {
        console.error('Error marking notification as read:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to mark notification as read',
            confirmButtonColor: '#ef4444'
        });
    }
}

// Mark all notifications as read
async function markAllAsRead() {
    try {
        const response = await fetch(`${API_BASE_URL}/user/notifications/mark-all-read`, {
            method: 'PUT',
            headers: getHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to mark all as read');
        }

        const data = await response.json();
        if (data.success) {
            // Update all notifications to read
            notifications.forEach(notification => {
                notification.is_read = 1;
            });
            renderNotifications();
            updateUnreadCount();
            
            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'All notifications marked as read',
                confirmButtonColor: '#10b981'
            });
        }
    } catch (error) {
        console.error('Error marking all as read:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to mark all notifications as read',
            confirmButtonColor: '#ef4444'
        });
    }
}

// Delete notification
async function deleteNotification(notificationId) {
    try {
        const result = await Swal.fire({
            title: 'Delete notification?',
            text: 'This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Delete',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            const response = await fetch(`${API_BASE_URL}/user/notifications/delete`, {
                method: 'DELETE',
                headers: getHeaders(),
                body: JSON.stringify({ notification_id: notificationId })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete notification');
            }

            const data = await response.json();
            if (data.success) {
                // Remove from local array
                notifications = notifications.filter(n => n.notification_id !== notificationId);
                renderNotifications();
                updateUnreadCount();
                
                Swal.fire({
                    icon: 'success',
                    title: 'Deleted',
                    text: 'Notification deleted successfully',
                    confirmButtonColor: '#10b981'
                });
            }
        }
    } catch (error) {
        console.error('Error deleting notification:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to delete notification',
            confirmButtonColor: '#ef4444'
        });
    }
}

// Update notification UI after marking as read
function updateNotificationUI(notificationId) {
    const notificationElement = document.querySelector(`[data-notification-id="${notificationId}"]`);
    if (notificationElement) {
        const unreadIndicator = notificationElement.querySelector('.unread-indicator');
        if (unreadIndicator) {
            unreadIndicator.style.display = 'none';
        }
        notificationElement.dataset.read = 'true';
    }
}

// Update unread count
function updateUnreadCount() {
    const unreadCount = notifications.filter(n => !n.is_read).length;
    // You can update a badge or counter in your UI here
    console.log(`Unread notifications: ${unreadCount}`);
}

// Render notifications
function renderNotifications(filter = 'all') {
    const container = document.getElementById('notificationsList');
    const filteredNotifications = filter === 'all' 
        ? notifications 
        : notifications.filter(n => n.type === filter);

    if (filteredNotifications.length === 0) {
        showEmptyState();
        return;
    }

    container.innerHTML = filteredNotifications.map(notification => {
        const style = getNotificationStyle(notification.type);
        const isUnread = !notification.is_read;
        
        return `
            <div class="alert-item bg-white border-l-4 ${style.border} rounded-lg shadow-sm overflow-hidden" 
                  data-notification-id="${notification.notification_id}" 
                  data-type="${notification.type}" 
                  data-read="${notification.is_read ? 'true' : 'false'}">
                <div class="p-4">
                    <div class="flex items-start gap-3">
                        <div class="w-10 h-10 ${style.bg} rounded-lg flex items-center justify-center flex-shrink-0">
                            <i class="fas ${style.icon} ${style.iconColor}"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 mb-1">
                                <span class="px-2 py-0.5 ${style.badge} text-xs font-semibold rounded uppercase">
                                    ${notification.type}
                                </span>
                                <span class="text-xs text-gray-500">${formatDate(notification.created_at)}</span>
                                ${isUnread ? '<div class="w-2 h-2 bg-blue-600 rounded-full ml-auto unread-indicator"></div>' : ''}
                            </div>
                            <h3 class="font-semibold text-gray-900 mb-1">${notification.title}</h3>
                            <p class="text-sm text-gray-600 mb-2">${notification.message}</p>
                            ${notification.related_incident_id ? `
                                <div class="flex items-center gap-4 text-xs text-gray-500">
                                    <span class="flex items-center gap-1">
                                        <i class="fas fa-link"></i>
                                        Incident: ${notification.related_incident_id}
                                    </span>
                                </div>
                            ` : ''}
                            <div class="flex items-center gap-3 mt-3">
                                ${isUnread ? `
                                    <button class="mark-read-btn text-xs font-medium text-blue-600 hover:text-blue-700" data-id="${notification.notification_id}">
                                        Mark as read
                                    </button>
                                ` : ''}
                                <button class="delete-btn text-xs font-medium text-red-600 hover:text-red-700" data-id="${notification.notification_id}">
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Add event listeners to new elements
    container.querySelectorAll('.mark-read-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            markAsRead(btn.dataset.id);
        });
    });

    container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteNotification(btn.dataset.id);
        });
    });

    container.querySelectorAll('.alert-item').forEach(item => {
        item.addEventListener('click', () => {
            const notificationId = item.dataset.notificationId;
            if (item.dataset.read === 'false') {
                markAsRead(notificationId);
            }
        });
    });

    showNotificationsList();
}

// UI State Management
function showLoadingState() {
    document.getElementById('loadingState').classList.remove('hidden');
    document.getElementById('filterTabs').classList.add('hidden');
    document.getElementById('notificationsList').classList.add('hidden');
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('errorState').classList.add('hidden');
}

function showNotificationsList() {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('filterTabs').classList.remove('hidden');
    document.getElementById('notificationsList').classList.remove('hidden');
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('errorState').classList.add('hidden');
}

function showEmptyState() {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('filterTabs').classList.add('hidden');
    document.getElementById('notificationsList').classList.add('hidden');
    document.getElementById('emptyState').classList.remove('hidden');
    document.getElementById('errorState').classList.add('hidden');
}

function showErrorState(message) {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('filterTabs').classList.add('hidden');
    document.getElementById('notificationsList').classList.add('hidden');
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('errorState').classList.remove('hidden');
    document.getElementById('errorMessage').textContent = message || 'There was an error loading your notifications.';
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

// Filter notifications
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', function() {
        // Update active tab
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('bg-blue-600', 'text-white');
            btn.classList.add('bg-gray-100', 'text-gray-700', 'hover:bg-gray-200');
        });
        this.classList.add('bg-blue-600', 'text-white');
        this.classList.remove('bg-gray-100', 'text-gray-700', 'hover:bg-gray-200');

        // Filter notifications
        const filter = this.dataset.filter;
        renderNotifications(filter);
    });
});

// Mark all as read
document.getElementById('markAllReadBtn').addEventListener('click', function() {
    markAllAsRead();
});

// Retry button
document.getElementById('retryButton').addEventListener('click', function() {
    fetchNotifications();
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
document.getElementById('sidebarLogoutBtn').addEventListener('click', logout);

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadUserData();
    updateMeshStatus();
    fetchNotifications();
    setInterval(updateMeshStatus, 5000);
});