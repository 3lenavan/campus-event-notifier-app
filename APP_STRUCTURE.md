# App Structure - Cleaned Up

## 📁 **Current Structure (After Cleanup)**

### **App Routes (`/app/`)**
- `index.tsx` - Landing/login page
- `_layout.tsx` - Root layout
- `settings.tsx` - Settings page
- `signup.tsx` - Signup page  
- `update-email.tsx` - Update email page
- `update-password.tsx` - Update password page
- `verify-club.tsx` - Club verification page (wrapper)
- `event-card.tsx` - Event card component
- `event-details-screen.tsx` - Event details page

### **Tab Routes (`/app/(tabs)/`)**
- `_layout.tsx` - Tab layout with navigation
- `home.tsx` - Home feed
- `discover.tsx` - Discover clubs/events
- `create-event.tsx` - Create event (tab)
- `profile.tsx` - User profile

### **Source Pages (`/src/pages/`)**
- `Login.tsx` - Login component
- `CreateEvent.tsx` - Create event component
- `VerifyClub.tsx` - Club verification component
- `EventPolicyDemo.tsx` - Event policy demo

### **Components (`/src/components/`)**
- `EventCreationSettings.tsx` - Settings panel
- `index.ts` - Barrel export

### **Services (`/src/services/`)**
- `eventsService.ts` - Event management
- `profileService.ts` - Profile management

### **Lib (`/src/lib/`)**
- `eventPolicy.ts` - Event policy management
- `localStorage.ts` - Local storage utilities
- `hash.ts` - Hashing utilities
- `firebase.ts` - Firebase configuration
- `index.ts` - Barrel export

## ✅ **Removed Duplicates**
- ❌ `app/create-event.tsx` (duplicate of tab version)
- ❌ `app/login.tsx` (duplicate of src/pages/Login.tsx)

## 🎯 **Consistent Pattern**
- **App routes**: Simple wrappers that import from `src/pages/`
- **Tab routes**: Full implementations for main navigation
- **Source pages**: Reusable components
- **Components**: UI components with barrel exports
- **Services**: Business logic
- **Lib**: Utilities and configurations

## 📱 **Navigation Flow**
1. **Landing** → `index.tsx` (login/signup)
2. **Main App** → Tab navigation (home, discover, create-event, profile)
3. **Settings** → `settings.tsx` → Various update pages
4. **Club Verification** → `verify-club.tsx` → `VerifyClub` component
