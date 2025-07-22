import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // Importar CommonModule para diretivas como ngIf
import { IonicModule } from '@ionic/angular'; // Já está usando standalone components
import { Geolocation, PermissionStatus } from '@capacitor/geolocation'; // Importe PermissionStatus

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    // Importe os componentes Ionic que serão usados no templates
    IonicModule,
    CommonModule // Necessário para diretivas como *ngIf
  ],
})
export class HomePage {
  // Propriedades para exibir no template e gerenciar o estado
  currentLatitude: number | null = null;
  currentLongitude: number | null = null;
  distanceToSchool: number | null = null;
  isInSchoolArea: boolean | null = null;
  alertMessage: string = '';
  showAlert: boolean = false;

  // Dados da geofence da escola (HARDCODED POR ENQUANTO PARA TESTE - DEPOIS VIRÁ DO BACKEND)
  // Use as coordenadas do IF Sudeste MG - Campus Avançado Cataguases
  private readonly SCHOOL_GEOFENCE = {
    latitude: -21.383269,
    longitude: -42.701335,
    radius: 150 // Raio em metros
  };

  constructor() {
    // Pode-se pedir a permissão aqui ou no primeiro clique do botão
    // this.requestLocationPermission();
  }

  // --- Funções de Permissão de Geolocalização ---

  async requestLocationPermission(): Promise<boolean> {
    try {
      let status: PermissionStatus = await Geolocation.checkPermissions();
      console.log('Permissão de localização atual:', status.location);

      if (status.location !== 'granted') {
        const requestStatus: PermissionStatus = await Geolocation.requestPermissions();
        console.log('Status da requisição de permissão:', requestStatus.location);
        status = requestStatus;
      }

      if (status.location === 'granted') {
        this.setAlert('Permissão de localização concedida.', 'success');
        return true;
      } else {
        this.setAlert('Permissão de localização negada. O aplicativo não poderá funcionar corretamente.', 'danger');
        return false;
      }
    } catch (error) {
      console.error('Erro ao verificar/solicitar permissão de localização:', error);
      this.setAlert('Erro ao gerenciar permissões de localização.', 'danger');
      return false;
    }
  }

  // --- Funções para Obter Localização e Validar ---

  async getCurrentLocationAndValidate(): Promise<void> {
    console.log('Iniciando processo de validação de localização...');
    this.setAlert('Obtendo sua localização...', 'info');

    // Limpa os dados anteriores para um novo teste
    this.currentLatitude = null;
    this.currentLongitude = null;
    this.distanceToSchool = null;
    this.isInSchoolArea = null;

    const permissionGranted = await this.requestLocationPermission();
    if (!permissionGranted) {
      console.log('Permissão não concedida. Abortando.');
      return;
    }

    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      });

      this.currentLatitude = position.coords.latitude;
      this.currentLongitude = position.coords.longitude;
      console.log(`Localização obtida: Lat ${this.currentLatitude}, Lon ${this.currentLongitude}`);

      this.distanceToSchool = this.calculateDistance(
        this.currentLatitude,
        this.currentLongitude,
        this.SCHOOL_GEOFENCE.latitude,
        this.SCHOOL_GEOFENCE.radius
      );

      console.log(`Distância à escola: ${this.distanceToSchool.toFixed(2)} metros.`);

      if (this.distanceToSchool <= this.SCHOOL_GEOFENCE.radius) {
        this.isInSchoolArea = true;
        this.setAlert('Você está DENTRO da área da escola! ✅', 'success');
        console.log('Aluno está DENTRO da área da escola.');
        // AQUI: Próximo passo seria chamar a função de reconhecimento facial
        // this.startFaceRecognition();
      } else {
        this.isInSchoolArea = false;
        this.setAlert(`Você está FORA da área da escola. Distância: ${this.distanceToSchool.toFixed(2)}m. ❌`, 'danger');
        console.log('Aluno está FORA da área da escola.');
      }

    } catch (error: any) {
      console.error('Erro ao obter localização ou durante validação:', error);
      let errorMessage = 'Erro ao obter sua localização. Verifique o GPS e as permissões.';
      if (error.code === 1) {
        errorMessage = 'Permissão de localização negada pelo usuário.';
      } else if (error.code === 2) {
        errorMessage = 'Localização indisponível. Verifique a conexão ou o GPS.';
      } else if (error.code === 3) {
        errorMessage = 'Tempo esgotado para obter a localização. Tente novamente.';
      }
      this.setAlert(errorMessage, 'danger');
      this.currentLatitude = null;
      this.currentLongitude = null;
      this.distanceToSchool = null;
      this.isInSchoolArea = null;
    }
  }

  // --- Funções Auxiliares para Cálculo de Distância (Algoritmo Haversine) ---

  private toRadians(degrees: number): number {
    return degrees * Math.PI / 180;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Raio médio da Terra em metros
    const phi1 = this.toRadians(lat1);
    const phi2 = this.toRadians(lat2);
    const deltaPhi = this.toRadians(lat2 - lat1);
    const deltaLambda = this.toRadians(lon2 - lon1);

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c; // Distância em metros
    return distance;
  }

  // --- Funções para Alertas (Feedback Visual) ---

  setAlert(message: string, type: 'success' | 'danger' | 'info') {
    this.alertMessage = message;
    this.showAlert = true;
    // Opcional: esconder o alerta automaticamente após alguns segundos
    // setTimeout(() => { this.showAlert = false; }, 5000);
  }

  dismissAlert() {
    this.showAlert = false;
    this.alertMessage = '';
  }
}