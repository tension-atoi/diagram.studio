/**
 * English dictionary — the source of truth for the message catalogue.
 *
 * Every other language is typed as `Messages` (see `./index.ts`), which is
 * derived from this object, so a key that exists here but not in a translation
 * is a typecheck error rather than a runtime fallback.
 *
 * Key scheme: `<surface>.<slot>`, camelCase slots, grouped by the component or
 * feature that owns the string. Keep the English value byte-identical to what
 * the UI rendered before the dictionary existed, so switching to `en` is a
 * no-op.
 */
export const en = {
  // Settings dialog: inference chooser.
  "settings.inferenceChooser": "INFERENCE CHOOSER",
  "settings.inferenceChooserSubtitle":
    "Select your intelligence provider and reasoning model",
  "settings.activeEngine": "ACTIVE ENGINE:",
  "settings.filterAllModels": "All Models ({count})",
  "settings.filterLocalOllama": "Local Ollama (Air-Gapped)",
  "settings.filterOpenRouterCloud": "OpenRouter Cloud",
  "settings.customModelPlaceholder":
    "Custom model slug (e.g. meta-llama/llama-3.3-70b-instruct:free)...",
  "settings.apply": "Apply",
  "settings.modelUpdated": "Model updated successfully",
  "settings.modelSwitchFailed": "Failed to switch model",

  // Settings dialog: language selector.
  "settings.language": "Language",
  "settings.languageGroupLabel": "Interface language",
  "settings.languageEnglish": "English",
  "settings.languageFrench": "French",
  "settings.languageEnglishShort": "EN",
  "settings.languageFrenchShort": "FR",

  // Desktop titlebar.
  "titlebar.ingest": "Ingest",
  "titlebar.cache": "Cache",
  "titlebar.searchPlaceholder": "Search repo or action...",
  "titlebar.jevTooltip":
    "TypeSafe Jev System One semantic verification worker active",
  "titlebar.engineTooltip": "Active AI inference engine (click to configure)",
  "titlebar.apiKeyTooltip": "Configure API Keys & Access",

  // Main card: repository ingestion console.
  "mainCard.ingestionTitle": "TARGET CODEBASE INGESTION",
  "mainCard.offlineCacheReady": "OFFLINE CACHE READY",
  "mainCard.repositoryLabel": "GitHub repository",
  "mainCard.repositoryPlaceholder":
    "owner/repo (e.g. tension-atoi/gnosix, gnosis.os, pallets/flask)",
  "mainCard.submit": "Ingest & Map",
  "mainCard.invalidRepository":
    "Please enter a valid owner/repo (e.g. tension-atoi/gnosix)",
  "mainCard.localTargets": "Local Repositories & Bleeding-Edge Targets:",
  "mainCard.recentlyInspected": "Recently Inspected:",
  "mainCard.clearHistory": "Clear history",
  "mainCard.presetWaylandGpu": "Wayland GPUI Shell",
  "mainCard.presetCognitiveOs": "Cognitive OS Runtime",
  "mainCard.presetPythonWsgi": "Python WSGI Kernel",

  // Repository toolbar (generation workspace).
  "toolbar.openInGitHub": "Open in GitHub",
  "toolbar.jevAudited": "⚡ JEV AUDITED",
  "toolbar.jevAuditTitle": "{style} · {verified} verified · {pruned} pruned",
  "toolbar.video": "Video",
  "toolbar.info": "Info",
  "toolbar.zoom": "Zoom",
  "toolbar.exitZoom": "Exit zoom",
  "toolbar.copyCodeTitle": "Copy raw Mermaid code",
  "toolbar.copied": "Copied",
  "toolbar.copyMmd": "Copy MMD",
  "toolbar.purgeCacheTitle": "Purge local cache and re-analyze",
  "toolbar.purging": "Purging...",
  "toolbar.clearCache": "Clear Cache",
  "toolbar.analyzing": "Analyzing...",
  "toolbar.regenerate": "Regenerate",
} as const;
