import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/RootLayout";
import { HomePage } from "./pages/HomePage";
import { NewGamePage } from "./pages/NewGamePage";
import { JoinGamePage } from "./pages/JoinGamePage";
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
      { path: "*", Component: () => <div>404 - Page not found</div> },
    ],
  },
]);
