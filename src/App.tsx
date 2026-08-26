import { useMemo, useState } from "react";
import { hubConfig, modules, type Cta, type HubModule, type ModuleScreen } from "./content";

type View =
  | { type: "home" }
  | { type: "module"; moduleId: string; screenIndex: number }
  | { type: "contact" };

function trackEvent(eventName: string, data?: Record<string, string | number>) {
  console.log("[Tracking]", eventName, data);

  // Später z. B. Piano Analytics, Matomo oder GA4 anbinden:
  // window.pa?.sendEvent(eventName, data);
  // window._paq?.push(["trackEvent", "NFC Microsite", eventName, JSON.stringify(data)]);
  // window.gtag?.("event", eventName, data);
}

function Logo() {
  return (
    <div className="gl-logo" aria-label="Gelbe Liste Pharmindex">
      <div className="gl-logo-mark">G</div>
      <div className="gl-logo-text">
        <strong>GELBE LISTE.</strong>
        <span>PHARMINDEX</span>
      </div>
    </div>
  );
}

function Header({ onHome, onContact }: { onHome: () => void; onContact: () => void }) {
  return (
    <header className="app-header">
      <button className="header-button" onClick={onHome} aria-label="Zum Hauptmenü">
        Menü
      </button>
      <Logo />
      <button className="header-button contact" onClick={onContact} aria-label="Kontakt öffnen">
        Kontakt
      </button>
    </header>
  );
}

function HomeScreen({ openModule, openContact }: { openModule: (moduleId: string) => void; openContact: () => void }) {
  return (
    <div className="page-shell">
      <div className="phone">
        <Header onHome={() => undefined} onContact={openContact} />

        <main className="home-screen">
          <div className="badge">{hubConfig.badge}</div>
          <h1>{hubConfig.headline}</h1>
          <p className="intro">{hubConfig.intro}</p>

          <section className="module-list" aria-label="Inhaltsmodule">
            {modules.map((module) => (
              <button
                key={module.id}
                className="module-card"
                style={{
                  background: module.theme.card,
                  color: module.theme.text ?? "#ffffff"
                }}
                onClick={() => {
                  trackEvent("module_open", {
                    module_id: module.id,
                    module_title: module.title
                  });
                  openModule(module.id);
                }}
              >
                <div className="module-card-topline">
                  <span className="module-badge">{module.badge}</span>
                  <span className="arrow">›</span>
                </div>
                <div className="eyebrow">{module.eyebrow}</div>
                <h2>{module.title}</h2>
                <p>{module.subtitle}</p>
              </button>
            ))}

            <div className="coming-soon">
              <div className="plus">＋</div>
              <div>
                <strong>Weitere Module ergänzen</strong>
                <p>
                  Neue Inhalte, Farben, Logos und Ziel-Links werden zentral in <code>src/content.ts</code> gepflegt.
                </p>
              </div>
            </div>
          </section>

          <div className="hint-box">{hubConfig.addToHomeHint}</div>

          <footer className="legal-footer">
            <a href={hubConfig.legal.imprintHref}>{hubConfig.legal.imprintLabel}</a>
            <span>·</span>
            <a href={hubConfig.legal.privacyHref}>{hubConfig.legal.privacyLabel}</a>
          </footer>
        </main>
      </div>
    </div>
  );
}

function CtaLink({ cta, className = "primary-cta" }: { cta: Cta; className?: string }) {
  return (
    <a
      className={className}
      href={cta.href}
      target={cta.external ? "_blank" : undefined}
      rel={cta.external ? "noopener noreferrer" : undefined}
      download={cta.download ? true : undefined}
      onClick={() =>
        trackEvent(cta.download ? "file_download" : "cta_click", {
          label: cta.label,
          href: cta.href
        })
      }
    >
      {cta.label}
      <span aria-hidden="true">↗</span>
    </a>
  );
}

function ScreenContent({ screen }: { screen: ModuleScreen }) {
  return (
    <>
      {screen.cards && (
        <div className="info-grid">
          {screen.cards.map((card) => (
            <article className="info-card" key={card.title}>
              <strong>{card.title}</strong>
              <p>{card.text}</p>
            </article>
          ))}
        </div>
      )}

      {screen.metrics && (
        <div className="metric-grid">
          {screen.metrics.map(([value, label]) => (
            <div className="metric-card" key={`${value}-${label}`}>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      )}

      {screen.steps && (
        <div className="step-list">
          {screen.steps.map(([step, text]) => (
            <div className="step-item" key={step}>
              <strong>{step}</strong>
              <span>{text}</span>
            </div>
          ))}
        </div>
      )}

      {(screen.cta || screen.secondaryCta) && (
        <div className="cta-stack">
          {screen.cta && <CtaLink cta={screen.cta} />}
          {screen.secondaryCta && <CtaLink cta={screen.secondaryCta} className="secondary-cta" />}
        </div>
      )}
    </>
  );
}

function ModuleScreen({
  module,
  screenIndex,
  setView,
  openContact
}: {
  module: HubModule;
  screenIndex: number;
  setView: (view: View) => void;
  openContact: () => void;
}) {
  const screen = module.screens[screenIndex];
  const progress = ((screenIndex + 1) / module.screens.length) * 100;
  const hasNext = screenIndex < module.screens.length - 1;
  const hasBack = screenIndex > 0;

  const goHome = () => setView({ type: "home" });

  const goNext = () => {
    if (!hasNext) {
      trackEvent("module_complete", {
        module_id: module.id,
        module_title: module.title
      });
      goHome();
      return;
    }

    trackEvent("screen_next", {
      module_id: module.id,
      from_screen: screen.label,
      to_screen: module.screens[screenIndex + 1].label
    });

    setView({ type: "module", moduleId: module.id, screenIndex: screenIndex + 1 });
  };

  const goBack = () => {
    if (!hasBack) {
      goHome();
      return;
    }

    trackEvent("screen_back", {
      module_id: module.id,
      from_screen: screen.label,
      to_screen: module.screens[screenIndex - 1].label
    });

    setView({ type: "module", moduleId: module.id, screenIndex: screenIndex - 1 });
  };

  return (
    <div className="page-shell">
      <div className="phone">
        <Header onHome={goHome} onContact={openContact} />

        <main className="module-screen" style={{ background: module.theme.page }}>
          <div className="module-progress-row">
            <span>{module.eyebrow}</span>
            <span>
              {screenIndex + 1}/{module.screens.length}
            </span>
          </div>

          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%`, background: module.theme.accent }} />
          </div>

          <section className="screen-card">
            <div className="screen-label">{screen.label}</div>
            <h1>{screen.title}</h1>
            <p>{screen.body}</p>
            <ScreenContent screen={screen} />
          </section>

          <nav className="bottom-nav">
            <button onClick={goBack}>{hasBack ? "Zurück" : "Menü"}</button>
            <button onClick={goHome}>Home</button>
            <button className="primary" onClick={goNext}>
              {hasNext ? "Weiter" : "Fertig"}
            </button>
          </nav>
        </main>
      </div>
    </div>
  );
}

function ContactScreen({ setView }: { setView: (view: View) => void }) {
  return (
    <div className="page-shell">
      <div className="phone">
        <Header onHome={() => setView({ type: "home" })} onContact={() => undefined} />

        <main className="module-screen contact-screen">
          <section className="screen-card">
            <div className="screen-label">Kontakt</div>
            <h1>{hubConfig.contact.title}</h1>
            <p>{hubConfig.contact.intro}</p>

            <div className="contact-list">
              <a href={`mailto:${hubConfig.contact.email}`}>{hubConfig.contact.email}</a>
              <a href={`tel:${hubConfig.contact.phone.replace(/\s/g, "")}`}>{hubConfig.contact.phone}</a>
              <span>{hubConfig.contact.companyLine}</span>
            </div>

            <p className="fineprint">{hubConfig.contact.footer}</p>
          </section>

          <nav className="bottom-nav">
            <button onClick={() => setView({ type: "home" })}>Zurück</button>
            <button onClick={() => setView({ type: "home" })}>Home</button>
            <button className="primary" onClick={() => setView({ type: "home" })}>
              Fertig
            </button>
          </nav>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<View>({ type: "home" });

  const activeModule = useMemo(() => {
    if (view.type !== "module") return undefined;
    return modules.find((module) => module.id === view.moduleId);
  }, [view]);

  if (view.type === "contact") {
    return <ContactScreen setView={setView} />;
  }

  if (view.type === "module" && activeModule) {
    return (
      <ModuleScreen
        module={activeModule}
        screenIndex={view.screenIndex}
        setView={setView}
        openContact={() => setView({ type: "contact" })}
      />
    );
  }

  return (
    <HomeScreen
      openModule={(moduleId) => setView({ type: "module", moduleId, screenIndex: 0 })}
      openContact={() => setView({ type: "contact" })}
    />
  );
}
