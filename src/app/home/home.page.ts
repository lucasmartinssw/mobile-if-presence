import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
// Importe os componentes Ionic que serão usados no template HTML.
// Se você está usando IonicModule no imports do @Component, ele já provê a maioria.
// Mas para clareza e se for usar standalone de fato, é bom listar os componentes específicos.
// No seu caso, 'IonicModule' no imports já cobre IonHeader, IonToolbar, etc.
import { IonicModule } from '@ionic/angular';
import { Geolocation, PermissionStatus } from '@capacitor/geolocation';
import { HttpClient } from '@angular/common/http'; // Importe HttpClient

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    IonicModule, // Mantido como você forneceu, ele inclui os componentes Ionic
    CommonModule // Necessário para diretivas como *ngIf
  ],
})
export class HomePage {
  currentLatitude: number | null = null;
  currentLongitude: number | null = null;
  distanceToSchool: number | null = null;
  isInSchoolArea: boolean | null = null;
  alertMessage: string = '';
  showAlert: boolean = false;

  private readonly SCHOOL_GEOFENCE = {
    latitude: -21.383269,
    longitude: -42.701335,
    radius: 150
  };

  private readonly ATTENDANCE_API_URL = 'http://localhost/api/jsonRecordPresence.php';

  // O HttpClient é injetado no construtor.
  constructor(private http: HttpClient) {}

  // --- NOVO MÉTODO: Registrar Presença Manualmente para Teste ---
  // Este método estava fora do escopo da classe no código fornecido.
  // Ele foi movido para DENTRO da classe HomePage.
  async registerAttendanceDirectly(): Promise<void> {
    console.log('Tentando registrar presença manualmente para teste...');
    this.setAlert('Registrando presença...', 'info');

    try {
      // Usaremos um ID de aluno fixo para teste, pois o login real ainda não está integrado
      // Em um cenário real, você obteria isso do localStorage após o login
      const testStudentId = 2; // SUBSTITUA COM UM ID DE ALUNO VÁLIDO NO SEU BANCO DE DADOS
      const currentTimestamp = new Date().toISOString(); // Pega a data e hora atual

      // Coordenadas fixas para teste (pode ser as da escola ou qualquer uma)
      // Em um cenário real, estas viriam do GPS do aluno
      const testLatitude = -21.383269; // Coordenadas da escola para simular que está lá
      const testLongitude = -42.701335;

      const attendanceData = {
        student_id: testStudentId,
        timestamp: currentTimestamp,
        latitude: testLatitude,
        longitude: testLongitude,
        is_present: true // Assumindo presença
      };

      console.log('Dados de presença para enviar:', attendanceData);

      // Envia os dados para o endpoint do backend
      // .toPromise() é usado para converter o Observable do HttpClient em uma Promise
      // para uso com async/await.
      await this.http.post(this.ATTENDANCE_API_URL, attendanceData).toPromise();

      this.setAlert('Presença registrada com sucesso no banco! 🎉', 'success');
      console.log('Presença registrada no backend PHP.');

    } catch (error: any) {
      console.error('Erro ao registrar presença no backend:', error);
      let errorMessage = 'Erro ao registrar presença. Verifique o servidor e a URL.';
      if (error.status === 0) {
        errorMessage = 'Erro de conexão com o servidor. Verifique a URL do backend e sua rede.';
      } else if (error.error && error.error.message) {
        errorMessage = `Erro do servidor: ${error.error.message}`;
      }
      this.setAlert(errorMessage, 'danger');
    }
  }

  
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
      this.setAlert('Por favor, ative a localização de seu dispositivo.', 'danger');
      return false;
    }
  }

  
  async getCurrentLocationAndValidate(): Promise<void> {
    console.log('Iniciando processo de validação de localização...');
    this.setAlert('Obtendo sua localização...', 'info');

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

      // CORREÇÃO ANTERIOR MANTIDA: Passar this.SCHOOL_GEOFENCE.longitude como último parâmetro
      this.distanceToSchool = this.calculateDistance(
        this.currentLatitude,
        this.currentLongitude,
        this.SCHOOL_GEOFENCE.latitude,
        this.SCHOOL_GEOFENCE.longitude // <-- CORRETO: longitude da escola
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

  
  private toRadians(degrees: number): number {
    return degrees * Math.PI / 180;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const phi1 = this.toRadians(lat1);
    const phi2 = this.toRadians(lat2);
    const deltaPhi = this.toRadians(lat2 - lat1);
    const deltaLambda = this.toRadians(lon2 - lon1);

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c;
    return distance;
  }

  
  setAlert(message: string, type: 'success' | 'danger' | 'info') {
    this.alertMessage = message;
    this.showAlert = true;
  }

  dismissAlert() {
    this.showAlert = false;
    this.alertMessage = '';
  }
}