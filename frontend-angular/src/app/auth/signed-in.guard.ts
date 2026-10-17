import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

export const signedInGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return new Promise<boolean>((resolve) => auth.initialize().subscribe({
    next: (user) => {
      if (user) {
        resolve(true);
      } else {
        resolve(false);
      }
    },
    error: () => resolve(false),
  }));
};
