# Web Constraints

Apply when the project is a web application (frontend, full-stack, or SSR).

## Rules

### W1. XSS Prevention
- **RULE**: Escape user input before rendering. No `innerHTML` or `dangerouslySetInnerHTML` with user data unless sanitized.
- **RATIONALE**: XSS is the most common web vulnerability.
- **OVERRIDE**: Content is trusted (admin-only CMS) and sanitized server-side.
- **CHECK**: mechanical

### W2. CSRF Protection
- **RULE**: State-changing endpoints (POST/PUT/DELETE) use CSRF tokens or SameSite cookies.
- **RATIONALE**: Prevents unauthorized actions via forged requests.
- **OVERRIDE**: API-only backend with token auth (no cookies).
- **CHECK**: mechanical

### W3. Responsive Design
- **RULE**: UI components work on mobile (320px) through desktop (1920px).
- **RATIONALE**: Users access from all devices.
- **OVERRIDE**: Desktop-only internal tool.
- **CHECK**: judgment

### W4. Accessibility Basics
- **RULE**: Interactive elements are keyboard-navigable. Images have alt text. Form inputs have labels.
- **RATIONALE**: Legal requirement in many jurisdictions. Good for all users.
- **OVERRIDE**: None for public-facing apps.
- **CHECK**: mechanical

### W5. State Management Proportionality
- **RULE**: Use the simplest state solution that works. Local state > context > state library.
- **RATIONALE**: AI defaults to Redux/Zustand for apps that need useState.
- **OVERRIDE**: User specifies state management approach.
- **CHECK**: judgment

### W6. Bundle Awareness
- **RULE**: Import specific functions, not entire libraries. Prefer tree-shakeable packages.
- **RATIONALE**: Bundle size directly impacts user experience.
- **OVERRIDE**: Development-only tool or SSR-only code.
- **CHECK**: mechanical

### W7. Environment Variables
- **RULE**: API URLs, feature flags, and configuration come from env vars, not hardcoded.
- **RATIONALE**: Enables deployment to different environments.
- **OVERRIDE**: Truly static values (app name, version).
- **CHECK**: mechanical

### W8. Error Boundaries
- **RULE**: UI should not white-screen on errors. Implement error boundaries or try/catch at route level.
- **RATIONALE**: Crashes kill user trust.
- **OVERRIDE**: Prototype mode.
- **CHECK**: judgment
