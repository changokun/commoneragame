import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { ArrowLeft, Mail, MessageCircle, Globe, Clock, Phone } from "lucide-react";
import flagFinderImage from '@/assets/images/flag-finder.png';

/**
 * ContactPage Component
 * 
 * This page provides contact information for Common Era.
 * Note: This page intentionally has NO forms - it only displays contact information.
 * It uses React Router's Link for client-side navigation.
 * 
 * @returns {JSX.Element} The rendered Contact page
 */
export function ContactPage() {
  return (
    <div className="flex-1 flex flex-col">
      <div className="max-w-3xl w-full mx-auto space-y-8">

        {/* Hero section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Contact Us
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            We'd love to hear from you
          </p>
        </div>

        {/* Main content */}
        <div className="space-y-12">
          
          {/* Introduction */}
          <section className="text-center space-y-4">
            <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              If you find issues with the game, please join our discord and post your problems.
            </p>
            <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              If you find this game fun or useful, please share it, and also let me know!
            </p>
          </section>

          {/* Contact information grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Community card */}
            <div className="border rounded-lg p-6 space-y-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-3 rounded-full">
                  <MessageCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Community</h3>
                  <p className="text-sm text-muted-foreground">Join the conversation</p>
                </div>
              </div>
              <div className="space-y-3 flex items-center gap-3">
								{/* Discord SVG Logo */}
								<svg width="48px" height="48px" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
									<circle cx="512" cy="512" r="512" fill="#5865f2"/>
									<path d="M689.43 349a422.21 422.21 0 0 0-104.22-32.32 1.58 1.58 0 0 0-1.68.79 294.11 294.11 0 0 0-13 26.66 389.78 389.78 0 0 0-117.05 0 269.75 269.75 0 0 0-13.18-26.66 1.64 1.64 0 0 0-1.68-.79A421 421 0 0 0 334.44 349a1.49 1.49 0 0 0-.69.59c-66.37 99.17-84.55 195.9-75.63 291.41a1.76 1.76 0 0 0 .67 1.2 424.58 424.58 0 0 0 127.85 64.63 1.66 1.66 0 0 0 1.8-.59 303.45 303.45 0 0 0 26.15-42.54 1.62 1.62 0 0 0-.89-2.25 279.6 279.6 0 0 1-39.94-19 1.64 1.64 0 0 1-.16-2.72c2.68-2 5.37-4.1 7.93-6.22a1.58 1.58 0 0 1 1.65-.22c83.79 38.26 174.51 38.26 257.31 0a1.58 1.58 0 0 1 1.68.2c2.56 2.11 5.25 4.23 8 6.24a1.64 1.64 0 0 1-.14 2.72 262.37 262.37 0 0 1-40 19 1.63 1.63 0 0 0-.87 2.28 340.72 340.72 0 0 0 26.13 42.52 1.62 1.62 0 0 0 1.8.61 423.17 423.17 0 0 0 128-64.63 1.64 1.64 0 0 0 .67-1.18c10.68-110.44-17.88-206.38-75.7-291.42a1.3 1.3 0 0 0-.63-.63zM427.09 582.85c-25.23 0-46-23.16-46-51.6s20.38-51.6 46-51.6c25.83 0 46.42 23.36 46 51.6.02 28.44-20.37 51.6-46 51.6zm170.13 0c-25.23 0-46-23.16-46-51.6s20.38-51.6 46-51.6c25.83 0 46.42 23.36 46 51.6.01 28.44-20.17 51.6-46 51.6z" fill="white"/>
								</svg>
                <div>
                  <p className="text-sm text-muted-foreground">Discord Server</p>
                  <a 
                    href="https://discord.gg/XNr4cfqEqH"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline block"
                  >
                    Join the Common Era Discord

                  </a>
                </div>
              </div>
            </div>

            {/* Flag Finder card */}
            <div className="border rounded-lg p-6 space-y-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-3 rounded-full">
                  <MessageCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Flag an Event</h3>
                  <p className="text-sm text-muted-foreground">Favorite or Problem</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Each Event has these buttons to flag them as too difficult, too easy, or just to let us know you are glad that it exists. Please use these a lot (for now) because we need to know how we are doing.</p>
									<img src={flagFinderImage} alt="" />
                </div>
              </div>
            </div>
          </section>

          {/* FAQ section
          <section className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
              <p className="text-muted-foreground mt-2">
                Find answers to common questions below
              </p>
            </div>
            
            <div className="space-y-4">
              <details className="border rounded-lg p-4 group">
                <summary className="font-semibold cursor-pointer flex justify-between items-center">
                  How do I create a game?
                  <span className="text-muted-foreground group-hover:text-primary transition-colors">
                    Open
                  </span>
                </summary>
                <p className="text-muted-foreground mt-3 leading-relaxed">
                  Visit the homepage and click "Create New Game". You can customize the game settings including 
                  difficulty, number of events, and categories. Once created, share the game code with your 
                  friends to join.
                </p>
              </details>
              
              <details className="border rounded-lg p-4 group">
                <summary className="font-semibold cursor-pointer flex justify-between items-center">
                  How do I join a game?
                  <span className="text-muted-foreground group-hover:text-primary transition-colors">
                    Open
                  </span>
                </summary>
                <p className="text-muted-foreground mt-3 leading-relaxed">
                  Click "Join Existing Game" on the homepage and enter the game code provided by the game 
                  creator. Once all players have joined, the game will begin.
                </p>
              </details>
              
              <details className="border rounded-lg p-4 group">
                <summary className="font-semibold cursor-pointer flex justify-between items-center">
                  Is Common Era free to play?
                  <span className="text-muted-foreground group-hover:text-primary transition-colors">
                    Open
                  </span>
                </summary>
                <p className="text-muted-foreground mt-3 leading-relaxed">
                  Yes! Common Era is completely free to play. We may offer premium features or cosmetic 
                  options in the future, but the core gameplay will always be free.
                </p>
              </details>
              
              <details className="border rounded-lg p-4 group">
                <summary className="font-semibold cursor-pointer flex justify-between items-center">
                  How are scores calculated?
                  <span className="text-muted-foreground group-hover:text-primary transition-colors">
                    Open
                  </span>
                </summary>
                <p className="text-muted-foreground mt-3 leading-relaxed">
                  Scores are based on the accuracy of your timeline. Each correctly placed event earns points, 
                  with bonus points for perfect timelines. The scoring system rewards both speed and accuracy.
                </p>
              </details>
            </div>
          </section>
					*/}


        </div>
      </div>
    </div>
  );
}
