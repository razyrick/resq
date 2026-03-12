// API Configuration
const API_BASE_URL = 'https://greenyellow-hawk-206191.hostingersite.com';
const AI_API_URL = 'https://gen.pollinations.ai/v1/chat/completions';
const AI_API_KEY = 'sk_gRyGAA1lbBLFKierBargtQmeGkBQt2aa';

// Cloudinary Configuration
const CLOUDINARY_CLOUD_NAME = 'dgwp7j5l3';
const CLOUDINARY_UPLOAD_PRESET = 'resq-laguna';

let map, marker;
let currentLatitude = null;
let currentLongitude = null;
let cloudinaryWidget = null;
let selectedType = null;
let selectedSeverity = null;
let photoAttached = false;
let currentEditingType = null;
let currentEditingSeverity = null;

// AI System Prompt
const systemPrompt = `You are an incident classifier.

Analyze the incident description and return only valid JSON.

You may classify incidents even if the message is very short,
as long as the incident type can be directly inferred from explicit keywords.

If classification is possible:

{
"incident_type": "<incident type>",
"severity_level": "<low | medium | high>",
"confidence": "<percentage>"
}


If the description is unclear, insufficient, or cannot be classified:

{
"error": "Unable to classify incident type and severity."
}


Rules:

1. Use only the given description
2. Do not assume missing details
3. No explanations, no extra fields, no text outside JSON
4. incident_type must be in lowercase with underscores instead of spaces (snake_case)
Examples:
- traffic_accident
- medical_emergency
- fire_incident
- flood_situation
- crime_incident
- natural_disaster
- infrastructure_failure
- public_disturbance
- environmental_hazard
- other_emergency`;

// API Headers
function getHeaders() {
    return {
        'Authorization': `Bearer 68edec9b1fc64c018a4cf3134ee27318`,
        'X-CSRF-Token': '7fd006359b224813fd0247070c5eefd3',
        'Content-Type': 'application/json'
    };
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
    document.getElementById('address').value = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
}

// Character counter
document.getElementById('description').addEventListener('input', function() {
    const count = this.value.length;
    document.getElementById('charCount').textContent = count;
    if (count > 3000) {
        this.value = this.value.substring(0, 3000);
        document.getElementById('charCount').textContent = 3000;
    }
});

// Initialize Cloudinary Upload Widget
function initializeCloudinaryWidget() {
    cloudinaryWidget = cloudinary.createUploadWidget({
        cloudName: CLOUDINARY_CLOUD_NAME,
        uploadPreset: CLOUDINARY_UPLOAD_PRESET,
        sources: ['local', 'camera', 'url'],
        multiple: false,
        maxFileSize: 5000000,
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
            const imageUrl = result.info.secure_url;
            
            document.getElementById('cameraPreview').src = imageUrl;
            document.getElementById('cameraPreview').classList.remove('hidden');
            document.getElementById('cameraPlaceholder').classList.add('hidden');
            document.getElementById('removePhotoBtn').classList.remove('hidden');
            document.getElementById('photoInput').value = imageUrl;
            photoAttached = true;
            
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
    if (cloudinaryWidget) {
        cloudinaryWidget.open();
    } else {
        document.getElementById('photoInputFile').click();
    }
});

// Fallback file input
document.getElementById('photoInputFile').addEventListener('change', async function(e) {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        
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
        
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid File Type',
                text: 'Please upload a valid image file',
                confirmButtonColor: '#ef4444'
            });
            this.value = '';
            return;
        }
        
        await uploadToCloudinary(file);
    }
});

// Upload to Cloudinary
async function uploadToCloudinary(file) {
    try {
        const loadingSwal = Swal.fire({
            title: 'Uploading...',
            text: 'Please wait while we upload your photo',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);
        
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`Upload failed with status: ${response.status}`);
        }
        
        const data = await response.json();
        await loadingSwal.close();
        
        document.getElementById('cameraPreview').src = data.secure_url;
        document.getElementById('cameraPreview').classList.remove('hidden');
        document.getElementById('cameraPlaceholder').classList.add('hidden');
        document.getElementById('removePhotoBtn').classList.remove('hidden');
        document.getElementById('photoInput').value = data.secure_url;
        photoAttached = true;
        
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

// AI Analysis Function
async function analyzeIncident() {
    const description = document.getElementById('description').value.trim();
    
    if (!description) {
        Swal.fire({
            icon: 'error',
            title: 'Validation Error',
            text: 'Please describe the incident first',
            confirmButtonColor: '#2563eb'
        });
        return null;
    }
    
    if (!currentLatitude || !currentLongitude) {
        Swal.fire({
            icon: 'error',
            title: 'Validation Error',
            text: 'Please ensure location is set',
            confirmButtonColor: '#2563eb'
        });
        return null;
    }
    
    try {
        document.getElementById('loadingOverlay').classList.remove('hidden');
        document.getElementById('analyzeBtn').disabled = true;
        
        // Prepare AI request
        const payload = {
            model: "openai",
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: description
                }
            ]
        };
        
        const response = await fetch(AI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AI_API_KEY}`
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error(`AI API Error: ${response.status}`);
        }
        
        const data = await response.json();
        const aiResponse = data.choices?.[0]?.message?.content || '{"error": "No response from AI"}';
        
        let parsedResponse;
        try {
            parsedResponse = JSON.parse(aiResponse);
        } catch (e) {
            // If response is not valid JSON, treat it as an error
            parsedResponse = { error: "Invalid response from AI" };
        }
        
        return parsedResponse;
        
    } catch (error) {
        console.error('AI Analysis Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Analysis Failed',
            text: 'Failed to analyze the incident. Please try again.',
            confirmButtonColor: '#ef4444'
        });
        return { error: error.message };
    } finally {
        document.getElementById('loadingOverlay').classList.add('hidden');
        document.getElementById('analyzeBtn').disabled = false;
    }
}

// Display AI Results
function displayAIResults(results) {
    const resultsSection = document.getElementById('aiResultsSection');
    const photoSection = document.getElementById('photoSection');
    const submitSection = document.getElementById('submitSection');
    
    if (results.error) {
        // Show error state
        document.getElementById('incidentTypeText').textContent = 'Unable to determine';
        document.getElementById('severityText').textContent = 'Unable to determine';
        document.getElementById('confidenceBar').style.width = '0%';
        document.getElementById('confidenceText').textContent = '0%';
        
        Swal.fire({
            icon: 'warning',
            title: 'Analysis Incomplete',
            text: 'The AI could not classify this incident. Please manually select the type and severity.',
            confirmButtonColor: '#2563eb'
        });
        
        // Still show the sections for manual selection
        resultsSection.classList.remove('hidden');
        photoSection.classList.remove('hidden');
        submitSection.classList.remove('hidden');
        return;
    }
    
    // Format incident type from snake_case to readable text
    let incidentTypeText = results.incident_type || 'unknown';
    incidentTypeText = incidentTypeText.replace(/_/g, ' ');
    incidentTypeText = incidentTypeText.replace(/\b\w/g, l => l.toUpperCase());
    
    // Format severity level
    let severityText = results.severity_level || 'unknown';
    severityText = severityText.charAt(0).toUpperCase() + severityText.slice(1);
    
    // Update UI with results
    document.getElementById('incidentTypeText').textContent = incidentTypeText;
    document.getElementById('severityText').textContent = severityText;
    document.getElementById('confidenceText').textContent = `${results.confidence || '80'}%`;
    document.getElementById('confidenceBar').style.width = `${results.confidence || 80}%`;
    
    // Update hidden inputs
    document.getElementById('incidentType').value = results.incident_type || '';
    document.getElementById('severity').value = results.severity_level || '';
    
    // Update global variables
    selectedType = results.incident_type;
    selectedSeverity = results.severity_level;
    
    // Show severity indicator
    const severityIndicator = document.getElementById('severityIndicator');
    severityIndicator.innerHTML = '';
    
    let dotColor = 'bg-gray-400';
    if (selectedSeverity === 'low') dotColor = 'bg-green-500';
    else if (selectedSeverity === 'medium') dotColor = 'bg-yellow-500';
    else if (selectedSeverity === 'high') dotColor = 'bg-red-500';
    
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.className = `w-2 h-2 rounded-full ${dotColor} ${i >= 1 ? 'opacity-50' : ''}`;
        severityIndicator.appendChild(dot);
    }
    
    // Show sections
    resultsSection.classList.remove('hidden');
    photoSection.classList.remove('hidden');
    submitSection.classList.remove('hidden');
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Edit Incident Type
document.getElementById('editIncidentTypeBtn').addEventListener('click', function() {
    document.getElementById('editIncidentTypeModal').classList.remove('hidden');
    currentEditingType = selectedType;
    
    // Highlight current selection
    document.querySelectorAll('.edit-type-option').forEach(btn => {
        btn.classList.remove('border-blue-500', 'bg-blue-50');
        if (btn.dataset.type === currentEditingType) {
            btn.classList.add('border-blue-500', 'bg-blue-50');
        }
    });
});

// Edit Severity
document.getElementById('editSeverityBtn').addEventListener('click', function() {
    document.getElementById('editSeverityModal').classList.remove('hidden');
    currentEditingSeverity = selectedSeverity;
    
    // Highlight current selection
    document.querySelectorAll('.edit-severity-option').forEach(btn => {
        btn.querySelector('.fa-check').classList.add('hidden');
        btn.classList.remove('border-blue-500');
        if (btn.dataset.severity === currentEditingSeverity) {
            btn.querySelector('.fa-check').classList.remove('hidden');
            btn.classList.add('border-blue-500');
        }
    });
});

// Type selection in modal
document.querySelectorAll('.edit-type-option').forEach(btn => {
    btn.addEventListener('click', function() {
        currentEditingType = this.dataset.type;
        
        document.querySelectorAll('.edit-type-option').forEach(b => {
            b.classList.remove('border-blue-500', 'bg-blue-50');
        });
        this.classList.add('border-blue-500', 'bg-blue-50');
    });
});

// Severity selection in modal
document.querySelectorAll('.edit-severity-option').forEach(btn => {
    btn.addEventListener('click', function() {
        currentEditingSeverity = this.dataset.severity;
        
        document.querySelectorAll('.edit-severity-option').forEach(b => {
            b.querySelector('.fa-check').classList.add('hidden');
            b.classList.remove('border-blue-500');
        });
        this.querySelector('.fa-check').classList.remove('hidden');
        this.classList.add('border-blue-500');
    });
});

// Save type edit
document.getElementById('saveTypeEditBtn').addEventListener('click', function() {
    if (!currentEditingType) {
        Swal.fire({
            icon: 'warning',
            title: 'No Selection',
            text: 'Please select an incident type',
            confirmButtonColor: '#2563eb'
        });
        return;
    }
    
    selectedType = currentEditingType;
    
    // Update UI
    let incidentTypeText = currentEditingType.replace(/_/g, ' ');
    incidentTypeText = incidentTypeText.replace(/\b\w/g, l => l.toUpperCase());
    document.getElementById('incidentTypeText').textContent = incidentTypeText;
    document.getElementById('incidentType').value = currentEditingType;
    
    // Update confidence (lower when manually edited)
    const confidenceText = document.getElementById('confidenceText');
    const confidenceBar = document.getElementById('confidenceBar');
    confidenceText.textContent = '50% (Manual Edit)';
    confidenceBar.style.width = '50%';
    
    document.getElementById('editIncidentTypeModal').classList.add('hidden');
});

// Cancel type edit
document.getElementById('cancelTypeEditBtn').addEventListener('click', function() {
    document.getElementById('editIncidentTypeModal').classList.add('hidden');
});

// Save severity edit
document.getElementById('saveSeverityEditBtn').addEventListener('click', function() {
    if (!currentEditingSeverity) {
        Swal.fire({
            icon: 'warning',
            title: 'No Selection',
            text: 'Please select a severity level',
            confirmButtonColor: '#2563eb'
        });
        return;
    }
    
    selectedSeverity = currentEditingSeverity;
    
    // Update UI
    let severityText = currentEditingSeverity.charAt(0).toUpperCase() + currentEditingSeverity.slice(1);
    document.getElementById('severityText').textContent = severityText;
    document.getElementById('severity').value = currentEditingSeverity;
    
    // Update severity indicator
    const severityIndicator = document.getElementById('severityIndicator');
    severityIndicator.innerHTML = '';
    
    let dotColor = 'bg-gray-400';
    if (selectedSeverity === 'low') dotColor = 'bg-green-500';
    else if (selectedSeverity === 'medium') dotColor = 'bg-yellow-500';
    else if (selectedSeverity === 'high') dotColor = 'bg-red-500';
    
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.className = `w-2 h-2 rounded-full ${dotColor} ${i >= 1 ? 'opacity-50' : ''}`;
        severityIndicator.appendChild(dot);
    }
    
    // Update confidence (lower when manually edited)
    const confidenceText = document.getElementById('confidenceText');
    const confidenceBar = document.getElementById('confidenceBar');
    confidenceText.textContent = '50% (Manual Edit)';
    confidenceBar.style.width = '50%';
    
    document.getElementById('editSeverityModal').classList.add('hidden');
});

// Cancel severity edit
document.getElementById('cancelSeverityEditBtn').addEventListener('click', function() {
    document.getElementById('editSeverityModal').classList.add('hidden');
});

// Analyze Button Click
document.getElementById('analyzeBtn').addEventListener('click', async function() {
    const results = await analyzeIncident();
    if (results) {
        displayAIResults(results);
    }
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
            text: 'Please ensure incident type is set',
            confirmButtonColor: '#2563eb'
        });
        return;
    }

    if (!selectedSeverity) {
        Swal.fire({
            icon: 'error',
            title: 'Validation Error',
            text: 'Please ensure severity level is set',
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
            photo: document.getElementById('photoInput').value || ''
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

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    initializeCloudinaryWidget();
});