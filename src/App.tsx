import { useState } from 'react';
import { CustomerProvider } from './context/CustomerContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';
import { Loyalty } from './pages/Loyalty';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { CustomerPortal } from './pages/CustomerPortal';
import { StaffManagement } from './pages/StaffManagement';
import { Profile } from './pages/Profile';
import { Toaster } from 'react-hot-toast';
import { StaffProvider } from './context/StaffContext';
import { NotificationProvider } from './context/NotificationContext';

function AppContent() {
    const { isAuthenticated, isLoading } = useAuth();
    const [activePage, setActivePage] = useState<'dashboard' | 'customers' | 'loyalty' | 'reports' | 'settings' | 'staff' | 'profile'>('dashboard');
    const [showPortal, setShowPortal] = useState(false);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Portal público
    if (showPortal && !isAuthenticated) {
        return <CustomerPortal onBackToLogin={() => setShowPortal(false)} />;
    }

    if (!isAuthenticated) {
        return <Login onNavigateToPortal={() => setShowPortal(true)} />;
    }

    return (
        <StaffProvider>
            <CustomerProvider>
                <Layout activePage={activePage} onNavigate={setActivePage}>
                    <Toaster position="top-right" />
                    {activePage === 'dashboard' && <Dashboard />}
                    {activePage === 'customers' && <Customers />}
                    {activePage === 'loyalty' && <Loyalty />}
                    {activePage === 'reports' && <Reports />}
                    {activePage === 'settings' && <Settings />}
                    {activePage === 'staff' && <StaffManagement />}
                    {activePage === 'profile' && <Profile />}
                </Layout>
            </CustomerProvider>
        </StaffProvider>
    );
}

function App() {
    return (
        <AuthProvider>
            <NotificationProvider>
                <AppContent />
            </NotificationProvider>
        </AuthProvider>
    );
}

export default App;
