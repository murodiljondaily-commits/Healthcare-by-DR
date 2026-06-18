import { ArrowLeft, CornerDownLeft, MapPin, Navigation, PersonStanding } from "lucide-react";
import { useState } from "react";
import { Button } from "../../components/Button.jsx";
import { useI18n } from "../../i18n/index.jsx";

export function WalkingTracker({ go }) {
  const { t } = useI18n();
  const [tab, setTab] = useState("plan");
  const [targetSteps, setTargetSteps] = useState(10000);

  const distanceKm = (targetSteps * 0.00075).toFixed(1);
  const halfDistanceKm = (distanceKm / 2).toFixed(2);
  const calories = Math.round(targetSteps * 0.0375);
  const hours = Math.floor(targetSteps / 6000);
  const mins = Math.round((targetSteps % 6000) / 100);
  const timeStr = `${hours}:${mins < 10 ? "0" : ""}${mins}`;

  const currentSteps = 4820;
  const remainingSteps = targetSteps - currentSteps;
  const progressPercent = Math.round((currentSteps / targetSteps) * 100);
  const toTurnPoint = Math.round(targetSteps / 2) - currentSteps;

  return (
    <div className="page bg-warm">
      <div className={`route-header ${tab === "plan" ? "bg-green" : "bg-blue"}`}>
        <button className="route-back" onClick={() => go("dashboard")}>
          <ArrowLeft size={24} />
        </button>
        <div className="route-title">
          <h1>{tab === "plan" ? t("walk.plan.title") : t("walk.process.title")}</h1>
          <p>{t("walk.subtitle")}</p>
        </div>
        {tab === "plan" ? (
          <PersonStanding size={32} className="route-icon" />
        ) : (
          <Navigation size={32} className="route-icon" />
        )}
      </div>

      <div className="route-tabs">
        <button className={tab === "plan" ? "active" : ""} onClick={() => setTab("plan")}>
          {t("walk.tab.plan")}
        </button>
        <button className={tab === "process" ? "active" : ""} onClick={() => setTab("process")}>
          {t("walk.tab.process")}
        </button>
      </div>

      {tab === "plan" && (
        <section className="route-content">
          <div className="route-card">
            <div className="flex-between">
              <h3>{t("walk.target")}</h3>
              <strong className="text-green">
                {targetSteps.toLocaleString()} {t("walk.steps")}
              </strong>
            </div>
            <div className="range-container">
              <input
                type="range"
                min="1000"
                max="25000"
                step="500"
                value={targetSteps}
                onChange={(e) => setTargetSteps(Number(e.target.value))}
                className="custom-range"
              />
              <div className="range-labels">
                <span>1,000</span>
                <span>25,000</span>
              </div>
            </div>
          </div>

          <div className="route-card">
            <h3 className="uppercase text-green mb-10">{t("walk.routeinfo")}</h3>
            <div className="route-grid">
              <div className="route-box bg-light-green">
                <strong>{distanceKm} km</strong>
                <span>{t("walk.distance")}</span>
              </div>
              <div className="route-box bg-light-blue">
                <strong>{halfDistanceKm} km</strong>
                <span>{t("walk.oneway")}</span>
              </div>
              <div className="route-box bg-light-orange">
                <strong className="text-orange">{calories} kcal</strong>
                <span>{t("walk.calories")}</span>
              </div>
              <div className="route-box bg-light-purple">
                <strong className="text-purple">{timeStr}</strong>
                <span>{t("walk.time")}</span>
              </div>
            </div>
          </div>

          <div className="route-card p-0 overflow-hidden">
            <div className="map-placeholder">
              <div className="map-path">
                <span className="dot start"></span>
                <span className="line"></span>
                <span className="dot turn">{t("walk.farthest.point")}</span>
                <span className="line"></span>
                <span className="dot end"></span>
              </div>
            </div>
          </div>

          <div style={{ padding: "0 10px", marginTop: "10px" }}>
            <Button
              onClick={() => setTab("process")}
              style={{ width: "100%", height: "54px", borderRadius: "16px", fontSize: "16px" }}
              className="bg-green"
            >
              {t("walk.start")}
            </Button>
          </div>
        </section>
      )}

      {tab === "process" && (
        <section className="route-content">
          <div className="route-card">
            <div className="flex-between mb-10">
              <h3>{t("walk.stages")}</h3>
              <span className="step-badge">1/3</span>
            </div>

            <div className="route-timeline">
              <div className="rt-step active">
                <div className="rt-icon">
                  <MapPin size={16} />
                </div>
                <span>{t("walk.home.start")}</span>
              </div>
              <div className="rt-line active"></div>
              <div className="rt-step">
                <div className="rt-icon outline">
                  <MapPin size={16} />
                </div>
                <span className="text-green">{t("walk.farthest")}</span>
              </div>
              <div className="rt-line"></div>
              <div className="rt-step disabled">
                <div className="rt-icon outline">
                  <MapPin size={16} />
                </div>
                <span>{t("walk.home.return")}</span>
              </div>
            </div>
          </div>

          <div className="route-card outline-blue">
            <h3 className="uppercase text-blue mb-10">{t("walk.current")}</h3>
            <div className="flex-between align-end mb-10">
              <div>
                <strong className="text-green giant">{currentSteps.toLocaleString()}</strong>
                <span className="block text-muted">{t("walk.done.steps")}</span>
              </div>
              <div className="text-right">
                <strong className="text-red giant">{remainingSteps.toLocaleString()}</strong>
                <span className="block text-muted">{t("walk.remain.steps")}</span>
              </div>
            </div>

            <div className="progress-bar-container mb-10">
              <div className="progress-bar-fill bg-green" style={{ width: `${progressPercent}%` }}></div>
            </div>
            <p className="text-sm">
              {progressPercent}% — {t("walk.toturn")} {toTurnPoint > 0 ? toTurnPoint.toLocaleString() : 0}{" "}
              {t("walk.steps")}
            </p>
          </div>

          {toTurnPoint <= 180 && toTurnPoint > 0 && (
            <div className="alert-box bg-light-blue">
              <div className="alert-icon bg-blue">
                <CornerDownLeft size={20} color="white" />
              </div>
              <div>
                <strong className="text-blue">{t("walk.turn.title")}</strong>
                <p className="text-blue-muted m-0">
                  {toTurnPoint} {t("walk.turn.text")}
                </p>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
