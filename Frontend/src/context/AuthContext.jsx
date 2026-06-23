import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

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
    const [user, setUser] = useState(() => readStoredUser());

    useEffect(() => {
        const syncAuth = () => {
            setToken(localStorage.getItem('token'));
            setUser(readStoredUser());
        };

        window.addEventListener('storage', syncAuth);
        return () => window.removeEventListener('storage', syncAuth);
    }, []);

    const login = (nextToken, nextUser) => {
        localStorage.setItem('token', nextToken);
        localStorage.setItem('user', JSON.stringify(nextUser));
        setToken(nextToken);
        setUser(nextUser);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    const updateUser = (nextUser) => {
        localStorage.setItem('user', JSON.stringify(nextUser));
        setUser(nextUser);
    };

    const value = useMemo(() => ({
        token,
        user,
        isAuthenticated: Boolean(token),
        login,
        logout,
        updateUser,
    }), [token, user]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
