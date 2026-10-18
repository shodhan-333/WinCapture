import { Routes } from '@angular/router';
import { AppShellComponent } from './app-shell.component';
import { AlbumsPageComponent } from './features/albums/albums-page.component';

export const routes: Routes = [
  {
    path: '',
    component: AppShellComponent,
    children: [
      { path: 'albums', component: AlbumsPageComponent },
      { path: '', pathMatch: 'full', redirectTo: 'albums' },
      { path: '**', redirectTo: 'albums' },
    ],
  },
];
