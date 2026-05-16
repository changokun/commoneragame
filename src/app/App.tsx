import { ThemeProvider } from "./components/ThemeProvider";
import { DarkModeToggle } from "./components/DarkModeToggle";
import { Footer } from "./components/Footer";

export default function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <header className="w-full px-6 py-4 flex justify-end">
          <DarkModeToggle />
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
          <div className="max-w-3xl w-full text-center space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              Common Era
            </h1>

            <p className="text-lg md:text-xl leading-relaxed text-muted-foreground max-w-2xl mx-auto">
              Test your knowledge of history! Can you put these events in order?
            </p>
          </div>
        </main>

        <Footer />
      </div>
    </ThemeProvider>
  );
}