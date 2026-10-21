import { bootstrapApplication } from "@angular/platform-browser";
import { AppComponent } from "./app/app.component";
import { appConfig } from "./app/app.config";

// Start Angular with the shared MSAL and router providers; show a plain fallback if startup fails.
void bootstrapApplication(AppComponent, appConfig).catch((error: unknown) => {
  document.body.textContent =
    error instanceof Error ? error.message : "WinCapture could not start.";
});
