import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase';
import { setUser, logout, selectUser } from './features/auth/authSlice';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AddItem from './pages/AddItem';
import CompleteItem from './pages/CompleteItem';
import ManualEntry from './pages/ManualEntry';
import Reports from './pages/Reports';
import CompletedItems from './pages/CompletedItems';
import Settings from './pages/Settings';
import ManageAccess from './pages/ManageAccess';
import ProtectedRoute from './components/ProtectedRoute';
import { initializePushNotifications, addPushNotificationListeners } from './services/notificationService';
import { saveUserToken } from './services/firestoreService';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App as CapacitorApp } from '@capacitor/app';
import { SocialLogin } from '@capgo/capacitor-social-login';

function App() {
    const dispatch = useDispatch();
    const user = useSelector(selectUser);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (userAuth) => {
            if (userAuth) {
                dispatch(setUser({
                    uid: userAuth.uid,
                    email: userAuth.email,
                    displayName: userAuth.displayName,
                    photoURL: userAuth.photoURL,
                }));
                // Sync user profile to Firestore
                import('./services/firestoreService').then(({ syncUserProfile }) => {
                    syncUserProfile(userAuth);
                });
            } else {
                dispatch(logout());
            }
        });

        return unsubscribe;
    }, [dispatch]);

    // Initialize push notifications for native mobile
    useEffect(() => {
        if (user) {
            // Initialize and get FCM token
            initializePushNotifications().then(token => {
                if (token) {
                    console.log('FCM Token:', token);
                    saveUserToken(user.uid, token);
                }
            });

            // Add notification listeners
            addPushNotificationListeners({
                onRegistration: (token) => {
                    console.log('Token registered:', token);
                    saveUserToken(user.uid, token);
                },
                onNotificationReceived: (notification) => {
                    console.log('Notification received (foreground):', notification);
                    // You can show a toast or alert here
                },
                onNotificationTapped: (notification) => {
                    console.log('Notification tapped:', notification);
                    // Handle navigation based on notification data
                }
            });
        }
    }, [user]);

    useEffect(() => {
        const updateStatusBar = () => {
            const isDark = document.documentElement.classList.contains('dark');
            if (isDark) {
                StatusBar.setStyle({ style: Style.Dark });
                StatusBar.setBackgroundColor({ color: '#1f2937' }); // gray-800
            } else {
                StatusBar.setStyle({ style: Style.Light });
                StatusBar.setBackgroundColor({ color: '#ffffff' }); // white
            }
        };

        // Initial set
        updateStatusBar();
        StatusBar.setOverlaysWebView({ overlay: false }); // Ensure it doesn't overlay content

        // Observer for theme changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    updateStatusBar();
                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });

        return () => observer.disconnect();
    }, []);

    // Handle Android hardware back button
    useEffect(() => {
        const handleBackButton = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
            // If we're on the dashboard or login page, exit the app
            if (location.pathname === '/' || location.pathname === '/login') {
                CapacitorApp.exitApp();
            } else {
                // Otherwise, navigate back
                navigate(-1);
            }
        });

        return () => {
            handleBackButton.remove();
        };
    }, [location, navigate]);

    // Conditionally apply mt-6 to body
    useEffect(() => {
        if (location.pathname === '/login') {
            document.body.classList.remove('mt-6');
        } else {
            document.body.classList.add('mt-6');
        }
    }, [location.pathname]);

    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
                <ProtectedRoute>
                    <Dashboard />
                </ProtectedRoute>
            } />
            <Route path="/add" element={
                <ProtectedRoute>
                    <AddItem />
                </ProtectedRoute>
            } />
            <Route path="/complete/:id" element={
                <ProtectedRoute>
                    <CompleteItem />
                </ProtectedRoute>
            } />
            <Route path="/manual" element={
                <ProtectedRoute>
                    <ManualEntry />
                </ProtectedRoute>
            } />
            <Route path="/reports" element={
                <ProtectedRoute>
                    <Reports />
                </ProtectedRoute>
            } />
            <Route path="/history" element={
                <ProtectedRoute>
                    <CompletedItems />
                </ProtectedRoute>
            } />
            <Route path="/settings" element={
                <ProtectedRoute>
                    <Settings />
                </ProtectedRoute>
            } />
            <Route path="/manage-access" element={
                <ProtectedRoute>
                    <ManageAccess />
                </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
