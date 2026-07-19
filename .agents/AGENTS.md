# Project Rules

- **Notification of APK Updates:** Every time a change is committed/pushed to GitHub, explicitly notify the user at the end of the message with one of these two notifications based on whether the change requires a new native APK build or is automatically updated over-the-air:
  1. 📢 **"આ સુધારો ઓટો-અપડેટ થઈ ગયો છે, નવું APK આપવાની જરૂર નથી."** (This change is auto-updated, no need for a new APK.)
  2. 📢 **"આ સુધારા માટે નવું APK બનાવવું પડશે. તમે નવું APK બિલ્ડ કરીને ડેટાબેઝમાં લિંક અપડેટ કરી દો."** (For this change a new APK needs to be built. You build the new APK and update the link in the database.)
