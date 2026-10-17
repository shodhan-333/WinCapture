import { Routes } from '@angular/router';
import { signedInGuard } from './auth/signed-in.guard';
import { RedirectComponent } from './auth/redirect.component';
import { AlbumsComponent } from './pages/albums/albums.component';

export const routes: Routes = [
  { path: 'redirect', component: RedirectComponent },
  { path: '', pathMatch: 'full', redirectTo: 'albums' },
  { path: 'albums', component: AlbumsComponent, canActivate: [signedInGuard] },
  { path: '**', redirectTo: 'albums' },
];
