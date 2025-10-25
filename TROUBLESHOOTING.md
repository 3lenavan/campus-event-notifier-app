# QR Code Troubleshooting Guide

## 🔧 **Common QR Code Issues & Solutions**

### **1. "Unable to load" or "Connection failed" errors**

**Solution:**
- Ensure your phone and computer are on the same WiFi network
- Try using the tunnel connection: `npx expo start --tunnel`
- Check if your firewall is blocking the connection

### **2. "Metro bundler" errors**

**Solution:**
- Clear cache: `npx expo start --clear`
- Reset cache: `npx expo start --reset-cache`
- Kill all Node processes: `taskkill /f /im node.exe` (Windows)

### **3. "Package.json not found" errors**

**Solution:**
- Ensure you're running from the project root directory
- Check that `package.json` exists in the root
- Clear Expo cache and restart

### **4. App crashes on startup**

**Solution:**
- Check for JavaScript errors in the Metro bundler console
- Ensure all dependencies are installed: `npm install`
- Check for TypeScript errors: `npx expo lint`

### **5. QR Code not scanning**

**Solution:**
- Try typing the URL manually in Expo Go
- Use the "Enter URL manually" option in Expo Go
- Ensure Expo Go app is updated to the latest version

## 🚀 **Recommended Startup Sequence**

1. **Kill existing processes:**
   ```bash
   taskkill /f /im node.exe
   ```

2. **Clear cache and start:**
   ```bash
   npx expo start --clear --reset-cache
   ```

3. **If still having issues, try tunnel mode:**
   ```bash
   npx expo start --tunnel
   ```

## 📱 **Testing Steps**

1. **Install Expo Go** on your phone from App Store/Play Store
2. **Scan QR code** with Expo Go app (not camera app)
3. **Check console** for any error messages
4. **Try different network** if connection issues persist

## 🔍 **Debug Information**

- **Metro bundler URL:** Usually `http://localhost:8081`
- **Tunnel URL:** Provided when using `--tunnel` flag
- **Network requirements:** Same WiFi network for local development
