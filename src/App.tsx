import { useEffect, useMemo, useState } from "react";
import { hubConfig, modules, type Cta, type HubModule, type ModuleScreen } from "./content";

type View =
  | { type: "home" }
  | { type: "module"; moduleId: string; screenIndex: number }
  | { type: "contact" };

type InstallMode = "prompt" | "ios" | "samsung" | "manual" | "installed";

type InstallPromptResult = { outcome: "accepted" | "dismissed"; platform: string };

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<InstallPromptResult>;
};

function isStandaloneMode() {
  const iosNavigator = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || iosNavigator.standalone === true;
}

function isIosDevice() {
  const ua = navigator.userAgent;
  const classicIos = /iPad|iPhone|iPod/i.test(ua);
  const iPadDesktopMode = /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
  return classicIos || iPadDesktopMode;
}

function isSamsungInternet() {
  return /SamsungBrowser/i.test(navigator.userAgent);
}

function openCurrentPageInChrome() {
  const { host, pathname, search, href } = window.location;
  const path = `${pathname}${search}`;
  const fallbackUrl = encodeURIComponent(href);
  const intentUrl = `intent://${host}${path}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${fallbackUrl};end`;

  trackEvent("pwa_open_chrome");
  window.location.href = intentUrl;
}

function usePwaInstall() {
  const [installMode, setInstallMode] = useState<InstallMode>("manual");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandaloneMode()) {
      setInstallMode("installed");
    } else if (isIosDevice()) {
      setInstallMode("ios");
    } else if (isSamsungInternet()) {
      // Samsung Internet kann PWAs auf neueren Android-Versionen derzeit als
      // WebAPK verpacken, das von Google Play Protect fälschlich als veraltet
      // bzw. unsicher eingestuft wird. Deshalb dort nicht den nativen
      // Installationsdialog auslösen, sondern die Installation über Chrome führen.
      setInstallMode("samsung");
    } else {
      setInstallMode("manual");
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();

      if (isSamsungInternet()) {
        setDeferredPrompt(null);
        setInstallMode("samsung");
        return;
      }

      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setInstallMode("prompt");
    };

    const handleInstalled = () => {
      setDeferredPrompt(null);
      setInstallMode("installed");
      trackEvent("pwa_installed");
    };

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleDisplayModeChange = () => {
      if (mediaQuery.matches) {
        setInstallMode("installed");
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    mediaQuery.addEventListener?.("change", handleDisplayModeChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
      mediaQuery.removeEventListener?.("change", handleDisplayModeChange);
    };
  }, []);

  const requestInstall = async () => {
    if (!deferredPrompt) return null;

    trackEvent("pwa_install_prompt_open");
    const choice = await deferredPrompt.prompt();

    trackEvent("pwa_install_prompt_result", { outcome: choice.outcome });

    if (choice.outcome === "accepted") {
      setInstallMode("installed");
    }

    setDeferredPrompt(null);
    return choice.outcome;
  };

  return { installMode, requestInstall };
}

function trackEvent(eventName: string, data?: Record<string, string | number>) {
  console.log("[Tracking]", eventName, data);

  // Später z. B. Piano Analytics, Matomo oder GA4 anbinden:
  // window.pa?.sendEvent(eventName, data);
  // window._paq?.push(["trackEvent", "NFC Microsite", eventName, JSON.stringify(data)]);
  // window.gtag?.("event", eventName, data);
}

function InstallAppControl({
  installMode,
  requestInstall
}: {
  installMode: InstallMode;
  requestInstall: () => Promise<"accepted" | "dismissed" | null>;
}) {
  const [showHelp, setShowHelp] = useState(false);

  if (installMode === "installed") return null;

  const handleInstall = async () => {
    if (installMode === "prompt") {
      await requestInstall();
      return;
    }

    if (installMode === "samsung") {
      openCurrentPageInChrome();
      return;
    }

    trackEvent("pwa_install_help_open", { platform: installMode });
    setShowHelp(true);
  };

  const isIos = installMode === "ios";
  const isSamsung = installMode === "samsung";

  return (
    <section className="install-card" aria-label="App auf dem Gerät installieren">
      <div className="install-card-copy">
        <strong>Direktzugriff auf dem Gerät</strong>
        <span>{isSamsung ? "Für eine sichere Installation bitte in Chrome fortfahren." : "Als App speichern und später ohne Browserleiste starten."}</span>
      </div>
      <button className="install-button" onClick={handleInstall}>
        {isIos ? "Zum Home-Bildschirm" : isSamsung ? "Mit Chrome installieren" : "App installieren"}
      </button>

      {showHelp && (
        <div className="install-dialog-backdrop" role="presentation" onClick={() => setShowHelp(false)}>
          <div
            className="install-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button className="install-dialog-close" onClick={() => setShowHelp(false)} aria-label="Hinweis schließen">
              ×
            </button>
            <div className="install-dialog-kicker">App installieren</div>
            <h2 id="install-dialog-title">{isIos ? "Zum Home-Bildschirm hinzufügen" : "Im Browser installieren"}</h2>

            {isIos ? (
              <>
                <ol className="install-steps">
                  <li>In Safari das <strong>Teilen-Symbol</strong> öffnen.</li>
                  <li><strong>„Zum Home-Bildschirm“</strong> auswählen.</li>
                  <li>Oben rechts auf <strong>„Hinzufügen“</strong> tippen.</li>
                </ol>
                <p className="install-dialog-note">
                  Falls die Option fehlt, diese Seite bitte zuerst in Safari öffnen. Danach startet die Anwendung über das neue Icon im App-Modus ohne normale Browser-Navigation.
                </p>
              </>
            ) : (
              <>
                <ol className="install-steps">
                  <li>Das Browser-Menü öffnen.</li>
                  <li><strong>„App installieren“</strong> oder <strong>„Zum Startbildschirm hinzufügen“</strong> wählen.</li>
                  <li>Die Installation bestätigen.</li>
                </ol>
                <p className="install-dialog-note">
                  Die genaue Bezeichnung hängt vom verwendeten Browser ab. Chrome und Edge unterstützen den direkten Installationsdialog, sobald die App installierbar ist.
                </p>
              </>
            )}

            <button className="install-dialog-confirm" onClick={() => setShowHelp(false)}>
              Verstanden
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function Header({
  onHome,
  onContact,
  contextText
}: {
  onHome: () => void;
  onContact: () => void;
  contextText: string;
}) {
  return (
    <header className="app-header">
      <div className="header-brand">
        <button className="header-logo-button" onClick={onHome} aria-label="Zum Hauptmenü">
          <img src="/icons/icon-192.png" alt="Gelbe Liste Pharmindex" />
        </button>
        <div className="header-context" aria-label={`Medizinisches Fachgebiet: ${contextText}`}>
          <span className="header-context-label">Medizinisches Fachgebiet</span>
          <span className="header-context-value">{contextText}</span>
        </div>
      </div>
      <button className="header-button contact" onClick={onContact} aria-label="Kontakt öffnen">
        Kontakt
      </button>
    </header>
  );
}

function HomeScreen({
  openModule,
  openContact,
  installMode,
  requestInstall
}: {
  openModule: (moduleId: string) => void;
  openContact: () => void;
  installMode: InstallMode;
  requestInstall: () => Promise<"accepted" | "dismissed" | null>;
}) {
  return (
    <div className="page-shell">
      <div className="phone">
        <Header onHome={() => undefined} onContact={openContact} contextText="Indikation" />

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
          <InstallAppControl installMode={installMode} requestInstall={requestInstall} />

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
  const showProgress = module.screens.length > 1;
  const hasNext = screenIndex < module.screens.length - 1;

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

  return (
    <div className="page-shell">
      <div className="phone">
        <Header onHome={goHome} onContact={openContact} contextText={module.eyebrow} />

        <main className="module-screen" style={{ background: module.theme.page }}>
          {showProgress && (
            <>
              <div className="module-progress-row">
                <span>{module.eyebrow}</span>
                <span>
                  {screenIndex + 1}/{module.screens.length}
                </span>
              </div>

              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progress}%`, background: module.theme.accent }} />
              </div>
            </>
          )}

          <section className="screen-card">
            <div className="screen-label">{screen.label}</div>
            <h1>{screen.title}</h1>
            <p>{screen.body}</p>
            <ScreenContent screen={screen} />
          </section>

          <nav className="bottom-nav">
            <button className={`primary${hasNext ? "" : " is-finish"}`} onClick={goNext}>
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
        <Header onHome={() => setView({ type: "home" })} onContact={() => undefined} contextText="Kontakt" />

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
            <button className="primary is-finish" onClick={() => setView({ type: "home" })}>
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
  const { installMode, requestInstall } = usePwaInstall();

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
      installMode={installMode}
      requestInstall={requestInstall}
    />
  );
}
