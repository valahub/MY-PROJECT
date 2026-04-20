import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import AuthLayout from "./pages/auth/AuthLayout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import AdminRoutes from "./pages/admin/AdminRoutes";
import CustomerRoutes from "./pages/customer/CustomerRoutes";
import MerchantRoutes from "./pages/merchant/MerchantRoutes";
import AuthorRoutes from "./pages/author/AuthorRoutes";
import SupportRoutes from "./pages/support/SupportRoutes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            <Route path="/auth" element={<AuthLayout />}>
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="forgot-password" element={<ForgotPassword />} />
              <Route path="reset-password" element={<ResetPassword />} />
            </Route>

            <Route path="/admin/*" element={<AdminRoutes />} />
            <Route path="/customer/*" element={<CustomerRoutes />} />
            <Route path="/merchant/*" element={<MerchantRoutes />} />
            <Route path="/author/*" element={<AuthorRoutes />} />
            <Route path="/support/*" element={<SupportRoutes />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
