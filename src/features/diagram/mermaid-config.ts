import type { MermaidConfig } from "mermaid";

export type DiagramThemeMode = "hybrid" | "dark" | "light";

export function buildMermaidConfig({
  themeMode = "hybrid",
  isDark = true,
  backgroundColor,
}: {
  themeMode?: DiagramThemeMode;
  isDark?: boolean;
  backgroundColor?: string;
}) {
  const mode: DiagramThemeMode = themeMode ?? (isDark ? "hybrid" : "light");

  // Base theme variables per mode
  const themeVars = (() => {
    switch (mode) {
      case "hybrid":
        return {
          darkMode: true,
          background: backgroundColor ?? "transparent",
          primaryColor: "#f8fafc",
          primaryBorderColor: "#94a3b8",
          primaryTextColor: "#0f172a",
          lineColor: "#ffffff",
          arrowheadColor: "#ffffff",
          secondaryColor: "#ffffff",
          secondaryBorderColor: "#cbd5e1",
          secondaryTextColor: "#0f172a",
          tertiaryColor: "#f1f5f9",
          tertiaryBorderColor: "#94a3b8",
          tertiaryTextColor: "#0f172a",
          clusterBkg: "#ffffff",
          clusterBorder: "#cbd5e1",
          titleColor: "#0f172a",
          edgeLabelBackground: "#141314",
          nodeTextColor: "#0f172a",
          textColor: "#0f172a",
          fontFamily: "'Space Grotesk', 'IBM Plex Mono', sans-serif",
          fontSize: "13px",
        };
      case "dark":
        return {
          darkMode: true,
          background: backgroundColor ?? "transparent",
          primaryColor: "#1c1b1c",
          primaryBorderColor: "#3F5E36",
          primaryTextColor: "#e6e1e1",
          lineColor: "#5F7F52",
          arrowheadColor: "#8DA982",
          secondaryColor: "#151415",
          secondaryBorderColor: "#2a2829",
          secondaryTextColor: "#8DA982",
          tertiaryColor: "#201f20",
          tertiaryBorderColor: "#2a2829",
          tertiaryTextColor: "#e6e1e1",
          clusterBkg: "#151415",
          clusterBorder: "#2a2829",
          titleColor: "#8DA982",
          edgeLabelBackground: "#111418",
          nodeTextColor: "#e6e1e1",
          textColor: "#e6e1e1",
          fontFamily: "'Space Grotesk', 'IBM Plex Mono', sans-serif",
          fontSize: "13px",
        };
      case "light":
        return {
          darkMode: false,
          background: backgroundColor ?? "transparent",
          primaryColor: "#ffffff",
          primaryBorderColor: "#cbd5e1",
          primaryTextColor: "#0f172a",
          lineColor: "#334155",
          arrowheadColor: "#334155",
          secondaryColor: "#f8fafc",
          secondaryBorderColor: "#cbd5e1",
          secondaryTextColor: "#0f172a",
          tertiaryColor: "#f1f5f9",
          tertiaryBorderColor: "#94a3b8",
          tertiaryTextColor: "#0f172a",
          clusterBkg: "#ffffff",
          clusterBorder: "#94a3b8",
          titleColor: "#0f172a",
          edgeLabelBackground: "#ffffff",
          nodeTextColor: "#0f172a",
          textColor: "#0f172a",
          fontFamily: "'Space Grotesk', 'IBM Plex Mono', sans-serif",
          fontSize: "13px",
        };
    }
  })();

  const themeCSS = (() => {
    switch (mode) {
      case "hybrid":
        return `
          /* --- HYBRID MODE: Dark Canvas + White Paper Islands + Glowing Links --- */

          /* Subgraph Clusters (White Paper Islands) */
          .cluster rect {
            fill: #ffffff !important;
            stroke: #cbd5e1 !important;
            stroke-width: 1.5px !important;
            rx: 12px !important;
            ry: 12px !important;
            filter: drop-shadow(0 4px 20px rgba(0, 0, 0, 0.45)) !important;
          }
          .cluster-label text, .cluster text {
            fill: #0f172a !important;
            font-family: 'IBM Plex Mono', monospace !important;
            font-size: 12px !important;
            font-weight: 700 !important;
            letter-spacing: 0.05em !important;
            text-transform: uppercase !important;
          }

          /* Internal Nodes (Sleek cards inside islands) */
          .node rect, .node circle, .node polygon, .node path {
            fill: #f8fafc !important;
            stroke: #94a3b8 !important;
            stroke-width: 1.25px !important;
            rx: 8px !important;
            ry: 8px !important;
          }
          /* Hover feedback stays on clickable nodes, so a node that opens
             nothing never looks interactive. */
          .clickable:hover rect, .clickable:hover circle,
          .clickable:hover polygon {
            stroke: #5F7F52 !important;
            fill: #ffffff !important;
            filter: drop-shadow(0 2px 8px rgba(95, 127, 82, 0.3)) !important;
          }
          .node .label text, .node text, .nodeLabel {
            fill: #0f172a !important;
            color: #0f172a !important;
            font-family: 'Space Grotesk', system-ui, sans-serif !important;
            font-size: 13px !important;
            font-weight: 550 !important;
            letter-spacing: -0.01em !important;
          }

          /* External Connection Lines (Crisp white lines on dark canvas) */
          .flowchart-link:not([data-internal="true"]):not(.edge-internal),
          .edgePaths path:not([data-internal="true"]):not(.edge-internal),
          .edgePath:not(.edge-internal) .path:not([data-internal="true"]) {
            stroke: #ffffff !important;
            stroke-width: 1.75px !important;
            opacity: 0.95 !important;
            stroke-linecap: round !important;
            stroke-linejoin: round !important;
          }
          .edgePaths path:not([data-internal="true"]):hover {
            stroke: #8DA982 !important;
            stroke-width: 2.25px !important;
            opacity: 1 !important;
          }

          /* Internal Connection Lines (Black/Dark Slate lines inside white islands) */
          [data-internal="true"],
          .edge-internal,
          path.edge-internal,
          path[data-internal="true"] {
            stroke: #0f172a !important;
            stroke-width: 1.75px !important;
            opacity: 0.85 !important;
          }
          path[data-internal="true"]:hover {
            stroke: #5F7F52 !important;
            stroke-width: 2.25px !important;
            opacity: 1 !important;
          }

          /* Arrowheads */
          #arrowhead path, marker path, .marker, marker[id*="arrowhead"] path {
            fill: #ffffff !important;
            stroke: #ffffff !important;
          }

          /* Edge Labels (Console Badges on Dark Background) */
          .edgeLabel {
            background-color: transparent !important;
          }
          .edgeLabel rect {
            fill: #141314 !important;
            stroke: #3F5E36 !important;
            stroke-width: 1px !important;
            rx: 5px !important;
            ry: 5px !important;
            opacity: 0.98 !important;
          }
          .edgeLabel .label text, .edgeLabel text, .edgeLabel span {
            fill: #ffffff !important;
            color: #ffffff !important;
            font-family: 'IBM Plex Mono', monospace !important;
            font-size: 11.5px !important;
            font-weight: 600 !important;
            letter-spacing: 0.02em !important;
          }

          /* Clickable interactivity */
          .clickable > * {
            scale: 1;
            transform-box: fill-box;
            transform-origin: center;
            transition: scale 160ms cubic-bezier(0.23, 1, 0.32, 1);
          }
          .clickable {
            cursor: pointer;
          }
          @media (hover: hover) and (pointer: fine) {
            .clickable:hover > * {
              scale: 1.05;
            }
          }
          @media (prefers-reduced-motion: reduce) {
            .clickable > * {
              transition: none;
            }
            .clickable:hover > * {
              scale: 1;
            }
          }
        `;
      case "dark":
        return `
          /* --- FULL DARK CONSOLE MODE --- */
          .cluster rect {
            fill: #151415 !important;
            stroke: #2a2829 !important;
            stroke-width: 1.25px !important;
            rx: 12px !important;
            ry: 12px !important;
          }
          .cluster-label text, .cluster text {
            fill: #8DA982 !important;
            font-family: 'IBM Plex Mono', monospace !important;
            font-size: 12px !important;
            font-weight: 600 !important;
            letter-spacing: 0.05em !important;
            text-transform: uppercase !important;
          }
          .node rect, .node circle, .node polygon, .node path {
            fill: #1c1b1c !important;
            stroke: #3F5E36 !important;
            stroke-width: 1.25px !important;
            rx: 8px !important;
            ry: 8px !important;
          }
          .clickable:hover rect, .clickable:hover circle,
          .clickable:hover polygon {
            stroke: #5F7F52 !important;
            fill: #222022 !important;
            filter: drop-shadow(0 0 8px rgba(95, 127, 82, 0.3)) !important;
          }
          .node .label text, .node text, .nodeLabel {
            fill: #e6e1e1 !important;
            color: #e6e1e1 !important;
            font-family: 'Space Grotesk', system-ui, sans-serif !important;
            font-size: 13px !important;
            font-weight: 500 !important;
          }
          .flowchart-link, .edgePaths path, .edgePath .path {
            stroke: #5F7F52 !important;
            stroke-width: 1.5px !important;
            opacity: 0.9 !important;
          }
          #arrowhead path, marker path, .marker, marker[id*="arrowhead"] path {
            fill: #8DA982 !important;
            stroke: #8DA982 !important;
          }
          .edgeLabel rect {
            fill: #111418 !important;
            stroke: #2a2829 !important;
            stroke-width: 1px !important;
            rx: 4px !important;
            ry: 4px !important;
          }
          .edgeLabel .label text, .edgeLabel text, .edgeLabel span {
            fill: #d1ccd1 !important;
            color: #d1ccd1 !important;
            font-family: 'IBM Plex Mono', monospace !important;
            font-size: 11px !important;
          }
          .clickable { cursor: pointer; }
        `;
      case "light":
        return `
          /* --- CLEAN LIGHT LAB MODE --- */
          .cluster rect {
            fill: #ffffff !important;
            stroke: #cbd5e1 !important;
            stroke-width: 1.5px !important;
            rx: 12px !important;
            ry: 12px !important;
            filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.06)) !important;
          }
          .cluster-label text, .cluster text {
            fill: #1e293b !important;
            font-family: 'IBM Plex Mono', monospace !important;
            font-size: 12px !important;
            font-weight: 700 !important;
            text-transform: uppercase !important;
          }
          .node rect, .node circle, .node polygon, .node path {
            fill: #f8fafc !important;
            stroke: #94a3b8 !important;
            stroke-width: 1.25px !important;
            rx: 8px !important;
            ry: 8px !important;
          }
          .clickable:hover rect, .clickable:hover circle,
          .clickable:hover polygon {
            stroke: #2563eb !important;
            fill: #ffffff !important;
          }
          .node .label text, .node text, .nodeLabel {
            fill: #0f172a !important;
            color: #0f172a !important;
            font-family: 'Space Grotesk', system-ui, sans-serif !important;
            font-size: 13px !important;
            font-weight: 550 !important;
          }
          .flowchart-link, .edgePaths path, .edgePath .path {
            stroke: #475569 !important;
            stroke-width: 1.5px !important;
          }
          #arrowhead path, marker path, .marker, marker[id*="arrowhead"] path {
            fill: #475569 !important;
            stroke: #475569 !important;
          }
          .edgeLabel rect {
            fill: #ffffff !important;
            stroke: #cbd5e1 !important;
            rx: 4px !important;
            ry: 4px !important;
          }
          .edgeLabel .label text, .edgeLabel text, .edgeLabel span {
            fill: #0f172a !important;
            color: #0f172a !important;
            font-family: 'IBM Plex Mono', monospace !important;
            font-size: 11px !important;
          }
          .clickable { cursor: pointer; }
        `;
    }
  })();

  return {
    startOnLoad: false,
    suppressErrorRendering: true,
    securityLevel: "antiscript" as const,
    secure: ["securityLevel", "startOnLoad", "maxTextSize"],
    theme: "base" as const,
    htmlLabels: false,
    layout: "elk",
    look: "classic" as const,
    flowchart: {
      wrappingWidth: 200,
      curve: "linear" as const,
      nodeSpacing: 50,
      rankSpacing: 50,
      padding: 18,
    },
    themeVariables: themeVars,
    themeCSS,
  } satisfies MermaidConfig;
}

/** DOMPurify options for a rendered diagram SVG. */
export const MERMAID_SVG_SANITIZE_OPTIONS = {
  USE_PROFILES: { html: true, svg: true, svgFilters: true },
  FORBID_TAGS: ["script"],
};
