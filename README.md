# DailyNest

DailyNest is a household purchase management application built with React, Vite, Tailwind CSS, and Firebase. It allows users to track daily expenses, manage pending items, and view reports. The app is designed to be mobile-first and can be converted into an Android APK using Capacitor.

## Prerequisites

Before you begin, ensure you have the following installed:

*   **Node.js** (v18 or higher recommended)
*   **npm** or **pnpm**
*   **Android Studio** (for generating the Android APK)
*   **Java Development Kit (JDK)** (usually bundled with Android Studio)

## Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd dailynest
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    pnpm install
    ```

3.  **Firebase Configuration:**
    Ensure you have a Firebase project set up.
    *   Update `src/config/firebase.js` with your Firebase project credentials.
    *   Enable **Authentication** (Email/Password, Google).
    *   Enable **Firestore Database** and deploy the rules found in `firestore.rules`.

## Running Locally

To start the development server:

```bash
npm run dev
```

This will run the app at `http://localhost:5173` (or another available port).

## Building for Web

To build the project for production (web):

```bash
npm run build
```

The output will be in the `dist` directory.

## Generating Android APK

This project uses **Capacitor** to wrap the web app into a native Android application.

1.  **Build the web assets:**
    You must build the React app first so Capacitor has the latest assets to copy.
    ```bash
    npm run build
    ```

2.  **Sync with Capacitor:**
    This copies the `dist` folder to the Android project and installs any native plugins.
    ```bash
    npx cap sync
    ```

3.  **Open in Android Studio:**
    ```bash
    npx cap open android
    ```

4.  **Build the APK:**
    *   In Android Studio, wait for Gradle sync to finish.
    *   Go to **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
    *   Once complete, a notification will appear. Click **locate** to find your `.apk` file (usually in `android/app/build/outputs/apk/debug/`).

    *Alternatively, to run directly on a connected device/emulator:*
    *   Click the **Run** (Play) button in the toolbar.

## Project Structure

*   `src/`: Source code
    *   `components/`: Reusable UI components (shadcn/ui, etc.)
    *   `features/`: Redux slices (auth, items)
    *   `pages/`: Application pages (Dashboard, AddItem, etc.)
    *   `services/`: API services (Firestore, Notifications)
*   `android/`: Native Android project files
