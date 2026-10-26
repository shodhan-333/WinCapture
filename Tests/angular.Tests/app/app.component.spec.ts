import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { describe, expect, it } from "vitest";
import { AppComponent } from "../../../frontend-angular/src/app/app.component";

describe("AppComponent", () => {
  it("hosts the active route", async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector("router-outlet")).not.toBeNull();
  });
});
