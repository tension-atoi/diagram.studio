import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  LANGUAGE_STORAGE_KEY,
  StudioLanguageProvider,
  useStudioLanguage,
} from "~/components/studio-language-provider";
import { ProviderModelDialog } from "~/components/provider-model-dialog";

const fetchMock = vi.fn(() =>
  Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
);

function Probe() {
  const { lang, setLang, t } = useStudioLanguage();
  return (
    <div>
      <span data-testid="lang">{lang}</span>
      <span data-testid="submit">{t("mainCard.submit")}</span>
      <span data-testid="regenerate">{t("toolbar.regenerate")}</span>
      <button type="button" onClick={() => setLang("fr")}>
        switch to french
      </button>
    </div>
  );
}

function renderProbe() {
  return render(
    <StudioLanguageProvider>
      <Probe />
    </StudioLanguageProvider>,
  );
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  document.documentElement.lang = "en";
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  fetchMock.mockClear();
  vi.unstubAllGlobals();
});

describe("StudioLanguageProvider", () => {
  it("renders English by default without sniffing the browser language", () => {
    const language = vi
      .spyOn(navigator, "language", "get")
      .mockReturnValue("fr-FR");

    renderProbe();

    expect(screen.getByTestId("lang")).toHaveTextContent("en");
    expect(screen.getByTestId("submit")).toHaveTextContent("Ingest & Map");
    expect(document.documentElement.lang).toBe("en");
    language.mockRestore();
  });

  it("switches the strings, the document language and the stored choice", () => {
    renderProbe();

    fireEvent.click(screen.getByRole("button", { name: "switch to french" }));

    expect(screen.getByTestId("lang")).toHaveTextContent("fr");
    expect(screen.getByTestId("submit")).toHaveTextContent(
      "Ingérer et cartographier",
    );
    expect(screen.getByTestId("regenerate")).toHaveTextContent("Régénérer");
    expect(document.documentElement.lang).toBe("fr");
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("fr");
  });

  it("persists the choice to the settings route", () => {
    renderProbe();

    fireEvent.click(screen.getByRole("button", { name: "switch to french" }));

    expect(fetchMock).toHaveBeenCalledWith("/api/settings/lang", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang: "fr" }),
    });
  });

  it("restores the stored language after hydration", () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "fr");

    renderProbe();

    expect(screen.getByTestId("lang")).toHaveTextContent("fr");
    expect(document.documentElement.lang).toBe("fr");
  });

  it("ignores a stored value that is not a supported language", () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "de");

    renderProbe();

    expect(screen.getByTestId("lang")).toHaveTextContent("en");
    expect(document.documentElement.lang).toBe("en");
  });
});

describe("language switch in the settings dialog", () => {
  it("offers a keyboard-reachable EN/FR switch and translates the dialog", () => {
    render(
      <StudioLanguageProvider>
        <ProviderModelDialog isOpen onClose={() => undefined} />
      </StudioLanguageProvider>,
    );

    const english = screen.getByRole("button", { name: "English" });
    const french = screen.getByRole("button", { name: "French" });
    expect(english).toHaveAttribute("aria-pressed", "true");
    expect(french).toHaveAttribute("aria-pressed", "false");
    expect(french.tagName).toBe("BUTTON");

    fireEvent.click(french);

    expect(french).toHaveAttribute("aria-pressed", "true");
    expect(english).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.getByRole("group", { name: "Langue de l'interface" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Anglais" })).toBe(english);
    expect(screen.getByRole("button", { name: "Français" })).toBe(french);
    expect(
      screen.getByRole("button", { name: "Appliquer" }),
    ).toBeInTheDocument();
  });
});
