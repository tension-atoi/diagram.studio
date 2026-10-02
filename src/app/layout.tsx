import "~/styles/globals.css";

import { type Metadata } from "next";
import { Header } from "~/components/header";
import { Footer } from "~/components/footer";
import { SITE_URL } from "~/lib/site";
import { chunkReloadScript } from "~/lib/chunk-reload";
import { StudioThemeProvider } from "~/lib/theme-context";
import { StudioLanguageProvider } from "~/components/studio-language-provider";
import { DEFAULT_LANG } from "~/lib/i18n";

export const metadata: Metadata = {
  title: "gnu.in.labs / diagram studio",
  description:
    "Local-first, provider-agnostic architecture diagrams for software systems and repositories.",
  metadataBase: new URL(SITE_URL || "http://localhost:3001"),
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "gnu.in.labs / diagram studio",
    description: "Local-first architecture diagrams.",
    siteName: "gnu.in.labs",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: chunkReloadScript }} />
      </head>
      <body className="flex min-h-screen flex-col bg-[#111418] font-sans text-[#e6e1e1] antialiased transition-colors duration-200 selection:bg-[#5F7F52] selection:text-white">
        <StudioThemeProvider>
          {/* The server renders the default language; the provider restores the
              stored choice after hydration and keeps <html lang> in sync. */}
          <StudioLanguageProvider defaultLang={DEFAULT_LANG}>
            <Header />
            <div className="flex flex-grow flex-col">{children}</div>
            <Footer />
          </StudioLanguageProvider>
        </StudioThemeProvider>
      </body>
    </html>
  );
}
