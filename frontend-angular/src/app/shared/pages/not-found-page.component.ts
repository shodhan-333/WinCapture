import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-not-found-page",
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="app-page" aria-labelledby="not-found-title">
      <div class="surface mx-auto mt-12 w-[min(520px,100%)] rounded-[18px] p-8 text-center">
        <p class="page-kicker">404 · Page not found</p>
        <h1 id="not-found-title" class="page-heading">This page isn’t available</h1>
        <p class="page-description mx-auto">
          The address may be incorrect, or the page may have moved.
        </p>
        <a class="primary-action mt-6" routerLink="/albums">Go to albums</a>
      </div>
    </section>
  `,
})
export class NotFoundPageComponent {}
