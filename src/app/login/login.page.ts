import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { HttpClient } from '@angular/common/http'; 
import { Router } from '@angular/router'; 
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class LoginPage {
  username!: string;
  password!: string;
  userType!: string; 
  errorMessage: string = '';

  private readonly LOGIN_API_URL = 'http://localhost/api/jsonLogin.php';

  constructor(private http: HttpClient, private router: Router) { }

  async login() {
    this.errorMessage = '';

    
    if (!this.username || !this.password || !this.userType) {
      this.errorMessage = 'Por favor, preencha todos os campos.';
      return;
    }

    try {
      const credentials = {
        email: this.username, 
        password: this.password,
        user_type: this.userType 
      };

      console.log('Enviando credenciais para o backend:', credentials);

      const response: any = await this.http.post(this.LOGIN_API_URL, credentials).toPromise();

      console.log('Resposta do backend:', response);

      if (response && response.status === 'success' && response.token) { 
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('userId', response.user_id); 
        localStorage.setItem('userType', response.user_type); 
        localStorage.setItem('userEmail', response.user_email); 

        console.log('Login bem-sucedido! Redirecionando para a página inicial...');
        
        this.router.navigateByUrl('/home');
      } else {
        // Mensagem de erro do backend se o login falhou mas a requisição foi 200 OK
        this.errorMessage = response.message || 'Credenciais inválidas. Verifique seu usuário e senha.';
      }

    } catch (error: any) {
      console.error('Erro na requisição de login:', error);
      // Lidar com erros de rede ou status HTTP diferentes de 2xx
      if (error.status === 401) {
        this.errorMessage = 'Usuário ou senha incorretos ou tipo de usuário inválido.';
      } else if (error.error && error.error.message) {
        this.errorMessage = error.error.message;
      } else {
        this.errorMessage = 'Erro ao tentar fazer login. Verifique sua conexão e tente novamente.';
      }
    }
  }
}