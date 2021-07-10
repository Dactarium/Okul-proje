
import { OnInit } from '@angular/core';
import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit{
  title = 'Bi\'Sipariş'
  isSignedIn = false
  firebaseErrorMsg  = "-"

  constructor(public router: Router, private authService: AuthService, public angularFireAuth: AngularFireAuth){
  }

  ngOnInit(){
    if(localStorage.getItem('user') !== null){
      this.isSignedIn = true
      this.router.navigate(['musteriler'])
    }
    else
    this.isSignedIn = false
  }

  async onSignIn(email: string, password: string){
    this.authService.loginUser(email, password).then(result => {
      if(result == null){
        this.isSignedIn = true
        this.router.navigate(['musteriler'])
        window.location.reload()
      }else if(result.isValid == false){
        this.firebaseErrorMsg = result?.message
      }
    })
  }

  async onSignUp(email: string, password: string){
    this.authService.signupUser(email, password).then(result => {
      if(result == null){
        this.isSignedIn = true
        this.router.navigate(['musteriler'])
        window.location.reload()
      }else if(result.isValid == false){
        this.firebaseErrorMsg = result?.message
      }
    })
  }

  logout(){
    this.angularFireAuth.signOut()
    localStorage.removeItem('user')
    this.router.navigate([''])
    this.isSignedIn = false;
  }

}


