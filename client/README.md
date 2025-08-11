# YouTube View Bot - Client

Professional dark mode client for the YouTube View Bot system.

## Deployment Instructions

### Deploy Client to Netlify

1. **Prepare the client:**
   - The client is ready for deployment in the `/client` folder
   - Update the `BACKEND_URL` in `index.html` with your Railway backend URL

2. **Deploy to Netlify:**
   - Drag and drop the `/client` folder to Netlify
   - Or connect your GitHub repository and set build directory to `client`

### Deploy Backend to Railway

1. **Deploy the backend:**
   - Deploy the root directory (containing `server.js`) to Railway
   - Railway will automatically detect and run `node server.js`

2. **Update client configuration:**
   - Replace `https://your-railway-app.railway.app` in `index.html` with your actual Railway URL

## Features

- **Dark Mode UI**: Professional dark theme optimized for extended use
- **Real-time Monitoring**: Live browser screenshots and activity updates
- **Performance Optimized**: Reduced screenshot frequency for better performance
- **Responsive Design**: Works on desktop and mobile devices
- **Advanced Settings**: Toggle share behavior, quality modes, and validation
- **Live Statistics**: Real-time view success tracking

## Configuration

Update the backend URL in `index.html`:

```javascript
const BACKEND_URL = 'https://your-railway-app.railway.app';
```

## Client-only Features

- Modern dark mode interface
- Optimized performance
- Professional statistics dashboard
- Real-time browser monitoring
- Advanced settings panel