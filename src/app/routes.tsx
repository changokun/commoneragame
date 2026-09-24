import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/RootLayout";
import { AdminAuthWrapper } from "./components/AdminAuthWrapper";
import { HomePage } from "./pages/HomePage";
import { NewGamePage } from "./pages/NewGamePage";
import { JoinGamePage } from "./pages/JoinGamePage";
import { AboutPage } from "./pages/AboutPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { TermsPage } from "./pages/TermsPage";
import { ContactPage } from "./pages/ContactPage";
import { AdminPage } from "./pages/admin/AdminPage";
import { AdminLoginPage } from "./pages/admin/AdminLoginPage";
import { EditTagPage } from "./pages/admin/tags/EditTagPage";
import { TagsPage } from "./pages/admin/tags/TagsPage";
import { EventsPage } from "./pages/admin/events/EventsPage";
import { EditEventPage } from "./pages/admin/events/EditEventPage";
import { PlayPage } from "./pages/PlayPage";


export const router = createBrowserRouter([
	{
		path: "/",
		Component: RootLayout,
		children: [
			{ index: true, Component: HomePage },
			{ path: "new-game", Component: NewGamePage },
			{ path: "join-game", Component: JoinGamePage },
			{ path: "play/:gameId?", Component: PlayPage },
			{ path: "about", Component: AboutPage },
			{ path: "privacy", Component: PrivacyPage },
			{ path: "terms", Component: TermsPage },
			{ path: "contact", Component: ContactPage },
			{ path: "*", Component: () => <div>404 - Page not found</div> },
		],
	},
	{
		path: "/admin/login",
		element: <AdminLoginPage />,
	},
	{
		path: "/admin",
		element: (
			<AdminAuthWrapper>
				<AdminPage />
			</AdminAuthWrapper>
		),
	},
	{
		path: "/admin/tags/edit/:id",
		element: (
			<AdminAuthWrapper>
				<EditTagPage />
			</AdminAuthWrapper>
		),
	},
	{
		path: "/admin/tags",
		element: (
			<AdminAuthWrapper>
				<TagsPage />
			</AdminAuthWrapper>
		),
	},
	{
		path: "/admin/events",
		element: (
			<AdminAuthWrapper>
				<EventsPage />
			</AdminAuthWrapper>
		),
	},
	{
		path: "/admin/events/edit/:id",
		element: (
			<AdminAuthWrapper>
				<EditEventPage />
			</AdminAuthWrapper>
		),
	}
]);
