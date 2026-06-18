import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../components/AppShell.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useI18n } from "../i18n/index.jsx";
import { AIChat } from "../pages/assistant/AIChat.jsx";
import { Appointments } from "../pages/appointments/Appointments.jsx";
import { Login } from "../pages/auth/Login.jsx";
import { Onboarding } from "../pages/auth/Onboarding.jsx";
import { ProfileSelect } from "../pages/auth/ProfileSelect.jsx";
import { Register } from "../pages/auth/Register.jsx";
import { Dashboard } from "../pages/dashboard/Dashboard.jsx";
import { DoctorPanel } from "../pages/hospital/DoctorPanel.jsx";
import { HospitalMap } from "../pages/hospital/HospitalMap.jsx";
import { CalorieTracker } from "../pages/health/CalorieTracker.jsx";
import { Diet } from "../pages/health/Diet.jsx";
import { HealthTrack } from "../pages/health/HealthTrack.jsx";
import { Medicine } from "../pages/health/Medicine.jsx";
import { Survey } from "../pages/health/Survey.jsx";
import { WalkingTracker } from "../pages/health/WalkingTracker.jsx";
import { MentalHealth } from "../pages/mental/MentalHealth.jsx";
import { Profile } from "../pages/profile/Profile.jsx";

const authScreens = new Set(["onboarding", "login", "register", "profileSelect"]);

export default function App() {
  const { user, loading, isAuthenticated } = useAuth();
  const { t } = useI18n();
  const [screen, setScreen] = useState("onboarding");

  // When auth state resolves, route appropriately.
  useEffect(() => {
    if (loading) return;
    if (isAuthenticated) {
      setScreen((cur) => (authScreens.has(cur) ? (user.role === "doctor" ? "doctor" : "dashboard") : cur));
    } else {
      setScreen((cur) => (authScreens.has(cur) ? cur : "onboarding"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, isAuthenticated]);

  const go = (nextScreen) => {
    setScreen(nextScreen);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const screens = useMemo(
    () => ({
      onboarding: <Onboarding onRegister={() => go("register")} onLogin={() => go("login")} />,
      register: <Register go={go} />,
      login: <Login go={go} />,
      profileSelect: <ProfileSelect go={go} />,
      dashboard: <Dashboard go={go} />,
      appointments: <Appointments go={go} />,
      mental: <MentalHealth go={go} />,
      health: <HealthTrack go={go} />,
      walking: <WalkingTracker go={go} />,
      calorie: <CalorieTracker go={go} />,
      medicine: <Medicine go={go} />,
      diet: <Diet go={go} />,
      survey: <Survey go={go} />,
      hospital: <HospitalMap go={go} />,
      doctor: <DoctorPanel go={go} />,
      ai: <AIChat go={go} />,
      profile: <Profile go={go} />,
    }),
    // screen included so the active page re-renders on navigation
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [screen, user]
  );

  if (loading) {
    return (
      <div className="boot-screen">
        <span className="brand-mark">+</span>
        <span className="spinner" />
        <p className="muted">{t("common.loading")}</p>
      </div>
    );
  }

  const content = screens[screen] || screens.onboarding;

  if (authScreens.has(screen) || !isAuthenticated) {
    return content;
  }

  return (
    <AppShell screen={screen} go={go}>
      {content}
    </AppShell>
  );
}
