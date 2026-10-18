import { Component, ElementRef, HostListener, ViewChild, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app-shell.component.html',
})
export class AppShellComponent {
  @ViewChild('profileContainer') private profileElement?: ElementRef<HTMLElement>;
  @ViewChild('profileTrigger') private profileTrigger?: ElementRef<HTMLButtonElement>;
  readonly auth = inject(AuthService);
  readonly mobileOpen = signal(false);
  readonly profileOpen = signal(false);
  private readonly reactOrigin = new URL(environment.reactAlbumsUrl).origin;

  reactPage(path: string): string {
    return new URL(path, this.reactOrigin).toString();
  }

  initials(name: string | undefined): string {
    const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
    return parts.length === 0 ? 'U' : parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  }

  closeMobileNavigation(): void {
    this.mobileOpen.set(false);
  }

  toggleMobileNavigation(): void {
    this.mobileOpen.update((open) => !open);
  }

  toggleProfileMenu(): void {
    this.profileOpen.update((open) => !open);
  }

  @HostListener('document:pointerdown', ['$event'])
  closeProfileOnOutsideClick(event: PointerEvent): void {
    const target = event.target;
    if (target instanceof Node && !this.profileElement?.nativeElement.contains(target)) {
      this.profileOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  closeProfileOnEscape(): void {
    if (!this.profileOpen()) return;
    this.profileOpen.set(false);
    this.profileTrigger?.nativeElement.focus();
  }

}
