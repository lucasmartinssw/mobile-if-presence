import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root' // Disponível em toda a aplicação
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    // 1. Verifique se existe um token de autenticação (JWT) no Local Storage
    const authToken = localStorage.getItem('authToken');

    if (authToken) {
      // Opcional: Você pode adicionar lógica aqui para verificar se o token é válido
      // (Ex: decodificar o JWT e verificar sua expiração, fazer uma requisição para uma rota de validação no backend)
      // Por enquanto, apenas a existência do token é suficiente para permitir o acesso.
      console.log('AuthGuard: Token encontrado. Acesso permitido.');
      return true; // Token existe, permite o acesso à rota
    } else {
      // Token não encontrado, redireciona para a página de login
      console.log('AuthGuard: Nenhum token encontrado. Redirecionando para login.');
      return this.router.parseUrl('/login'); // Redireciona para a rota de login
    }
  }
}