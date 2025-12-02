**For Elena**
You'll need to create a Supabase Storage bucket named event-images:
Go to your Supabase dashboard
Navigate to Storage
Create a new bucket called event-images
Set it to Public (or configure RLS policies for authenticated users)
---

# How to Import .ics Files to Your Calendar

## 📱 **On Mobile (iOS/Android)**

### **iOS (iPhone/iPad):**

**Method 1: Direct Import (Recommended)**
1. Tap "Add to Calendar" button in the app
2. When the share menu appears, tap **"Add to Calendar"** (if available)
3. The event will open directly in the Calendar app
4. Review the details and tap **"Add"**

**Method 2: Save to Files**
1. Tap "Add to Calendar" button
2. In the share menu, tap **"Save to Files"**
3. Choose a location (iCloud Drive or On My iPhone)
4. Open the **Files** app
5. Find and tap the `.ics` file
6. Tap **"Add to Calendar"**

**Method 3: Email to Yourself**
1. Tap "Add to Calendar" button
2. In the share menu, tap **"Mail"**
3. Email the file to yourself
4. Open the email on your iPhone
5. Tap the `.ics` attachment
6. Tap **"Add to Calendar"**

### **Android:**

**Method 1: Direct Import (Recommended)**
1. Tap "Add to Calendar" button in the app
2. When the share menu appears, tap **"Google Calendar"** (if available)
3. The event will open in Google Calendar
4. Review and save

**Method 2: Download and Open**
1. Tap "Add to Calendar" button
2. In the share menu, tap **"Save"** or **"Download"**
3. Open your **Files** or **Downloads** app
4. Find the `.ics` file
5. Tap it - Android will ask which app to open it with
6. Choose **"Google Calendar"** or your preferred calendar app

**Method 3: Email to Yourself**
1. Tap "Add to Calendar" button
2. In the share menu, tap **"Gmail"** or **"Email"**
3. Email the file to yourself
4. Open the email on your Android device
5. Tap the `.ics` attachment
6. Choose **"Google Calendar"** to open it

## 💻 **On Web/Desktop**

### **Google Calendar (Web):**

1. Download the `.ics` file from the app
2. Go to [calendar.google.com](https://calendar.google.com)
3. Click the **⚙️ Settings** (gear icon) in the top right
4. Click **"Settings"** in the dropdown
5. In the left sidebar, click **"Add calendar"** → **"Import"**
6. Click **"Select file from your computer"**
7. Choose the downloaded `.ics` file
8. Select which calendar to add it to
9. Click **"Import"**

### **Apple Calendar (Mac):**

1. Download the `.ics` file from the app
2. Double-click the `.ics` file
3. It will automatically open in Calendar app
4. Review the event details
5. Click **"Add"** or **"OK"**

### **Apple Calendar (iCloud.com):**

1. Download the `.ics` file from the app
2. Go to [icloud.com/calendar](https://icloud.com/calendar)
3. Click the **⚙️ Settings** (gear icon) in the bottom left
4. Click **"Import Calendar"**
5. Choose the downloaded `.ics` file
6. Click **"Import"**

### **Outlook (Web):**

1. Download the `.ics` file from the app
2. Go to [outlook.com/calendar](https://outlook.com/calendar)
3. Click **"Add calendar"** → **"Upload from file"**
4. Choose the downloaded `.ics` file
5. Click **"Import"**

### **Outlook (Desktop App):**

1. Download the `.ics` file from the app
2. Open Outlook
3. Go to **File** → **Open & Export** → **Import/Export**
4. Select **"Import an iCalendar (.ics) or vCalendar file"**
5. Choose the downloaded `.ics` file
6. Click **"Import"**

## 🔄 **Sync Between Devices**

- **Google Calendar**: Automatically syncs across all devices when signed in
- **Apple Calendar**: Syncs via iCloud when enabled
- **Outlook**: Syncs via Microsoft account

## 💡 **Tips**

- The `.ics` file contains all event details (title, date, time, location, description)
- You can import multiple events by downloading multiple `.ics` files
- If the event doesn't appear, check your calendar app's import settings
- Some calendar apps may require you to manually approve imported events

## 🆘 **Troubleshooting**

**File won't open:**
- Make sure you're using a calendar app that supports `.ics` files
- Try opening the file in a different app
- Check that the file downloaded completely

**Event details are wrong:**
- The `.ics` file uses the timezone from when it was created
- You may need to adjust the time in your calendar app

**Can't find the file:**
- Check your Downloads folder
- On iOS, check the Files app
- On Android, check the Downloads app

**For Elena**
You'll need to create a Supabase Storage bucket named event-images:
Go to your Supabase dashboard
Navigate to Storage
Create a new bucket called event-images
Set it to Public (or configure RLS policies for authenticated users)