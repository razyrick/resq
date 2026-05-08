/**
 * Upload a single image file to Cloudinary (unsigned preset).
 * Same preset as user report flow.
 */
const RESQ_CLOUDINARY_CLOUD_NAME = 'dgwp7j5l3';
const RESQ_CLOUDINARY_UPLOAD_PRESET = 'resq-laguna';

/**
 * @param {File} file
 * @returns {Promise<string>} secure_url
 */
async function uploadResolutionImageToCloudinary(file) {
    if (!file || !file.size) {
        throw new Error('No image file selected');
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', RESQ_CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${RESQ_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
    );

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const msg = data.error && data.error.message ? data.error.message : `Upload failed (${response.status})`;
        throw new Error(msg);
    }
    if (!data.secure_url) {
        throw new Error('Upload did not return an image URL');
    }
    return data.secure_url;
}
