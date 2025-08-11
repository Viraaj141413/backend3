
# YouTube View Bot - Advanced Browser Automation

A sophisticated YouTube view bot built with Node.js, Express, Socket.IO, and Playwright. Features ultra-fast 5-10ms screenshots, advanced human behavior simulation, and global browser fingerprinting.

## 🚀 Features

- **Ultra-Fast Screenshots**: Real-time browser monitoring with 5-10ms update intervals
- **Advanced Human Behavior**: Realistic mouse movements, scrolling patterns, and interaction behaviors
- **Global Browser Fingerprints**: 15+ country-specific user agents with realistic device profiles
- **Real-time Updates**: WebSocket-based live status and screenshot streaming
- **Anti-Detection**: Advanced fingerprint spoofing and browser automation detection bypass
- **Configurable Settings**: Environment variable support for easy customization

## 🌍 Supported Countries

🇺🇸 United States | 🇬🇧 United Kingdom | 🇫🇷 France | 🇯🇵 Japan | 🇩🇪 Germany | 🇪🇸 Spain | 🇦🇺 Australia | 🇧🇷 Brazil | 🇨🇳 China | 🇮🇹 Italy | 🇷🇺 Russia | 🇰🇷 South Korea | 🇮🇳 India | 🇸🇦 Saudi Arabia | 🇳🇱 Netherlands

## 🛠️ Installation

1. **Clone the repository** (if using Git)
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Start the application**:
   ```bash
   npm start
   ```

## 🔧 Configuration

The application supports environment variables for customization:

### Server Configuration
- `PORT` - Server port (default: 3000)
- `HOST` - Server host (default: 0.0.0.0)
- `NODE_ENV` - Environment mode (default: development)

### Bot Configuration
- `MAX_VIEWS` - Maximum views per session (default: 100)
- `MIN_VIEWS` - Minimum views per session (default: 1)
- `DEBUG_MODE` - Enable debug logging (default: false)

### Timing Configuration
- `MIN_WATCH_DURATION` - Minimum video watch time in ms (default: 45000)
- `MAX_WATCH_DURATION` - Maximum video watch time in ms (default: 105000)
- `MIN_BREAK_TIME` - Minimum break between views in ms (default: 10000)
- `MAX_BREAK_TIME` - Maximum break between views in ms (default: 15000)

### Browser Configuration
- `HEADLESS_MODE` - Run browser in headless mode (default: true)
- `BROWSER_TIMEOUT` - Browser operation timeout in ms (default: 60000)

## 🖥️ Usage

1. **Open your browser** and navigate to `http://localhost:3000`
2. **Enter a YouTube URL** (supports standard videos and YouTube Shorts)
3. **Set the number of views** (1-100)
4. **Click "Start Advanced View Bot"**
5. **Monitor real-time progress** with ultra-fast screenshots and status updates

### Supported URL Formats
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/shorts/VIDEO_ID`

## 🔍 API Endpoints

- `GET /` - Main application interface
- `GET /health` - Health check endpoint
- `GET /api/status` - Service status and configuration
- `POST /start` - Start view bot with URL and view count

## 🏗️ Architecture

- **Backend**: Node.js with Express server
- **Real-time Communication**: Socket.IO for live updates
- **Browser Automation**: Playwright with Chromium
- **Frontend**: Vanilla JavaScript with modern CSS animations
- **Configuration**: Environment-based configuration system

## 🔒 Security Features

- **Fingerprint Spoofing**: Advanced browser fingerprint randomization
- **Anti-Detection**: Removal of automation traces and realistic behavior patterns
- **IP Rotation**: Random IP simulation through headers
- **Realistic Timing**: Human-like delays and interaction patterns

## 🚀 Development

### Available Scripts
- `npm start` - Start the production server
- `npm run dev` - Start development server with auto-reload (if nodemon is installed)

### Project Structure
```
├── static/
│   └── index.html          # Frontend interface
├── server.js               # Main server application
├── config.js               # Configuration management
├── package.json            # Project dependencies
└── README.md               # Project documentation
```

## ⚠️ Important Notes

- This tool is for educational purposes and testing only
- Respect YouTube's Terms of Service and rate limits
- Use responsibly and ethically
- Monitor your usage to avoid detection

## 🔧 Troubleshooting

1. **Connection Issues**: Check if port 3000 is available
2. **Browser Errors**: Ensure Playwright dependencies are installed correctly
3. **Performance**: Reduce screenshot frequency for better performance
4. **Memory Usage**: Monitor system resources during heavy usage

## 📄 License

This project is for educational purposes only. Use responsibly.
