import { Clock, MapPin, Navigation, Phone, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../../components/Button.jsx";
import { PageHeader } from "../../components/PageHeader.jsx";
import { useI18n } from "../../i18n/index.jsx";
import { hospitals } from "../../data/healthData.js";

export function HospitalMap({ go }) {
  const { t } = useI18n();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const types = useMemo(() => ["all", ...Array.from(new Set(hospitals.map((h) => h.type)))], []);

  const filtered = useMemo(
    () =>
      hospitals.filter((hospital) => {
        const matchesFilter = filter === "all" || hospital.type === filter;
        const needle = search.toLowerCase();
        const matchesSearch =
          hospital.name.toLowerCase().includes(needle) ||
          hospital.address.toLowerCase().includes(needle) ||
          hospital.type.toLowerCase().includes(needle);
        return matchesFilter && matchesSearch;
      }),
    [filter, search]
  );

  return (
    <div className="page">
      <PageHeader
        title={t("hosp.title")}
        subtitle={t("hosp.subtitle")}
        icon={MapPin}
        go={go}
        action={
          <Button size="sm">
            <Navigation size={17} /> {t("hosp.location")}
          </Button>
        }
      />

      <section className="grid grid-2">
        <div className="map-panel">
          <iframe
            title="MediSelf clinics map"
            src="https://www.openstreetmap.org/export/embed.html?bbox=69.16%2C41.24%2C69.36%2C41.36&layer=mapnik&marker=41.2995%2C69.2401"
            loading="lazy"
          />
        </div>

        <article className="form-panel">
          <h2>{t("hosp.search")}</h2>
          <label className="field">
            <span>{t("hosp.searchlabel")}</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Kardiologiya..." />
          </label>
          <div className="filter-row" style={{ marginTop: 12 }}>
            {types.map((type) => (
              <button className={`chip ${filter === type ? "active" : ""}`} key={type} type="button" onClick={() => setFilter(type)}>
                <Search size={14} /> {type === "all" ? t("hosp.all") : type}
              </button>
            ))}
          </div>
        </article>
      </section>

      <article className="card">
        <h2>
          {filtered.length} {t("hosp.found")}
        </h2>
        <div className="list">
          {filtered.map((hospital) => (
            <div className="list-row" key={hospital.id}>
              <div className="list-row__main">
                <strong>{hospital.name}</strong>
                <span>
                  {hospital.type} · {hospital.address}
                </span>
                <span className="tiny">
                  <Clock size={13} /> {hospital.open} · {t("hosp.eta")} {hospital.eta}
                </span>
              </div>
              <div className="auth-actions">
                <a className="btn btn-secondary btn-sm" href={`tel:${hospital.phone}`}>
                  <Phone size={15} /> {t("hosp.call")}
                </a>
                <Button size="sm" variant="secondary" onClick={() => go("appointments")}>
                  {t("hosp.book")}
                </Button>
                <a
                  className="btn btn-primary btn-sm"
                  href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Navigation size={15} /> {t("hosp.route")}
                </a>
              </div>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}
