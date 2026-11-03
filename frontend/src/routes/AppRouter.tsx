import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { RoleRouteGuard } from './RoleRouteGuard';
import { PageLoader } from '../components/ui/PageLoader';
import { parseRole } from '../utils/roleUtils';

// ─── Lazy-loaded pages ───────────────────────────────────────────────────────
const LandingPage      = lazy(() => import('../pages/LandingPage'));
const LoginPage        = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage     = lazy(() => import('../pages/auth/RegisterPage'));
const OnboardingPage   = lazy(() => import('../pages/onboarding/OnboardingPage'));
const UnauthorizedPage = lazy(() => import('../pages/UnauthorizedPage'));

// ── App Shell ──
const AppShell = lazy(() => import('../components/layout/AppShell'));

// ── Student ──
const StudentDashboard  = lazy(() => import('../pages/student/StudentDashboard'));
const StudyPlanPage     = lazy(() => import('../pages/student/StudyPlanPage'));
const AssignmentsPage   = lazy(() => import('../pages/student/AssignmentsPage'));
const AcademicProjects  = lazy(() => import('../pages/student/AcademicProjectsPage'));
const StudentCalendar   = lazy(() => import('../pages/student/StudentCalendarPage'));
const StudentTasks      = lazy(() => import('../pages/student/StudentTasksPage'));
const StudentNotes      = lazy(() => import('../pages/student/StudentNotesPage'));
const StudentProgress   = lazy(() => import('../pages/student/StudentProgressPage'));
const StudentSettings   = lazy(() => import('../pages/student/StudentSettingsPage'));

// ── Freelancer ──
const FreelancerDashboard   = lazy(() => import('../pages/freelancer/FreelancerDashboard'));
const WorkPlansPage         = lazy(() => import('../pages/freelancer/WorkPlansPage'));
const DeliverablesPage      = lazy(() => import('../pages/freelancer/DeliverablesPage'));
const FreelancerProjects    = lazy(() => import('../pages/freelancer/FreelancerProjectsPage'));
const FreelancerCalendar    = lazy(() => import('../pages/freelancer/FreelancerCalendarPage'));
const FreelancerTasks       = lazy(() => import('../pages/freelancer/FreelancerTasksPage'));
const FreelancerNotes       = lazy(() => import('../pages/freelancer/FreelancerNotesPage'));
const FreelancerProgress    = lazy(() => import('../pages/freelancer/FreelancerProgressPage'));
const FreelancerSettings    = lazy(() => import('../pages/freelancer/FreelancerSettingsPage'));

// ── Developer ──
const DeveloperDashboard = lazy(() => import('../pages/developer/DeveloperDashboard'));
const BuildPlanPage      = lazy(() => import('../pages/developer/BuildPlanPage'));
const DevProjectsPage    = lazy(() => import('../pages/developer/DevProjectsPage'));
const MilestonesPage     = lazy(() => import('../pages/developer/MilestonesPage'));
const DevTasksPage       = lazy(() => import('../pages/developer/DevTasksPage'));
const DevCalendarPage    = lazy(() => import('../pages/developer/DevCalendarPage'));
const DevNotesPage       = lazy(() => import('../pages/developer/DevNotesPage'));
const DevProgressPage    = lazy(() => import('../pages/developer/DevProgressPage'));
const DevSettingsPage    = lazy(() => import('../pages/developer/DevSettingsPage'));

// ── Job Seeker ──
const JobSeekerDashboard  = lazy(() => import('../pages/job_seeker/JobSeekerDashboard'));
const SearchPlanPage      = lazy(() => import('../pages/jobSeeker/SearchPlanPage'));
const ApplicationsPage    = lazy(() => import('../pages/jobSeeker/ApplicationsPage'));
const PortfolioTasksPage  = lazy(() => import('../pages/jobSeeker/PortfolioTasksPage'));
const InterviewPrepPage   = lazy(() => import('../pages/jobSeeker/InterviewPrepPage'));
const JobCalendarPage     = lazy(() => import('../pages/jobSeeker/JobCalendarPage'));
const JobNotesPage        = lazy(() => import('../pages/jobSeeker/JobNotesPage'));
const JobProgressPage     = lazy(() => import('../pages/jobSeeker/JobProgressPage'));
const JobSettingsPage     = lazy(() => import('../pages/jobSeeker/JobSettingsPage'));

// ─── Router ──────────────────────────────────────────────────────────────────

export function AppRouter() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <PageLoader />;

  const preferredRole = parseRole(localStorage.getItem('mentor_workspace_role'));
  const rolePath = (preferredRole ?? user?.role ?? 'student').replace('_', '-');

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ── Public routes ── */}
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/login"
            element={
              isAuthenticated
                ? <Navigate to={`/app/${rolePath}/dashboard`} replace />
                : <LoginPage />
            }
          />
          <Route
            path="/register"
            element={
              isAuthenticated
                ? <Navigate to={`/app/${rolePath}/dashboard`} replace />
                : <RegisterPage />
            }
          />
          <Route
            path="/dashboard"
            element={
              isAuthenticated
                ? <Navigate to={`/app/${rolePath}/dashboard`} replace />
                : <Navigate to="/login" replace />
            }
          />
          <Route path="/onboarding" element={<RoleRouteGuard requireAuth requireOnboarding={false}><OnboardingPage /></RoleRouteGuard>} />
          <Route path="/app/unauthorized" element={<UnauthorizedPage />} />

          {/* ── Protected workspace ── */}
          <Route path="/app" element={<RoleRouteGuard requireAuth><AppShell /></RoleRouteGuard>}>

            {/* Student */}
            <Route path="student" element={<RoleRouteGuard />}>
              <Route path="dashboard"  element={<StudentDashboard />} />
              <Route path="study-plan" element={<StudyPlanPage />} />
              <Route path="assignments"element={<AssignmentsPage />} />
              <Route path="projects"   element={<AcademicProjects />} />
              <Route path="calendar"   element={<StudentCalendar />} />
              <Route path="tasks"      element={<StudentTasks />} />
              <Route path="notes"      element={<StudentNotes />} />
              <Route path="progress"   element={<StudentProgress />} />
              <Route path="settings"   element={<StudentSettings />} />
            </Route>

            {/* Freelancer */}
            <Route path="freelancer" element={<RoleRouteGuard />}>
              <Route path="dashboard"    element={<FreelancerDashboard />} />
              <Route path="work-plans"   element={<WorkPlansPage />} />
              <Route path="deliverables" element={<DeliverablesPage />} />
              <Route path="projects"     element={<FreelancerProjects />} />
              <Route path="calendar"     element={<FreelancerCalendar />} />
              <Route path="tasks"        element={<FreelancerTasks />} />
              <Route path="notes"        element={<FreelancerNotes />} />
              <Route path="progress"     element={<FreelancerProgress />} />
              <Route path="settings"     element={<FreelancerSettings />} />
            </Route>

            {/* Developer */}
            <Route path="developer" element={<RoleRouteGuard />}>
              <Route path="dashboard"  element={<DeveloperDashboard />} />
              <Route path="build-plan" element={<BuildPlanPage />} />
              <Route path="projects"   element={<DevProjectsPage />} />
              <Route path="milestones" element={<MilestonesPage />} />
              <Route path="tasks"      element={<DevTasksPage />} />
              <Route path="calendar"   element={<DevCalendarPage />} />
              <Route path="notes"      element={<DevNotesPage />} />
              <Route path="progress"   element={<DevProgressPage />} />
              <Route path="settings"   element={<DevSettingsPage />} />
            </Route>

            {/* Job Seeker */}
            <Route path="job-seeker" element={<RoleRouteGuard />}>
              <Route path="dashboard"      element={<JobSeekerDashboard />} />
              <Route path="search-plan"    element={<SearchPlanPage />} />
              <Route path="applications"   element={<ApplicationsPage />} />
              <Route path="portfolio"      element={<PortfolioTasksPage />} />
              <Route path="interview-prep" element={<InterviewPrepPage />} />
              <Route path="calendar"       element={<JobCalendarPage />} />
              <Route path="notes"          element={<JobNotesPage />} />
              <Route path="progress"       element={<JobProgressPage />} />
              <Route path="settings"       element={<JobSettingsPage />} />
            </Route>

            {/* Default /app → redirect to role dashboard */}
            <Route
              index
              element={
                user
                  ? <Navigate to={`/app/${user.role.replace('_','-')}/dashboard`} replace />
                  : <Navigate to="/login" replace />
              }
            />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
