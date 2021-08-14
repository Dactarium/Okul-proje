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
                localStorage.setItem('restaurant', JSON.stringify(result.user))
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

    async signupUser(restaurant_name: string, mail: string, password: string) {
        try {
            const result = await this.angularFireAuth.createUserWithEmailAndPassword(mail, password)
            var access_code: string = await this.generateAccessCode(mail)
            access_code = access_code.toUpperCase()
            await this.angularFirestore.collection("restaurants").doc(mail).set({
                access_code,
                mail,
                restaurant_name
            })
            localStorage.setItem('restaurant', JSON.stringify(result.user))
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
                localStorage.removeItem('restaurant')
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
        this.angularFirestore.collection('restaurants')
            .add(payload).then(function (res) {
                console.log("Auth Service: setUserInfo response...")
                console.log(res);
            })
    }

    getCurrentUser() {
        return this.angularFireAuth.currentUser;
    }

    async generateAccessCode(email: string): Promise<string> {
        console.log("Generating access code...")
        var access_code: string = ""
        access_code += email.substring(0, email.lastIndexOf("@"))
        if (access_code.length < 3)
            access_code = (access_code + "aa").substring(0, 3)
        else
            access_code = access_code.substring(0, 3)
        access_code += this.getDayOfYear().toString(20)

        const result = await this.checkAccessCodeExists(access_code)
        access_code = result
        console.log("Generated access code: ", access_code)

        return access_code
    }

    getDayOfYear(): number {
        var currentDate = new Date()
        var firstDayOfYear = new Date(new Date().getFullYear(), 0, 0)
        var days = Math.floor((currentDate.getTime() - firstDayOfYear.getTime()) / 1000 / 60 / 60 / 24)
        return days
    }

    async checkAccessCodeExists(access_code: string, count: number = -1): Promise<string> {
        var checkAccessCode: string = access_code
        console.log(access_code, " ", count)
        if (count != -1)
            checkAccessCode = access_code + count
        const userCheck = await this.angularFirestore.collection("restaurants").ref.where("access_code", "==", checkAccessCode).get()
        if (userCheck.empty) {
            return checkAccessCode
        }
        return this.checkAccessCodeExists(access_code, count + 1)
    }

}

