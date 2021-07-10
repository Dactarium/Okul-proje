import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  userLoggedIn: boolean;      // other components can check on this variable for the login status of the user

  constructor(private router: Router, private angularFireAuth: AngularFireAuth, private angularFirestore: AngularFirestore) {
      this.userLoggedIn = false;

      this.angularFireAuth.onAuthStateChanged((user) => {              // set up a subscription to always know the login status of the user
          if (user) {
              this.userLoggedIn = true;
          } else {
              this.userLoggedIn = false;
          }
      });
  }

  
  loginUser(email: string, password: string): Promise<any> {
    return this.angularFireAuth.signInWithEmailAndPassword(email, password)
        .then(result => {
            console.log('Auth Service: loginUser: success');
            localStorage.setItem('user',JSON.stringify(result.user))
        })
        .catch(error => {
            console.log('Auth Service: login error...');
            console.log('error code', error.code);
            console.log('error', error);
            if (error.code)
                return { isValid: false, message: error.message };
            else 
              return null
        });
  }

  async signupUser(email: string, password: string) {
    return this.angularFireAuth.createUserWithEmailAndPassword(email, password)
        .then( result => {
            let emailLower = email.toLowerCase();
            
            this.angularFirestore.collection("users").doc(emailLower).set({
                    accountType: 'yonetici',
                    uid: result.user?.uid,
                    email: email,
                    email_lower: emailLower
            })
            localStorage.setItem('user',JSON.stringify(result.user))
            //result.user?.sendEmailVerification()                 // immediately send the user a verification email
        })
        .catch(error => {
            console.log('Auth Service: signup error', error);
            return { isValid: false, message: error.message };
        });
  }

  logoutUser(): Promise<void> {
    return this.angularFireAuth.signOut()
        .then(() => {
            this.router.navigate(['/home']);                    // when we log the user out, navigate them to home
        })
        .catch(error => {
            console.log('Auth Service: logout error...');
            console.log('error code', error.code);
            console.log('error', error);
            return error;
        });
  }
  setUserInfo(payload: object) {
    console.log('Auth Service: saving user info...');
    this.angularFirestore.collection('users')
        .add(payload).then(function (res) {
            console.log("Auth Service: setUserInfo response...")
            console.log(res);
        })
  }

  getCurrentUser() {
    return this.angularFireAuth.currentUser;                                 // returns user object for logged-in users, otherwise returns null 
  }

}
