import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const ProtectedLayout = ({ children }) => {
    const { user } = useAuth();
    const rawRole = user?.roleRef?.code || user?.role || 'STUDENT';
    const currentRole = String(rawRole).toUpperCase();
    const isSidebarRole = ['ADMIN', 'TEACHER', 'MANAGER'].includes(currentRole);

    if (isSidebarRole) {
        return (
            <div className="app-shell app-shell--sidebar-layout">
                <Sidebar />
                <main className="app-content--sidebar-view">
                    {children}
                </main>
            </div>
        );
    }

    return (
        <div className="app-shell app-shell--protected">
            <Navbar />
            <main className="app-content app-content--protected">
                {children}
            </main>
        </div>
    );
};

export default ProtectedLayout;
