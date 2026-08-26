export type Cta = {
  label: string;
  href: string;
  external?: boolean;
  download?: boolean;
};

export type InfoCard = {
  title: string;
  text: string;
};

export type ModuleScreen = {
  label: string;
  title: string;
  body: string;
  cards?: InfoCard[];
  metrics?: [string, string][];
  steps?: [string, string][];
  cta?: Cta;
  secondaryCta?: Cta;
};

export type HubModule = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  badge: string;
  theme: {
    card: string;
    page: string;
    accent: string;
    text?: string;
  };
  screens: ModuleScreen[];
};

export const hubConfig = {
  projectName: "Gelbe Liste NFC Hub",
  badge: "med.i.tap Template",
  headline: "Gelbe Liste\nFachportal",
  intro:
    "Mobile-first Einstieg für Fachkreise: Inhalte werden kompakt angeteasert und führen direkt zu passenden Angeboten auf gelbe-liste.de.",
  addToHomeHint:
    "Tipp: Die Anwendung kann über das Browser-Menü zum Homebildschirm hinzugefügt werden. Für den Livegang sind Manifest und App-Icon bereits vorbereitet.",
  contact: {
    label: "Kontakt",
    title: "Gelbe Liste / Vidal MMI",
    intro:
      "Ansprechpartner, Projektinformationen und redaktionelle Hinweise können hier projektbezogen ergänzt werden.",
    email: "info@mmi.de",
    phone: "+49 (0) 6102 506-0",
    companyLine: "Vidal MMI Germany GmbH",
    footer: "Bitte finale Kontakt- und Pflichtangaben vor Livegang prüfen."
  },
  legal: {
    imprintLabel: "Impressum",
    privacyLabel: "Datenschutz",
    imprintHref: "/impressum.html",
    privacyHref: "/datenschutz.html"
  }
};

export const modules: HubModule[] = [
  {
    id: "arzneimittelsuche",
    eyebrow: "Fachportal",
    title: "Arzneimittel schnell finden",
    subtitle:
      "Direkter Einstieg in die Suche nach Präparaten, Wirkstoffen und relevanten Arzneimittelinformationen.",
    badge: "Suche",
    theme: {
      card:
        "linear-gradient(135deg, #ffd84d 0%, #ffcf1a 42%, #d7a900 100%)",
      page:
        "radial-gradient(circle at 78% 8%, rgba(255, 255, 255, 0.38), transparent 26%), linear-gradient(135deg, #ffe680 0%, #ffd84d 38%, #c99a00 100%)",
      accent: "#ffd400",
      text: "#111827"
    },
    screens: [
      {
        label: "Einstieg",
        title: "Schneller Zugriff auf Arzneimittelinformationen",
        body:
          "Dieses Modul dient als mobiler Einstieg in die Arzneimittelrecherche der Gelben Liste. Inhalte und Ziel-URL können pro Kundenprojekt angepasst werden.",
        cards: [
          {
            title: "Präparate & Wirkstoffe",
            text: "Führt zur relevanten Suche oder zu einer vordefinierten Landingpage auf gelbe-liste.de."
          },
          {
            title: "Mobile Nutzung",
            text: "Optimiert für den schnellen Aufruf über NFC-Tag oder QR-Code."
          }
        ],
        cta: {
          label: "Zur Gelbe Liste Suche",
          href: "https://www.gelbe-liste.de/suche",
          external: true
        }
      }
    ]
  },
  {
    id: "medizinische-news",
    eyebrow: "News",
    title: "Aktuelle medizinische Meldungen",
    subtitle:
      "Kompakter Zugang zu aktuellen Nachrichten, Meldungen und Updates aus Medizin und Pharmazie.",
    badge: "News",
    theme: {
      card:
        "linear-gradient(135deg, #fff6bf 0%, #ffe36a 42%, #d8b52a 100%)",
      page:
        "radial-gradient(circle at 20% 0%, rgba(255, 255, 255, 0.5), transparent 30%), linear-gradient(135deg, #fff9d8 0%, #ffe98f 42%, #d1ad28 100%)",
      accent: "#ffd400",
      text: "#171717"
    },
    screens: [
      {
        label: "Überblick",
        title: "News mobil antippen und weiterlesen",
        body:
          "Dieses Modul kann für News-Strecken, Kongress-Updates oder fachgebietsspezifische Themen genutzt werden. Die Zielseite wird im Template zentral gepflegt.",
        cards: [
          {
            title: "Themen bündeln",
            text: "Mehrere Artikel oder Themenseiten können in einem Modul gesammelt werden."
          },
          {
            title: "Direkt weiterführen",
            text: "Der CTA öffnet die passende Seite auf gelbe-liste.de in einem neuen Tab."
          }
        ],
        cta: {
          label: "News auf gelbe-liste.de öffnen",
          href: "https://www.gelbe-liste.de/nachrichten",
          external: true
        }
      }
    ]
  },
  {
    id: "fachinformationen",
    eyebrow: "Wissen & Service",
    title: "Fachinformationen & Services",
    subtitle:
      "Modulvorlage für vertiefende Inhalte, Serviceangebote oder produktnahe Informationsstrecken.",
    badge: "Service",
    theme: {
      card:
        "linear-gradient(135deg, #3b3414 0%, #5a4d12 52%, #8a7414 100%)",
      page:
        "radial-gradient(circle at 82% 8%, rgba(255, 224, 102, 0.22), transparent 28%), linear-gradient(135deg, #2f2a12 0%, #4a4014 48%, #7c6918 100%)",
      accent: "#ffd400"
    },
    screens: [
      {
        label: "Modulvorlage",
        title: "Inhalte flexibel strukturieren",
        body:
          "Dieses Modul zeigt, wie ein fachlicher Inhalt auf mehrere kurze Aussagen, Karten und einen klaren Call-to-Action reduziert werden kann.",
        steps: [
          ["1", "PDF, Artikel oder Landingpage auswählen"],
          ["2", "Kernaussagen in kurze mobile Screens überführen"],
          ["3", "Ziel-Link oder Download im CTA hinterlegen"]
        ],
        cta: {
          label: "Gelbe Liste Fachportal öffnen",
          href: "https://www.gelbe-liste.de",
          external: true
        }
      }
    ]
  },
  {
    id: "app-und-tools",
    eyebrow: "Gelbe Liste App",
    title: "App & digitale Werkzeuge",
    subtitle:
      "Vorlage für Module rund um App-Funktionen, mobile Nutzung und digitale Services.",
    badge: "App",
    theme: {
      card:
        "linear-gradient(135deg, #fffdf2 0%, #fff3b8 46%, #ffd84d 100%)",
      page:
        "radial-gradient(circle at 72% 8%, rgba(255, 212, 0, 0.34), transparent 30%), linear-gradient(135deg, #ffffff 0%, #fff8d9 44%, #ffd84d 100%)",
      accent: "#111827",
      text: "#111827"
    },
    screens: [
      {
        label: "Digitaler Service",
        title: "Mobile Services als Erweiterung des Fachportals",
        body:
          "Dieses Modul kann auf App-Funktionen, Service-Seiten oder spezielle digitale Werkzeuge verlinken. Texte und Ziel-URLs werden projektbezogen angepasst.",
        metrics: [
          ["NFC", "Tap öffnet die Landingpage"],
          ["PWA", "Homebildschirmfähig"],
          ["CTA", "Weiterleitung zu gelbe-liste.de"],
          ["Tracking", "Events vorbereitet"]
        ],
        cta: {
          label: "Zur Gelbe Liste Website",
          href: "https://www.gelbe-liste.de",
          external: true
        }
      }
    ]
  }
];
