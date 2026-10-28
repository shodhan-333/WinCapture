import { provideRouter } from "@angular/router";
import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { NotFoundPageComponent } from "../../../src/app/shared/pages/not-found-page.component";

describe("NotFoundPageComponent", () => {
  it("renders the not found message and albums link", async () => {
    await TestBed.configureTestingModule({
      imports: [NotFoundPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(NotFoundPageComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain("Page not found");
    expect(fixture.nativeElement.querySelector("a")?.getAttribute("href")).toBe("/albums");
  });
});
