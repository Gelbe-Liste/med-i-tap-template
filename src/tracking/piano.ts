type PianoValue = string | number | boolean | string[] | number[] | boolean[];
type PianoProperties = Record<string, PianoValue | undefined | null>;

type QueuedEvent = {
  eventName: string;
  properties: Record<string, PianoValue>;
  at: number;
};

const sentOnce = new Set<string>();
const pendingEvents: QueuedEvent[] = [];
let persistentContext: Record<string, PianoValue> = {};
let initPromise: Promise<void> | null = null;

const pianoEnabled = String(import.meta.env.VITE_PIANO_ENABLED || "false").toLowerCase() === "true";
const pianoSiteId = Number(import.meta.env.VITE_PIANO_SITE_ID || 640794);
const pianoCollectDomain = String(import.meta.env.VITE_PIANO_COLLECT_DOMAIN || "https://rwwnhth.pa-cd.com");
const pianoSdkUrl = "https://tag.aticdn.net/piano-analytics.js";

const essentialProperties = [
  // Bereits in der Gelbe-Liste-Produktivkonfiguration vorhanden
  "is_PAP",
  "page",
  "page_url",
  "de_page_category",
  "de_page_tags",
  "product_name",
  "product_mol",
  "product_titulaire",
  "product_ATC_class_code",
  "product_ATC_class_name",
  "product_UCD10_codes",
  "page_type",
  "visitor_type",
  "occupation",
  "article_category",
  "box_names",
  "pop_in_name",
  "pop_in_type",
  "click",
  // Ergänzungen für med.i.tap – vor Livegang im Piano Data Model validieren
  "project_id",
  "module_id",
  "module_title",
  "screen_id",
  "screen_number",
  "screen_title",
  "document_id",
  "element_id",
  "destination_path",
  "entry_point",
  "standalone_mode",
  "install_outcome",
  "trigger_source"
];

const essentialEvents = ["pop_in.display", "click.action"];

function cleanProperties(properties: PianoProperties = {}) {
  return Object.fromEntries(
    Object.entries(properties).filter(([, value]) => value !== undefined && value !== null && value !== "")
  ) as Record<string, PianoValue>;
}

function configureConsentLayer() {
  const w = window as any;

  w._pac = w._pac || {};
  w._pac.cookieSecure = true;

  // Eine Cookie-Domain .gelbe-liste.de darf nur auf dieser Domain gesetzt werden.
  // Auf Vercel/Preview-Domains wird cookieDomain bewusst nicht erzwungen.
  if (/(^|\.)gelbe-liste\.de$/i.test(window.location.hostname)) {
    w._pac.cookieDomain = ".gelbe-liste.de";
  }

  w.pdl = w.pdl || {};
  w.pdl.requireConsent = true;
  const previousConsent = w.pdl.consent || {};
  w.pdl.consent = {
    ...previousConsent,
    products: Array.from(new Set([...(previousConsent.products || []), "PA"])),
    defaultPreset: {
      ...(previousConsent.defaultPreset || {}),
      PA: "essential"
    }
  };

  w.pdl.consent_items = w.pdl.consent_items || {};
  const previousPaItems = w.pdl.consent_items.PA || {};
  w.pdl.consent_items.PA = {
    ...previousPaItems,
    properties: {
      ...(previousPaItems.properties || {}),
      ...Object.fromEntries(essentialProperties.map((property) => [property, "essential"]))
    },
    events: {
      ...(previousPaItems.events || {}),
      ...Object.fromEntries(essentialEvents.map((eventName) => [eventName, "essential"]))
    }
  };
}

function loadPianoSdk() {
  return new Promise<void>((resolve, reject) => {
    const w = window as any;
    if (w.pa?.sendEvent) {
      resolve();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${pianoSdkUrl}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Piano Analytics SDK konnte nicht geladen werden.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = pianoSdkUrl;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Piano Analytics SDK konnte nicht geladen werden."));
    document.head.appendChild(script);
  });
}

function flushQueue() {
  const pa = (window as any).pa;
  if (!pa?.sendEvent) return;
  while (pendingEvents.length) {
    const queued = pendingEvents.shift();
    if (queued) pa.sendEvent(queued.eventName, queued.properties);
  }
}

export function sanitizePageUrl(url = window.location.href) {
  try {
    const parsed = new URL(url, window.location.origin);
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return window.location.origin + window.location.pathname;
  }
}


export function sanitizeDestinationPath(url: string) {
  try {
    const parsed = new URL(url, window.location.origin);
    return `${parsed.hostname}${parsed.pathname}`.slice(0, 255);
  } catch {
    return String(url).split(/[?#]/, 1)[0].slice(0, 255);
  }
}

export function getEntryPoint() {
  const params = new URLSearchParams(window.location.search);
  const raw = (params.get("src") || params.get("utm_source") || "").toLowerCase();
  if (["nfc", "nfc_tag", "nfc-tag"].includes(raw)) return "nfc_tag";
  if (["qr", "qr_code", "qr-code"].includes(raw)) return "qr_code";
  if (raw) return raw.replace(/[^a-z0-9_-]/g, "_").slice(0, 80);
  return "direct_link";
}

export function getStandaloneMode() {
  const iosNavigator = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || iosNavigator.standalone === true;
}

export function setTrackingContext(properties: PianoProperties) {
  persistentContext = cleanProperties({ ...persistentContext, ...properties });
  const pa = (window as any).pa;
  if (pianoEnabled && pa?.setProperties) {
    pa.setProperties(persistentContext, { persistent: true });
  }
}

export function initPianoTracking(properties: PianoProperties = {}) {
  persistentContext = cleanProperties({ ...persistentContext, ...properties });
  if (!pianoEnabled) {
    if (import.meta.env.DEV) console.info("[Piano disabled]", persistentContext);
    return Promise.resolve();
  }

  if (initPromise) return initPromise;

  initPromise = (async () => {
    configureConsentLayer();
    await loadPianoSdk();
    const pa = (window as any).pa;
    if (!pa) throw new Error("Piano Analytics SDK ist nach dem Laden nicht verfügbar.");

    pa.setConfigurations({
      site: pianoSiteId,
      collectDomain: pianoCollectDomain
    });

    if (Object.keys(persistentContext).length && pa.setProperties) {
      pa.setProperties(persistentContext, { persistent: true });
    }

    flushQueue();
  })().catch((error) => {
    console.warn("[Piano] Initialisierung fehlgeschlagen:", error);
  });

  return initPromise;
}

export function trackEvent(eventName: string, properties: PianoProperties = {}) {
  const clean = cleanProperties(properties);
  const debugPayload = { ...persistentContext, ...clean };

  if (import.meta.env.DEV || !pianoEnabled) {
    console.info("[Tracking]", eventName, debugPayload);
  }

  if (!pianoEnabled) return;

  const pa = (window as any).pa;
  if (pa?.sendEvent) {
    pa.sendEvent(eventName, clean);
  } else {
    pendingEvents.push({ eventName, properties: clean, at: Date.now() });
  }
}

export function trackOnce(key: string, eventName: string, properties: PianoProperties = {}) {
  if (sentOnce.has(key)) return;
  sentOnce.add(key);
  trackEvent(eventName, properties);
}
