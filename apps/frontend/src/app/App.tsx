import "../../styles/globals.css";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { Toaster } from "sonner";
import { Interview } from "@/components/Interview";
import { InterviewComplete } from "@/components/InterviewComplete";
import { ProctoringEnded } from "@/components/ProctoringEnded";
import { Result } from "@/components/Result";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { AuthProvider } from "@/features/auth/context/auth-context";
import { LandingPage } from "@/features/auth/pages/LandingPage";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { OAuthCallbackPage } from "@/features/auth/pages/OAuthCallbackPage";
import { RegisterPage } from "@/features/auth/pages/RegisterPage";
import { CandidateDashboardPage } from "@/features/candidate/pages/DashboardPage";
import { CandidateApplicationsPage } from "@/features/candidate/pages/ApplicationsPage";
import { CandidateApplicationAnalyticsPage } from "@/features/candidate/pages/ApplicationAnalyticsPage";
import { CandidateJobDetailPage } from "@/features/candidate/pages/JobDetailPage";
import { CandidateJobsListPage } from "@/features/candidate/pages/JobsListPage";
import { ProfilePage } from "@/features/candidate/pages/ProfilePage";
import { RecruiterDashboardPage } from "@/features/recruiter/pages/DashboardPage";
import { RecruiterApplicationPacketPage } from "@/features/recruiter/pages/ApplicationPacketPage";
import { RecruiterJobApplicantsPage } from "@/features/recruiter/pages/JobApplicantsPage";
import { RecruiterJobEditPage } from "@/features/recruiter/pages/JobEditPage";
import { RecruiterJobsListPage } from "@/features/recruiter/pages/JobsListPage";
import { PublicJobDetailPage } from "@/features/jobs/pages/PublicJobDetailPage";
import { CandidateLayout } from "@/shared/components/layout/CandidateLayout";
import { PublicLayout } from "@/shared/components/layout/PublicLayout";
import { RecruiterLayout } from "@/shared/components/layout/RecruiterLayout";

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="dark min-h-screen bg-background text-foreground">
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/jobs/:id" element={<PublicJobDetailPage />} />
            </Route>

            <Route path="/auth/callback" element={<OAuthCallbackPage />} />

            <Route element={<ProtectedRoute allowedRoles={["CANDIDATE"]} />}>
              <Route element={<CandidateLayout />}>
                <Route path="/candidate/dashboard" element={<CandidateDashboardPage />} />
                <Route path="/candidate/profile" element={<ProfilePage />} />
                <Route path="/candidate/jobs" element={<CandidateJobsListPage />} />
                <Route path="/candidate/jobs/:id" element={<CandidateJobDetailPage />} />
                <Route path="/candidate/applications" element={<CandidateApplicationsPage />} />
                <Route path="/candidate/applications/:id" element={<CandidateApplicationAnalyticsPage />} />
              </Route>

              <Route path="/interview/:id" element={<Interview />} />
              <Route path="/interview/:id/complete" element={<InterviewComplete />} />
              <Route path="/interview/:id/proctoring-ended" element={<ProctoringEnded />} />
              <Route path="/results/:id" element={<Result />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["RECRUITER"]} />}>
              <Route element={<RecruiterLayout />}>
                <Route path="/recruiter/dashboard" element={<RecruiterDashboardPage />} />
                <Route path="/recruiter/jobs" element={<RecruiterJobsListPage />} />
                <Route path="/recruiter/jobs/new" element={<RecruiterJobEditPage />} />
                <Route path="/recruiter/jobs/:id" element={<RecruiterJobEditPage />} />
                <Route path="/recruiter/jobs/:id/applicants" element={<RecruiterJobApplicantsPage />} />
                <Route path="/recruiter/applications/:id" element={<RecruiterApplicationPacketPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster theme="dark" richColors />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
