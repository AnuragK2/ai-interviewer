import "../../styles/globals.css";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { Toaster } from "sonner";
import { Form } from "@/components/Form";
import { Interview } from "@/components/Interview";
import { ProctoringEnded } from "@/components/ProctoringEnded";
import { Result } from "@/components/Result";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { AuthProvider } from "@/features/auth/context/auth-context";
import { LandingPage } from "@/features/auth/pages/LandingPage";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { OAuthCallbackPage } from "@/features/auth/pages/OAuthCallbackPage";
import { RegisterPage } from "@/features/auth/pages/RegisterPage";
import { CandidateDashboardPage } from "@/features/candidate/pages/DashboardPage";
import { ProfilePage } from "@/features/candidate/pages/ProfilePage";
import { RecruiterDashboardPage } from "@/features/recruiter/pages/DashboardPage";

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="dark min-h-screen bg-background text-foreground">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/auth/callback" element={<OAuthCallbackPage />} />

            <Route element={<ProtectedRoute allowedRoles={["CANDIDATE"]} />}>
              <Route path="/candidate/dashboard" element={<CandidateDashboardPage />} />
              <Route path="/candidate/profile" element={<ProfilePage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["RECRUITER"]} />}>
              <Route path="/recruiter/dashboard" element={<RecruiterDashboardPage />} />
            </Route>

            <Route path="/legacy" element={<Form />} />
            <Route path="/interview/:id" element={<Interview />} />
            <Route path="/interview/:id/proctoring-ended" element={<ProctoringEnded />} />
            <Route path="/results/:id" element={<Result />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster theme="dark" richColors />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
