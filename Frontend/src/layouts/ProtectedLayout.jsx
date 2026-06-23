import Navbar from '../components/Navbar';

const ProtectedLayout = ({ children }) => {
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