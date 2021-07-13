import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { environment } from '../environments/environment';
import { MusterilerComponent } from './musteriler/musteriler.component';
import { SiparislerComponent } from './siparisler/siparisler.component';
import { YemeklerComponent } from './yemekler/yemekler.component';
import { AuthService } from './services/auth.service';
import { MusteriSiparislerComponent } from './musteri-siparisler/musteri-siparisler.component';

@NgModule({
  declarations: [
    AppComponent,
    MusterilerComponent,
    SiparislerComponent,
    YemeklerComponent,
    MusteriSiparislerComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirestoreModule
  ],
  providers: [AuthService],
  bootstrap: [AppComponent]
})
export class AppModule { }
