import "@angular/compiler";
import { createEnvironmentInjector, runInInjectionContext } from "@angular/core";
import { describe, expect, it } from "vitest";
import { AuthService } from "../../../frontend-angular/src/app/core/auth/auth.service";
import { AppShellComponent } from "../../../frontend-angular/src/app/app-shell.component";

describe("Angular application shell behavior", () => {
  it("builds React links, derives initials, and toggles navigation and profile state", () => {
    const injector = createEnvironmentInjector(
      [{ provide: AuthService, useValue: {} }],
      createEnvironmentInjector([]),
    );
    const shell = runInInjectionContext(injector, () => new AppShellComponent());
    expect(shell.reactPage("/dashboard")).toBe("https://localhost:5173/dashboard");
    expect(shell.initials(undefined)).toBe("U");
    expect(shell.initials("   ")).toBe("U");
    expect(shell.initials("Ada Lovelace Byron")).toBe("AL");
    shell.toggleMobileNavigation();
    expect(shell.mobileOpen()).toBe(true);
    shell.closeMobileNavigation();
    expect(shell.mobileOpen()).toBe(false);
    shell.toggleProfileMenu();
    expect(shell.profileOpen()).toBe(true);
    shell.closeProfileOnEscape();
    expect(shell.profileOpen()).toBe(false);
    shell.closeProfileOnEscape();
    shell.toggleProfileMenu();
    shell.closeProfileOnOutsideClick({ target: document.body } as PointerEvent);
    expect(shell.profileOpen()).toBe(false);
    injector.destroy();
  });
});
