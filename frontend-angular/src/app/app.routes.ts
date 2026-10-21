import { Routes } from "@angular/router";
import { AppShellComponent } from "./app-shell.component";

// Load the Albums experience and fallback page only when their routes are requested.
export const routes: Routes = [
  {
    path: "",
    component: AppShellComponent,
    children: [
      {
        path: "albums",
        loadComponent: () =>
          import("./features/albums/albums-page.component").then(
            (module) => module.AlbumsPageComponent,
          ),
        title: "Albums | WinCapture",
      },
      { path: "", pathMatch: "full", redirectTo: "albums" },
      {
        path: "**",
        loadComponent: () =>
          import("./shared/pages/not-found-page.component").then(
            (module) => module.NotFoundPageComponent,
          ),
        title: "Page not found | WinCapture",
      },
    ],
  },
];
