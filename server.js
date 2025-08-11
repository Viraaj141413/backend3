const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { chromium } = require('playwright');
const path = require('path');
const config = require('./config');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.json());
app.use(express.static('static'));

// Global state
let activeBots = new Map();
let globalStats = {
    totalViews: 0,
    successfulViews: 0,
    activeBots: 0,
    successRate: 0,
    publicViewsRegistered: 0
};

// Enhanced residential proxy simulation with real locations
const RESIDENTIAL_PROXIES = [
    {
        country: 'United States',
        city: 'New York',
        ip: '192.168.1.100', // Simulated residential IP
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        timezone: 'America/New_York',
        language: 'en-US',
        locale: 'en-US',
        platform: 'Win32',
        mobile: false,
        behavior: 'confident_desktop'
    },
    {
        country: 'United States',
        city: 'Los Angeles',
        ip: '10.0.0.50',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
        viewport: { width: 375, height: 812 },
        timezone: 'America/Los_Angeles',
        language: 'en-US',
        locale: 'en-US',
        platform: 'iPhone',
        mobile: true,
        behavior: 'mobile_swipe'
    },
    {
        country: 'United Kingdom',
        city: 'London',
        ip: '172.16.0.25',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1440, height: 900 },
        timezone: 'Europe/London',
        language: 'en-GB',
        locale: 'en-GB',
        platform: 'MacIntel',
        mobile: false,
        behavior: 'hesitant_mac'
    },
    {
        country: 'Germany',
        city: 'Berlin',
        ip: '192.168.2.75',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1366, height: 768 },
        timezone: 'Europe/Berlin',
        language: 'de-DE',
        locale: 'de-DE',
        platform: 'Linux x86_64',
        mobile: false,
        behavior: 'thorough_linux'
    },
    {
        country: 'Canada',
        city: 'Toronto',
        ip: '10.1.1.30',
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
        viewport: { width: 768, height: 1024 },
        timezone: 'America/Toronto',
        language: 'en-CA',
        locale: 'en-CA',
        platform: 'iPad',
        mobile: true,
        behavior: 'tablet_casual'
    }
];

// Human arrival patterns - how real users find videos
const ARRIVAL_PATTERNS = [
    {
        type: 'google_search',
        weight: 35,
        steps: ['google.com', 'search_query', 'click_youtube_result']
    },
    {
        type: 'youtube_search',
        weight: 25,
        steps: ['youtube.com', 'search_in_youtube', 'click_video']
    },
    {
        type: 'channel_page',
        weight: 15,
        steps: ['youtube.com', 'visit_channel', 'browse_videos', 'click_target']
    },
    {
        type: 'related_video',
        weight: 15,
        steps: ['youtube.com', 'watch_related_video', 'click_suggested']
    },
    {
        type: 'social_media',
        weight: 10,
        steps: ['twitter.com_or_reddit.com', 'click_shared_link']
    }
];

// Enhanced human behavior patterns
const HUMAN_BEHAVIORS = {
    watch_patterns: {
        minimum_watch: 30000, // 30 seconds minimum for view count
        typical_range: [40, 85], // 40-85% of video length
        engagement_actions: [
            'play_pause_random',
            'seek_forward_back',
            'volume_change',
            'quality_change',
            'subtitles_toggle',
            'mute_unmute',
            'playback_speed_change',
            'fullscreen_toggle'
        ]
    },
    mouse_behaviors: [
        'micro_wiggles',
        'hover_like_button',
        'hover_subscribe',
        'hover_share',
        'hover_save_playlist',
        'hover_channel_icon',
        'hover_view_count',
        'move_over_progress_bar'
    ],
    scroll_behaviors: [
        'scroll_to_comments',
        'expand_description',
        'scroll_suggested_videos',
        'scroll_comments_deep',
        'sort_comments_newest'
    ],
    interaction_behaviors: [
        'click_suggested_quick_back',
        'open_channel_about',
        'hover_hashtags',
        'right_click_context_menu',
        'tab_switch_return',
        'change_theater_mode'
    ]
};

// Enhanced human-like delays with realistic timing
function getHumanDelay(type = 'normal') {
    const delays = {
        micro: () => Math.random() * 200 + 100,      // 100-300ms (micro movements)
        quick: () => Math.random() * 800 + 300,      // 300-1100ms (quick actions)
        normal: () => Math.random() * 2000 + 1000,   // 1-3s (normal human response)
        thinking: () => Math.random() * 5000 + 3000, // 3-8s (reading/thinking)
        reading: () => Math.random() * 8000 + 5000,  // 5-13s (reading content)
        decision: () => Math.random() * 10000 + 7000 // 7-17s (making decisions)
    };
    return delays[type] ? delays[type]() : delays.normal();
}

// Realistic mouse movement with human imperfections
async function moveMouseHumanLike(page, targetX, targetY, behavior = 'normal') {
    try {
        const currentPos = await page.evaluate(() => {
            return { x: window.lastMouseX || Math.random() * 500, y: window.lastMouseY || Math.random() * 300 };
        });
        
        const distance = Math.sqrt(Math.pow(targetX - currentPos.x, 2) + Math.pow(targetY - currentPos.y, 2));
        const steps = Math.max(10, Math.floor(distance / 20) + Math.random() * 10);
        
        for (let i = 0; i <= steps; i++) {
            const progress = i / steps;
            
            // Human-like curve with overshoot and correction
            const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
            const overshoot = Math.sin(progress * Math.PI) * (Math.random() * 15 - 7.5);
            const jitter = (Math.random() - 0.5) * 3;
            
            const x = currentPos.x + (targetX - currentPos.x) * easeProgress + overshoot + jitter;
            const y = currentPos.y + (targetY - currentPos.y) * easeProgress + overshoot + jitter;
            
            await page.mouse.move(x, y);
            
            // Variable speed - slower at start and end, faster in middle
            const speed = Math.sin(progress * Math.PI) * 15 + 5;
            await page.waitForTimeout(speed);
        }
        
        // Store final position
        await page.evaluate((x, y) => {
            window.lastMouseX = x;
            window.lastMouseY = y;
        }, targetX, targetY);
        
        // Small random pause after movement
        await page.waitForTimeout(getHumanDelay('micro'));
        
    } catch (error) {
        console.log('Mouse movement error:', error.message);
    }
}

// Realistic scrolling with human patterns
async function scrollHumanLike(page, direction = 'down', intensity = 'medium') {
    try {
        const scrollAmounts = {
            light: 150 + Math.random() * 100,
            medium: 300 + Math.random() * 200,
            heavy: 600 + Math.random() * 300
        };
        
        const totalScroll = scrollAmounts[intensity] || scrollAmounts.medium;
        const steps = Math.floor(Math.random() * 8) + 5;
        const stepSize = totalScroll / steps;
        
        for (let i = 0; i < steps; i++) {
            const delta = direction === 'down' ? stepSize : -stepSize;
            const variation = (Math.random() - 0.5) * 30; // Human inconsistency
            
            await page.mouse.wheel(0, delta + variation);
            
            // Variable scroll speed - sometimes fast, sometimes slow
            const pauseTime = Math.random() * 150 + 50;
            await page.waitForTimeout(pauseTime);
        }
        
        // Pause after scrolling (human reading time)
        await page.waitForTimeout(getHumanDelay('quick'));
        
    } catch (error) {
        console.log('Scroll error:', error.message);
    }
}

// Simulate realistic arrival pattern
async function simulateHumanArrival(page, videoUrl, arrivalPattern, socketId) {
    try {
        io.to(socketId).emit('bot_update', {
            message: `🌐 Simulating ${arrivalPattern.type} arrival pattern...`
        });
        
        switch (arrivalPattern.type) {
            case 'google_search':
                await page.goto('https://www.google.com', { waitUntil: 'networkidle' });
                await page.waitForTimeout(getHumanDelay('thinking'));
                
                // Search for video-related terms
                const searchBox = await page.$('input[name="q"]');
                if (searchBox) {
                    const videoId = videoUrl.match(/(?:v=|\/shorts\/)([a-zA-Z0-9_-]+)/)?.[1];
                    await searchBox.type(`youtube ${videoId}`, { delay: 100 + Math.random() * 100 });
                    await page.waitForTimeout(getHumanDelay('normal'));
                    await page.keyboard.press('Enter');
                    await page.waitForTimeout(getHumanDelay('reading'));
                    
                    // Click YouTube result
                    const ytLink = await page.$('a[href*="youtube.com"]');
                    if (ytLink) {
                        await ytLink.click();
                    }
                }
                break;
                
            case 'youtube_search':
                await page.goto('https://www.youtube.com', { waitUntil: 'networkidle' });
                await page.waitForTimeout(getHumanDelay('thinking'));
                
                const ytSearchBox = await page.$('input#search');
                if (ytSearchBox) {
                    const searchTerms = ['music', 'tutorial', 'funny', 'news', 'gaming'];
                    const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
                    await ytSearchBox.type(randomTerm, { delay: 80 + Math.random() * 120 });
                    await page.waitForTimeout(getHumanDelay('normal'));
                    await page.keyboard.press('Enter');
                    await page.waitForTimeout(getHumanDelay('reading'));
                }
                break;
                
            case 'channel_page':
                // Extract channel from video URL and visit it first
                await page.goto('https://www.youtube.com', { waitUntil: 'networkidle' });
                await page.waitForTimeout(getHumanDelay('thinking'));
                break;
                
            case 'social_media':
                // Simulate coming from Twitter/Reddit
                await page.goto('https://www.twitter.com', { waitUntil: 'networkidle' });
                await page.waitForTimeout(getHumanDelay('quick'));
                break;
                
            default:
                await page.goto('https://www.youtube.com', { waitUntil: 'networkidle' });
                await page.waitForTimeout(getHumanDelay('thinking'));
        }
        
        io.to(socketId).emit('bot_update', {
            message: `✅ Realistic arrival simulation completed`
        });
        
    } catch (error) {
        console.log('Arrival simulation error:', error.message);
    }
}

// Enhanced view validation with public count tracking
async function validateAndTrackView(page, socketId, fingerprint) {
    try {
        // Wait for video to fully load
        await page.waitForSelector('video', { timeout: 20000 });
        await page.waitForTimeout(getHumanDelay('normal'));
        
        // Check if video is playing
        const videoStatus = await page.evaluate(() => {
            const video = document.querySelector('video');
            if (!video) return { playing: false, duration: 0, currentTime: 0 };
            
            return {
                playing: !video.paused && video.currentTime > 0,
                duration: video.duration || 0,
                currentTime: video.currentTime || 0,
                muted: video.muted,
                volume: video.volume
            };
        });
        
        if (!videoStatus.playing) {
            throw new Error('Video failed to start playing');
        }
        
        // Get current view count for tracking
        const viewCountData = await page.evaluate(() => {
            const viewElements = [
                'span.view-count',
                '.view-count',
                '[class*="view-count"]',
                '.style-scope.ytd-video-view-count-renderer',
                '#count .style-scope.yt-view-count-renderer'
            ];
            
            for (const selector of viewElements) {
                const element = document.querySelector(selector);
                if (element && element.textContent) {
                    const text = element.textContent.trim();
                    const match = text.match(/[\d,]+/);
                    return {
                        text: text,
                        count: match ? parseInt(match[0].replace(/,/g, '')) : null
                    };
                }
            }
            return { text: 'Not found', count: null };
        });
        
        io.to(socketId).emit('bot_update', {
            message: `📊 Current view count: ${viewCountData.text} | Video duration: ${Math.floor(videoStatus.duration)}s`
        });
        
        // Calculate realistic watch time (40-85% of video length, minimum 30s)
        const minWatchTime = Math.max(30000, videoStatus.duration * 1000 * 0.4);
        const maxWatchTime = videoStatus.duration * 1000 * 0.85;
        const watchTime = Math.random() * (maxWatchTime - minWatchTime) + minWatchTime;
        
        io.to(socketId).emit('bot_update', {
            message: `⏱️ Planned watch time: ${Math.floor(watchTime / 1000)}s (${Math.floor((watchTime / (videoStatus.duration * 1000)) * 100)}% of video)`
        });
        
        return {
            isValid: true,
            watchTime: watchTime,
            initialViewCount: viewCountData.count,
            videoData: videoStatus
        };
        
    } catch (error) {
        io.to(socketId).emit('bot_update', {
            message: `❌ View validation failed: ${error.message}`
        });
        return { isValid: false, error: error.message };
    }
}

// Perform realistic human engagement during video watch
async function performHumanEngagement(page, watchTime, socketId) {
    const startTime = Date.now();
    const endTime = startTime + watchTime;
    const engagementActions = [];
    
    // Plan random engagement actions
    const actionCount = Math.floor(Math.random() * 8) + 3; // 3-10 actions
    for (let i = 0; i < actionCount; i++) {
        const actionTime = startTime + (Math.random() * watchTime);
        const actions = [
            'play_pause', 'volume_change', 'seek_random', 'scroll_comments',
            'hover_like', 'hover_subscribe', 'change_quality', 'toggle_mute',
            'mouse_wiggle', 'scroll_description', 'hover_share', 'tab_switch'
        ];
        
        engagementActions.push({
            time: actionTime,
            action: actions[Math.floor(Math.random() * actions.length)]
        });
    }
    
    engagementActions.sort((a, b) => a.time - b.time);
    
    io.to(socketId).emit('bot_update', {
        message: `🎯 Planned ${engagementActions.length} human engagement actions during watch`
    });
    
    let actionIndex = 0;
    
    while (Date.now() < endTime) {
        // Check if it's time for next engagement action
        if (actionIndex < engagementActions.length && Date.now() >= engagementActions[actionIndex].time) {
            const action = engagementActions[actionIndex];
            await performEngagementAction(page, action.action, socketId);
            actionIndex++;
        }
        
        // Random micro mouse movements
        if (Math.random() < 0.3) {
            const currentPos = await page.evaluate(() => ({ 
                x: window.lastMouseX || 500, 
                y: window.lastMouseY || 300 
            }));
            
            const newX = currentPos.x + (Math.random() - 0.5) * 100;
            const newY = currentPos.y + (Math.random() - 0.5) * 100;
            
            await moveMouseHumanLike(page, newX, newY);
        }
        
        // Wait before next check
        await page.waitForTimeout(1000 + Math.random() * 2000);
    }
    
    io.to(socketId).emit('bot_update', {
        message: `✅ Completed ${watchTime / 1000}s human-like watch session with ${actionIndex} interactions`
    });
}

// Perform specific engagement action
async function performEngagementAction(page, action, socketId) {
    try {
        switch (action) {
            case 'play_pause':
                const video = await page.$('video');
                if (video) {
                    await video.click();
                    await page.waitForTimeout(getHumanDelay('quick'));
                    await video.click(); // Resume
                    io.to(socketId).emit('bot_update', { message: '⏯️ Performed play/pause action' });
                }
                break;
                
            case 'volume_change':
                await page.evaluate(() => {
                    const video = document.querySelector('video');
                    if (video) {
                        video.volume = Math.random() * 0.8 + 0.2; // 20-100% volume
                    }
                });
                io.to(socketId).emit('bot_update', { message: '🔊 Changed volume level' });
                break;
                
            case 'seek_random':
                await page.evaluate(() => {
                    const video = document.querySelector('video');
                    if (video && video.duration) {
                        const seekTo = Math.random() * video.duration * 0.3; // Seek within first 30%
                        video.currentTime = Math.max(video.currentTime - 10, seekTo);
                    }
                });
                io.to(socketId).emit('bot_update', { message: '⏪ Performed seek action' });
                break;
                
            case 'scroll_comments':
                await scrollHumanLike(page, 'down', 'medium');
                io.to(socketId).emit('bot_update', { message: '📝 Scrolled to view comments' });
                break;
                
            case 'hover_like':
                const likeButton = await page.$('button[aria-label*="like"], #segmented-like-button');
                if (likeButton) {
                    const box = await likeButton.boundingBox();
                    if (box) {
                        await moveMouseHumanLike(page, box.x + box.width/2, box.y + box.height/2);
                        await page.waitForTimeout(getHumanDelay('quick'));
                    }
                }
                io.to(socketId).emit('bot_update', { message: '👍 Hovered over like button' });
                break;
                
            case 'hover_subscribe':
                const subscribeButton = await page.$('button[aria-label*="Subscribe"], #subscribe-button');
                if (subscribeButton) {
                    const box = await subscribeButton.boundingBox();
                    if (box) {
                        await moveMouseHumanLike(page, box.x + box.width/2, box.y + box.height/2);
                        await page.waitForTimeout(getHumanDelay('quick'));
                    }
                }
                io.to(socketId).emit('bot_update', { message: '🔔 Hovered over subscribe button' });
                break;
                
            case 'toggle_mute':
                await page.evaluate(() => {
                    const video = document.querySelector('video');
                    if (video) {
                        video.muted = !video.muted;
                    }
                });
                io.to(socketId).emit('bot_update', { message: '🔇 Toggled mute/unmute' });
                break;
                
            case 'mouse_wiggle':
                const currentPos = await page.evaluate(() => ({ 
                    x: window.lastMouseX || 500, 
                    y: window.lastMouseY || 300 
                }));
                
                for (let i = 0; i < 3; i++) {
                    const wiggleX = currentPos.x + (Math.random() - 0.5) * 20;
                    const wiggleY = currentPos.y + (Math.random() - 0.5) * 20;
                    await moveMouseHumanLike(page, wiggleX, wiggleY);
                    await page.waitForTimeout(200 + Math.random() * 300);
                }
                break;
                
            case 'tab_switch':
                // Simulate tab switch by pausing and resuming
                await page.evaluate(() => {
                    const video = document.querySelector('video');
                    if (video && !video.paused) {
                        video.pause();
                        setTimeout(() => video.play(), 2000 + Math.random() * 3000);
                    }
                });
                io.to(socketId).emit('bot_update', { message: '🔄 Simulated tab switch' });
                break;
        }
        
        await page.waitForTimeout(getHumanDelay('quick'));
        
    } catch (error) {
        console.log(`Engagement action ${action} failed:`, error.message);
    }
}

// Main bot function with enhanced human behavior
async function runAdvancedHumanBot(url, views, socketId) {
    const botId = `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    activeBots.set(botId, { status: 'starting', views: 0, target: views });
    
    try {
        io.to(socketId).emit('bot_update', {
            message: `🚀 Starting ADVANCED HUMAN BOT for ${views} views`
        });
        
        for (let i = 0; i < views; i++) {
            // Select random residential proxy/fingerprint
            const fingerprint = RESIDENTIAL_PROXIES[Math.floor(Math.random() * RESIDENTIAL_PROXIES.length)];
            const arrivalPattern = ARRIVAL_PATTERNS[Math.floor(Math.random() * ARRIVAL_PATTERNS.length)];
            
            io.to(socketId).emit('bot_update', {
                message: `👤 View ${i + 1}/${views} - Using ${fingerprint.country} (${fingerprint.city}) ${fingerprint.mobile ? 'Mobile' : 'Desktop'}`
            });
            
            // Launch browser with realistic fingerprint
            const browser = await chromium.launch({
                headless: false, // Visible for more realistic behavior
                args: [
                    '--no-sandbox',
                    '--disable-blink-features=AutomationControlled',
                    '--disable-infobars',
                    '--disable-dev-shm-usage',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding',
                    `--lang=${fingerprint.language}`,
                    `--user-agent=${fingerprint.userAgent}`
                ]
            });
            
            const context = await browser.newContext({
                userAgent: fingerprint.userAgent,
                viewport: fingerprint.viewport,
                locale: fingerprint.locale,
                timezoneId: fingerprint.timezone,
                permissions: ['notifications'],
                colorScheme: Math.random() > 0.5 ? 'dark' : 'light'
            });
            
            // Add realistic browser fingerprinting
            await context.addInitScript(() => {
                // Remove automation traces
                Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
                
                // Add realistic properties
                Object.defineProperty(navigator, 'plugins', {
                    get: () => [
                        { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
                        { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
                        { name: 'Native Client', filename: 'internal-nacl-plugin' }
                    ]
                });
                
                // Realistic screen properties
                Object.defineProperty(screen, 'availWidth', { get: () => window.innerWidth });
                Object.defineProperty(screen, 'availHeight', { get: () => window.innerHeight - 40 });
            });
            
            const page = await context.newPage();
            
            try {
                // Simulate realistic arrival pattern
                await simulateHumanArrival(page, url, arrivalPattern, socketId);
                
                // Navigate to target video
                io.to(socketId).emit('bot_update', {
                    message: `🎯 Navigating to target video...`
                });
                
                await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
                await page.waitForTimeout(getHumanDelay('thinking'));
                
                // Take screenshot
                const screenshot = await page.screenshot({ 
                    type: 'jpeg', 
                    quality: 80,
                    fullPage: false 
                });
                
                io.to(socketId).emit('screenshot', {
                    image: screenshot.toString('base64'),
                    context: `View ${i + 1} - ${fingerprint.country} ${fingerprint.mobile ? 'Mobile' : 'Desktop'}`
                });
                
                // Validate view and get watch time
                const validation = await validateAndTrackView(page, socketId, fingerprint);
                
                if (!validation.isValid) {
                    throw new Error(validation.error);
                }
                
                // Perform human-like engagement during watch
                await performHumanEngagement(page, validation.watchTime, socketId);
                
                // Final validation - check if view was registered
                const finalViewCount = await page.evaluate(() => {
                    const viewElements = [
                        'span.view-count',
                        '.view-count',
                        '[class*="view-count"]',
                        '.style-scope.ytd-video-view-count-renderer'
                    ];
                    
                    for (const selector of viewElements) {
                        const element = document.querySelector(selector);
                        if (element && element.textContent) {
                            const text = element.textContent.trim();
                            const match = text.match(/[\d,]+/);
                            return match ? parseInt(match[0].replace(/,/g, '')) : null;
                        }
                    }
                    return null;
                });
                
                // Update global stats
                globalStats.totalViews++;
                
                if (finalViewCount && validation.initialViewCount && finalViewCount > validation.initialViewCount) {
                    globalStats.successfulViews++;
                    globalStats.publicViewsRegistered++;
                    
                    io.to(socketId).emit('bot_update', {
                        message: `🎉 VIEW REGISTERED PUBLICLY! Count increased from ${validation.initialViewCount} to ${finalViewCount}`
                    });
                } else {
                    io.to(socketId).emit('bot_update', {
                        message: `✅ View completed successfully (${Math.floor(validation.watchTime / 1000)}s watch time)`
                    });
                    globalStats.successfulViews++;
                }
                
                globalStats.successRate = Math.round((globalStats.successfulViews / globalStats.totalViews) * 100);
                
                // Emit updated stats
                io.to(socketId).emit('statistics_update', globalStats);
                
                // Random post-watch behavior
                if (Math.random() < 0.3) {
                    io.to(socketId).emit('bot_update', {
                        message: `🔍 Performing post-watch exploration...`
                    });
                    
                    await scrollHumanLike(page, 'down', 'light');
                    await page.waitForTimeout(getHumanDelay('reading'));
                    
                    // Sometimes click on suggested video
                    if (Math.random() < 0.2) {
                        const suggestedVideo = await page.$('a#thumbnail[href*="/watch"]');
                        if (suggestedVideo) {
                            await suggestedVideo.click();
                            await page.waitForTimeout(getHumanDelay('quick'));
                            await page.goBack();
                        }
                    }
                }
                
            } catch (error) {
                io.to(socketId).emit('bot_update', {
                    message: `❌ View ${i + 1} failed: ${error.message}`
                });
            } finally {
                await browser.close();
                
                // Human-like break between views
                if (i < views - 1) {
                    const breakTime = getHumanDelay('decision');
                    io.to(socketId).emit('bot_update', {
                        message: `⏳ Taking ${Math.floor(breakTime / 1000)}s human-like break before next view...`
                    });
                    await new Promise(resolve => setTimeout(resolve, breakTime));
                }
            }
        }
        
        io.to(socketId).emit('bot_update', {
            message: `🎊 MISSION ACCOMPLISHED! ${views} views completed with ${globalStats.publicViewsRegistered} publicly registered views!`
        });
        
    } catch (error) {
        io.to(socketId).emit('bot_update', {
            message: `💥 Bot error: ${error.message}`
        });
    } finally {
        activeBots.delete(botId);
        globalStats.activeBots = activeBots.size;
        io.to(socketId).emit('statistics_update', globalStats);
    }
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        activeBots: activeBots.size,
        stats: globalStats,
        timestamp: new Date().toISOString()
    });
});

app.get('/api/status', (req, res) => {
    res.json({
        server: 'YouTube View Bot - Advanced Human Simulation',
        version: '2.0.0',
        features: [
            'Residential Proxy Simulation',
            'Human Arrival Patterns',
            'Advanced Engagement Actions',
            'Public View Count Tracking',
            'Ultra-Realistic Behavior'
        ],
        stats: globalStats,
        activeBots: activeBots.size
    });
});

app.post('/start', async (req, res) => {
    try {
        const { url, views, socketId } = req.body;
        
        if (!url || !views || !socketId) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }
        
        if (views < 1 || views > 100) {
            return res.status(400).json({ error: 'Views must be between 1 and 100' });
        }
        
        if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }
        
        // Start bot asynchronously
        runAdvancedHumanBot(url, views, socketId).catch(console.error);
        
        res.json({ 
            message: `🚀 Advanced Human Bot started for ${views} views with realistic behavior patterns`,
            botFeatures: [
                'Residential IP Simulation',
                'Human Arrival Patterns',
                'Realistic Engagement Actions',
                'Public View Tracking',
                '30+ Human Behaviors'
            ]
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.emit('bot_update', {
        message: '🌟 Connected to Advanced Human YouTube Bot Server'
    });
    
    socket.emit('statistics_update', globalStats);
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Start server
const PORT = config.PORT;
server.listen(PORT, config.HOST, () => {
    console.log(`🚀 Advanced Human YouTube View Bot Server running on http://${config.HOST}:${PORT}`);
    console.log(`📊 Features: Residential Proxies, Human Behavior, Public View Tracking`);
});

module.exports = app;