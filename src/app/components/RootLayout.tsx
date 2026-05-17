import { Outlet } from "react-router";
import { ThemeProvider } from "./ThemeProvider";
import { DarkModeToggle } from "./DarkModeToggle";
import { Footer } from "./Footer";

export function RootLayout() {
  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <header className="w-full px-6 py-4 flex justify-end">
          <DarkModeToggle />
        </header>

        <main className="flex-1 flex flex-col px-6 py-8">
          <Outlet />
        </main>

        <Footer />
      </div>
    </ThemeProvider>
  );
}
