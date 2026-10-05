# Mobile Constraints

Apply when the project is a mobile application (React Native, Flutter, native iOS/Android).

## Rules

### M1. Minimum Permissions
- **RULE**: Request only permissions the feature needs. Request at time of use, not at launch.
- **RATIONALE**: Users deny broad permission requests. App store reviewers flag unnecessary permissions.
- **OVERRIDE**: None.
- **CHECK**: mechanical

### M2. Offline Awareness
- **RULE**: Handle network absence gracefully. Show cached data or clear offline state.
- **RATIONALE**: Mobile networks are unreliable. App shouldn't crash or show blank screen.
- **OVERRIDE**: App explicitly requires constant connectivity (video call, live stream).
- **CHECK**: judgment

### M3. Touch Targets
- **RULE**: Interactive elements minimum 44x44 points (iOS) / 48x48 dp (Android).
- **RATIONALE**: Small targets = frustrated users, accessibility failure.
- **OVERRIDE**: None for primary interactions.
- **CHECK**: mechanical

### M4. Battery Awareness
- **RULE**: Avoid unnecessary background processing, frequent GPS polling, or continuous network requests.
- **RATIONALE**: Battery drain gets apps uninstalled.
- **OVERRIDE**: App's core purpose requires continuous operation (fitness tracker, navigation).
- **CHECK**: judgment

### M5. Data Usage
- **RULE**: Lazy-load images. Paginate API responses. Offer data-saver mode for media-heavy features.
- **RATIONALE**: Many users have limited data plans.
- **OVERRIDE**: WiFi-only features.
- **CHECK**: judgment

### M6. Platform Conventions
- **RULE**: Follow platform UI patterns (navigation, gestures, system UI integration).
- **RATIONALE**: Users expect familiar behavior. Platform reviewers may reject non-conforming apps.
- **OVERRIDE**: Cross-platform design system that intentionally diverges.
- **CHECK**: judgment

### M7. Secure Storage
- **RULE**: Sensitive data (tokens, user data) stored in secure storage (Keychain/Keystore), not AsyncStorage/SharedPreferences.
- **RATIONALE**: Unencrypted storage is readable by other apps or on rooted devices.
- **OVERRIDE**: Non-sensitive preferences.
- **CHECK**: mechanical
