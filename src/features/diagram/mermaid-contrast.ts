export type DiagramThemeMode = "hybrid" | "dark" | "light";

interface ClusterRect {
  id: string | null;
  x: number;
  y: number;
  w: number;
  h: number;
}

export function enhanceDiagramContrast(
  mermaidElement: HTMLElement,
  themeMode: DiagramThemeMode = "hybrid",
) {
  const svg = mermaidElement.querySelector("svg");
  if (!svg) return;

  const clusters: ClusterRect[] = Array.from(
    svg.querySelectorAll<SVGGElement>(".clusters .cluster, g.cluster"),
  )
    .map((c) => {
      const rect = c.querySelector("rect");
      if (!rect) return null;
      return {
        id: c.getAttribute("id"),
        x: parseFloat(rect.getAttribute("x") || "0"),
        y: parseFloat(rect.getAttribute("y") || "0"),
        w: parseFloat(rect.getAttribute("width") || "0"),
        h: parseFloat(rect.getAttribute("height") || "0"),
      };
    })
    .filter((c): c is ClusterRect => c !== null);

  const existingMarker = svg.querySelector<SVGMarkerElement>(
    'marker[id*="pointEnd"], marker[id*="arrowhead"], marker',
  );

  // Prepare dark marker
  let darkMarker = svg.querySelector<SVGMarkerElement>(
    "#arrowhead-internal-dark",
  );
  if (!darkMarker && existingMarker && existingMarker.parentElement) {
    darkMarker = existingMarker.cloneNode(true) as SVGMarkerElement;
    darkMarker.setAttribute("id", "arrowhead-internal-dark");
    const p = darkMarker.querySelector("path");
    if (p) {
      p.style.fill = "#0f172a";
      p.style.stroke = "#0f172a";
      p.setAttribute("fill", "#0f172a");
      p.setAttribute("stroke", "#0f172a");
    }
    existingMarker.parentElement.appendChild(darkMarker);
  }

  // Prepare white marker
  let whiteMarker = svg.querySelector<SVGMarkerElement>(
    "#arrowhead-external-white",
  );
  if (!whiteMarker && existingMarker && existingMarker.parentElement) {
    whiteMarker = existingMarker.cloneNode(true) as SVGMarkerElement;
    whiteMarker.setAttribute("id", "arrowhead-external-white");
    const p = whiteMarker.querySelector("path");
    if (p) {
      p.style.fill = "#ffffff";
      p.style.stroke = "#ffffff";
      p.setAttribute("fill", "#ffffff");
      p.setAttribute("stroke", "#ffffff");
    }
    existingMarker.parentElement.appendChild(whiteMarker);
  }

  const edges = Array.from(
    svg.querySelectorAll<SVGPathElement>(
      ".edgePaths path, path.flowchart-link",
    ),
  );

  edges.forEach((path) => {
    try {
      const len = path.getTotalLength();
      if (!Number.isFinite(len) || len <= 0) return;

      const p1 = path.getPointAtLength(0);
      const p2 = path.getPointAtLength(len);

      const cluster = clusters.find(
        (c) =>
          p1.x >= c.x - 5 &&
          p1.x <= c.x + c.w + 5 &&
          p1.y >= c.y - 5 &&
          p1.y <= c.y + c.h + 5 &&
          p2.x >= c.x - 5 &&
          p2.x <= c.x + c.w + 5 &&
          p2.y >= c.y - 5 &&
          p2.y <= c.y + c.h + 5,
      );

      if (themeMode === "hybrid") {
        if (cluster) {
          // Inside white island: BLACK line
          path.setAttribute("data-internal", "true");
          path.style.setProperty("stroke", "#0f172a", "important");
          path.style.setProperty("stroke-width", "1.75px", "important");
          path.style.setProperty("opacity", "0.85", "important");
          if (darkMarker) {
            path.setAttribute("marker-end", "url(#arrowhead-internal-dark)");
          }
        } else {
          // Outside island: WHITE line across dark background
          path.setAttribute("data-internal", "false");
          path.style.setProperty("stroke", "#ffffff", "important");
          path.style.setProperty("stroke-width", "1.75px", "important");
          path.style.setProperty("opacity", "0.95", "important");
          if (whiteMarker) {
            path.setAttribute("marker-end", "url(#arrowhead-external-white)");
          }
        }
      } else if (themeMode === "dark") {
        path.style.setProperty("stroke", "#5F7F52", "important");
        path.style.setProperty("stroke-width", "1.5px", "important");
        path.style.setProperty("opacity", "0.9", "important");
      } else if (themeMode === "light") {
        path.style.setProperty("stroke", "#334155", "important");
        path.style.setProperty("stroke-width", "1.5px", "important");
        path.style.setProperty("opacity", "0.9", "important");
      }
    } catch {
      // ignore path calculation errors
    }
  });
}
