import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Geolocation, PermissionStatus } from '@capacitor/geolocation';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { lastValueFrom } from 'rxjs'; // Importação moderna para converter Observable em Promise

// Em um projeto real, mova esta URL para os arquivos de ambiente
const API_URL = 'http://localhost/api/jsonRecordPresence.php';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule
  ],
})
export class HomePage {
  // --- Propriedades de Estado ---
  currentLatitude: number | null = null;
  currentLongitude: number | null = null;
  distanceToSchool: number | null = null;
  isInSchoolArea: boolean | null = null;
  isLoading: boolean = false;
  alert: { message: string; type: 'success' | 'danger' | 'info'; show: boolean } = {
    message: '',
    type: 'info',
    show: false,
  };

  // ==================================================================
  // CORREÇÃO PARA COMPATIBILIDADE COM O TEMPLATE
  // ==================================================================
  /**
   * Getter que expõe a visibilidade do alerta para o template HTML.
   * O seu HTML usa `showAlert`, então este getter faz a ponte.
   */
  public get showAlert(): boolean {
    return this.alert.show;
  }

  /**
   * Getter que expõe a mensagem do alerta para o template HTML.
   * O seu HTML usa `alertMessage`, então este getter faz a ponte.
   */
  public get alertMessage(): string {
    return this.alert.message;
  }
  // ==================================================================

  private readonly SCHOOL_GEOFENCE = {
    latitude: 21.383269,
    longitude: -42.701335,
    radius: 150,
  };

  constructor(private http: HttpClient) {}

  /**
   * Método de teste para registrar presença.
   * AGORA COM O PAYLOAD CORRIGIDO.
   */
  async registerAttendanceDirectly(): Promise<void> {
    console.log('Tentando registrar presença com o payload corrigido...');
    this.setLoading(true);

    try {
      // Em um app real, o ID do aluno viria de um serviço de autenticação
      const testStudentId = 6; // Use um ID de aluno válido
      
      // 1. Obtenha um ID de chamada válido e ativo no seu banco de dados
      const testRollCallId = 1; // SUBSTITUA PELO SEU ID DE CHAMADA ATIVO

      const attendanceData = {
        // 2. CORRIGIDO: O nome do campo agora é 'id_student'
        id_student: testStudentId,
        
        // 3. ADICIONADO: O campo 'id_roll_call' que estava em falta
        id_roll_call: testRollCallId,
        
        timestamp: new Date().toISOString(),
        latitude: this.SCHOOL_GEOFENCE.latitude,
        longitude: this.SCHOOL_GEOFENCE.longitude,
        is_present: true,
      };

      console.log('Enviando dados de presença (corrigidos):', attendanceData);

      // Usando a abordagem moderna com lastValueFrom
      const response = await lastValueFrom(
        this.http.post(API_URL, attendanceData)
      );

      console.log('Resposta do backend:', response);
      this.setAlert('Presença registrada com sucesso pelo Ionic! 🎉', 'success');

    } catch (error) {
      console.error('Erro ao registrar presença no backend:', error);
      this.handleApiError(error);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Inicia o fluxo de validação de geolocalização.
   */
  async getCurrentLocationAndValidate(): Promise<void> {
    console.log('Iniciando processo de validação de localização...');
    this.setLoading(true);
    this.resetState();

    const hasPermission = await this.requestLocationPermission();
    if (!hasPermission) {
      this.setLoading(false);
      return;
    }

    try {
      this.setAlert('Obtendo sua localização...', 'info');
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
      });

      this.currentLatitude = position.coords.latitude;
      this.currentLongitude = position.coords.longitude;

      this.distanceToSchool = this.calculateDistance(
        this.currentLatitude,
        this.currentLongitude,
        this.SCHOOL_GEOFENCE.latitude,
        this.SCHOOL_GEOFENCE.longitude
      );

      if (this.distanceToSchool <= this.SCHOOL_GEOFENCE.radius) {
        this.isInSchoolArea = true;
        this.setAlert('Você está DENTRO da área da escola! ✅', 'success');
        // Agora você poderia chamar o `registerAttendanceDirectly()` automaticamente
        // this.registerAttendanceDirectly();
      } else {
        this.isInSchoolArea = false;
        this.setAlert(`Você está FORA da área da escola. Distância: ${this.distanceToSchool.toFixed(2)}m. ❌`, 'danger');
      }
    } catch (error: any) {
      this.handleLocationError(error);
    } finally {
      this.setLoading(false);
    }
  }

  // --- Métodos Auxiliares ---

  private async requestLocationPermission(): Promise<boolean> {
    try {
      let status: PermissionStatus = await Geolocation.checkPermissions();
      if (status.location !== 'granted') {
        status = await Geolocation.requestPermissions();
      }
      return status.location === 'granted';
    } catch (error) {
      console.error('Erro no sistema de permissões:', error);
      this.setAlert('Por favor, ative a localização nas configurações do seu dispositivo.', 'danger');
      return false;
    }
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const toRad = (deg: number) => deg * Math.PI / 180;
    const phi1 = toRad(lat1);
    const phi2 = toRad(lat2);
    const deltaPhi = toRad(lat2 - lat1);
    const deltaLambda = toRad(lon2 - lon1);
    const a = Math.sin(deltaPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // --- Métodos de UI ---

  private handleApiError(error: unknown) {
    let message = 'Erro desconhecido ao comunicar com o servidor.';
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        message = 'Não foi possível conectar ao servidor. Verifique sua rede e a URL da API.';
      } else {
        const serverError = error.error?.message || 'O servidor não retornou uma mensagem específica.';
        message = `Erro do servidor: ${serverError}`;
      }
    }
    this.setAlert(message, 'danger');
  }

  private handleLocationError(error: any) {
    let message = 'Erro ao obter sua localização.';
    if (error.code) {
      switch (error.code) {
        case 1: message = 'Permissão de localização negada.'; break;
        case 2: message = 'Localização indisponível (sem sinal de GPS).'; break;
        case 3: message = 'Tempo esgotado para obter a localização.'; break;
      }
    }
    this.setAlert(message, 'danger');
    this.resetState();
  }

  private setAlert(message: string, type: 'success' | 'danger' | 'info') {
    this.alert = { message, type, show: true };
  }

  private setLoading(isLoading: boolean) {
    this.isLoading = isLoading;
    if (isLoading) this.dismissAlert();
  }

  private resetState() {
    this.currentLatitude = null;
    this.currentLongitude = null;
    this.distanceToSchool = null;
    this.isInSchoolArea = null;
  }
  
  dismissAlert() {
    this.alert.show = false;
  }
}
