import { isNull } from '@angular/compiler/src/output/output_ast';
import { Component, OnInit } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument, AngularFirestoreModule, CollectionReference, DocumentReference, QuerySnapshot } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { distinctUntilChanged, pairwise, take } from 'rxjs/operators';
import { isEqual } from 'lodash';

interface order{
  id: string
  name: string
  price: number
  amount: number
}


interface customer {
  id: string;
  name: string;
  order_code: string;
  status: string;
  note: string;
  isAllowed: boolean;

  orders: AngularFirestoreCollection<order>;
  bill: AngularFirestoreCollection<order>;
}

class order_info {
  id: string
  name: string
  order_code: string
  status: string
  note: string
  total: number
  hasCurrentOrder: boolean
  isNoteEdit: boolean = false

  constructor(id: string, name: string, order_code: string, status: string, note: string, total: number, hasCurrentOrder: boolean) {
    this.id = id
    this.name = name
    this.order_code = order_code
    this.status = status
    this.note = note
    this.total = total
    this.hasCurrentOrder = hasCurrentOrder
  }

  setTotal(total: number){
    this.total = total
    return this.total
  }
}

@Component({
  selector: 'app-siparisler',
  templateUrl: './siparisler.component.html',
  styleUrls: ['./siparisler.component.css']
})
export class SiparislerComponent implements OnInit {
  orders: order_info[] = []
  customerCollection!: AngularFirestoreCollection<customer>

  constructor(public router: Router, auth: AuthService, angularFirestore: AngularFirestore) {
    auth.getCurrentUser().then(async result => {
      this.customerCollection = angularFirestore.collection("restaurants").doc(result?.email!).collection("customers")

      this.customerCollection.valueChanges().pipe(distinctUntilChanged((prev, curr) => isEqual(prev, curr))).subscribe(customerDocuments => {

        if(!customerDocuments)
          return;

        var tmp_orders: order_info[] = []
        

        for(let customerDocument of customerDocuments){
          if(customerDocument.isAllowed){
            let customer_id = customerDocument.id
            let customer_name = customerDocument.name
            let customer_order_code = customerDocument.order_code
            let customer_status = customerDocument.status
            let hasCurrentOrder = false
            let note = customerDocument.note
            let total = 0
            
            tmp_orders.push(new order_info(customer_id, customer_name, customer_order_code, customer_status, note, total, hasCurrentOrder))

            this.customerCollection.doc(customerDocument.id).collection("orders").valueChanges().subscribe(customerOrderDocuments => {
              
              if(customerOrderDocuments.length > 0){
                hasCurrentOrder = true
                this.customerCollection.doc(customerDocument.id).update({status: "Yeni Siparişi var!"})
                return
              }else{
                this.customerCollection.doc(customerDocument.id).update({status: "Aktif"})
              }

            })

            this.customerCollection.doc(customer_id).collection("bill").valueChanges().pipe(distinctUntilChanged((prev, curr) => isEqual(prev, curr))).subscribe(customerBillDocuments => {
              
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
        this.orders = tmp_orders
      })

    })
  }

  ngOnInit(): void {

  }

  async editNote(id: string) {
   await this.customerCollection.doc(id).update({
      note: (<HTMLInputElement>document.getElementById(id)).value
    })
  }

  endCustomerOrder(id: string){
    if(confirm("Müşterinin işlemini bitirmek istediğinize emin misiniz?"))

    // delete all below documents
      
      this.customerCollection.doc(id).delete()
  }

  routeTo(path: string, id: string) {
    this.router.navigate([path, id])
  }



}
