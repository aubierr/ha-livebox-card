/*
 * Livebox TV Card — carte Lovelace pour le décodeur TV UHD Orange
 * (intégration https://github.com/AkA57/liveboxtvuhd)
 *
 * Fonctionnalités :
 *  - en-tête avec programme en cours (visuel EPG, titre, saison/épisode, progression)
 *  - changement de chaîne via liste recherchable (grille ou liste), favoris, récentes
 *  - contrôles : power, chaîne +/-, lecture/pause, volume +/-, muet
 *  - télécommande (croix directionnelle, OK, retour, menu, guide, VOD, enregistrement…)
 *  - pavé numérique (sélection directe d'une chaîne par son numéro)
 *  - éditeur visuel
 */

const CARD_VERSION = "1.0.0";
const CARD_TAG = "livebox-tv-card";

const DEFAULTS = {
  default_panel: "none", // none | channels | remote | keypad
  channel_layout: "grid", // grid | list
  list_height: 340,
  show_artwork: true,
  show_progress: true,
  show_volume: true,
  show_remote: true,
  show_keypad: true,
  hide_guide: false,
  close_on_select: true,
  power_on_delay: 6, // secondes entre l'allumage et le changement de chaîne quand on choisit une chaîne en veille
  builtin_logos: true,
  favorites: [],
  logos: {},
  logo_template: "",
  logo_path: "", // dossier des logos intégrés ; vide = logos/ à côté de la carte
};

// Logos réels des chaînes : dépôt tv-logo/tv-logos (https://github.com/tv-logo/tv-logos), servis par jsDelivr.
// Version figée pour que les URLs restent stables. Chemin relatif à countries/, "france/" et ".png" implicites,
// sauf pour les URLs complètes (http…) en fin de table.
// Copies locales : dossier logos/ situé à côté de ce fichier (la carte est chargée comme module JavaScript).
const LOCAL_LOGO_BASE = new URL("logos/", import.meta.url).href;
const LOGO_BASE ="https://cdn.jsdelivr.net/gh/tv-logo/tv-logos@d32e347bb7c4c640dceec23957802ad9182f58a6/countries/";
const CHANNEL_LOGOS = {
  "TF1": "tf1-fr",
  "FRANCE 2": "france-2-fr",
  "FRANCE 3": "france-3-fr",
  "FRANCE 4": "france-4-fr",
  "FRANCE 5": "france-5-fr",
  "M6": "m6-fr",
  "ARTE": "arte-fr",
  "LCP/PS": "lcp-fr",
  "W9": "w9-fr",
  "TMC": "tmc-fr",
  "TFX": "tfx-fr",
  "GULLI": "gulli-fr",
  "BFM TV": "bfm-tv-fr",
  "CNEWS": "c-news-fr",
  "LCI": "lci-fr",
  "FRANCEINFO:": "franceinfo-fr",
  "CSTAR": "c-star-fr",
  "T18": "t18-fr",
  "NOVO19": "novo19-fr",
  "TF1 SERIES FILMS": "tf1-series-films-fr",
  "LA CHAINE L'EQUIPE": "lequipe-fr",
  "6TER": "6ter-fr",
  "RMC STORY": "rmc-story-fr",
  "RMC DECOUVERTE": "rmc-decouverte-fr",
  "RMC LIFE": "rmc-life-fr",
  "TV5MONDE": "tv5-monde-fr",
  "RTL9": "rtl9-fr",
  "TEVA": "teva-fr",
  "PARIS PREMIERE": "paris-premiere-fr",
  "TV BREIZH": "tv-breizh-fr",
  "CANAL+": "canal-plus-fr",
  "C+ SPORT360": "canal-plus-sport-360-fr",
  "C+ FOOT": "canal-plus-foot-fr",
  "C+ SPORT": "canal-plus-sport-fr",
  "C+ BOX OFFICE": "canal-plus-box-office-fr",
  "C+ GRAND ECRAN": "canal-plus-grand-ecran-fr",
  "C+ CINEMAS": "canal-plus-cinemas-fr",
  "C+ DOCS": "canal-plus-docs-fr",
  "C+ KIDS": "canal-plus-kids-fr",
  "BEIN SPORTS 1": "bein-sports-1-french-fr",
  "BEIN SPORTS 2": "bein-sports-2-french-fr",
  "BEIN SPORTS 3": "bein-sports-3-french-fr",
  "DAZN": "international/dazn-int",
  "OCS PREMIER": "cine-plus-premier-fr",
  "CINE+ FRISSON": "cine-plus-frisson-fr",
  "CINE+ EMOTION": "cine-plus-emotion-fr",
  "CINE+ FAMIZ": "cine-plus-family-fr",
  "CINE+ FESTIVAL": "cine-plus-festival-fr",
  "CINE+ CLASSIC": "cine-plus-classic-fr",
  "CINE+ OCS A LA DEMANDE": "cine-plus-ocs-fr",
  "TCM CINEMA": "tcm-cinema-fr",
  "ACTION": "action-fr",
  "E!": "germany/e-entertainment-de",
  "MTV": "germany/mtv-de",
  "WARNER TV": "warner-tv-fr",
  "TLC": "tlc-fr",
  "AB1": "ab1-fr",
  "COMEDY CENTRAL": "germany/comedy-central-de",
  "13EME RUE": "belgium/13eme-rue-be",
  "SYFY": "germany/syfy-de",
  "COMEDIE+": "comedie-plus-fr",
  "POLAR+": "polar-plus-fr",
  "SERIE CLUB": "serie-club-fr",
  "DISNEY CHANNEL": "disney-channel-fr",
  "PITCHOUN TV": "pitchoun-tv-fr",
  "BOOMERANG": "boomerang-fr",
  "BOOMERANG +1": "boomerang-fr",
  "CARTOONITOON": "italy/cartoonito-it",
  "TIJI": "tiji-fr",
  "CANAL J": "canal-j-fr",
  "NICKELODEON JUNIOR": "nickelodeon-junior-fr",
  "NICKELODEON": "nickelodeon-fr",
  "NICKELODEON +1": "nickelodeon-fr",
  "NICKELODEON TEEN": "nickelodeon-teen-fr",
  "DREAMWORKS": "international/dreamworks-tv-int",
  "PIWI+": "piwi-plus-fr",
  "TELETOON+": "teletoon-plus-fr",
  "TELETOON+1": "teletoon-plus-1-fr",
  "NATIONAL GEOGRAPHIC": "germany/national-geographic-de",
  "MUSEUM TV": "world-europe/museum-eu",
  "DISCOVERY INVESTIGATION": "international/investigation-discovery-int",
  "TRAVELXP HD": "world-africa/travelxp-afr",
  "ANIMAUX": "animaux-fr",
  "CRIME DISTRICT": "crime-district-fr",
  "CHASSE & PECHE": "chasse-et-peche-fr",
  "TOUTE L'HISTOIRE": "toute-lhistoire-fr",
  "HISTOIRE TV": "histoire-tv-fr",
  "USHUAIA TV": "ushuaia-tv-fr",
  "MY ZEN TV": "spain/my-zen-tv-es",
  "SCIENCE & VIE TV": "science-and-vie-tv-fr",
  "DISCOVERY CHANNEL": "germany/discovery-channel-de",
  "PLANETE+": "planete-plus-fr",
  "PLANETE+ CRIME": "planete-plus-crime-fr",
  "PLANETE+ AVENTURE": "planete-plus-aventure-fr",
  "MCM": "mcm-fr",
  "MGG TV": "mgg-tv-fr",
  "MANGAS": "mangas-fr",
  "WB TV NEXT": "warner-tv-next-fr",
  "TV PITCHOUN KIDS MUSIC": "pitchoun-tv-fr",
  "TRACE URBAN": "trace-urban-fr",
  "NRJ HITS": "nrj-hits-fr",
  "CSTAR HITS FRANCE": "c-star-fr",
  "M6MUSIC": "m6-music-fr",
  "RFM": "rfm-tv-fr",
  "MELODY": "melody-fr",
  "TRACE LATINA": "trace-latina-fr",
  "OLYMPIA TV": "olympia-tv-fr",
  "MEZZO": "mezzo-fr",
  "MEZZO LIVE HD": "mezzo-live-fr",
  "STINGRAY CLASSICA": "germany/stingray-classica-de",
  "EQUIDIA": "equidia-fr",
  "SPORT EN FRANCE": "sport-en-france-fr",
  "BEIN SPORTS MAX 4": "international/beinsports/old/stacked/bein-sports-max-int",
  "BEIN SPORTS MAX 5": "international/beinsports/old/stacked/bein-sports-max-int",
  "BEIN SPORTS MAX 6": "international/beinsports/old/stacked/bein-sports-max-int",
  "BEIN SPORTS MAX 7": "international/beinsports/old/stacked/bein-sports-max-int",
  "BEIN SPORTS MAX 8": "international/beinsports/old/stacked/bein-sports-max-int",
  "BEIN SPORTS MAX 9": "international/beinsports/old/stacked/bein-sports-max-int",
  "BEIN SPORTS MAX 10": "international/beinsports/old/stacked/bein-sports-max-int",
  "LIGUE 1+ 2": "ligue-1plus-2-fr",
  "LIGUE 1+ 3": "ligue-1plus-3-fr",
  "LIGUE 1+ 4": "ligue-1plus-4-fr",
  "LIGUE 1+ 5": "ligue-1plus-5-fr",
  "AUTOMOTO LA CHAINE": "automoto-la-chaine-fr",
  "LIGUE 1+ 7": "ligue-1plus-7-fr",
  "LIGUE 1+ 8": "ligue-1plus-8-fr",
  "LIGUE 1+ 9": "ligue-1plus-9-fr",
  "EUROSPORT 2": "eurosport-2-fr",
  "FASHIONTV": "international/fashion-tv-int",
  "KTO": "kto-fr",
  "LCP 100%": "lcp-fr",
  "PUBLIC SENAT 24/24": "public-senat-fr",
  "FRANCE 24 FRANCAIS": "france-24-fr",
  "BFM BUSINESS": "bfm-business-fr",
  "LA CHAINE METEO": "la-chaine-meteo-fr",
  "FRANCE 24 ENGLISH": "france-24-fr",
  "SKY NEWS": "united-kingdom/sky-news-uk",
  "CNN INTERNATIONAL": "international/cnn-international-int",
  "CNBC": "world-europe/cnbc-eu",
  "BLOOMBERG EUROPE": "united-states/bloomberg-television-us",
  "BBC WORLD NEWS": "international/bbc-world-news-int",
  "AL JAZEERA ENGLISH": "united-kingdom/aljazeera-uk",
  "FRANCE 24 ARABE": "france-24-fr",
  "AL JAZEERA ARABE": "united-kingdom/aljazeera-uk",
  "I24NEWS": "israel/i24-news-il",
  "NHK WORLD - JAPAN": "international/nhk-world-japan-int",
  "DEUTSCHE WELLE ENGLISH": "international/dw-int",
  "TRT WORLD": "turkey/trt-world-tr",
  "FRANCE 24 ESPANOL": "france-24-fr",
  "DORCEL TV": "poland/dorcel-tv-pl",
  "DORCEL XXX": "canada/dorcel-xxx-ca",
  "PENTHOUSE GOLD": "united-states/penthouse-gold-us",
  "PENTHOUSE QUICKIES": "united-states/penthouse-quickies-us",
  "HUSTLER HD": "united-states/hustler-hd-us",
  "FRANCE 3 NATIONALE": "france-3-fr",
  "FRANCE 3 ALPES": "france-3-fr",
  "FRANCE 3 ALSACE": "france-3-fr",
  "FRANCE 3 AQUITAINE": "france-3-fr",
  "FRANCE 3 AUVERGNE": "france-3-fr",
  "FRANCE 3 BASSE NORMANDIE": "france-3-fr",
  "FRANCE 3 BOURGOGNE": "france-3-fr",
  "FRANCE 3 BRETAGNE": "france-3-fr",
  "FRANCE 3 CENTRE": "france-3-fr",
  "FRANCE 3 CHAMPAGNES ARDENNES": "france-3-fr",
  "FRANCE 3 CORSE": "france-3-fr",
  "FRANCE 3 CÔTE D'AZUR": "france-3-fr",
  "FRANCE 3 FRANCHE COMTE": "france-3-fr",
  "FRANCE 3 HAUTE NORMANDIE": "france-3-fr",
  "FRANCE 3 LANGUEDOC": "france-3-fr",
  "FRANCE 3 LIMOUSIN": "france-3-fr",
  "FRANCE 3 LORRAINE": "france-3-fr",
  "FRANCE 3 MIDI-PYRENEES": "france-3-fr",
  "FRANCE 3 NORD PAS DE CALAIS": "france-3-fr",
  "FRANCE 3 PARIS IDF": "france-3-fr",
  "FRANCE 3 PAYS DE LA LOIRE": "france-3-fr",
  "FRANCE 3 PICARDIE": "france-3-fr",
  "FRANCE 3 POITOU CHARENTES": "france-3-fr",
  "FRANCE 3 PACA": "france-3-fr",
  "FRANCE 3 RHONES ALPES": "france-3-fr",
  "TCM CINEMA VO": "tcm-cinema-fr",
  "BOOMERANG (VO)": "boomerang-fr",
  "FOXNEWS": "united-states/fox-news-us",
  "TCM CINEMA ANGLAIS": "tcm-cinema-fr",
  "BOOMERANG ANGLAIS": "boomerang-fr",
  "RTL NITRO": "germany/nitro-de",
  "ZDF": "germany/zdf-de",
  "ZDF_NEO": "germany/zdf-neo-de",
  "RTL 2": "germany/rtl-zwei-de",
  "VOX": "germany/vox-de",
  "PROSIEBEN": "austria/prosieben-austria-at",
  "KIKA": "germany/kika-de",
  "3SAT": "germany/3sat-de",
  "ONE": "germany/one-de",
  "TVE INTERNACIONAL": "international/tve-internacional-int",
  "CANAL Q": "portugal/canal-q-pt",
  "RAI NEWS 24": "italy/rai-news-24-it",
  "RAI UNO": "italy/rai-1-it",
  "RAI DUE": "italy/rai-2-it",
  "RAI TRE": "italy/rai-3-it",
  "NOVELA TV": "novelas-tv-fr",
  "TF1 4K": "tf1-fr",
  "FRANCE 2 UHD": "france-2-fr",
  "M6 4K": "m6-fr",
  // Chaînes absentes de tv-logos : logos de la base iptv-org (https://github.com/iptv-org/database),
  // de Wikimedia et de picons (https://github.com/picons/picons). URLs complètes.
  "EUROCHANNEL": "https://i.imgur.com/yXAtmI6.png",
  "L'ESPRIT SORCIER": "https://i.imgur.com/zyh8yub.png",
  "MAISONS & TRAVAUX TV": "https://i.imgur.com/uYpc6nE.png",
  "TOP SANTE TV": "https://i.imgur.com/O7U0DZk.png",
  "LE FIGARO TV": "https://i.imgur.com/a8RuRUQ.png",
  "TECH & CO": "https://upload.wikimedia.org/wikipedia/fr/thumb/8/83/Tech_%26_Co.svg/960px-Tech_%26_Co.svg.png",
  "MELODY D'AFRIQUE": "https://i.imgur.com/srBbJ4s.png",
  "CLUBBING TV": "https://i.imgur.com/MyiA92q.png",
  "TRACE TROPICAL": "https://cdn.jsdelivr.net/gh/picons/picons@1ed63488cb93094fe5dddde9c15591c91ba7e27e/build-source/logos/tracetropical.default.svg",
  "TRACE VANILLA": "https://i.imgur.com/ngF58fe.png",
  "JOURNAL TV DU GOLF": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Logo_officiel_Journal_du_Golf.png/250px-Logo_officiel_Journal_du_Golf.png",
  "LUCKY JACK TV": "https://i.imgur.com/HKIydT6.png",
  "LUXE TV": "https://i.imgur.com/24ehonx.png",
  "MEN'S UP TV": "https://i.imgur.com/5BZwRFs.png",
  "SQOOL TV": "https://i.imgur.com/iujcGiI.png",
  "DEMAIN.TV": "https://i.imgur.com/EIjYLyj.png",
  "SOUVENIRS FROM EARTH": "https://i.ibb.co/Qf1Ys8S/SOUVENIRS-FROM-EARTH.png",
  "EURONEWS FRANCAIS": "https://i.imgur.com/5A0Wnrv.png",
  "MEDI 1 TV": "https://i.imgur.com/a20DHnj.png",
  "ASHARQ NEWS": "https://i.imgur.com/bqRC3sl.png",
  "XXL": "https://i.imgur.com/TEuLkeQ.png",
  "PENTHOUSE BLACK": "https://i.imgur.com/eo7E8mR.png",
  "PINK X": "https://i.imgur.com/WsS4Kkm.png",
  "MAN-X": "https://i.imgur.com/rod1KmE.png",
  "A+ KIDS": "https://i.imgur.com/ZUVvwC0.png",
  "ETV": "https://i.imgur.com/m5E2VP0.png",
  "TELE KREOL": "https://i.imgur.com/PcllRXg.png",
  "KANAL AUSTRAL": "https://i.imgur.com/MaaxPJb.png",
  "TV MONACO": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/TVMonaco_2023.svg/960px-TVMonaco_2023.svg.png",
  "SUPER RTL": "https://i.imgur.com/KbdK8t9.png",
  "RTPI": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/RTP_Mundo.svg/960px-RTP_Mundo.svg.png",
  "RAI ITALIA": "https://i.imgur.com/1nN4rEP.png",
  "THE ISRAELI NETWORK": "https://i.imgur.com/wOsArb9.png",
  "2M MONDE": "https://i.imgur.com/MvpntzA.png",
  "VOX AFRICA": "https://upload.wikimedia.org/wikipedia/fr/thumb/6/63/Voxafrica-1.png/960px-Voxafrica-1.png",
  "NCI": "https://i.imgur.com/I3pv69r.png",
  "TRACE AFRICA": "https://i.imgur.com/kPUkoS7.png",
  "TRACE GOSPEL": "https://i.imgur.com/X0UmU3K.png",
  "NOLLYWOOD TV": "https://i.imgur.com/29L2gbb.png",
  "SUNU YEUF": "https://i.imgur.com/WSlppQj.png",
  "EQUINOXE": "https://i.imgur.com/GKbnBlo.png",
  "B-ONE": "https://i.imgur.com/O66JSq5.png",
  // Chaînes trouvées ailleurs : france.tv (Mieux, logo extrait en local uniquement : préfixe @) et Wikimedia (Marmiton).
  "MIEUX": "@mieux",
  "MARMITON TV": "https://upload.wikimedia.org/wikipedia/fr/thumb/6/6e/Logo_Marmiton_%282019%29.svg/960px-Logo_Marmiton_%282019%29.svg.png",
  "MARMITE TV": "=MARMITON TV",
  // Liste Caraïbes (préfixe = : même logo qu'une autre entrée de la table).
  "GUADELOUPE 1ERE": "https://i.imgur.com/g8QTonQ.png",
  "MARTINIQUE 1ERE": "https://i.imgur.com/rBhc87a.png",
  "GUYANE 1ERE": "https://i.imgur.com/aHoVNvh.png",
  "CANAL 10 GUADELOUPE": "https://i.imgur.com/FAbd8jL.png",
  "KOUROU TV": "https://i.imgur.com/ZOmFLh3.png",
  "KMT": "https://i.imgur.com/xIYPPsK.png",
  "IO TV": "https://i.imgur.com/KwtIGj1.png",
  "ZITATA TV": "https://i.imgur.com/KJmefse.png",
  "LCP": "lcp-fr",
  "FRANCEINFO": "franceinfo-fr",
  "CHERIE 25": "rmc-life-fr",
  "TV5 MONDE": "tv5-monde-fr",
  "LIGUE 1+": "ligue-1plus-fr",
  "LIGUE 1+2": "ligue-1plus-2-fr",
  "LIGUE 1+3": "ligue-1plus-3-fr",
  "LIGUE 1+4": "ligue-1plus-4-fr",
  "LIGUE 1+5": "ligue-1plus-5-fr",
  "LIGUE 1+6": "ligue-1plus-6-fr",
  "LIGUE 1+7": "ligue-1plus-7-fr",
  "LIGUE 1+8": "ligue-1plus-8-fr",
  "LIGUE 1+9": "ligue-1plus-9-fr",
  "PARAMOUNT CHANNEL": "paramount-channel-fr",
  "PARAMOUNT CHANNEL DECALE": "paramount-channel-decale-fr",
  "BET": "bet-fr",
  "GAME ONE": "game-one-fr",
  "GAME ONE +1": "game-one-fr",
  "GULLI MAX": "gulli-fr",
  "L'ESPRIT SORCIER TV": "=L'ESPRIT SORCIER",
  "IMEARTH": "https://i.imgur.com/6aJMgve.jpeg",
  "J ONE": "j-one-fr",
  "ADN": "https://i.imgur.com/HQZQyWt.png",
  "MTV HITS": "united-kingdom/mtv-hits-uk",
  "EUROPE 2 POP TV": "europe-2-pop-tv-fr",
  "TRACE CARABBEAN": "trace-caribbean-fr",
  "MEZZO LIVE": "mezzo-live-fr",
  "SPORT EN FRANC": "sport-en-france-fr",
  "BFM2": "https://alloforfait.fr/wp-content/uploads/2024/03/logo-bfm2-300x200.jpg",
  "BSMART 4CHANGE": "b-smart-fr",
  "AFRICA 24": "https://africa24tv.com/wp-content/uploads/2021/09/logo.png",
  "TAHITI NUI TELEVISION": "https://i.imgur.com/e5eVHam.png",
  "ARTE GERMANY": "arte-fr",
  "RTP 3": "https://cdn-images.rtp.pt/common/img/channels/logos/color/horizontal/rtpnoticias_2026.png",
  "RECORD NEWS": "brazil/record-news-br",
};

// Logos trop sombres pour le fond foncé des tuiles (contraste WCAG mesuré) : affichés sur fond clair.
// Liste par nom de fichier : vaut aussi pour les alias et les chaînes qui partagent un logo.
const LIGHT_LOGOS = new Set([
  "tv5-monde-fr.png", "museum-eu.png", "tve-internacional-int.png", "journal-tv-du-golf.png", "luxe-tv.png",
  "man-x.png", "eurochannel.png", "le-figaro-tv.png", "demain-tv.png", "men-s-up-tv.png", "rai-news-24-it.png",
  "rai-italia.png", "kto-fr.png", "rai-1-it.png", "tech-co.png", "mtv-hits-uk.png", "guadeloupe-1ere.png",
  "martinique-1ere.png", "guyane-1ere.png", "canal-10-guadeloupe.png", "rtp-3.png",
]);

const REMOTE_KEYS = [
  { cmd: "BACK", icon: "mdi:arrow-u-left-top", label: "Retour" },
  { cmd: "MENU", icon: "mdi:home-outline", label: "Menu" },
  { cmd: "GUIDE", icon: "mdi:television-guide", label: "Guide" },
  { cmd: "VOD", icon: "mdi:filmstrip-box-multiple", label: "VOD" },
  { cmd: "FBWD", icon: "mdi:rewind", label: "Retour rapide" },
  { cmd: "PLAY/PAUSE", icon: "mdi:play-pause", label: "Lecture / pause" },
  { cmd: "FFWD", icon: "mdi:fast-forward", label: "Avance rapide" },
  { cmd: "REC", icon: "mdi:record-rec", label: "Enregistrer", cls: "rec" },
];

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const slugify = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\+/g, "plus")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const hashHue = (s) => {
  let h = 0;
  for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % 360;
};

const fmtTime = (sec) => {
  if (!isFinite(sec) || sec < 0) sec = 0;
  sec = Math.floor(sec);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
};

const lsGet = (key, fallback) => {
  try {
    const v = window.localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch (e) {
    return fallback;
  }
};
const lsSet = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    /* stockage indisponible : on ignore */
  }
};

class LiveboxTvCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._panel = null;
    this._tab = "all";
    this._search = "";
    this._pending = null; // { source, until }
    this._keypad = "";
    this._lastState = null;
    this._lastRemoteState = null;

    const root = this.shadowRoot;
    root.addEventListener("click", (e) => this._onClick(e));
    root.addEventListener("input", (e) => {
      if (e.target.classList.contains("search")) {
        this._search = e.target.value;
        this._renderList();
      }
    });
    root.addEventListener("keydown", (e) => {
      if (!e.target.classList.contains("search")) return;
      if (e.key === "Enter") {
        const first = this._filteredChannels()[0];
        if (first) this._selectSource(first.source);
      } else if (e.key === "Escape") {
        this._search = "";
        e.target.value = "";
        this._renderList();
      }
    });
    // logo introuvable -> on retire l'image, le badge texte reste visible
    root.addEventListener(
      "error",
      (e) => {
        const img = e.target;
        if (!img || img.tagName !== "IMG") return;
        // copie locale absente -> logo en ligne ; sinon on retire l'image et le badge texte reste visible
        if (img.dataset.fallback) {
          img.src = img.dataset.fallback;
          delete img.dataset.fallback;
        } else {
          img.remove();
        }
      },
      true
    );
  }

  /* ------------------------------------------------------------------ */
  /* Configuration                                                       */
  /* ------------------------------------------------------------------ */

  static getConfigForm() {
    // L'éditeur de HA affiche `default` quand l'option est absente de la configuration :
    // on reprend les valeurs de DEFAULTS pour que les cases reflètent ce que fait vraiment la carte.
    const withDefaults = (items) =>
      items.map((it) => {
        if (it.schema) return { ...it, schema: withDefaults(it.schema) };
        const def = DEFAULTS[it.name];
        return ["boolean", "number", "string"].includes(typeof def) && def !== "" ? { ...it, default: def } : it;
      });
    return {
      schema: withDefaults([
        {
          name: "entity",
          required: true,
          selector: { entity: { domain: "media_player" } },
        },
        { name: "remote_entity", selector: { entity: { domain: "remote" } } },
        { name: "name", selector: { text: {} } },
        {
          type: "grid",
          name: "",
          schema: [
            {
              name: "default_panel",
              selector: {
                select: {
                  mode: "dropdown",
                  options: [
                    { value: "none", label: "Aucun" },
                    { value: "channels", label: "Chaînes" },
                    { value: "remote", label: "Télécommande" },
                    { value: "keypad", label: "Pavé numérique" },
                  ],
                },
              },
            },
            {
              name: "channel_layout",
              selector: {
                select: {
                  mode: "dropdown",
                  options: [
                    { value: "grid", label: "Grille" },
                    { value: "list", label: "Liste" },
                  ],
                },
              },
            },
            { name: "list_height", selector: { number: { min: 150, max: 900, step: 10, unit_of_measurement: "px", mode: "box" } } },
            { name: "power_on_delay", selector: { number: { min: 0, max: 30, step: 1, unit_of_measurement: "s", mode: "box" } } },
            { name: "logo_template", selector: { text: {} } },
            { name: "logo_path", selector: { text: {} } },
          ],
        },
        {
          type: "grid",
          name: "",
          schema: [
            { name: "show_artwork", selector: { boolean: {} } },
            { name: "show_progress", selector: { boolean: {} } },
            { name: "show_volume", selector: { boolean: {} } },
            { name: "show_remote", selector: { boolean: {} } },
            { name: "show_keypad", selector: { boolean: {} } },
            { name: "hide_guide", selector: { boolean: {} } },
            { name: "close_on_select", selector: { boolean: {} } },
            { name: "builtin_logos", selector: { boolean: {} } },
          ],
        },
      ]),
      computeLabel: (s) =>
        ({
          entity: "Lecteur multimédia Livebox",
          remote_entity: "Télécommande (auto-détectée si vide)",
          name: "Nom",
          default_panel: "Panneau ouvert par défaut",
          channel_layout: "Affichage des chaînes",
          list_height: "Hauteur max. de la liste",
          logo_template: "Modèle d'URL des logos ({slug}, {name}, {number})",
          show_artwork: "Visuel du programme",
          show_progress: "Barre de progression",
          show_volume: "Contrôles du volume",
          show_remote: "Bouton télécommande",
          show_keypad: "Bouton pavé numérique",
          hide_guide: "Masquer « GUIDE TV »",
          close_on_select: "Fermer la liste après sélection",
          power_on_delay: "Délai avant de zapper après l'allumage",
          builtin_logos: "Logos des chaînes intégrés",
          logo_path: "Dossier des logos intégrés (vide = logos/ à côté de la carte)",
        }[s.name]),
    };
  }

  static getStubConfig(hass) {
    const entities = hass.entities || {};
    let entity = Object.keys(entities).find((id) => id.startsWith("media_player.") && entities[id].platform === "liveboxtvuhd");
    if (!entity) entity = Object.keys(hass.states).find((id) => id.startsWith("media_player.") && /livebox/i.test(id));
    if (!entity) entity = Object.keys(hass.states).find((id) => id.startsWith("media_player.")) || "media_player.livebox";
    return { entity };
  }

  setConfig(config) {
    if (!config || !config.entity) throw new Error('Veuillez définir "entity" (le media_player de la Livebox).');
    if (!config.entity.startsWith("media_player.")) throw new Error('"entity" doit être une entité media_player.');
    this._config = { ...DEFAULTS, ...config };
    this._panel = this._config.default_panel && this._config.default_panel !== "none" ? this._config.default_panel : null;
    this._remoteCache = undefined;
    this._lastState = null;
    if (this._hass) this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;
    const st = hass.states[this._config.entity];
    const remoteId = this._remoteId();
    const rst = remoteId ? hass.states[remoteId] : null;
    const reached = st && st.state !== "off" && !(this._pending && this._pending.powering) && st.attributes.source === (this._pending && this._pending.source);
    if (this._pending && st && (reached || Date.now() > this._pending.until)) {
      this._pending = null;
      this._lastState = null;
    }
    if (st !== this._lastState || rst !== this._lastRemoteState) {
      this._lastState = st;
      this._lastRemoteState = rst;
      this._render();
    }
  }

  get hass() {
    return this._hass;
  }

  getCardSize() {
    const st = this._stateObj;
    if (st && ["off", "unavailable", "unknown"].includes(st.state) && !(this._pending && this._pending.powering)) {
      return this._panel ? 7 : 1;
    }
    return this._panel ? 9 : 4;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: "auto" };
  }

  connectedCallback() {
    clearInterval(this._timer);
    this._timer = setInterval(() => this._tickProgress(), 1000);
  }

  disconnectedCallback() {
    clearInterval(this._timer);
    clearTimeout(this._refreshT);
    clearTimeout(this._keypadT);
    // _powerT n'est pas annulé : le zapping prévu après l'allumage doit avoir lieu même si la carte est masquée
  }

  /* ------------------------------------------------------------------ */
  /* Données                                                             */
  /* ------------------------------------------------------------------ */

  get _stateObj() {
    return this._hass && this._config ? this._hass.states[this._config.entity] : undefined;
  }

  _remoteId() {
    if (this._config.remote_entity) return this._config.remote_entity;
    if (this._remoteCache !== undefined) return this._remoteCache;
    const hass = this._hass;
    let found = null;
    const ents = hass.entities;
    const me = ents && ents[this._config.entity];
    if (me && me.device_id) {
      found = Object.keys(ents).find((id) => id.startsWith("remote.") && ents[id].device_id === me.device_id) || null;
    }
    if (!found) {
      const obj = this._config.entity.split(".")[1];
      const candidates = [obj, obj.replace(/_media_player$/, ""), `${obj.replace(/_media_player$/, "")}_remote`];
      found = candidates.map((c) => `remote.${c}`).find((id) => hass.states[id]) || null;
    }
    this._remoteCache = found;
    return found;
  }

  _parse(source) {
    const m = /^(\d+)\.\s*(.*)$/.exec(source || "");
    return m ? { source, num: m[1], name: m[2].trim() } : { source, num: null, name: source || "" };
  }

  _channels() {
    const st = this._stateObj;
    const list = (st && st.attributes.source_list) || [];
    let chans = list.map((s) => this._parse(s));
    if (this._config.hide_guide) chans = chans.filter((c) => c.num !== "0");
    return chans;
  }

  get _favKey() {
    return `${CARD_TAG}:fav:${this._config.entity}`;
  }
  get _recentKey() {
    return `${CARD_TAG}:recent:${this._config.entity}`;
  }

  _favorites() {
    const local = lsGet(this._favKey, null);
    if (local) return new Set(local);
    // première utilisation : on part des favoris de la configuration
    const conf = (this._config.favorites || []).map(String);
    const set = new Set();
    for (const c of this._channels()) {
      if (conf.includes(c.num) || conf.some((f) => f.toLowerCase() === c.name.toLowerCase() || f === c.source)) set.add(c.source);
    }
    return set;
  }

  _toggleFavorite(source) {
    const fav = this._favorites();
    if (fav.has(source)) fav.delete(source);
    else fav.add(source);
    lsSet(this._favKey, [...fav]);
    this._renderList();
  }

  _pushRecent(source) {
    const recent = lsGet(this._recentKey, []).filter((s) => s !== source);
    recent.unshift(source);
    lsSet(this._recentKey, recent.slice(0, 12));
  }

  _filteredChannels() {
    let chans = this._channels();
    if (this._tab === "fav") {
      const fav = this._favorites();
      chans = chans.filter((c) => fav.has(c.source));
    } else if (this._tab === "recent") {
      const recent = lsGet(this._recentKey, []);
      const byId = new Map(chans.map((c) => [c.source, c]));
      chans = recent.map((s) => byId.get(s)).filter(Boolean);
    }
    const q = this._search.trim().toLowerCase();
    if (q) {
      const nq = slugify(q);
      chans = chans.filter((c) => c.num === q || (c.num && c.num.startsWith(q)) || c.name.toLowerCase().includes(q) || (nq && slugify(c.name).includes(nq)));
      // correspondance exacte du numéro en premier
      chans.sort((a, b) => (b.num === q) - (a.num === q));
    }
    return chans;
  }

  _logoUrl(ch) {
    const logos = this._config.logos || {};
    if (logos[ch.name]) return logos[ch.name];
    if (ch.num && logos[ch.num]) return logos[ch.num];
    if (logos[ch.source]) return logos[ch.source];
    const tpl = this._config.logo_template;
    if (tpl && ch.num !== null) {
      return tpl
        .replace(/\{slug\}/g, slugify(ch.name))
        .replace(/\{name\}/g, encodeURIComponent(ch.name))
        .replace(/\{number\}/g, ch.num);
    }
    return this._builtinLogo(ch);
  }

  // Logo intégré : copie locale (dossier logos/ à côté de la carte), l'URL en ligne sert de secours.
  _builtinLogo(ch) {
    return this._builtinLogos(ch).local;
  }

  _builtinLogos(ch) {
    if (this._config.builtin_logos === false) return {};
    let name = ch.name.toUpperCase();
    let path = CHANNEL_LOGOS[name];
    if (path && path.startsWith("=")) {
      // alias : même logo qu'une autre entrée
      name = path.slice(1);
      path = CHANNEL_LOGOS[name];
    }
    if (!path) return {};
    const isUrl = /^https?:/.test(path);
    const localOnly = path.startsWith("@");
    const remote = isUrl ? path : localOnly ? "" : `${LOGO_BASE}${path.includes("/") ? path : `france/${path}`}.png`;
    // nom du fichier local : doit rester identique au script de téléchargement des logos
    const file = isUrl
      ? `${slugify(name)}${/\.svg$/i.test(path) ? ".svg" : ".png"}`
      : localOnly
      ? `${path.slice(1)}.png`
      : `${path.split("/").pop()}.png`;
    const base = this._config.logo_path ? `${this._config.logo_path.replace(/\/?$/, "/")}` : LOCAL_LOGO_BASE;
    return { local: base + file, remote };
  }

  _abbr(name) {
    const clean = name.replace(/[:_]/g, " ").replace(/\s+/g, " ").trim();
    if (clean.length <= 7) return clean;
    const words = clean.split(" ");
    if (words.length > 1) {
      // "FRANCE 2" -> "FRANCE 2" trop long ? -> "F2" ; "BEIN SPORTS 1" -> "BS1"
      const ab = words.map((w) => (/^\d+$/.test(w) || w === "+" ? w : w[0])).join("");
      if (ab.length >= 2) return ab.slice(0, 5);
    }
    return clean.slice(0, 6);
  }

  _logo(ch, cls = "") {
    const hue = hashHue(ch.name);
    const url = this._logoUrl(ch);
    const abbr = this._abbr(ch.name || "?");
    const size = abbr.length > 5 ? "xs" : abbr.length > 3 ? "s" : "";
    const builtin = this._builtinLogos(ch);
    const isBuiltin = url && url === builtin.local;
    const light = isBuiltin && LIGHT_LOGOS.has(url.split("/").pop()) ? "light" : "";
    const fallback = isBuiltin && builtin.remote ? ` data-fallback="${esc(builtin.remote)}"` : "";
    // « 0. GUIDE TV » n'est pas une chaîne : icône du guide des programmes
    const guide = !url && ch.num === "0";
    return `<div class="logo ${cls} ${light} ${guide ? "guide" : ""}" style="--h:${hue}">
      ${guide ? this._icon("mdi:television-guide") : `<span class="abbr ${size}">${esc(abbr)}</span>`}
      ${url ? `<img src="${esc(url)}"${fallback} alt="" loading="lazy" referrerpolicy="no-referrer">` : ""}
    </div>`;
  }

  /* ------------------------------------------------------------------ */
  /* Actions                                                             */
  /* ------------------------------------------------------------------ */

  _haptic(type = "light") {
    this.dispatchEvent(new CustomEvent("haptic", { detail: type, bubbles: true, composed: true }));
  }

  _mp(service, data = {}) {
    this._haptic();
    return this._hass.callService("media_player", service, { entity_id: this._config.entity, ...data }).catch((err) => this._toast(err));
  }

  _remote(command) {
    const remote = this._remoteId();
    if (!remote) return;
    this._haptic();
    return this._hass
      .callService("remote", "send_command", { entity_id: remote, command, delay_secs: 0.4 })
      .catch((err) => this._toast(err));
  }

  _toast(err) {
    this.dispatchEvent(
      new CustomEvent("hass-notification", {
        detail: { message: `Livebox : ${(err && err.message) || err}` },
        bubbles: true,
        composed: true,
      })
    );
  }

  // L'intégration interroge le décodeur toutes les 30 s : on force un rafraîchissement.
  _refreshSoon(delay = 2500) {
    clearTimeout(this._refreshT);
    this._refreshT = setTimeout(() => {
      this._hass.callService("homeassistant", "update_entity", { entity_id: this._config.entity }).catch(() => {});
    }, delay);
  }

  _selectSource(source) {
    const st = this._stateObj;
    const powering = !!st && st.state === "off";
    this._pushRecent(source);
    clearTimeout(this._powerT);
    if (powering) {
      // décodeur en veille : on l'allume, puis on zappe une fois qu'il a démarré
      const delay = Math.max(0, Number(this._config.power_on_delay) || 0) * 1000;
      this._pending = { source, powering: true, until: Date.now() + delay + 40000 };
      this._mp("turn_on");
      this._powerT = setTimeout(() => {
        if (this._pending && this._pending.powering) this._pending.powering = false;
        this._mp("select_source", { source });
        this._refreshSoon();
        this._render();
      }, delay);
    } else {
      this._pending = { source, until: Date.now() + 35000 };
      this._mp("select_source", { source });
      this._refreshSoon();
    }
    if (this._config.close_on_select) {
      this._panel = null;
      this._search = "";
    }
    this._render();
  }

  _commitKeypad() {
    clearTimeout(this._keypadT);
    const num = this._keypad;
    this._keypad = "";
    if (!num) return this._render();
    const match = this._channels().find((c) => c.num === String(Number(num)));
    if (match) {
      this._selectSource(match.source);
      this._panel = "keypad";
      this._render();
    } else if (this._remoteId() && this._stateObj && this._stateObj.state !== "off") {
      this._remote(num.split(""));
      this._refreshSoon(4000);
      this._render();
    } else {
      this._render();
    }
  }

  _onClick(e) {
    const el = e.target.closest("[data-action]");
    if (!el || el.disabled) return;
    const { action, value } = el.dataset;
    const st = this._stateObj;
    switch (action) {
      case "power":
        this._mp(st && st.state !== "off" && st.state !== "unavailable" ? "turn_off" : "turn_on");
        this._refreshSoon(4000);
        break;
      case "prev":
        this._mp("media_previous_track");
        this._refreshSoon();
        break;
      case "next":
        this._mp("media_next_track");
        this._refreshSoon();
        break;
      case "playpause":
        this._mp("media_play_pause");
        this._refreshSoon();
        break;
      case "voldown":
        this._mp("volume_down");
        break;
      case "volup":
        this._mp("volume_up");
        break;
      case "mute":
        this._mp("volume_mute", { is_volume_muted: !(st && st.attributes.is_volume_muted) });
        break;
      case "panel":
        this._panel = this._panel === value ? null : value;
        if (this._panel === "channels") this._tab = this._tab || "all";
        this._render();
        if (this._panel === "channels") {
          const cur = this.shadowRoot.querySelector(".chan.current");
          if (cur) cur.scrollIntoView({ block: "nearest" });
        }
        break;
      case "tab":
        this._tab = value;
        this._renderList();
        this.shadowRoot.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.value === value));
        break;
      case "select":
        this._selectSource(value);
        break;
      case "fav":
        e.stopPropagation();
        this._toggleFavorite(value);
        break;
      case "clear":
        this._search = "";
        this._render();
        break;
      case "key":
        this._remote(value);
        if (["OK", "BACK", "MENU"].includes(value)) this._refreshSoon(3000);
        break;
      case "digit":
        this._haptic("selection");
        if (this._keypad.length < 4) this._keypad += value;
        clearTimeout(this._keypadT);
        this._keypadT = setTimeout(() => this._commitKeypad(), 2000);
        this._renderKeypadDisplay();
        break;
      case "kp-del":
        this._keypad = this._keypad.slice(0, -1);
        clearTimeout(this._keypadT);
        if (this._keypad) this._keypadT = setTimeout(() => this._commitKeypad(), 2000);
        this._renderKeypadDisplay();
        break;
      case "kp-ok":
        this._commitKeypad();
        break;
      case "more-info":
        this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: this._config.entity }, bubbles: true, composed: true }));
        break;
    }
  }

  /* ------------------------------------------------------------------ */
  /* Rendu                                                               */
  /* ------------------------------------------------------------------ */

  _progress() {
    const a = this._stateObj ? this._stateObj.attributes : {};
    const dur = Number(a.media_duration);
    if (!dur || a.media_position === undefined || a.media_position === null) return null;
    let pos = Number(a.media_position);
    if (this._stateObj.state === "playing" && a.media_position_updated_at) {
      pos += (Date.now() - new Date(a.media_position_updated_at).getTime()) / 1000;
    }
    pos = Math.max(0, Math.min(dur, pos));
    return { pos, dur, pct: (pos / dur) * 100 };
  }

  _tickProgress() {
    if (!this._config || !this._config.show_progress) return;
    const p = this._progress();
    const root = this.shadowRoot;
    const fill = root.querySelector(".bar-fill");
    if (!p || !fill) return;
    fill.style.width = `${p.pct}%`;
    const cur = root.querySelector(".t-cur");
    const rem = root.querySelector(".t-rem");
    if (cur) cur.textContent = fmtTime(p.pos);
    if (rem) rem.textContent = `-${fmtTime(p.dur - p.pos)}`;
  }

  _icon(icon) {
    return `<ha-icon icon="${icon}"></ha-icon>`;
  }

  _btn(action, icon, label, { value = "", cls = "", disabled = false } = {}) {
    return `<button class="btn ${cls}" data-action="${action}" ${value !== "" ? `data-value="${esc(value)}"` : ""} title="${esc(label)}" aria-label="${esc(label)}" ${disabled ? "disabled" : ""}>${this._icon(icon)}</button>`;
  }

  _render() {
    if (!this._config || !this._hass) return;
    const root = this.shadowRoot;

    // conserve le focus de la recherche et le défilement de la liste
    const active = root.activeElement;
    const searchFocused = active && active.classList && active.classList.contains("search");
    const caret = searchFocused ? active.selectionStart : null;
    const listEl = root.querySelector(".list");
    const scroll = listEl ? listEl.scrollTop : 0;

    const st = this._stateObj;
    if (!st) {
      root.innerHTML = `${this._style()}<ha-card><div class="warning">Entité introuvable : ${esc(this._config.entity)}</div></ha-card>`;
      return;
    }

    const a = st.attributes;
    const unavailable = st.state === "unavailable" || st.state === "unknown";
    const powering = !!(this._pending && this._pending.powering);
    // en veille : affichage compact, sauf pendant l'allumage déclenché par le choix d'une chaîne
    if ((st.state === "off" && !powering) || unavailable) {
      root.innerHTML = this._standbyHtml(st, unavailable);
      this._afterRender(searchFocused, caret, scroll);
      return;
    }
    const off = false;
    const playing = st.state === "playing";
    const source = this._pending ? this._pending.source : a.source;
    const cur = this._parse(source);
    const inList = (a.source_list || []).includes(source);
    const name = this._config.name || a.friendly_name || "Livebox TV";

    // titre du programme : media_title = "<source> - <programme>"
    let show = "";
    if (!this._pending && a.media_title && a.source && a.media_title.startsWith(`${a.source} - `)) {
      show = a.media_title.slice(a.source.length + 3);
    } else if (!this._pending && a.media_title && a.media_title !== a.source) {
      show = a.media_title;
    }
    let episode = "";
    if (!this._pending && (a.media_season || a.media_episode)) {
      episode = [a.media_season ? `S${String(a.media_season).padStart(2, "0")}` : "", a.media_episode ? `E${String(a.media_episode).padStart(2, "0")}` : ""].join("");
    }
    const series = !this._pending && a.media_series_title && a.media_series_title !== show ? a.media_series_title : "";

    const art = this._config.show_artwork && !off && !this._pending ? a.entity_picture || "" : "";
    const hue = hashHue(cur.name || name);
    const remoteId = this._remoteId();
    const hasRemote = !!remoteId && this._hass.states[remoteId] && this._hass.states[remoteId].state !== "unavailable";
    const p = this._config.show_progress && !off && !this._pending ? this._progress() : null;

    const status = powering ? "Allumage…" : this._pending ? "Changement de chaîne…" : playing ? "En direct" : st.state === "paused" ? "En pause" : "Allumé";

    root.innerHTML = `
      ${this._style()}
      <ha-card class="${off ? "is-off" : ""}" style="--h:${hue}">
        <div class="hero ${art ? "has-art" : ""}">
          ${art ? `<div class="art" style="background-image:url('${esc(art)}')"></div>` : ""}
          <div class="shade"></div>
          <div class="hero-top">
            <button class="name" data-action="more-info" title="Plus d'informations">
              ${this._icon("mdi:television-box")}<span>${esc(name)}</span>
            </button>
            <span class="status ${playing && !this._pending ? "live" : ""}">${esc(status)}</span>
            ${this._btn("power", "mdi:power", off ? "Allumer" : "Éteindre", { cls: `power ${off ? "" : "on"}`, disabled: unavailable })}
          </div>
          <div class="hero-main">
            ${off ? `<div class="logo big off-logo">${this._icon("mdi:television-off")}</div>` : this._logo(cur, "big")}
            <div class="info">
              ${
                off
                  ? `<div class="chan-name">${esc(name)}</div><div class="show">${unavailable ? "Décodeur injoignable" : "Décodeur en veille"}</div>`
                  : `<div class="chan-name">${cur.num !== null ? `<span class="num">${esc(cur.num)}</span>` : ""}${esc(inList || cur.num !== null ? cur.name : cur.name.toLowerCase().replace(/^\w/, (c) => c.toUpperCase()))}</div>
                     ${show ? `<div class="show" title="${esc(show)}">${esc(show)}</div>` : ""}
                     ${series || episode ? `<div class="sub">${esc([series, episode].filter(Boolean).join(" · "))}</div>` : ""}`
              }
            </div>
          </div>
          ${
            p
              ? `<div class="progress">
                  <span class="t-cur">${fmtTime(p.pos)}</span>
                  <div class="bar"><div class="bar-fill" style="width:${p.pct}%"></div></div>
                  <span class="t-rem">-${fmtTime(p.dur - p.pos)}</span>
                </div>`
              : ""
          }
        </div>

        <div class="controls">
          <div class="group">
            ${this._btn("prev", "mdi:chevron-down", "Chaîne précédente", { disabled: off })}
            ${this._btn("playpause", playing ? "mdi:pause" : "mdi:play", playing ? "Pause" : "Lecture", { cls: "primary", disabled: off })}
            ${this._btn("next", "mdi:chevron-up", "Chaîne suivante", { disabled: off })}
          </div>
          ${
            this._config.show_volume
              ? `<div class="group">
                  ${this._btn("voldown", "mdi:volume-minus", "Volume -", { disabled: off })}
                  ${this._btn("mute", a.is_volume_muted ? "mdi:volume-off" : "mdi:volume-high", a.is_volume_muted ? "Rétablir le son" : "Couper le son", { cls: a.is_volume_muted ? "active" : "", disabled: off })}
                  ${this._btn("volup", "mdi:volume-plus", "Volume +", { disabled: off })}
                </div>`
              : ""
          }
        </div>

        <div class="bar-row">
          <button class="source ${this._panel === "channels" && !off ? "open" : ""}" data-action="panel" data-value="channels" ${off ? "disabled" : ""}>
            ${this._icon("mdi:format-list-bulleted")}
            <span class="source-label">${off ? "Chaînes" : cur.num !== null ? `${esc(cur.num)} · ${esc(cur.name)}` : "Choisir une chaîne"}</span>
            ${this._icon(this._panel === "channels" && !off ? "mdi:chevron-up" : "mdi:chevron-down")}
          </button>
          ${this._config.show_keypad ? this._btn("panel", "mdi:dialpad", "Pavé numérique", { value: "keypad", cls: `tool ${this._panel === "keypad" && !off ? "active" : ""}`, disabled: off }) : ""}
          ${this._config.show_remote && hasRemote ? this._btn("panel", "mdi:remote", "Télécommande", { value: "remote", cls: `tool ${this._panel === "remote" && !off ? "active" : ""}`, disabled: off }) : ""}
        </div>

        ${!off ? this._panelHtml(hasRemote) : ""}
      </ha-card>
    `;
    this._afterRender(searchFocused, caret, scroll);
  }

  // remplit la liste / le pavé et restaure le focus et le défilement après un rendu complet
  _afterRender(searchFocused, caret, scroll) {
    const root = this.shadowRoot;
    if (this._panel === "channels") {
      this._renderList();
      const list = root.querySelector(".list");
      if (list) list.scrollTop = scroll;
      if (searchFocused) {
        const s = root.querySelector(".search");
        if (s) {
          s.focus();
          if (caret !== null) s.setSelectionRange(caret, caret);
        }
      }
    }
    if (this._panel === "keypad") this._renderKeypadDisplay();
  }

  // Décodeur en veille (ou injoignable) : une seule ligne, avec accès aux chaînes et au pavé numérique.
  // Choisir une chaîne allume le décodeur puis zappe dessus.
  _standbyHtml(st, unavailable) {
    const name = this._config.name || st.attributes.friendly_name || "Livebox TV";
    // en veille, seule la liste des chaînes est proposée (ni pavé numérique ni télécommande)
    const panel = !unavailable && this._panel === "channels" ? "channels" : null;
    return `
      ${this._style()}
      <ha-card class="is-standby ${unavailable ? "is-unavailable" : ""}">
        <div class="standby">
          <button class="standby-info" data-action="more-info" title="Plus d'informations">
            <span class="standby-icon">${this._icon(unavailable ? "mdi:lan-disconnect" : "mdi:television-off")}</span>
            <span class="standby-text">
              <span class="standby-name">${esc(name)}</span>
              <span class="standby-state">${unavailable ? "Décodeur injoignable" : "En veille"}</span>
            </span>
          </button>
          ${
            unavailable
              ? ""
              : this._btn("panel", "mdi:format-list-bulleted", "Choisir une chaîne (allume le décodeur)", { value: "channels", cls: `tool ${panel === "channels" ? "active" : ""}` })
          }
          ${this._btn("power", "mdi:power", "Allumer", { cls: "tool power-off", disabled: unavailable })}
        </div>
        ${panel ? `<div class="standby-hint">${this._icon("mdi:information-outline")}Choisir une chaîne allume le décodeur.</div>${this._panelHtml(false)}` : ""}
      </ha-card>
    `;
  }

  _panelHtml(hasRemote) {
    if (this._panel === "channels") {
      const tabs = [
        ["all", "Toutes", "mdi:television-classic"],
        ["fav", "Favoris", "mdi:star"],
        ["recent", "Récentes", "mdi:history"],
      ];
      return `<div class="panel channels">
        <div class="search-row">
          ${this._icon("mdi:magnify")}
          <input class="search" type="search" placeholder="Rechercher une chaîne ou un numéro" value="${esc(this._search)}" autocomplete="off" enterkeyhint="go">
          ${this._search ? this._btn("clear", "mdi:close", "Effacer", { cls: "mini" }) : ""}
        </div>
        <div class="tabs">
          ${tabs.map(([v, l, i]) => `<button class="tab ${this._tab === v ? "active" : ""}" data-action="tab" data-value="${v}">${this._icon(i)}${l}</button>`).join("")}
        </div>
        <div class="list ${this._config.channel_layout === "list" ? "as-list" : "as-grid"}" style="max-height:${Number(this._config.list_height) || 340}px"></div>
      </div>`;
    }
    if (this._panel === "remote" && hasRemote) {
      return `<div class="panel remote">
        <div class="dpad">
          <button class="dp up" data-action="key" data-value="UP" aria-label="Haut">${this._icon("mdi:chevron-up")}</button>
          <button class="dp left" data-action="key" data-value="LEFT" aria-label="Gauche">${this._icon("mdi:chevron-left")}</button>
          <button class="dp ok" data-action="key" data-value="OK" aria-label="OK">OK</button>
          <button class="dp right" data-action="key" data-value="RIGHT" aria-label="Droite">${this._icon("mdi:chevron-right")}</button>
          <button class="dp down" data-action="key" data-value="DOWN" aria-label="Bas">${this._icon("mdi:chevron-down")}</button>
        </div>
        <div class="keys">
          ${REMOTE_KEYS.map((k) => `<button class="key ${k.cls || ""}" data-action="key" data-value="${k.cmd}" title="${k.label}">${this._icon(k.icon)}<span>${k.label}</span></button>`).join("")}
        </div>
      </div>`;
    }
    if (this._panel === "keypad") {
      const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
      return `<div class="panel keypad">
        <div class="kp-display"></div>
        <div class="kp-grid">
          ${keys.map((k) => `<button class="kp" data-action="digit" data-value="${k}">${k}</button>`).join("")}
          <button class="kp fn" data-action="kp-del" aria-label="Effacer">${this._icon("mdi:backspace-outline")}</button>
          <button class="kp" data-action="digit" data-value="0">0</button>
          <button class="kp fn go" data-action="kp-ok" aria-label="Valider">${this._icon("mdi:check")}</button>
        </div>
      </div>`;
    }
    return "";
  }

  _renderKeypadDisplay() {
    const el = this.shadowRoot.querySelector(".kp-display");
    if (!el) return;
    if (!this._keypad) {
      el.innerHTML = `<span class="kp-hint">Tapez un numéro de chaîne</span>`;
      return;
    }
    const match = this._channels().find((c) => c.num === String(Number(this._keypad)));
    el.innerHTML = `${match ? this._logo(match, "small") : ""}
      <span class="kp-num">${esc(this._keypad)}</span>
      <span class="kp-name">${match ? esc(match.name) : this._remoteId() && this._stateObj && this._stateObj.state !== "off" ? "Envoi des touches…" : "Chaîne inconnue"}</span>
      <span class="kp-timer"></span>`;
  }

  _renderList() {
    const el = this.shadowRoot.querySelector(".list");
    if (!el) return;
    const chans = this._filteredChannels();
    const fav = this._favorites();
    const st = this._stateObj;
    const current = this._pending ? this._pending.source : st && st.attributes.source;
    if (!chans.length) {
      const msg =
        this._tab === "fav" && !this._search
          ? "Aucun favori. Touchez l'étoile d'une chaîne pour l'ajouter."
          : this._tab === "recent" && !this._search
          ? "Aucune chaîne récente."
          : "Aucune chaîne ne correspond.";
      el.innerHTML = `<div class="empty">${this._icon(this._tab === "fav" ? "mdi:star-outline" : "mdi:television-off")}<span>${msg}</span></div>`;
      return;
    }
    el.innerHTML = chans
      .map(
        (c) => `<div class="chan ${c.source === current ? "current" : ""}" data-action="select" data-value="${esc(c.source)}" role="button" tabindex="0" title="${esc(c.source)}">
          ${this._logo(c, "small")}
          <div class="chan-text"><span class="chan-num">${esc(c.num ?? "")}</span><span class="chan-title">${esc(c.name)}</span></div>
          <button class="star ${fav.has(c.source) ? "on" : ""}" data-action="fav" data-value="${esc(c.source)}" aria-label="Favori">${this._icon(fav.has(c.source) ? "mdi:star" : "mdi:star-outline")}</button>
        </div>`
      )
      .join("");
  }

  _style() {
    return `<style>
      :host {
        --ltv-radius: var(--ha-card-border-radius, 16px);
        --ltv-accent: var(--primary-color, #ff7900);
        --ltv-orange: #ff7900;
        --ltv-surface: var(--secondary-background-color, rgba(127,127,127,.12));
        --ltv-text: var(--primary-text-color, #1c1c1c);
        --ltv-muted: var(--secondary-text-color, #727272);
        --ltv-divider: var(--divider-color, rgba(127,127,127,.2));
      }
      ha-card { overflow: hidden; position: relative; color: var(--ltv-text); }
      button { font: inherit; color: inherit; background: none; border: 0; padding: 0; cursor: pointer; -webkit-tap-highlight-color: transparent; }
      button:disabled { opacity: .35; cursor: default; }
      ha-icon { --mdc-icon-size: 22px; display: inline-flex; }
      .warning { padding: 16px; color: var(--error-color, #db4437); }

      /* ---------- en-tête ---------- */
      .hero {
        position: relative; color: #fff; padding: 14px 16px 16px; min-height: 150px;
        display: flex; flex-direction: column; gap: 12px; isolation: isolate; overflow: hidden;
        background:
          radial-gradient(120% 140% at 0% 0%, hsl(var(--h) 70% 45%) 0%, transparent 60%),
          radial-gradient(120% 140% at 100% 100%, hsl(calc(var(--h) + 50) 65% 30%) 0%, transparent 60%),
          #15171c;
        transition: background .4s;
      }
      .is-off .hero { background: linear-gradient(135deg, #2a2d34, #15171c); }
      .art { position: absolute; inset: 0; background-size: cover; background-position: center 25%; z-index: -2; transform: scale(1.02); }
      .shade { position: absolute; inset: 0; z-index: -1;
        background: linear-gradient(90deg, rgba(10,12,16,.92) 0%, rgba(10,12,16,.7) 45%, rgba(10,12,16,.25) 100%),
                    linear-gradient(0deg, rgba(10,12,16,.75) 0%, transparent 55%); }
      .hero:not(.has-art) .shade { background: linear-gradient(0deg, rgba(0,0,0,.35), transparent 70%); }
      .hero-top { display: flex; align-items: center; gap: 8px; }
      .name { display: flex; align-items: center; gap: 6px; font-weight: 500; font-size: 14px; opacity: .9; min-width: 0; }
      .name span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .name ha-icon { --mdc-icon-size: 18px; color: var(--ltv-orange); }
      .status { margin-left: auto; font-size: 11px; letter-spacing: .06em; text-transform: uppercase; padding: 3px 8px; border-radius: 99px; background: rgba(255,255,255,.14); white-space: nowrap; }
      .status.live::before { content: ""; display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #ff3b30; margin-right: 6px; vertical-align: middle; animation: pulse 1.6s infinite; }
      @keyframes pulse { 50% { opacity: .3; } }
      .btn.power { width: 38px; height: 38px; border-radius: 50%; background: rgba(255,255,255,.14); display: grid; place-items: center; transition: background .2s, transform .1s; }
      .btn.power.on { background: var(--ltv-orange); box-shadow: 0 0 0 4px rgba(255,121,0,.25); }
      .btn.power:active { transform: scale(.92); }

      .hero-main { display: flex; align-items: center; gap: 14px; margin-top: auto; }
      .info { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 3px; }
      .chan-name { font-size: 20px; font-weight: 700; line-height: 1.2; display: flex; align-items: center; gap: 8px; text-shadow: 0 1px 6px rgba(0,0,0,.4); }
      .chan-name .num { font-size: 12px; font-weight: 700; background: rgba(255,255,255,.92); color: #111; border-radius: 6px; padding: 2px 6px; text-shadow: none; }
      .show { font-size: 15px; opacity: .95; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .sub { font-size: 12px; opacity: .7; }

      .progress { display: flex; align-items: center; gap: 10px; font-size: 11px; font-variant-numeric: tabular-nums; opacity: .9; }
      .bar { flex: 1; height: 4px; border-radius: 4px; background: rgba(255,255,255,.22); overflow: hidden; }
      .bar-fill { height: 100%; background: var(--ltv-orange); border-radius: 4px; transition: width 1s linear; }

      /* ---------- logos ---------- */
      .logo {
        position: relative; flex: none; display: grid; place-items: center; overflow: hidden;
        background: linear-gradient(135deg, hsl(var(--h) 65% 48%), hsl(calc(var(--h) + 40) 70% 30%));
        color: #fff; font-weight: 800; letter-spacing: -.02em; text-align: center; line-height: 1;
      }
      .logo img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; background: radial-gradient(circle at 30% 20%, #3a3d45, #1b1d22); padding: 14%; box-sizing: border-box; }
      .logo.guide { background: linear-gradient(135deg, #ff8d26, #e55d00); }
      .logo.guide ha-icon { --mdc-icon-size: 24px; color: #fff; }
      .logo.big.guide ha-icon, .as-grid .logo.guide ha-icon { --mdc-icon-size: 32px; }
      .logo.light img { background: radial-gradient(circle at 30% 20%, #ffffff, #e6e8ec); }
      .logo.big { width: 72px; height: 72px; border-radius: 16px; font-size: 22px; box-shadow: 0 6px 20px rgba(0,0,0,.35); }
      .logo.big .abbr.s { font-size: 17px; } .logo.big .abbr.xs { font-size: 13px; }
      .logo.small { width: 44px; height: 44px; border-radius: 11px; font-size: 14px; }
      .logo.small .abbr.s { font-size: 11px; } .logo.small .abbr.xs { font-size: 9px; }
      .off-logo { background: rgba(255,255,255,.08); color: rgba(255,255,255,.6); }
      .off-logo ha-icon { --mdc-icon-size: 34px; }

      /* ---------- contrôles ---------- */
      .controls { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 12px 12px 4px; flex-wrap: wrap; }
      .group { display: flex; align-items: center; gap: 2px; background: var(--ltv-surface); border-radius: 99px; padding: 3px; }
      .btn { width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; color: var(--ltv-text); transition: background .15s, transform .1s; }
      .btn:not(:disabled):hover { background: rgba(127,127,127,.15); }
      .btn:not(:disabled):active { transform: scale(.9); }
      .btn.primary { background: var(--ltv-orange); color: #fff; width: 46px; height: 46px; }
      .btn.primary:not(:disabled):hover { background: #ff8d26; }
      .btn.active { color: var(--ltv-orange); }
      .btn.mini { width: 30px; height: 30px; }
      .btn.mini ha-icon { --mdc-icon-size: 18px; }

      .bar-row { display: flex; align-items: center; gap: 8px; padding: 8px 12px 12px; }
      .source { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; height: 44px; padding: 0 14px; border-radius: 12px; background: var(--ltv-surface); color: var(--ltv-text); text-align: left; transition: background .15s; }
      .source:not(:disabled):hover, .source.open { background: rgba(255,121,0,.14); }
      .source.open { box-shadow: inset 0 0 0 1.5px var(--ltv-orange); }
      .source ha-icon:first-child { color: var(--ltv-orange); }
      .source-label { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500; }
      .btn.tool { width: 44px; height: 44px; border-radius: 12px; background: var(--ltv-surface); }
      .btn.tool.active { background: rgba(255,121,0,.14); box-shadow: inset 0 0 0 1.5px var(--ltv-orange); }

      /* ---------- panneaux ---------- */
      /* ---------- veille : une seule ligne ---------- */
      .standby { display: flex; align-items: center; gap: 8px; padding: 10px 12px; }
      .standby-info { flex: 1; min-width: 0; display: flex; align-items: center; gap: 12px; text-align: left; }
      .standby-icon { flex: none; width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center; background: var(--ltv-surface); color: var(--ltv-muted); }
      .standby-text { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
      .standby-name { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .standby-state { font-size: 13px; color: var(--ltv-muted); }
      .is-unavailable .standby-state { color: var(--error-color, #db4437); }
      .btn.tool.power-off { color: var(--ltv-orange); }
      .btn.tool.power-off:not(:disabled):hover { background: rgba(255,121,0,.14); }
      .standby-hint { display: flex; align-items: center; gap: 6px; padding: 0 14px 10px; font-size: 12px; color: var(--ltv-muted); }
      .standby-hint ha-icon { --mdc-icon-size: 16px; }

      .panel { border-top: 1px solid var(--ltv-divider); padding: 12px; animation: slide .18s ease-out; }
      @keyframes slide { from { opacity: 0; transform: translateY(-6px); } }

      .search-row { display: flex; align-items: center; gap: 8px; height: 42px; padding: 0 6px 0 12px; border-radius: 12px; background: var(--ltv-surface); color: var(--ltv-muted); }
      .search-row:focus-within { box-shadow: inset 0 0 0 1.5px var(--ltv-orange); }
      .search { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--ltv-text); font: inherit; font-size: 15px; }
      .search::-webkit-search-cancel-button { display: none; }
      .tabs { display: flex; gap: 6px; margin: 10px 0; overflow-x: auto; scrollbar-width: none; }
      .tab { display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 99px; font-size: 13px; color: var(--ltv-muted); background: var(--ltv-surface); white-space: nowrap; }
      .tab ha-icon { --mdc-icon-size: 16px; }
      .tab.active { background: var(--ltv-orange); color: #fff; }

      .list { overflow-y: auto; overscroll-behavior: contain; margin: 0 -4px; padding: 2px 4px; scrollbar-width: thin; }
      .as-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 8px; }
      .as-list { display: flex; flex-direction: column; gap: 2px; }
      .chan { position: relative; cursor: pointer; border-radius: 12px; transition: background .15s, transform .1s; outline: none; }
      .chan:hover, .chan:focus-visible { background: rgba(127,127,127,.12); }
      .chan:active { transform: scale(.97); }
      .chan.current { background: rgba(255,121,0,.14); box-shadow: inset 0 0 0 1.5px var(--ltv-orange); }
      .as-grid .chan { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 10px 4px 8px; text-align: center; }
      .as-grid .chan .logo.small { width: 56px; height: 56px; border-radius: 14px; font-size: 16px; }
      .as-grid .chan .logo.small .abbr.s { font-size: 13px; } .as-grid .chan .logo.small .abbr.xs { font-size: 10px; }
      .as-grid .chan-text { display: flex; flex-direction: column; min-width: 0; width: 100%; }
      .as-grid .chan-num { font-size: 11px; color: var(--ltv-muted); font-variant-numeric: tabular-nums; }
      .as-grid .chan-title { font-size: 12px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0 4px; }
      .as-grid .star { position: absolute; top: 2px; right: 2px; }
      .as-list .chan { display: flex; align-items: center; gap: 12px; padding: 6px 8px; }
      .as-list .chan-text { flex: 1; min-width: 0; display: flex; align-items: baseline; gap: 10px; }
      .as-list .chan-num { min-width: 28px; text-align: right; font-size: 13px; color: var(--ltv-muted); font-variant-numeric: tabular-nums; }
      .as-list .chan-title { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .star { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; color: var(--ltv-muted); opacity: .55; }
      .star ha-icon { --mdc-icon-size: 18px; }
      .star:hover { opacity: 1; }
      .star.on { color: #ffb400; opacity: 1; }
      .empty { grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 28px 12px; color: var(--ltv-muted); text-align: center; font-size: 14px; }
      .empty ha-icon { --mdc-icon-size: 32px; opacity: .6; }

      /* télécommande */
      .remote { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 18px; }
      .dpad { position: relative; width: 176px; height: 176px; border-radius: 50%; background: var(--ltv-surface); display: grid; grid-template: repeat(3, 1fr) / repeat(3, 1fr); }
      .dp { display: grid; place-items: center; color: var(--ltv-text); border-radius: 50%; transition: background .15s, transform .1s; }
      .dp:hover { background: rgba(127,127,127,.15); }
      .dp:active { transform: scale(.9); }
      .dp ha-icon { --mdc-icon-size: 30px; }
      .dp.up { grid-area: 1 / 2; } .dp.left { grid-area: 2 / 1; } .dp.right { grid-area: 2 / 3; } .dp.down { grid-area: 3 / 2; }
      .dp.ok { grid-area: 2 / 2; background: var(--ltv-orange); color: #fff; font-weight: 700; font-size: 15px; box-shadow: 0 4px 14px rgba(255,121,0,.35); }
      .dp.ok:hover { background: #ff8d26; }
      .keys { display: grid; grid-template-columns: repeat(4, 64px); gap: 8px; }
      .key { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 8px 2px; border-radius: 12px; background: var(--ltv-surface); font-size: 10px; color: var(--ltv-muted); transition: background .15s, transform .1s; }
      .key ha-icon { color: var(--ltv-text); }
      .key:hover { background: rgba(127,127,127,.2); }
      .key:active { transform: scale(.93); }
      .key.rec ha-icon { color: #ff3b30; }
      .key span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }

      /* pavé numérique */
      .keypad { display: flex; flex-direction: column; align-items: center; gap: 12px; }
      .kp-display { width: 100%; max-width: 280px; height: 56px; border-radius: 14px; background: var(--ltv-surface); display: flex; align-items: center; gap: 10px; padding: 0 8px; box-sizing: border-box; position: relative; overflow: hidden; }
      .kp-hint { flex: 1; text-align: center; color: var(--ltv-muted); font-size: 14px; }
      .kp-num { font-size: 26px; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--ltv-orange); }
      .kp-name { flex: 1; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .kp-display .logo.small { width: 40px; height: 40px; }
      .kp-timer { position: absolute; left: 0; bottom: 0; height: 3px; background: var(--ltv-orange); animation: kp 2s linear forwards; }
      @keyframes kp { from { width: 100%; } to { width: 0; } }
      .kp-grid { display: grid; grid-template-columns: repeat(3, 72px); gap: 10px; }
      .kp { height: 52px; border-radius: 14px; background: var(--ltv-surface); font-size: 22px; font-weight: 600; color: var(--ltv-text); transition: background .15s, transform .1s; display: grid; place-items: center; }
      .kp:hover { background: rgba(127,127,127,.2); }
      .kp:active { transform: scale(.92); }
      .kp.fn { color: var(--ltv-muted); }
      .kp.go { background: var(--ltv-orange); color: #fff; }

      @media (max-width: 400px) {
        .controls { justify-content: center; }
        .keys { grid-template-columns: repeat(4, 58px); }
        .logo.big { width: 60px; height: 60px; font-size: 18px; }
        .chan-name { font-size: 18px; }
      }
    </style>`;
  }
}

if (!customElements.get(CARD_TAG)) customElements.define(CARD_TAG, LiveboxTvCard);

window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === CARD_TAG)) {
  window.customCards.push({
    type: CARD_TAG,
    name: "Livebox TV Card",
    description: "Contrôle du décodeur TV UHD Orange : chaînes, programme en cours, télécommande et pavé numérique.",
    preview: true,
    documentationURL: "https://github.com/aubierr/ha-livebox-card",
  });
}

console.info(`%c LIVEBOX-TV-CARD %c v${CARD_VERSION} `, "color:#fff;background:#ff7900;font-weight:700;border-radius:4px 0 0 4px", "color:#ff7900;background:#222;border-radius:0 4px 4px 0");
