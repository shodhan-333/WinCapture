import { Component, ElementRef, HostListener, ViewChild, inject, signal } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { AuthService } from "./core/auth/auth.service";
import { environment } from "../environments/environment";

@Component({
  selector: "app-shell",
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: "./app-shell.component.html",
})
// Hosts Angular navigation and profile controls while routing the other sections back to React.
export class AppShellComponent {
  @ViewChild("profileContainer") private profileElement?: ElementRef<HTMLElement>;
  @ViewChild("profileTrigger") private profileTrigger?: ElementRef<HTMLButtonElement>;
  readonly auth = inject(AuthService);
  readonly mobileOpen = signal(false);
  readonly profileOpen = signal(false);
  private readonly reactOrigin = environment.reactBaseUrl;

  // Build links against React's configured origin so both applications share the same browser session.
  reactPage(path: string): string {
    return new URL(path, this.reactOrigin).toString();
  }

  // Derive an avatar label from the active user's first two name parts.
  initials(name: string | undefined): string {
    const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
    return parts.length === 0
      ? "U"
      : parts
          .slice(0, 2)
          .map((part) => part[0])
          .join("")
          .toUpperCase();
  }

  // Hide the mobile navigation after a route has been selected.
  closeMobileNavigation(): void {
    this.mobileOpen.set(false);
  }

  // Toggle the responsive navigation panel.
  toggleMobileNavigation(): void {
    this.mobileOpen.update((open) => !open);
  }

  // Toggle the account menu from its profile button.
  toggleProfileMenu(): void {
    this.profileOpen.update((open) => !open);
  }

  // Close the profile menu when a pointer event lands outside its trigger and panel.
  @HostListener("document:pointerdown", ["$event"])
  closeProfileOnOutsideClick(event: PointerEvent): void {
    const target = event.target;
    if (target instanceof Node && !this.profileElement?.nativeElement.contains(target)) {
      this.profileOpen.set(false);
    }
  }

  // Restore focus to the trigger after Escape closes the profile menu.
  @HostListener("document:keydown.escape")
  closeProfileOnEscape(): void {
    if (!this.profileOpen()) return;
    this.profileOpen.set(false);
    this.profileTrigger?.nativeElement.focus();
  }
}
