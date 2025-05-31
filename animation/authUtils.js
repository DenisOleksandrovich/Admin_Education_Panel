// Файл: authUtils.js
const backendUrl = 'http://localhost:3000';

export function getAuthToken() {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    console.log(`[authUtils.js @ ${new Date().toLocaleTimeString()}] getAuthToken: Reading 'authToken'. Found in ${localStorage.getItem('authToken') ? 'localStorage' : sessionStorage.getItem('authToken') ? 'sessionStorage' : 'neither'}. Token value: ${token ? 'Exists' : 'NULL'}`);
    return token;
}

export function getAuthHeaders() {
    const token = getAuthToken();
    if (!token) {
        console.error("[authUtils.js] CRITICAL: getAuthHeaders could not find the token!");
    }
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export async function getUserInfo() {
    const headers = getAuthHeaders();
    if (!headers['Authorization']) {
        console.error("[authUtils.js] Cannot fetch profile, no token found.");
        return null;
    }
    console.log("[authUtils.js] Attempting to fetch user profile info...");
    try {
        const response = await fetch(`${backendUrl}/api/user/profile`, { headers });
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                 console.error("[authUtils.js] Authentication/Authorization error fetching user profile.");
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("[authUtils.js] User profile data received:", data);
        if (data.success && data.account) {
            return data.account;
        } else {
             throw new Error("User profile data is missing 'account' object or success is false.");
        }
    } catch (error) {
        console.error("[authUtils.js] Error fetching user profile info:", error);
        return null;
    }
}

export function showNotification(message, type = 'info', containerId = 'notification-container-global') {
     let notificationContainer = document.getElementById(containerId);
     if (!notificationContainer) {
         notificationContainer = document.createElement('div');
         notificationContainer.id = containerId;
         notificationContainer.style.position = 'fixed';
         notificationContainer.style.top = '20px';
         notificationContainer.style.right = '20px';
         notificationContainer.style.zIndex = '1050';
         notificationContainer.style.width = '300px';
         document.body.appendChild(notificationContainer);
     }
     const notificationElement = document.createElement('div');
     notificationElement.className = `notification notification-${type}`;
     notificationElement.textContent = message;
     notificationElement.style.backgroundColor = type === 'error' ? '#f8d7da' : type === 'success' ? '#d4edda' : '#cfe2ff';
     notificationElement.style.color = type === 'error' ? '#721c24' : type === 'success' ? '#155724' : '#0c5460';
     notificationElement.style.padding = '15px';
     notificationElement.style.marginBottom = '10px';
     notificationElement.style.borderRadius = '4px';
     notificationElement.style.opacity = '1';
     notificationElement.style.transition = 'opacity 0.5s ease-out';
     notificationContainer.appendChild(notificationElement);
     setTimeout(() => {
         notificationElement.style.opacity = '0';
         setTimeout(() => {
             if (notificationContainer.contains(notificationElement)) notificationContainer.removeChild(notificationElement);
             if (!notificationContainer.hasChildNodes()) notificationContainer.remove();
         }, 500);
     }, 3000);
}