// Initialize AOS
AOS.init();

const API_BASE_URL = 'https://greenyellow-hawk-206191.hostingersite.com';

// Extract parameters from URL
function getUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        email: urlParams.get('email'),
        verificationCode: urlParams.get('verification_code')
    };
}

// Validate reset link on page load
document.addEventListener('DOMContentLoaded', function() {
    const { email, verificationCode } = getUrlParams();
    
    // Check if both parameters exist
    if (!email || !verificationCode) {
        showInvalidLinkModal();
        return;
    }

    // Set hidden fields
    document.getElementById('email').value = decodeURIComponent(email);
    document.getElementById('verificationCode').value = verificationCode;

    // Decode and display email in a small notice (optional)
    const emailDisplay = document.createElement('div');
    emailDisplay.className = 'text-xs text-center text-gray-500 mb-4';
    emailDisplay.innerHTML = `<i class="fas fa-envelope mr-1"></i>Resetting password for: <span class="font-semibold">${decodeURIComponent(email)}</span>`;
    document.querySelector('.bg-white.rounded-b-2xl').insertBefore(emailDisplay, document.querySelector('form'));

    setupPasswordToggles();
});

// Password visibility toggle
function setupPasswordToggles() {
    const toggleNewPassword = document.getElementById('toggleNewPassword');
    const newPassword = document.getElementById('newPassword');
    
    if (toggleNewPassword && newPassword) {
        toggleNewPassword.addEventListener('click', function() {
            const type = newPassword.getAttribute('type') === 'password' ? 'text' : 'password';
            newPassword.setAttribute('type', type);
            
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
    const confirmPassword = document.getElementById('confirmPassword');
    
    if (toggleConfirmPassword && confirmPassword) {
        toggleConfirmPassword.addEventListener('click', function() {
            const type = confirmPassword.getAttribute('type') === 'password' ? 'text' : 'password';
            confirmPassword.setAttribute('type', type);
            
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

// Password strength checker
function checkPasswordStrength(password) {
    let strength = 0;
    
    if (password.length >= 8) strength += 1;
    if (password.length >= 10) strength += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 1;
    
    return Math.min(strength, 3);
}

// Update password strength indicator
function updatePasswordStrength(password) {
    const strength = checkPasswordStrength(password);
    const strength1 = document.getElementById('strength1');
    const strength2 = document.getElementById('strength2');
    const strength3 = document.getElementById('strength3');
    const strengthText = document.getElementById('strengthText');
    
    // Reset colors
    [strength1, strength2, strength3].forEach(el => {
        el.classList.remove('bg-red-500', 'bg-yellow-500', 'bg-green-500', 'bg-blue-500');
        el.classList.add('bg-gray-200');
    });

    if (password.length === 0) {
        strengthText.textContent = 'Enter a password';
        return;
    }

    // Update based on strength
    if (strength >= 1) {
        strength1.classList.remove('bg-gray-200');
        strength1.classList.add('bg-red-500');
        strengthText.textContent = 'Weak';
    }
    if (strength >= 2) {
        strength2.classList.remove('bg-gray-200');
        strength2.classList.add('bg-yellow-500');
        strengthText.textContent = 'Medium';
    }
    if (strength >= 3) {
        strength3.classList.remove('bg-gray-200');
        strength3.classList.add('bg-green-500');
        strengthText.textContent = 'Strong';
    }
}

// Validate form
function validateForm() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const submitButton = document.getElementById('submitButton');
    const passwordMatchError = document.getElementById('passwordMatchError');
    const reqLength = document.getElementById('reqLength');
    const reqMatch = document.getElementById('reqMatch');
    
    // Update requirement indicators
    reqLength.classList.toggle('text-green-600', newPassword.length >= 8);
    reqLength.classList.toggle('text-gray-500', newPassword.length < 8);
    
    const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;
    reqMatch.classList.toggle('text-green-600', passwordsMatch);
    reqMatch.classList.toggle('text-gray-500', !passwordsMatch);
    
    // Show/hide password match error
    if (confirmPassword.length > 0 && newPassword !== confirmPassword) {
        passwordMatchError.classList.remove('hidden');
    } else {
        passwordMatchError.classList.add('hidden');
    }
    
    // Enable/disable submit button
    const isValid = newPassword.length >= 8 && passwordsMatch;
    submitButton.disabled = !isValid;
}

// Reset Password Form Handler
const resetPasswordForm = document.getElementById('resetPasswordForm');
const newPasswordInput = document.getElementById('newPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');

if (newPasswordInput) {
    newPasswordInput.addEventListener('input', function() {
        updatePasswordStrength(this.value);
        validateForm();
    });
}

if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener('input', validateForm);
}

if (resetPasswordForm) {
    resetPasswordForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const verificationCode = document.getElementById('verificationCode').value;
        const newPassword = document.getElementById('newPassword').value;
        
        const submitButton = document.getElementById('submitButton');
        const buttonText = document.getElementById('buttonText');
        const buttonSpinner = document.getElementById('buttonSpinner');

        // Show loading state
        buttonText.textContent = 'Resetting...';
        buttonSpinner.classList.remove('hidden');
        submitButton.disabled = true;

        try {
            const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ 
                    email: decodeURIComponent(email),
                    verification_code: verificationCode,
                    new_password: newPassword
                })
            });
            
            const data = await response.json();

            if (data.success) {
                // Show success modal
                document.getElementById('successModal').classList.remove('hidden');
                document.body.style.overflow = 'hidden';
                
                // Reset form
                resetPasswordForm.reset();
                
                // Reset strength indicator
                updatePasswordStrength('');
            } else {
                // Show error message from server
                showError('Reset Failed', data.error || 'Failed to reset password. Please try again.');
                
                // Reset button state
                buttonText.textContent = 'Reset Password';
                buttonSpinner.classList.add('hidden');
                submitButton.disabled = false;
            }

        } catch (error) {
            console.error('Reset password error:', error);
            showError('Connection Error', 'Unable to connect to server. Please check your internet connection and try again.');
            
            // Reset button state
            buttonText.textContent = 'Reset Password';
            buttonSpinner.classList.add('hidden');
            submitButton.disabled = false;
        }
    });
}

// Show invalid link modal
function showInvalidLinkModal() {
    document.getElementById('invalidLinkModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// Show error modal
function showError(title, message) {
    document.getElementById('errorTitle').textContent = title;
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('errorModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// Close success modal
function closeSuccessModal() {
    document.getElementById('successModal').classList.add('hidden');
    document.body.style.overflow = '';
}

// Close error modal
function closeErrorModal() {
    document.getElementById('errorModal').classList.add('hidden');
    document.body.style.overflow = '';
}

// Close modals on outside click
const successModal = document.getElementById('successModal');
const errorModal = document.getElementById('errorModal');
const invalidLinkModal = document.getElementById('invalidLinkModal');

if (successModal) {
    successModal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeSuccessModal();
        }
    });
}

if (errorModal) {
    errorModal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeErrorModal();
        }
    });
}

if (invalidLinkModal) {
    invalidLinkModal.addEventListener('click', function(e) {
        if (e.target === this) {
            window.location.href = 'forgot-password.html';
        }
    });
}

// Close on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeSuccessModal();
        closeErrorModal();
    }
});

// Add CSS for disabled button
const style = document.createElement('style');
style.textContent = `
    button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none !important;
    }
    button:disabled:hover {
        opacity: 0.5;
    }
    #reqLength i, #reqMatch i {
        font-size: 6px;
    }
`;
document.head.appendChild(style);