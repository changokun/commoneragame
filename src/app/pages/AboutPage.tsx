import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { ArrowLeft, BookOpen, Lightbulb, Users, Globe } from "lucide-react";

/**
 * AboutPage Component
 * 
 * This page provides information about the Common Era game.
 * It uses React Router's Link for client-side navigation.
 * 
 * @returns {JSX.Element} The rendered About page
 */
export function AboutPage() {
	return (
		<div className="flex-1 flex flex-col">
			<div className="max-w-3xl w-full mx-auto space-y-8">

				{/* Hero section */}
				<div className="text-center space-y-4">
					<h1 className="text-4xl md:text-5xl font-bold tracking-tight">
						About Common Era
					</h1>
					<p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
						A simple game that tests your knowledge of history
					</p>
				</div>

				{/* Main content */}
				<div className="space-y-12">

					{/* What is Common Era section */}
					<section className="space-y-4">
						<div className="inline-flex items-center gap-2 text-primary">
							<BookOpen className="h-6 w-6" />
							<h2 className="text-2xl font-bold">What is Common Era?</h2>
						</div>
						<p className="text-muted-foreground leading-relaxed">
							Common Era is an engaging multiplayer game where players compete to correctly order historical events. Each game presents a set of events from various categories and time periods, and players must arrange them in chronological order.
						</p>
						<p className="text-muted-foreground leading-relaxed">
							The game is perfect for history enthusiasts, students, and anyone looking to test or expand their knowledge of world events. Whether you're a casual player or a history buff, Common Era offers a fun and educational experience.
						</p>
					</section>

					{/* How it works section */}
					<section className="space-y-4">
						<div className="inline-flex items-center gap-2 text-primary">
							<Lightbulb className="h-6 w-6" />
							<h2 className="text-2xl font-bold">How It Works</h2>
						</div>
						<ol className="space-y-4 text-muted-foreground leading-relaxed list-decimal list-inside">
							<li>
								<strong>Create or Join a Game:</strong> Start a new game session or join an existing one if you have an invite.
							</li>
							<li>
								<strong>Your timeline starts with two events:</strong> Two random events are shown in order with older events at the top of the screen, and more recent events at the bottom.
							</li>
							<li>
								<strong>Draw a random event:</strong> Click/Tap the Draw New Event Button.
							</li>
							<li>
								<strong>Read and Choose:</strong> Figure out where this new event belongs on your timeline. Click/Tap the buttons between the events in your timeline to choose its location. If you are right, it is added to your timeline and you draw a new event. If you are wrong, the event goes to the side, and you have one strike. You can draw a new event or try the missed event again.
							</li>
							<li>
								<strong>Win, or maybe lose:</strong> Play until you’ve got ten events in your timeline or until you get three strikes.
							</li>
						</ol>
					</section>

					{/* Features section */}
					<section className="space-y-4">
						<div className="inline-flex items-center gap-2 text-primary">
							<Globe className="h-6 w-6" />
							<h2 className="text-2xl font-bold">Features</h2>
						</div>
						<ul className="space-y-3 text-muted-foreground leading-relaxed">
							<li className="flex items-start gap-3">
								<span className="mt-1">🌍</span>
								<span>Comprehensive historical database spanning ancient to modern times</span>
							</li>
							<li className="flex items-start gap-3">
								<span className="mt-1">🎯</span>
								<span>Multiple difficulty levels to suit all knowledge bases</span>
							</li>
							<li className="flex items-start gap-3">
								<span className="mt-1">🎯</span>
								<span>Topic filters, so that you can focus only on Sports History, Art History, Military History, or a combination of any Topics</span>
							</li>
							<li className="flex items-start gap-3">
								<span className="mt-1">🎯</span>
								<span>Geographic filters, so that you can focus only on European History, Ancient South American History, Greek History, or any combination</span>
							</li>
						</ul>
					</section>
					<section className="space-y-4">

						<div className="inline-flex items-center gap-2 text-primary">
							<Globe className="h-6 w-6" />
							<h2 className="text-2xl font-bold">Planned Features</h2>
						</div>
						<ul className="space-y-3 text-muted-foreground leading-relaxed">
							<li className="flex items-start gap-3">
								<span className="mt-1">🌍</span>
								<span>More historical events to work with, in every category and age.</span>
							</li>
							<li className="flex items-start gap-3">
								<span className="mt-1">🌍</span>
								<span>Curriculum-related historical events.</span>
							</li>
							<li className="flex items-start gap-3">
								<span className="mt-1">🌍</span>
								<span>Add and Manage your own set of historical events. Get nerdy with it!</span>
							</li>
							<li className="flex items-start gap-3">
								<span className="mt-1">👥</span>
								<span>Multiplayer support for competitive or cooperative play</span>
							</li>
							<li className="flex items-start gap-3">
								<span className="mt-1">📊</span>
								<span>Detailed scoring and statistics to track your progress</span>
							</li>
							<li className="flex items-start gap-3">
								<span className="mt-1">🎨</span>
								<span>A prettier interface</span>
							</li>
						</ul>
					</section>

					{/* Our Mission section */}
					<section className="space-y-4">
						<div className="inline-flex items-center gap-2 text-primary">
							<Users className="h-6 w-6" />
							<h2 className="text-2xl font-bold">Our Mission</h2>
						</div>
						<p className="text-muted-foreground leading-relaxed">
							We created Common Era to make learning history fun and accessible. Our goal is to help people of all ages develop a better understanding of historical timelines and the connections between events that shaped our world.
						</p>
						<p className="text-muted-foreground leading-relaxed">
							By turning education into an engaging game, we hope to inspire curiosity and a lifelong love of learning about the past.
						</p>
					</section>

					{/* Call to action */}
					<section className="text-center pt-8">
						<p className="text-muted-foreground mb-6">
							Ready to test your historical knowledge?
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Link to="/new-game">
								<Button size="lg" className="w-full sm:w-auto">
									Create New Game
								</Button>
							</Link>
						</div>
					</section>
				</div>
			</div>
		</div>
	);
}
