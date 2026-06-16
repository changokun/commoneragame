import { Outlet, useLocation } from "react-router";
import { ThemeProvider } from "./ThemeProvider";
import { Footer } from "./Footer";

export function RootLayout() {
  const location = useLocation();
  const isPlayPage = location.pathname.startsWith("/play");

  return (
    <ThemeProvider>
      <div className="{isPlayPage && 'h-screen'} overflow-hidden flex flex-col bg-background text-foreground">
        <header className="w-full px-6 py-4 flex-shrink-0">
          <h1 className="text-3xl font-bold text-muted-foreground">Common Era</h1>
        </header>

        <main className="flex-1 flex flex-col px-6 py-8 overflow-hidden">
          <Outlet />
        </main>

        {!isPlayPage && <Footer />}
      </div>
    </ThemeProvider>
  );
}
