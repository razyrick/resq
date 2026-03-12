// Initialize AOS animations
AOS.init({
    duration: 800,
    once: true,
    offset: 100
});

// Mobile menu functionality
const mobileMenuButton = document.getElementById('mobileMenuButton');
const closeMobileMenuButton = document.getElementById('closeMobileMenu');
const mobileMenu = document.getElementById('mobileMenu');

function openMobileMenu() {
    mobileMenu.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
}

if (mobileMenuButton) {
    mobileMenuButton.addEventListener('click', openMobileMenu);
}
if (closeMobileMenuButton) {
    closeMobileMenuButton.addEventListener('click', closeMobileMenu);
}

if (mobileMenu) {
    const mobileMenuLinks = mobileMenu.querySelectorAll('a');
    mobileMenuLinks.forEach(link => link.addEventListener('click', closeMobileMenu));
}

// Initialize hero map
if (document.getElementById('heroMap')) {
    const heroMap = L.map('heroMap').setView([14.2691, 121.4113], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(heroMap);

    const sampleLocations = [
        { lat: 14.2691, lng: 121.4113, name: 'Calamba City', type: 'safe' },
        { lat: 14.1091, lng: 121.1619, name: 'San Pablo City', type: 'warning' },
        { lat: 14.4167, lng: 121.4333, name: 'Biñan City', type: 'safe' },
        { lat: 14.3500, lng: 121.4667, name: 'Santa Rosa City', type: 'alert' }
    ];

    sampleLocations.forEach(loc => {
        const color = loc.type === 'safe' ? '#2563eb' : loc.type === 'warning' ? '#f59e0b' : '#dc2626';
        L.circleMarker([loc.lat, loc.lng], {
            radius: 8,
            fillColor: color,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(heroMap).bindPopup(`<b>${loc.name}</b><br>Status: ${loc.type}`);
    });
}

// Modal handlers
function showLoginModal() {
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        // Re-setup password toggles for login modal
        setTimeout(setupPasswordToggles, 100);
    }
}

function closeLoginModal() {
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

function showRegisterModal() {
    closeLoginModal();
    const registerModal = document.getElementById('registerModal');
    if (registerModal) {
        registerModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        // Re-setup password toggles for register modal
        setTimeout(setupPasswordToggles, 100);
    }
}

function closeRegisterModal() {
    const registerModal = document.getElementById('registerModal');
    if (registerModal) {
        registerModal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

// Password visibility toggle functionality
function setupPasswordToggles() {
    // Login form password toggle
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    
    if (togglePassword && passwordInput) {
        // Remove existing event listeners
        const newTogglePassword = togglePassword.cloneNode(true);
        togglePassword.parentNode.replaceChild(newTogglePassword, togglePassword);
        
        newTogglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Toggle eye icon
            const icon = this.querySelector('i');
            if (type === 'text') {
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    }

    // Registration form password toggles
    const toggleRegPassword = document.getElementById('toggleRegPassword');
    const regPasswordInput = document.getElementById('regPassword');
    
    if (toggleRegPassword && regPasswordInput) {
        // Remove existing event listeners
        const newToggleRegPassword = toggleRegPassword.cloneNode(true);
        toggleRegPassword.parentNode.replaceChild(newToggleRegPassword, toggleRegPassword);
        
        newToggleRegPassword.addEventListener('click', function() {
            const type = regPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            regPasswordInput.setAttribute('type', type);
            
            // Toggle eye icon
            const icon = this.querySelector('i');
            if (type === 'text') {
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    }

    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    if (toggleConfirmPassword && confirmPasswordInput) {
        // Remove existing event listeners
        const newToggleConfirmPassword = toggleConfirmPassword.cloneNode(true);
        toggleConfirmPassword.parentNode.replaceChild(newToggleConfirmPassword, toggleConfirmPassword);
        
        newToggleConfirmPassword.addEventListener('click', function() {
            const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            confirmPasswordInput.setAttribute('type', type);
            
            // Toggle eye icon
            const icon = this.querySelector('i');
            if (type === 'text') {
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    }
}

// Login form handler
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    // Remove existing event listeners
    const newLoginForm = loginForm.cloneNode(true);
    loginForm.parentNode.replaceChild(newLoginForm, loginForm);
    
    newLoginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        const loginButton = document.getElementById('loginButton');

        // Update button to show loading state
        const buttonText = document.getElementById('buttonText');
        const buttonSpinner = document.getElementById('buttonSpinner');
        
        buttonText.textContent = 'Signing In...';
        buttonSpinner.classList.remove('hidden');
        loginButton.disabled = true;

        try {
            
            const res = await fetch('https://greenyellow-hawk-206191.hostingersite.com/auth/login', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await res.json();

            if (data.success) {
                localStorage.setItem('userData', JSON.stringify(data.user));
                localStorage.setItem('userRole', data.user.role); // Get role from response
                if (data.user.csrf_token) {
                    localStorage.setItem('csrf_token', data.user.csrf_token);
                }

                Swal.fire({
                    icon: 'success',
                    title: 'Login Successful',
                    text: data.message || 'Redirecting...',
                    timer: 1500,
                    showConfirmButton: false
                });

                setTimeout(() => redirectToDashboard(data.user.role), 1500); // Use role from response
            } else {
                // Show the actual error message from server
                Swal.fire({
                    icon: 'error',
                    title: 'Login Failed',
                    text: data.error || 'Invalid email or password',
                    confirmButtonText: 'OK'
                });
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Server Error',
                text: 'Login failed. Please try again. Error: ' + error.message
            });
        } finally {
            buttonText.textContent = 'Sign In';
            buttonSpinner.classList.add('hidden');
            loginButton.disabled = false;
        }
    });
}

// Register form handler
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    // Remove existing event listeners
    const newRegisterForm = registerForm.cloneNode(true);
    registerForm.parentNode.replaceChild(newRegisterForm, registerForm);
    
    newRegisterForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const firstName = document.getElementById('firstName').value.trim();
        const middleName = document.getElementById('middleName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value.trim();
        const confirmPassword = document.getElementById('confirmPassword').value.trim();
        const roleElement = document.querySelector('input[name="regUserRole"]:checked');
        const role = roleElement ? roleElement.value : 'user';
        const registerButton = document.getElementById('registerButton');

        if (!validateRegistrationForm(firstName, lastName, email, password, confirmPassword)) return;

        // Update button to show loading state
        const registerButtonText = document.getElementById('registerButtonText');
        const registerButtonSpinner = document.getElementById('registerButtonSpinner');
        
        registerButtonText.textContent = 'Creating Account...';
        registerButtonSpinner.classList.remove('hidden');
        registerButton.disabled = true;

        try {
            const res = await fetch('https://greenyellow-hawk-206191.hostingersite.com/auth/register', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    first_name: firstName,
                    middle_name: middleName,
                    last_name: lastName,
                    email,
                    password,
                    role
                })
            });

            const data = await res.json();

            if (data.success) {
                localStorage.setItem('userData', JSON.stringify(data.user));
                localStorage.setItem('userRole', role);
                if (data.user.csrf_token) {
                    localStorage.setItem('csrf_token', data.user.csrf_token);
                }

                Swal.fire({
                    icon: 'success',
                    title: 'Registration Successful',
                    text: data.message || 'Account created successfully! Please wait for admin approval.',
                    timer: 3000,
                    showConfirmButton: false
                });

                setTimeout(() => {
                    closeRegisterModal();
                    showLoginModal();
                }, 3000);
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Registration Failed',
                    text: data.error || 'Something went wrong'
                });
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Server Error',
                text: 'Registration failed. Please try again. Error: ' + error.message
            });
        } finally {
            registerButtonText.textContent = 'Create Account';
            registerButtonSpinner.classList.add('hidden');
            registerButton.disabled = false;
        }
    });
}

// Validation
function validateRegistrationForm(firstName, lastName, email, password, confirmPassword) {
    // Name validation regex - STRING ONLY (letters and spaces)
    const nameRegex = /^[A-Za-z\s]+$/;
    
    // First Name validation
    if (!firstName) {
        showSwalError('First name is required');
        return false;
    }
    
    // Remove extra spaces
    firstName = firstName.trim();
    
    if (firstName.length < 2) {
        showSwalError('First name must be at least 2 characters');
        return false;
    }
    
    if (firstName.length > 50) {
        showSwalError('First name must not exceed 50 characters');
        return false;
    }
    
    if (!nameRegex.test(firstName)) {
        showSwalError('First name should contain letters only (no numbers or symbols)');
        return false;
    }
    
    // Last Name validation
    if (!lastName) {
        showSwalError('Last name is required');
        return false;
    }
    
    // Remove extra spaces
    lastName = lastName.trim();
    
    if (lastName.length < 2) {
        showSwalError('Last name must be at least 2 characters');
        return false;
    }
    
    if (lastName.length > 50) {
        showSwalError('Last name must not exceed 50 characters');
        return false;
    }
    
    if (!nameRegex.test(lastName)) {
        showSwalError('Last name should contain letters only (no numbers or symbols)');
        return false;
    }
    
    // Email validation
    if (!email) {
        showSwalError('Email is required');
        return false;
    }
    
    if (!isValidEmail(email)) {
        showSwalError('Please enter a valid email address');
        return false;
    }
    
    // Password validation
    if (!password) {
        showSwalError('Password is required');
        return false;
    }
    
    // Change from 8 to 6 minimum, 12 maximum
    if (password.length < 6) {
        showSwalError('Password must be at least 6 characters');
        return false;
    }
    
    // ADD THIS: Password maximum 12 characters
    if (password.length > 12) {
        showSwalError('Password must not exceed 12 characters');
        return false;
    }
    
    // Confirm Password validation
    if (!confirmPassword) {
        showSwalError('Please confirm your password');
        return false;
    }
    
    if (password !== confirmPassword) {
        showSwalError('Passwords do not match');
        return false;
    }
    
    return true;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showSwalError(message) {
    Swal.fire({
        icon: 'error',
        title: 'Invalid Input',
        text: message
    });
}

// Redirect function
function redirectToDashboard(role) {
    const dashboards = {
        'user': '/user/home.html',
        'barangay': '/barangay/dashboard.html',
        'dispatcher': '/dispatcher/dashboard.html',
        'agency': '/agency/dashboard.html',
        'admin': '/admin/dashboard.html'
    };
    const dashboardPath = dashboards[role] || '/user/home.html';
    window.location.href = dashboardPath;
}

// Close modal on outside click or Escape
const loginModal = document.getElementById('loginModal');
if (loginModal) {
    loginModal.addEventListener('click', e => {
        if (e.target === e.currentTarget) closeLoginModal();
    });
}

const registerModal = document.getElementById('registerModal');
if (registerModal) {
    registerModal.addEventListener('click', e => {
        if (e.target === e.currentTarget) closeRegisterModal();
    });
}

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        closeLoginModal();
        closeRegisterModal();
        closeMobileMenu();
    }
});

// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupPasswordToggles();
    
    // Add click handlers for login/register buttons in navigation
    const signInButtons = document.querySelectorAll('button[onclick*="showLoginModal"]');
    signInButtons.forEach(button => {
        button.addEventListener('click', showLoginModal);
    });

    const getStartedButtons = document.querySelectorAll('button[onclick*="showLoginModal"]');
    getStartedButtons.forEach(button => {
        button.addEventListener('click', showLoginModal);
    });

    // Add CSS for password toggle buttons
    const style = document.createElement('style');
    style.textContent = `
        #togglePassword,
        #toggleRegPassword,
        #toggleConfirmPassword {
            background: none;
            border: none;
            cursor: pointer;
            padding: 0;
            outline: none;
            z-index: 10;
        }

        #togglePassword:focus,
        #toggleRegPassword:focus,
        #toggleConfirmPassword:focus {
            outline: 2px solid #3b82f6;
            outline-offset: 2px;
            border-radius: 4px;
        }
    `;
    document.head.appendChild(style);
});

// Debug function to check if elements exist
function debugElements() {
}

// Run debug on load
setTimeout(debugElements, 1000);