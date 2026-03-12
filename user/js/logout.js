// Logout Confirmation Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Get all logout buttons from the page
    const logoutBtn = document.getElementById('logoutBtn');
    const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');
    
    // Function to confirm logout
    function confirmLogout(event) {
        if (event) {
            event.preventDefault();
        }
        
        Swal.fire({
            title: 'Logout Confirmation',
            text: 'Are you sure you want to log out?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, Logout',
            cancelButtonText: 'Cancel',
            reverseButtons: true,
            customClass: {
                popup: 'rounded-lg'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                // Show loading state
                Swal.fire({
                    title: 'Logging out...',
                    text: 'Please wait',
                    icon: 'info',
                    allowOutsideClick: false,
                    showConfirmButton: false,
                    willOpen: () => {
                        Swal.showLoading();
                    }
                });

                // Perform logout actions
                performLogout();
            }
        });
    }
    
    // Function to perform actual logout
    function performLogout() {
        // Clear authentication data
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
        sessionStorage.clear();
        
        // Clear any cookies related to authentication
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        
        // Wait a moment to show the loading state
        setTimeout(() => {
            // Show success message
            Swal.fire({
                title: 'Logged Out!',
                text: 'You have been successfully logged out',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                // Redirect to login page
                window.location.href = '../index.html';
            });
        }, 1000);
    }
    
    // Attach event listeners to logout buttons
    if (logoutBtn) {
        logoutBtn.addEventListener('click', confirmLogout);
    }
    
    if (sidebarLogoutBtn) {
        sidebarLogoutBtn.addEventListener('click', confirmLogout);
    }
    
    // Make function available globally if needed
    window.confirmLogout = confirmLogout;
});