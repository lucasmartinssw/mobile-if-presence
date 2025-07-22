import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter } from '@angular/router';
// --- CORREÇÃO AQUI ---
// provideIonicAngular vem de '@ionic/angular/standalone'
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone'; // <-- Mude esta linha

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { environment } from './environments/environment';

import { provideHttpClient } from '@angular/common/http';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes),
    provideHttpClient()
  ],
}).catch(err => console.error(err));