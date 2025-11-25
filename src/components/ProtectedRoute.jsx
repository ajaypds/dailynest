import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser, selectAuthLoading } from '../features/auth/authSlice';

// TODO: Move this to a config file or fetch from Firestore
const ALLOWED_EMAILS = ['ajay.demo@example.com', 'wife.demo@example.com'];

const ProtectedRoute = ({ children }) => {
    const user = useSelector(selectUser);
    const loading = useSelector(selectAuthLoading);
    const location = useLocation();

    if (loading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Whitelist check (optional, can be disabled for dev)
    // if (!ALLOWED_EMAILS.includes(user.email)) {
    //   return <div className="p-8 text-center">Access Denied. You are not authorized to use this app.</div>;
    // }

    return children;
};

export default ProtectedRoute;
