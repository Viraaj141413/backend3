
module.exports = {
    // Server Configuration
    PORT: process.env.PORT || 3000,
    HOST: process.env.HOST || '0.0.0.0',
    
    // Bot Configuration
    MAX_VIEWS: parseInt(process.env.MAX_VIEWS) || 100,
    MIN_VIEWS: parseInt(process.env.MIN_VIEWS) || 1,
    
    // Timing Configuration
    MIN_WATCH_DURATION: parseInt(process.env.MIN_WATCH_DURATION) || 45000, // 45 seconds
    MAX_WATCH_DURATION: parseInt(process.env.MAX_WATCH_DURATION) || 105000, // 105 seconds
    MIN_BREAK_TIME: parseInt(process.env.MIN_BREAK_TIME) || 10000, // 10 seconds
    MAX_BREAK_TIME: parseInt(process.env.MAX_BREAK_TIME) || 15000, // 15 seconds
    
    // Screenshot Configuration
    SCREENSHOT_INTERVAL: parseInt(process.env.SCREENSHOT_INTERVAL) || 5000, // 5 seconds for realistic screenshots
    MAX_SCREENSHOTS: parseInt(process.env.MAX_SCREENSHOTS) || 2000,
    
    // Browser Configuration
    HEADLESS_MODE: process.env.HEADLESS_MODE !== 'false', // true by default for server deployment
    BROWSER_TIMEOUT: parseInt(process.env.BROWSER_TIMEOUT) || 120000,
    
    // Enhanced Human Behavior Configuration
    MOUSE_MOVEMENT_SPEED: parseInt(process.env.MOUSE_MOVEMENT_SPEED) || 50, // pixels per step
    HUMAN_DELAY_MIN: parseInt(process.env.HUMAN_DELAY_MIN) || 1000,
    HUMAN_DELAY_MAX: parseInt(process.env.HUMAN_DELAY_MAX) || 5000,
    VIEW_VALIDATION_TIMEOUT: parseInt(process.env.VIEW_VALIDATION_TIMEOUT) || 15000,
    
    // Human Watch Behavior
    MIN_WATCH_PERCENTAGE: parseInt(process.env.MIN_WATCH_PERCENTAGE) || 40, // 40% minimum
    MAX_WATCH_PERCENTAGE: parseInt(process.env.MAX_WATCH_PERCENTAGE) || 85, // 85% maximum
    ENGAGEMENT_ACTIONS_MIN: parseInt(process.env.ENGAGEMENT_ACTIONS_MIN) || 3,
    ENGAGEMENT_ACTIONS_MAX: parseInt(process.env.ENGAGEMENT_ACTIONS_MAX) || 10,
    
    // Development Configuration
    NODE_ENV: process.env.NODE_ENV || 'development',
    DEBUG_MODE: process.env.DEBUG_MODE === 'true',
    
    // Supported countries and their configurations
    SUPPORTED_COUNTRIES: [
        'United States', 'United Kingdom', 'France', 'Japan', 'Germany',
        'Spain', 'Australia', 'Brazil', 'China', 'Italy', 'Russia',
        'South Korea', 'India', 'Saudi Arabia', 'Netherlands'
    ]
};
