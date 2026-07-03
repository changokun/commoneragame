import { Outlet, useLocation } from "react-router";
import { ThemeProvider } from "./ThemeProvider";
import { Footer } from "./Footer";
import { ErrorBoundary } from "./ErrorBoundary";

export function RootLayout() {
  const location = useLocation();
  const isPlayPage = location.pathname.startsWith("/play");

  return (
    <ThemeProvider>
      <div className="{isPlayPage && 'h-screen'} overflow-hidden flex flex-col bg-background text-foreground">
        {!isPlayPage && (
          <header className="w-full px-6 py-4 flex-shrink-0">
            <h1 className="text-3xl font-bold text-muted-foreground">Common Era</h1>
          </header>
        )}

        <main className={`flex-1 flex flex-col overflow-hidden ${!isPlayPage ? "px-6 py-8" : ""}`}>
					<ErrorBoundary onReset={() => window.location.reload()}>
						<Outlet />
					</ErrorBoundary>
        </main>

        {!isPlayPage && <Footer />}
      </div>
    </ThemeProvider>
  );
}
