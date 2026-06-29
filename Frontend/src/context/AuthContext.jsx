/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export const AuthContext = createContext(null);

const readStoredUser = () => {
    try {
        const rawUser = localStorage.getItem('user');
        return rawUser ? JSON.parse(rawUser) : null;
    } catch {
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('refreshToken'));
    const [user, setUser] = useState(() => readStoredUser());

    useEffect(() => {
        const syncAuth = () => {
            setToken(localStorage.getItem('token'));
            setRefreshToken(localStorage.getItem('refreshToken'));
            setUser(readStoredUser());
        };

        window.addEventListener('storage', syncAuth);
        return () => window.removeEventListener('storage', syncAuth);
    }, []);

    const login = (nextToken, nextUser, nextRefreshToken) => {
        localStorage.setItem('token', nextToken);
        localStorage.setItem('refreshToken', nextRefreshToken);
        localStorage.setItem('user', JSON.stringify(nextUser));
        setToken(nextToken);
        setRefreshToken(nextRefreshToken);
        setUser(nextUser);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setToken(null);
        setRefreshToken(null);
        setUser(null);
    };

    const updateUser = (nextUser) => {
        localStorage.setItem('user', JSON.stringify(nextUser));
        setUser(nextUser);
    };

    const value = useMemo(() => ({
        token,
        refreshToken,
        user,
        isAuthenticated: Boolean(token),
        login,
        logout,
        updateUser,
    }), [token, refreshToken, user]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
