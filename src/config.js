// Configuration file for API endpoints and settings
const config = {
    // API Gateway endpoints - update these after deployment
    API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'YOUR_API_GATEWAY_URL',

    // Noise level thresholds (in decibels)
    THRESHOLDS: {
        ACCEPTABLE: 60,
        WARNING: 70,
        VIOLATION: 80
    },

    // Recording settings
    RECORDING: {
        DURATION: 5000, // 5 seconds in milliseconds
        SAMPLE_RATE: 44100,
        CHANNELS: 1
    },

    // Demo settings
    DEMO: {
        ENABLE_FALLBACK: true, // Enable fallback for demo when API is not available
        FALLBACK_DELAY: 2000 // Delay for fallback response simulation
    }
};

// Helper function to get API endpoints
export const getApiEndpoints = () => ({
    process: `${config.API_BASE_URL}/noise/process`,
    getData: `${config.API_BASE_URL}/noise/data`,
    getUser: `${config.API_BASE_URL}/user`
});

// Helper function to get status based on decibel level
export const getStatusFromDecibel = (decibelLevel) => {
    if (decibelLevel <= config.THRESHOLDS.ACCEPTABLE) {
        return 'acceptable';
    } else if (decibelLevel <= config.THRESHOLDS.WARNING) {
        return 'warning';
    } else {
        return 'violation';
    }
};

// Helper function to get status color
export const getStatusColor = (status) => {
    switch (status) {
        case 'acceptable': return '#10b981';
        case 'warning': return '#f59e0b';
        case 'violation': return '#ef4444';
        default: return '#6b7280';
    }
};

export default config; 