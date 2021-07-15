
import { OnInit } from '@angular/core';
import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, DocumentReference } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';

interface user {
  user_code: string
}


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {
  title = 'Bi\'Sipariş'
  user_code = ""
  isSignedIn = false
  firebaseErrorMsg = "-"

  constructor(public router: Router, private authService: AuthService, public angularFireAuth: AngularFireAuth, public angularFirestore: AngularFirestore) {
  }

  ngOnInit() {
    if (localStorage.getItem('user') !== null) {
      console.warn("oninit")
      this.signedIn(false)
    }
    else
      this.isSignedIn = false
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

  async onSignUp(email: string, password: string) {
    const result = await this.authService.signupUser(email, password)
    if (result.isValid) {
      console.warn("onsignup")
      this.signedIn(true)
    } else{
      this.firebaseErrorMsg = result?.message
    }
  }

  logout() {
    this.angularFireAuth.signOut()
    localStorage.removeItem('user')
    this.router.navigate([''])
    this.isSignedIn = false;
  }

  async signedIn(reloadPage: boolean) {
    this.isSignedIn = true
    const user = JSON.parse(localStorage.getItem('user')!)
    const user_ref: DocumentReference<user> = (<DocumentReference<user>>this.angularFirestore.collection("users").doc(user["email"].toLowerCase()).ref)
    const user_data = await user_ref.get()
    if (!user_data.exists)
      console.log("No user document!")
    else {
      this.user_code = user_data.data()?.user_code!
    }
    this.router.navigate(['musteriler'])
    if (reloadPage)
      window.location.reload()
  }

}


