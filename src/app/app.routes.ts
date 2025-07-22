import { Routes } from '@angular/router';

// Importe as páginas que você criou
import { LoginPage } from './login/login.page'; // Certifique-se de que o caminho está correto
import { HomePage } from './home/home.page';   // Certifique-se de que o caminho está correto

// (Vamos criar este AuthGuard no próximo passo)
import { AuthGuard } from './guards/auth.guard'; // Importe o AuthGuard

export const routes: Routes = [
  // Redireciona a rota vazia para '/login'
  {
    path: '',
    redirectTo: 'login', // A primeira rota padrão será a de login
    pathMatch: 'full',
  },
  // Rota para a página de login
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then(m => m.LoginPage)
  },
  // Rota para a página principal (Home), protegida pelo AuthGuard
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then(m => m.HomePage),
    canActivate: [AuthGuard] // Protege esta rota: só acessível se o AuthGuard permitir
  },
  // Opcional: Rotas para outras páginas protegidas
  // {
  //   path: 'dashboard',
  //   loadComponent: () => import('./dashboard/dashboard.page').then(m => m.DashboardPage),
  //   canActivate: [AuthGuard]
  // },
  // ... outras rotas do seu app ...

  // Rota wildcard para lidar com caminhos não encontrados (opcional, redireciona para login)
  {
    path: '**',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];