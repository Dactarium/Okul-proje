import { isNull } from '@angular/compiler/src/output/output_ast';
import { Component, OnInit } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument, AngularFirestoreModule, CollectionReference, DocumentReference, QuerySnapshot } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { distinctUntilChanged, pairwise, take } from 'rxjs/operators';
import { isEqual } from 'lodash';

interface Restaurant{
  restaurant_name: string
}

interface Customer {
  id: string
  name: string
  order_code: string
  status: string
  note: string
  isAllowed: boolean
  wantsBill: boolean
}

class Order_info {
  id: string
  name: string
  order_code: string
  status: string
  note: string
  total: number = 0
  hasCurrentOrder: boolean = false
  wantsBill: boolean
  isNoteEdit: boolean = false

  constructor(id: string, name: string, order_code: string, status: string, note: string, wantsBill: boolean) {
    this.id = id
    this.name = name
    this.order_code = order_code
    this.status = status
    this.note = note
    this.wantsBill = wantsBill
  }

  setTotal(total: number){
    this.total = total
    return this.total
  }
}

const status_states: string[] = ["Hesabı istiyor", "Hesabı istyor, Güncel siparişleri var", "Güncel siparişleri var", "Aktif"]
@Component({
  selector: 'app-siparisler',
  templateUrl: './siparisler.component.html',
  styleUrls: ['./siparisler.component.css']
})
export class SiparislerComponent implements OnInit {
  restaurant_name: string = ""
  orders: Order_info[] = []
  customersCollection!: AngularFirestoreCollection<Customer>
  restaurantCustomersCollection!: AngularFirestoreCollection<Customer>

  constructor(public router: Router, auth: AuthService, angularFirestore: AngularFirestore) {
    auth.getCurrentUser().then(async result => {
      this.customersCollection = angularFirestore.collection("customers")
      const restaurantDocumant: AngularFirestoreDocument<Restaurant> = angularFirestore.collection("restaurants").doc(result?.email!)
      this.restaurantCustomersCollection = restaurantDocumant.collection("customers")

      restaurantDocumant.valueChanges().pipe(take(1)).subscribe(data => {
        this.restaurant_name = data?.restaurant_name!
      })

      this.restaurantCustomersCollection.valueChanges().pipe(distinctUntilChanged((prev, curr) => isEqual(prev, curr))).subscribe(customerDocuments => {

        if(!customerDocuments)
          return;

        var tmp_orders: Order_info[] = []
        

        for(let customerDocument of customerDocuments){
          if(customerDocument.isAllowed){
            let customer_id = customerDocument.id
            let customer_name = customerDocument.name
            let customer_order_code = customerDocument.order_code
            let customer_status = customerDocument.status
            let customer_wantsBill = customerDocument.wantsBill
            let hasCurrentOrder = false
            let note = customerDocument.note
            let total = 0
            
            tmp_orders.push(new Order_info(customer_id, customer_name, customer_order_code, customer_status, note, customer_wantsBill))

            this.restaurantCustomersCollection.doc(customer_id).collection("orders").valueChanges().subscribe(customerOrderDocuments => {
              
              if(customerOrderDocuments.length > 0){
                hasCurrentOrder = true
                let newStatus: string = status_states[2]

                if(customer_wantsBill)
                  newStatus = status_states[1]
                
                this.restaurantCustomersCollection.doc(customer_id).update({status: newStatus})
              }else{

                let newStatus: string = status_states[3]

                if(customer_wantsBill)
                  newStatus = status_states[0]

                this.restaurantCustomersCollection.doc(customer_id).update({status: newStatus})
              }

            })

            this.restaurantCustomersCollection.doc(customer_id).collection("bill").valueChanges().pipe(distinctUntilChanged((prev, curr) => isEqual(prev, curr))).subscribe(customerBillDocuments => {
              
              total = 0

              for(let customerBillDocument of customerBillDocuments){
                const _amount = customerBillDocument.amount
                const _price = customerBillDocument.price
                total += _amount * _price
              }

              this.orders.find(item => {
                if(item.id == customer_id){
                  item.setTotal(total)
                }
              })

            })

          }
        }
        tmp_orders.sort((a, b) => {
            const aState = this.getStatusState(a.status)
            const bState = this.getStatusState(b.status)
            return aState < bState ? -1 : aState > bState ? 1 : 0
        })
        this.orders = tmp_orders
      })

    })
  }

  ngOnInit(): void {

  }


  async editNote(id: string, ) {
   await this.restaurantCustomersCollection.doc(id).update({
      note: (<HTMLInputElement>document.getElementById(id)).value
    })
  }

  async endCustomerOrder(id: string, total: number){
    if(confirm("Müşterinin işlemini bitirmek istediğinize emin misiniz?")){

      const snapshot = await this.customersCollection.ref.where("uid", "==", id).get()

      if(snapshot.empty){
        console.error("No such customer")
        return
      }

      snapshot.forEach(customer => {

        customer.ref.collection("history").doc().set({
          restaurant_name: this.restaurant_name,
          total,
          date: new Date()
        })

      })

      const orderSnapshot = await this.restaurantCustomersCollection.doc(id).collection("orders").ref.get()

      if(!orderSnapshot.empty){

        orderSnapshot.forEach(doc => {
          doc.ref.delete()
        })

      }

      const billSnapshot = await this.restaurantCustomersCollection.doc(id).collection("bill").ref.get()

      if(!billSnapshot.empty){

        billSnapshot.forEach(doc => {
          doc.ref.delete()
        })
        
      }
        
      this.restaurantCustomersCollection.doc(id).delete()
    }

    
  }

  getStatusState(status: string){
    let i = 0
    for(let checkState of status_states)
      if(status == checkState) return i
      else i++
    
      return -1
  }

  routeTo(path: string, id: string) {
    this.router.navigate([path, id])
  }



}
