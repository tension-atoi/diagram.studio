import type { Messages } from "./index";

/**
 * French dictionary.
 *
 * The `Messages` annotation is the whole point of this file: it is derived from
 * the English catalogue, so dropping or renaming a key here is a typecheck
 * error. A handful of values are intentionally identical to the English ones
 * (language codes, "cache", "info", "zoom" — same words in French); the i18n
 * test pins that list so a copy-paste fallback cannot slip in unnoticed.
 */
export const fr: Messages = {
  // Settings dialog: inference chooser.
  "settings.inferenceChooser": "SÉLECTEUR D'INFÉRENCE",
  "settings.inferenceChooserSubtitle":
    "Choisissez votre fournisseur d'intelligence et votre modèle de raisonnement",
  "settings.activeEngine": "MOTEUR ACTIF :",
  "settings.filterAllModels": "Tous les modèles ({count})",
  "settings.filterLocalOllama": "Ollama local (air-gappé)",
  "settings.filterOpenRouterCloud": "OpenRouter (cloud)",
  "settings.customModelPlaceholder":
    "Slug de modèle personnalisé (p. ex. meta-llama/llama-3.3-70b-instruct:free)...",
  "settings.apply": "Appliquer",
  "settings.modelUpdated": "Modèle mis à jour avec succès",
  "settings.modelSwitchFailed": "Échec du changement de modèle",

  // Settings dialog: language selector.
  "settings.language": "Langue",
  "settings.languageGroupLabel": "Langue de l'interface",
  "settings.languageEnglish": "Anglais",
  "settings.languageFrench": "Français",
  // Language codes are the same in both languages.
  "settings.languageEnglishShort": "EN",
  "settings.languageFrenchShort": "FR",

  // Desktop titlebar.
  "titlebar.ingest": "Ingérer",
  "titlebar.cache": "Cache",
  "titlebar.searchPlaceholder": "Rechercher un dépôt ou une action...",
  "titlebar.jevTooltip":
    "Worker de vérification sémantique TypeSafe Jev System One actif",
  "titlebar.engineTooltip":
    "Moteur d'inférence IA actif (cliquer pour configurer)",
  "titlebar.apiKeyTooltip": "Configurer les clés d'API et les accès",

  // Main card: repository ingestion console.
  "mainCard.ingestionTitle": "INGESTION DU CODE CIBLE",
  "mainCard.offlineCacheReady": "CACHE HORS LIGNE PRÊT",
  "mainCard.repositoryLabel": "Dépôt GitHub",
  "mainCard.repositoryPlaceholder":
    "owner/repo (p. ex. tension-atoi/gnosix, gnosis.os, pallets/flask)",
  "mainCard.submit": "Ingérer et cartographier",
  "mainCard.invalidRepository":
    "Veuillez saisir un dépôt au format owner/repo valide (p. ex. tension-atoi/gnosix)",
  "mainCard.localTargets": "Dépôts locaux et cibles de pointe :",
  "mainCard.recentlyInspected": "Consultés récemment :",
  "mainCard.clearHistory": "Effacer l'historique",
  "mainCard.presetWaylandGpu": "Shell GPUI Wayland",
  "mainCard.presetCognitiveOs": "Runtime d'OS cognitif",
  "mainCard.presetPythonWsgi": "Noyau WSGI Python",

  // Repository toolbar (generation workspace).
  "toolbar.openInGitHub": "Ouvrir sur GitHub",
  "toolbar.jevAudited": "⚡ AUDITÉ PAR JEV",
  "toolbar.jevAuditTitle":
    "{style} · {verified} arêtes vérifiées · {pruned} arêtes élaguées",
  "toolbar.video": "Vidéo",
  "toolbar.info": "Info",
  "toolbar.zoom": "Zoom",
  "toolbar.exitZoom": "Quitter le zoom",
  "toolbar.copyCodeTitle": "Copier le code Mermaid brut",
  "toolbar.copied": "Copié",
  "toolbar.copyMmd": "Copier le MMD",
  "toolbar.purgeCacheTitle": "Vider le cache local et réanalyser",
  "toolbar.purging": "Purge en cours...",
  "toolbar.clearCache": "Vider le cache",
  "toolbar.analyzing": "Analyse en cours...",
  "toolbar.regenerate": "Régénérer",
};
