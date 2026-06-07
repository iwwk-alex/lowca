import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'leaflets',
    canActivate: [authGuard],
    loadComponent: () => import('./features/leaflets/leaflets.component').then(m => m.LeafletsComponent)
  },
  {
    path: 'comparison',
    canActivate: [authGuard],
    loadComponent: () => import('./features/comparison/comparison.component').then(m => m.ComparisonComponent)
  },
  {
    path: 'shopping-list',
    canActivate: [authGuard],
    loadComponent: () => import('./features/shopping-list/shopping-list.component').then(m => m.ShoppingListComponent)
  },
  {
    path: 'cards',
    canActivate: [authGuard],
    loadComponent: () => import('./features/cards/cards.component').then(m => m.CardsComponent)
  }
];
