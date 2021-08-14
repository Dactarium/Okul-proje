import { stringify } from '@angular/compiler/src/util';
import { Component, OnInit } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreCollectionGroup, AngularFirestoreDocument } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

interface customer {
  id: string
  name: string
  order_code: string
  status: string
  isAllowed: boolean
  wantsBill: boolean
}

@Component({
  selector: 'app-musteriler',
  templateUrl: './musteriler.component.html',
  styleUrls: ['./musteriler.component.css']
})
export class MusterilerComponent implements OnInit {
  customerCollection!: AngularFirestoreCollection<customer>
  customers_data!: Observable<customer[]>

  customers: customer[] = []

  constructor(auth: AuthService, angularFirestore: AngularFirestore) {
    auth.getCurrentUser().then(result => {
      this.customerCollection = angularFirestore.collection("restaurants").doc(result?.email!).collection("customers")
      this.customers_data = this.customerCollection.valueChanges()
      this.customers_data.subscribe(datas => {
        this.customers = []
        for (let data of datas) {
          if(!data.isAllowed)
            this.customers.push(data)
        }
      })
    })
  }

  ngOnInit(): void {
  }

  async customerAllow(selectedCustomer: customer) {
    if (confirm(selectedCustomer.name + " adlı müşteriyi onaylıyor musunuz?")) {
      const searchedCustomer = await this.customerCollection.ref.where("id", "==", selectedCustomer.id).get()
      if (searchedCustomer.empty) {
        console.log("No matching documents.")
        return
      }
      searchedCustomer.forEach(doc => {
        doc.ref.update({
          status: "Aktif",
          isAllowed: true
        })
        console.log("Müşteri onay işlemi başarıyla gerçekleşti!")
      })
    } else {
      console.log("Müşteri onay işlemi tarafınızca reddedildi!")
    }


  }

  async customerDeny(selectedCustomer: customer) {
    if (confirm(selectedCustomer.name + " adlı müşteriyi reddediyor musunuz?")) {
      const searchedCustomer = await this.customerCollection.ref.where("id", "==", selectedCustomer.id).get()
      if (searchedCustomer.empty) {
        console.error("No matching documents.")
        return
      }
      searchedCustomer.forEach(doc => {
        doc.ref.delete();
        console.log("Müşteri red işlemi başarıyla gerçekleşti!")
      })
    } else {
      console.log("Müşteri red işlemi tarafınızca reddedildi!")
    }

  }


}
