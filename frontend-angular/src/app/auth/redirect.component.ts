import { Component, OnInit } from '@angular/core';
import { broadcastResponseToMainFrame } from '@azure/msal-browser/redirect-bridge';

@Component({
  selector: 'app-redirect',
  standalone: true,
  template: '<main class="redirect-page">Completing Microsoft sign-in…</main>',
})
export class RedirectComponent implements OnInit {
  ngOnInit(): void {
    broadcastResponseToMainFrame().catch((error: unknown) => {
      console.error('Microsoft sign-in redirect could not be completed.', error);
    });
  }
}
