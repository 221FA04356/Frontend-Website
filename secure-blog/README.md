# Secure Blog Pages with Video Protection

This folder contains secure blog pages with integrated video security features based on the demo security implementation.

## Structure

```
secure-blog/
├── assets/
│   ├── css/
│   │   └── video-security.css    # Security styles for video protection
│   ├── js/
│   │   └── video-security.js     # Security JavaScript functionality
│   └── videos/
│       └── demo.mp4              # Demo video file (replace with your videos)
├── blog-secure.html              # Secure blog listing page
├── blog-details-secure.html      # Secure blog details page with video
└── README.md                     # This file
```

## Security Features

The secure blog pages include the following security features:

### 1. **Session Timer**
   - 5-minute session countdown
   - Automatically reloads when session expires
   - Displayed in top-right corner

### 2. **Moving Watermark**
   - Dynamic watermark that moves across the screen
   - Displays "DEMO ONLY" with timestamp
   - Prevents unauthorized sharing

### 3. **Tab/Focus Protection**
   - Video pauses when tab loses focus
   - Video blurs when window loses focus
   - Prevents background recording

### 4. **Screenshot Protection**
   - Blur overlay activates on screenshot attempts
   - Detects PrintScreen key and Mac screenshot shortcuts
   - Protects against snipping tools

### 5. **Screen Recording Blocking**
   - Blocks screen capture APIs
   - Detects recording software
   - Prevents screen recording

### 6. **Developer Tools Blocking**
   - Prevents F12 and DevTools shortcuts
   - Blocks right-click context menu
   - Prevents source code viewing

### 7. **Video Controls Restriction**
   - Disables download option
   - Prevents picture-in-picture
   - Restricts video control access

### 8. **Recording Quality Disruption**
   - Random opacity changes to break recording
   - Makes recorded content less usable

## Usage

### Adding Your Videos

1. Replace the demo video file:
   - Place your video files in `secure-blog/assets/videos/`
   - Update the video source in `blog-details-secure.html`:
     ```html
     <source src="assets/videos/your-video.mp4" type="video/mp4">
     ```

### Customizing Session Time

To change the session duration, edit `secure-blog/assets/js/video-security.js`:

```javascript
let remaining = 300; // Change 300 to desired seconds (e.g., 600 for 10 minutes)
```

### Customizing Watermark Text

Edit the watermark text in `secure-blog/assets/js/video-security.js`:

```javascript
wm.innerText =
  "YOUR CUSTOM TEXT\n" +
  new Date().toLocaleTimeString() +
  "\nAdditional Message";
```

## Integration with Main Site

The secure blog pages are designed to work with the main website:

- Links in navigation point to secure blog pages
- Assets reference the main site's CSS and JS files using relative paths (`../assets/`)
- Maintains consistent design with the main site

## File Paths

All paths are relative:
- Main site assets: `../assets/`
- Secure blog assets: `assets/`
- Navigation links: Use relative paths from secure-blog folder

## Browser Compatibility

These security features work best on modern browsers:
- Chrome/Edge (Chromium)
- Firefox
- Safari

**Note:** Some security features may be bypassed by advanced users or browser extensions. These features provide basic protection but are not 100% foolproof.

## Important Notes

1. **Not 100% Secure**: These features provide basic protection but can be bypassed by determined users
2. **Performance**: Some features (like opacity changes) may impact performance slightly
3. **User Experience**: Some security features may affect legitimate user interactions
4. **Video Format**: Ensure videos are in MP4 format or provide multiple format sources

## Support

For questions or issues, refer to the main project documentation or contact the development team.

