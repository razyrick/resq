// Initialize AOS
AOS.init();

const API_BASE_URL = 'https://greenyellow-hawk-206191.hostingersite.com';

// Forgot Password Form Handler
const forgotPasswordForm = document.getElementById('forgotPasswordForm');

if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const submitButton = document.getElementById('submitButton');
        const buttonText = document.getElementById('buttonText');
        const buttonSpinner = document.getElementById('buttonSpinner');

        // Validate email
        if (!email) {
            showError('Email Required', 'Please enter your email address');
            return;
        }

        if (!isValidEmail(email)) {
            showError('Invalid Email', 'Please enter a valid email address');
            return;
        }

        // Show loading state
        buttonText.textContent = 'Sending...';
        buttonSpinner.classList.remove('hidden');
        submitButton.disabled = true;

        try {
            const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email })
            });
            
            const data = await response.json();

            if (data.success) {
                // Show success modal
                document.getElementById('displayEmail').textContent = email;
                document.getElementById('successModal').classList.remove('hidden');
                document.body.style.overflow = 'hidden';
                
                // Reset form
                forgotPasswordForm.reset();
            } else {
                // Show error message from server
                showError('Request Failed', data.error || 'Failed to send reset instructions. Please try again.');
            }

        } catch (error) {
            console.error('Forgot password error:', error);
            showError('Connection Error', 'Unable to connect to server. Please check your internet connection and try again.');
        } finally {
            // Reset button state
            buttonText.textContent = 'Send Reset Instructions';
            buttonSpinner.classList.add('hidden');
            submitButton.disabled = false;
        }
    });
}

// Email validation
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

// Close on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeSuccessModal();
        closeErrorModal();
    }
});

// Input validation on blur
const emailInput = document.getElementById('email');
if (emailInput) {
    emailInput.addEventListener('blur', function() {
        if (this.value && !isValidEmail(this.value.trim())) {
            this.classList.add('border-red-500');
        } else {
            this.classList.remove('border-red-500');
        }
    });

    emailInput.addEventListener('input', function() {
        this.classList.remove('border-red-500');
    });
}