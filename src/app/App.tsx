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
              A text-based strategy game where you guide civilizations through the ages.
              Make critical decisions, manage resources, and shape the course of history
              from ancient times to the modern world. Every choice matters as you navigate
              the challenges of building and sustaining a thriving society.
            </p>
          </div>
        </main>

        <Footer />
      </div>
    </ThemeProvider>
  );
}