import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useEffect } from "react";
import { initTrashCleanup } from "./lib/trash-utils";
import { NotificationProvider } from "./contexts/NotificationContext";
import { AuthProvider } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Devices from "./pages/Devices";
import Services from "./pages/Services";
import Inventory from "./pages/Inventory";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import CustomerDetail from "./pages/CustomerDetail";
import NewCustomer from "./pages/NewCustomer";
import EditCustomer from "./pages/EditCustomer";
import DeviceDetail from "./pages/DeviceDetail";
import NewDevice from "./pages/NewDevice";
import EditDevice from "./pages/EditDevice";
import ServiceDetail from "./pages/ServiceDetail";
import NewService from "./pages/NewService";
import EditService from "./pages/EditService";
import Documents from "./pages/Documents";
import NewDocument from "./pages/NewDocument";
import DocumentDetail from "./pages/DocumentDetail";
import TrashBin from './pages/TrashBin';
import Index from './pages/Index';
import ResetStatistics from './pages/ResetStatistics';
import DataUpdateEmitter from './lib/DataUpdateEmitter';

// Add framer-motion for animations
import { AnimatePresence } from "framer-motion";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

// Create a protected route component
const ProtectedRoute = () => {
  const storedUser = localStorage.getItem('pauloCell_user');
  if (!storedUser) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

function App() {
  // Initialize trash cleanup on application start
  useEffect(() => {
    initTrashCleanup();
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <DataUpdateEmitter />
          <AuthProvider>
            <NotificationProvider>
              <Toaster />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  
                  {/* Customers */}
                  <Route path="/customers" element={<Customers />} />
                  <Route path="/customers/new" element={<NewCustomer />} />
                  <Route path="/customers/:id" element={<CustomerDetail />} />
                  <Route path="/customers/edit/:id" element={<EditCustomer />} />
                  <Route path="/trash-bin" element={<TrashBin />} />
                  
                  {/* Devices */}
                  <Route path="/devices" element={<Devices />} />
                  <Route path="/devices/new" element={<NewDevice />} />
                  <Route path="/devices/:id" element={<DeviceDetail />} />
                  <Route path="/devices/edit/:id" element={<EditDevice />} />
                  
                  {/* Services */}
                  <Route path="/services" element={<Services />} />
                  <Route path="/services/new" element={<NewService />} />
                  <Route path="/services/:id" element={<ServiceDetail />} />
                  <Route path="/services/edit/:id" element={<EditService />} />
                  
                  {/* Inventory */}
                  <Route path="/inventory" element={<Inventory />} />
                  
                  {/* Documents */}
                  <Route path="/documents" element={<Documents />} />
                  <Route path="/documents/new" element={<NewDocument />} />
                  <Route path="/documents/:id" element={<DocumentDetail />} />
                  
                  {/* Reports */}
                  <Route path="/reports" element={<Reports />} />
                  
                  {/* Settings */}
                  <Route path="/settings" element={<Settings />} />
                  
                  {/* Reset Statistics */}
                  <Route path="/reset-statistics" element={<ResetStatistics />} />
                </Route>
                
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Sonner />
            </NotificationProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
