import "@angular/compiler";
import { describe, expect, it } from "vitest";
import { AppShellComponent } from "../../../frontend-angular/src/app/app-shell.component";
import { AppComponent } from "../../../frontend-angular/src/app/app.component";
import { routes } from "../../../frontend-angular/src/app/app.routes";
import { AlbumsPageComponent } from "../../../frontend-angular/src/app/features/albums/albums-page.component";

describe("Angular application routing", () => {
  it("keeps Albums at /angular/albums and redirects empty or unknown child paths there", () => {
    expect(AppComponent).toBeDefined();
    const shellRoute = routes[0];
    expect(shellRoute.path).toBe("");
    expect(shellRoute.component).toBe(AppShellComponent);
    expect(shellRoute.children).toContainEqual({ path: "albums", component: AlbumsPageComponent });
    expect(shellRoute.children).toContainEqual({
      path: "",
      pathMatch: "full",
      redirectTo: "albums",
    });
    expect(shellRoute.children).toContainEqual({ path: "**", redirectTo: "albums" });
  });
});
