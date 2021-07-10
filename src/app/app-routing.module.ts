import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { MusterilerComponent } from './musteriler/musteriler.component';
import { AuthGuard } from './services/auth.guard';
import { SiparislerComponent } from './siparisler/siparisler.component';
import { YemeklerComponent } from './yemekler/yemekler.component';


const routes: Routes = [
  {path:"",
  component:AppComponent
  },
  {path:"musteriler",
  component:MusterilerComponent,
  canActivate:[AuthGuard]
  },
  {path:"siparisler",
  component:SiparislerComponent,
  canActivate:[AuthGuard]
  },
  {path:"yemekler",
  component:YemeklerComponent,
  canActivate:[AuthGuard]
  }
  
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
