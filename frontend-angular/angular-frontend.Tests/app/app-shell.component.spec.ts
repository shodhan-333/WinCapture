import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { signal } from "@angular/core";
import { describe, expect, it, vi } from "vitest";
import { AppShellComponent } from "../../src/app/app-shell.component";
import { AuthService } from "../../src/app/core/auth/auth.service";

describe("AppShellComponent", () => {
  const authMock = {
    user: signal<{ userId: number; name: string; email: string; role: "Admin" } | null>({ userId: 1, name: "Ada Lovelace", email: "ada@example.com", role: "Admin" }),
    signOut: vi.fn(),
  };

  it("renders navigation for a signed-in user and supports menu behavior", async () => {
    await TestBed.configureTestingModule({
      imports: [AppShellComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authMock }],
    }).compileComponents();
    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(fixture.nativeElement.textContent).toContain("Albums");
    expect(component.reactPage("/files")).toContain("/files");
    expect(component.initials("  Ada   Lovelace Byron ")).toBe("AL");
    expect(component.initials(" ")).toBe("U");
    expect(component.initials(undefined)).toBe("U");

    component.toggleMobileNavigation();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[aria-label="Mobile navigation"]')).not.toBeNull();
    component.closeMobileNavigation();
    expect(component.mobileOpen()).toBe(false);

    component.toggleProfileMenu();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="menu"]')).not.toBeNull();
    fixture.nativeElement.querySelector('[aria-haspopup="menu"]')?.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true }),
    );
    expect(component.profileOpen()).toBe(true);
    document.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    expect(component.profileOpen()).toBe(false);
    component.closeProfileOnEscape();
    expect(component.profileOpen()).toBe(false);
    component.toggleProfileMenu();
    component.closeProfileOnEscape();
    expect(component.profileOpen()).toBe(false);
  });

  it("hides the shell while the shared user is unavailable", async () => {
    authMock.user.set(null);
    await TestBed.configureTestingModule({
      imports: [AppShellComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authMock }],
    }).compileComponents();
    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector("header")).toBeNull();
    authMock.user.set({ userId: 1, name: "Ada Lovelace", email: "ada@example.com", role: "Admin" });
  });
});
