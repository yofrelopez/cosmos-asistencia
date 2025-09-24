import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import AdminDashboard from './components/AdminDashboard'; 
import RecordsHistoryPage from './components/historial/RecordsHistoryPage'; 
import type { AuthSession } from '@/lib/auth'; // ✅ importa el tipo correcto

const queryClient = new QueryClient();

// ⚡ sesión dummy solo para pruebas directas
const dummySession: AuthSession = {
  userId: "admin1",
  userType: "admin",
  userName: "Administrador Principal",
  loginTime: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8h
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<AdminDashboard session={dummySession} onLogout={() => {}} />} />
          <Route path="/history" element={<RecordsHistoryPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
