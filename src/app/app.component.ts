
import { OnInit } from '@angular/core';
import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, DocumentReference } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';

interface user {
  access_code: string
}


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {
  title = 'Bi\'Sipariş'
  access_code = ""
  isSignedIn = false
  hasAccount = true
  firebaseErrorMsg = "-"

  constructor(public router: Router, private authService: AuthService, public angularFireAuth: AngularFireAuth, public angularFirestore: AngularFirestore) {
  }

  ngOnInit() {
    if (localStorage.getItem('restaurant') !== null) {
      console.warn("oninit")
      this.signedIn(false)
    }
    else
      this.isSignedIn = false
      this.hasAccount = true
  }

  signUp(){
    this.hasAccount = false
  }

  signIn(){
    this.hasAccount = true
  }

  async onSignIn(email: string, password: string) {
    this.authService.loginUser(email, password).then(result => {
      if (result == null) {
        console.warn("onsignin")
        this.signedIn(true)
      } else if (result.isValid == false) {
        this.firebaseErrorMsg = result?.message
      }
    })
  }

  async onSignUp(restaurant_name: string, email: string, password: string) {
    const result = await this.authService.signupUser(restaurant_name, email, password)
    if (result.isValid) {
      console.warn("onsignup")
      this.signedIn(true)
    } else{
      this.firebaseErrorMsg = result?.message
    }
  }

  logout() {
    this.angularFireAuth.signOut()
    localStorage.removeItem('restaurant')
    this.router.navigate([''])
    this.isSignedIn = false;
  }

  async signedIn(reloadPage: boolean) {
    this.isSignedIn = true
    const user = JSON.parse(localStorage.getItem('restaurant')!)
    const user_ref: DocumentReference<user> = (<DocumentReference<user>>this.angularFirestore.collection("restaurants").doc(user["email"].toLowerCase()).ref)
    const user_data = await user_ref.get()
    if (!user_data.exists)
      console.log("No user document!")
    else {
      this.access_code = user_data.data()?.access_code.toUpperCase()!
    }
    this.router.navigate(['musteriler'])
    if (reloadPage)
      window.location.reload()
  }

}


