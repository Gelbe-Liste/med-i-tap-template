import { useEffect, useMemo, useRef, useState } from "react";
import { hubConfig, modules, type Cta, type HubModule, type ModuleScreen } from "./content";
import {
  getStandaloneMode,
  initPianoTracking,
  sanitizeDestinationPath,
  sanitizePageUrl,
  trackEvent,
  trackOnce
} from "./tracking/piano";

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

function buildChromeIntentUrl() {
  const { host, pathname, search } = window.location;
  const path = `${pathname}${search}`;

  return `intent://${host}${path}#Intent;scheme=https;package=com.android.chrome;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end`;
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
      trackEvent("click.action", {
        pop_in_type: "PWA",
        pop_in_name: "Direct access",
        click: "PWA installed",
        install_outcome: "installed"
      });
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

    trackEvent("click.action", {
      pop_in_type: "PWA",
      pop_in_name: "Direct access",
      click: "Open install prompt",
      trigger_source: "install_card"
    });
    const choice = await deferredPrompt.prompt();

    trackEvent("click.action", {
      pop_in_type: "PWA",
      pop_in_name: "Direct access",
      click: "Install prompt result",
      install_outcome: choice.outcome,
      trigger_source: "install_card"
    });

    if (choice.outcome === "accepted") {
      setInstallMode("installed");
    }

    setDeferredPrompt(null);
    return choice.outcome;
  };

  return { installMode, requestInstall };
}

function InstallAppControl({
  installMode,
  requestInstall
}: {
  installMode: InstallMode;
  requestInstall: () => Promise<"accepted" | "dismissed" | null>;
}) {
  const [showHelp, setShowHelp] = useState(false);
  const [showChromeHelp, setShowChromeHelp] = useState(false);

  const handleInstall = async () => {
    if (installMode === "prompt") {
      await requestInstall();
      return;
    }

    if (installMode === "samsung") {
      trackEvent("click.action", {
        pop_in_type: "PWA",
        pop_in_name: "Direct access",
        click: "Open in Chrome",
        trigger_source: "install_card"
      });
      window.location.href = buildChromeIntentUrl();

      window.setTimeout(() => {
        if (document.visibilityState === "visible") {
          setShowChromeHelp(true);
        }
      }, 1400);
      return;
    }

    trackEvent("click.action", {
      pop_in_type: "PWA Help",
      pop_in_name: installMode === "ios" ? "iOS home-screen help" : "Home-screen help",
      click: "Open install help",
      trigger_source: "install_card"
    });
    setShowHelp(true);
  };

  const isIos = installMode === "ios";
  const isSamsung = installMode === "samsung";

  useEffect(() => {
    if (showHelp) {
      trackEvent("pop_in.display", {
        pop_in_type: "PWA Help",
        pop_in_name: isIos ? "iOS home-screen help" : "Home-screen help",
        page: `${hubConfig.projectName} | Home`
      });
    }
  }, [showHelp, isIos]);

  useEffect(() => {
    if (showChromeHelp) {
      trackEvent("pop_in.display", {
        pop_in_type: "PWA Help",
        pop_in_name: "Chrome browser help",
        page: `${hubConfig.projectName} | Home`
      });
    }
  }, [showChromeHelp]);

  if (installMode === "installed") return null;

  return (
    <section className="install-card" aria-label="Direktzugriff auf dem Gerät speichern">
      <div className="install-card-copy">
        <strong>Direktzugriff speichern</strong>
        <span>
          {isSamsung
            ? "Der Direktzugriff auf dem Home-Bildschirm wird über Google Chrome unterstützt."
            : "Speichern Sie den Direktzugriff auf Ihrem Home-Bildschirm und öffnen Sie die Inhalte später direkt über das Icon."}
        </span>
      </div>
      <button className="install-button" onClick={handleInstall}>
        {isIos
          ? "Zum Home-Bildschirm hinzufügen"
          : isSamsung
            ? "In Google Chrome öffnen"
            : "Auf Home-Bildschirm speichern"}
      </button>

      {isSamsung && (
        <div className="install-card-note">
          Falls Android nach dem Browser fragt, bitte <strong>Google Chrome</strong> auswählen.
        </div>
      )}

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
            <div className="install-dialog-kicker">Direktzugriff speichern</div>
            <h2 id="install-dialog-title">{isIos ? "Zum Home-Bildschirm hinzufügen" : "Auf dem Gerät speichern"}</h2>

            {isIos ? (
              <>
                <ol className="install-steps">
                  <li>In Safari das <strong>Teilen-Symbol</strong> öffnen.</li>
                  <li><strong>„Zum Home-Bildschirm“</strong> auswählen.</li>
                  <li>Oben rechts auf <strong>„Hinzufügen“</strong> tippen.</li>
                </ol>
                <p className="install-dialog-note">
                  Falls die Option fehlt, diese Seite bitte zuerst in Safari öffnen. Danach öffnen Sie die Inhalte über das neue Icon direkt und ohne normale Browser-Navigation.
                </p>
              </>
            ) : (
              <>
                <ol className="install-steps">
                  <li>Das Browser-Menü öffnen.</li>
                  <li>Die Option zum <strong>Hinzufügen auf den Home- oder Startbildschirm</strong> auswählen.</li>
                  <li>Das Hinzufügen bestätigen.</li>
                </ol>
                <p className="install-dialog-note">
                  Die genaue Bezeichnung hängt vom verwendeten Browser ab. Anschließend öffnen Sie die Inhalte direkt über das neue Icon.
                </p>
              </>
            )}

            <button className="install-dialog-confirm" onClick={() => setShowHelp(false)}>
              Verstanden
            </button>
          </div>
        </div>
      )}

      {showChromeHelp && (
        <div className="install-dialog-backdrop" role="presentation" onClick={() => setShowChromeHelp(false)}>
          <div
            className="install-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="chrome-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button className="install-dialog-close" onClick={() => setShowChromeHelp(false)} aria-label="Hinweis schließen">
              ×
            </button>
            <div className="install-dialog-kicker">Google Chrome</div>
            <h2 id="chrome-dialog-title">Bitte in Chrome öffnen</h2>
            <p className="install-dialog-note">
              Sollte Android eine Browserauswahl anzeigen, wählen Sie bitte <strong>Google Chrome</strong>. Bei Auswahl von Samsung Internet gelangen Sie wieder zu dieser Seite zurück.
            </p>
            <button className="install-dialog-confirm" onClick={() => setShowChromeHelp(false)}>
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

function TrackedModuleCard({ module, openModule }: { module: HubModule; openModule: (moduleId: string) => void }) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
          trackOnce(`module-visible-${module.id}`, "pop_in.display", {
            pop_in_type: "NFC Module",
            pop_in_name: module.title,
            page: `${hubConfig.projectName} | Home`,
            module_id: module.id,
            module_title: module.title
          });
          observer.disconnect();
        }
      },
      { threshold: [0.35] }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [module]);

  return (
    <button
      ref={ref}
      className="module-card"
      style={{ background: module.theme.card, color: module.theme.text ?? "#ffffff" }}
      onClick={() => {
        trackEvent("click.action", {
          pop_in_type: "NFC Module",
          pop_in_name: module.title,
          click: "Open module",
          page: `${hubConfig.projectName} | Home`,
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
              <TrackedModuleCard key={module.id} module={module} openModule={openModule} />
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
            <a
              href={hubConfig.legal.imprintHref}
              onClick={() => trackEvent("click.action", { pop_in_type: "Footer Link", pop_in_name: hubConfig.legal.imprintLabel, click: "Open legal notice", page: `${hubConfig.projectName} | Home` })}
            >{hubConfig.legal.imprintLabel}</a>
            <span>·</span>
            <a
              href={hubConfig.legal.privacyHref}
              onClick={() => trackEvent("click.action", { pop_in_type: "Footer Link", pop_in_name: hubConfig.legal.privacyLabel, click: "Open privacy policy", page: `${hubConfig.projectName} | Home` })}
            >{hubConfig.legal.privacyLabel}</a>
          </footer>
        </main>
      </div>
    </div>
  );
}

function CtaLink({
  cta,
  module,
  screen,
  className = "primary-cta"
}: {
  cta: Cta;
  module: HubModule;
  screen: ModuleScreen;
  className?: string;
}) {
  const elementId = cta.analyticsId || `${module.id}-${screen.id}-cta`;
  return (
    <a
      className={className}
      href={cta.href}
      target={cta.external ? "_blank" : undefined}
      rel={cta.external ? "noopener noreferrer" : undefined}
      download={cta.download ? true : undefined}
      onClick={() =>
        trackEvent("click.action", {
          pop_in_type: cta.download ? "PDF" : "CTA",
          pop_in_name: cta.label,
          click: cta.download ? "Open document" : "Open external link",
          page: `${hubConfig.projectName} | ${module.title} | ${screen.label}`,
          module_id: module.id,
          module_title: module.title,
          screen_id: screen.id,
          screen_title: screen.label,
          element_id: elementId,
          document_id: cta.download ? (cta.documentId || elementId) : undefined,
          destination_path: sanitizeDestinationPath(cta.href),
          trigger_source: "module_screen"
        })
      }
    >
      {cta.label}
      <span aria-hidden="true">↗</span>
    </a>
  );
}

function ScreenContent({ screen, module }: { screen: ModuleScreen; module: HubModule }) {
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
          {screen.cta && <CtaLink cta={screen.cta} module={module} screen={screen} />}
          {screen.secondaryCta && <CtaLink cta={screen.secondaryCta} module={module} screen={screen} className="secondary-cta" />}
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

  const goHome = () => {
    trackEvent("click.action", {
      pop_in_type: "Navigation",
      pop_in_name: "Header",
      click: "Home",
      page: `${hubConfig.projectName} | ${module.title} | ${screen.label}`,
      module_id: module.id,
      screen_id: screen.id,
      trigger_source: "header"
    });
    setView({ type: "home" });
  };

  const goNext = () => {
    if (!hasNext) {
      trackEvent("click.action", {
        pop_in_type: "Navigation",
        pop_in_name: "Bottom navigation",
        click: "Complete module",
        page: `${hubConfig.projectName} | ${module.title} | ${screen.label}`,
        module_id: module.id,
        module_title: module.title,
        screen_id: screen.id,
        screen_number: screenIndex + 1,
        screen_title: screen.label,
        trigger_source: "bottom_navigation"
      });
      // Ein Nutzerklick erzeugt genau ein click.action. Der virtuelle Home-Aufruf
      // wird anschließend separat als page.display erfasst.
      setView({ type: "home" });
      return;
    }

    trackEvent("click.action", {
      pop_in_type: "Navigation",
      pop_in_name: "Bottom navigation",
      click: "Next screen",
      page: `${hubConfig.projectName} | ${module.title} | ${screen.label}`,
      module_id: module.id,
      module_title: module.title,
      screen_id: screen.id,
      screen_number: screenIndex + 1,
      screen_title: screen.label
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
            <ScreenContent screen={screen} module={module} />
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
        <Header
          onHome={() => {
            trackEvent("click.action", { pop_in_type: "Navigation", pop_in_name: "Header", click: "Home", page: `${hubConfig.projectName} | Contact`, trigger_source: "header" });
            setView({ type: "home" });
          }}
          onContact={() => undefined}
          contextText="Kontakt"
        />

        <main className="module-screen contact-screen">
          <section className="screen-card">
            <div className="screen-label">Kontakt</div>
            <h1>{hubConfig.contact.title}</h1>
            <p>{hubConfig.contact.intro}</p>

            <div className="contact-list">
              <a href={`mailto:${hubConfig.contact.email}`} onClick={() => trackEvent("click.action", { pop_in_type: "Contact", pop_in_name: "E-Mail", click: "Open email", page: `${hubConfig.projectName} | Contact` })}>{hubConfig.contact.email}</a>
              <a href={`tel:${hubConfig.contact.phone.replace(/\s/g, "")}`} onClick={() => trackEvent("click.action", { pop_in_type: "Contact", pop_in_name: "Phone", click: "Open phone", page: `${hubConfig.projectName} | Contact` })}>{hubConfig.contact.phone}</a>
              <span>{hubConfig.contact.companyLine}</span>
            </div>

            <p className="fineprint">{hubConfig.contact.footer}</p>
          </section>

          <nav className="bottom-nav">
            <button
              className="primary is-finish"
              onClick={() => {
                trackEvent("click.action", { pop_in_type: "Navigation", pop_in_name: "Contact", click: "Close contact", page: `${hubConfig.projectName} | Contact` });
                setView({ type: "home" });
              }}
            >
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

  useEffect(() => {
    initPianoTracking({
      project_id: hubConfig.analytics.projectId,
      standalone_mode: getStandaloneMode()
    });
  }, []);

  useEffect(() => {
    const base = {
      page_url: sanitizePageUrl(),
      page_type: hubConfig.analytics.pageType,
      visitor_type: hubConfig.analytics.visitorType,
      article_category: (view.type === "module" && activeModule?.analytics?.articleCategory) || hubConfig.analytics.articleCategory,
      de_page_category: [
        ...((view.type === "module" && activeModule?.analytics?.specialtyCategories) || hubConfig.analytics.specialtyCategories || []),
        ...((view.type === "module" && activeModule?.analytics?.contentTypeCategories) || hubConfig.analytics.contentTypeCategories || [])
      ]
    };

    if (view.type === "home") {
      trackEvent("page.display", {
        ...base,
        page: `${hubConfig.projectName} | Home`,
        de_page_tags: hubConfig.analytics.tags
      });
      return;
    }

    if (view.type === "contact") {
      trackEvent("page.display", {
        ...base,
        page: `${hubConfig.projectName} | Contact`,
        de_page_tags: [...hubConfig.analytics.tags, "Contact"]
      });
      return;
    }

    if (activeModule) {
      const screen = activeModule.screens[view.screenIndex];
      if (!screen) return;
      trackEvent("page.display", {
        ...base,
        page: `${hubConfig.projectName} | ${activeModule.title} | ${screen.label}`,
        de_page_tags: [...hubConfig.analytics.tags, ...(activeModule.analytics?.tags || [])],
        module_id: activeModule.id,
        module_title: activeModule.title,
        screen_id: screen.id,
        screen_number: view.screenIndex + 1,
        screen_title: screen.label
      });
    }
  }, [view, activeModule]);

  const openContact = () => {
    const currentPage = view.type === "module" && activeModule
      ? `${hubConfig.projectName} | ${activeModule.title} | ${activeModule.screens[view.screenIndex]?.label || "Module"}`
      : `${hubConfig.projectName} | Home`;
    const currentScreen = view.type === "module" && activeModule
      ? activeModule.screens[view.screenIndex]
      : undefined;
    trackEvent("click.action", {
      pop_in_type: "Button",
      pop_in_name: "Contact",
      click: "Open contact",
      page: currentPage,
      module_id: activeModule?.id,
      module_title: activeModule?.title,
      screen_id: currentScreen?.id,
      screen_number: view.type === "module" ? view.screenIndex + 1 : undefined,
      screen_title: currentScreen?.label,
      trigger_source: "header"
    });
    setView({ type: "contact" });
  };

  if (view.type === "contact") {
    return <ContactScreen setView={setView} />;
  }

  if (view.type === "module" && activeModule) {
    return (
      <ModuleScreen
        module={activeModule}
        screenIndex={view.screenIndex}
        setView={setView}
        openContact={openContact}
      />
    );
  }

  return (
    <HomeScreen
      openModule={(moduleId) => setView({ type: "module", moduleId, screenIndex: 0 })}
      openContact={openContact}
      installMode={installMode}
      requestInstall={requestInstall}
    />
  );
}
