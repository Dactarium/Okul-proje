import { stringify } from '@angular/compiler/src/util';
import { Component, OnInit } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreCollectionGroup, AngularFirestoreDocument } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';



class customer{
  id: string;
  name: string;
  order_code: string;
  status: string;
  isAllowed: boolean;

  constructor(id:string, name: string,order_code: string, status: string, isAllowed: boolean){
    this.id = id;
    this.name = name;
    this.order_code = order_code;
    this.status = status;
    this.isAllowed = isAllowed;
  }

}

@Component({
  selector: 'app-musteriler',
  templateUrl: './musteriler.component.html',
  styleUrls: ['./musteriler.component.css']
})
export class MusterilerComponent implements OnInit {
  customerCollection!: AngularFirestoreCollection<customer>;
  customers_data!: Observable<customer[]>;

  customers: customer[] = [];

  constructor(auth: AuthService, angularFirestore: AngularFirestore) { 
    auth.getCurrentUser().then(result => {
     this.customerCollection = angularFirestore.collection("users").doc(result?.email?.toLowerCase()).collection("customers")
     this.customers_data = this.customerCollection.valueChanges()
     this.customers_data.subscribe(datas => {
       this.customers = []
       for(let data of datas){
          this.customers.push(new customer(data.id, data.name, data.order_code, "Bekliyor", false))
       }
     })
    })
  }

  ngOnInit(): void {
  }

  customerAllow(selectedCustomer: customer){
    selectedCustomer.isAllowed = true;
    selectedCustomer.status = "Sipariş vermeye hazır";
  }

  customerDeny(selectedCustomer: customer){
    const index = this.customers.indexOf(selectedCustomer);
    if(index > -1)
      this.customers.splice(index, 1)
    
  }

  customerEnd(selectedCustomer: customer){
    const index = this.customers.indexOf(selectedCustomer);
    if(index > -1)
      this.customers.splice(index, 1)
  }

}
