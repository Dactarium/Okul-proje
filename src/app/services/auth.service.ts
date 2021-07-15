import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreCollectionGroup, AngularFirestoreDocument } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';


@Injectable({
    providedIn: 'root'
})
export class AuthService {
    userLoggedIn: boolean;

    constructor(private router: Router, private angularFireAuth: AngularFireAuth, private angularFirestore: AngularFirestore) {
        this.userLoggedIn = false;

        this.angularFireAuth.onAuthStateChanged((user) => {
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
                localStorage.setItem('user', JSON.stringify(result.user))
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
        try {
            const result = await this.angularFireAuth.createUserWithEmailAndPassword(email, password)
            let emailLower = email.toLowerCase();
            var user_code: string = await this.generateUserCode(email)
            await this.angularFirestore.collection("users").doc(emailLower).set({
                accountType: 'manager',
                uid: result.user?.uid,
                user_code,
                email,
                emailLower
            })
            localStorage.setItem('user', JSON.stringify(result.user))
            return { isValid: true} 
        } catch (error) {
            console.log('Auth Service: signup error', error);
            return { isValid: false, message: error.message };
        }

    }

    logoutUser(): Promise<void> {
        return this.angularFireAuth.signOut()
            .then(() => {
                this.router.navigate(['']);
                localStorage.removeItem('user')
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
        return this.angularFireAuth.currentUser;
    }

    async generateUserCode(email: string): Promise<string> {
        console.log("Generating user code...")
        var user_code: string = ""
        user_code += email.substring(0, email.lastIndexOf("@"))
        if (user_code.length < 3)
            user_code = (user_code + "aa").substring(0, 3)
        else
            user_code = user_code.substring(0, 3)
        user_code += this.getDayOfYear().toString(20)

        const result = await this.checkUserCodeExists(user_code)
        user_code = result
        console.log("Generated user code: ", user_code)

        return user_code
    }

    getDayOfYear(): number {
        var currentDate = new Date()
        var firstDayOfYear = new Date(new Date().getFullYear(), 0, 0)
        var days = Math.floor((currentDate.getTime() - firstDayOfYear.getTime()) / 1000 / 60 / 60 / 24)
        return days
    }

    async checkUserCodeExists(user_code: string, count: number = -1): Promise<string> {
        var checkUserCode: string = user_code
        console.log(user_code, " ", count)
        if (count != -1)
            checkUserCode = user_code + count
        const userCheck = await this.angularFirestore.collection("users").ref.where("user_code", "==", checkUserCode).get()
        if (userCheck.empty) {
            return checkUserCode
        }
        return this.checkUserCodeExists(user_code, count + 1)
    }

}

