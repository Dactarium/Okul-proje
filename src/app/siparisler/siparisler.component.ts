import { isNull } from '@angular/compiler/src/output/output_ast';
import { Component, OnInit } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument, AngularFirestoreModule, CollectionReference, DocumentReference, QuerySnapshot } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { distinctUntilChanged, first } from 'rxjs/operators';
import { isEqual } from 'lodash';

interface menu {
  name: string
  type: string
  price: number
}

interface customer_order {
  menu_ref: DocumentReference<menu>
  amount: number
}

interface customer {
  name: string;
  order_code: string;
  status: string;
  isAllowed: boolean;
}

interface order {
  id: string
  customer: DocumentReference<customer>
  note: string
}

class order_info {
  id: string
  customer_name: string
  customer_status: string
  note: string
  total: number
  hasCurrentOrder: boolean
  isNoteEdit: boolean = false

  constructor(id: string, customer_name: string, customer_status: string, note: string, total: number, hasCurrentOrder: boolean) {
    this.id = id
    this.customer_name = customer_name
    this.customer_status = customer_status
    this.note = note
    this.total = total
    this.hasCurrentOrder = hasCurrentOrder
  }
}

@Component({
  selector: 'app-siparisler',
  templateUrl: './siparisler.component.html',
  styleUrls: ['./siparisler.component.css']
})
export class SiparislerComponent implements OnInit {
  ordersCollection!: AngularFirestoreCollection<order>
  orders: order_info[] = []

  constructor(public router: Router, auth: AuthService, angularFirestore: AngularFirestore) {
    auth.getCurrentUser().then(async result => {
      const userCollection = angularFirestore.collection("users").doc(result?.email?.toLowerCase())
      this.ordersCollection = userCollection.collection("orders")

      this.ordersCollection.valueChanges().pipe(distinctUntilChanged((prev, curr) => isEqual(prev, curr))).subscribe(async docs => {
        if (!docs)
          return;
        console.log(this.orders, docs)
        var tmp_orders: order_info[] = []
        for (let doc of docs) {
          var customer_name: string = ""
          var customer_status: string = ""
          var hasCurrentOrder: boolean = false
          var note = doc.note
          var total: number = 0

          const customer_data = await doc.customer.get()
          if (!customer_data.exists) {
            console.log('No customer data');
          } else {
            customer_name = customer_data.data()?.name!
            customer_status = customer_data.data()?.status!
          }

          const customerOrderColletion: AngularFirestoreCollection<customer_order> = this.ordersCollection.doc(doc.id).collection("order")
          customerOrderColletion.valueChanges().subscribe(async customer_order_datas => {
            total = 0
            for (let customer_order_data of customer_order_datas) {
              const menu_ref = await customer_order_data.menu_ref.get()
              if (!menu_ref.exists) {
                console.log('No menu ref');
              } else {
                var subtotal: number = (menu_ref.data()?.price! * customer_order_data.amount)
                total = total + subtotal
              }
            }
            const order_total = this.orders.find(item => item.id == doc.id)
            if (order_total) order_total.total = total
          })

          const customerCurrentOrderColletion: AngularFirestoreCollection<customer_order> = this.ordersCollection.doc(doc.id).collection("current_order")
          customerCurrentOrderColletion.valueChanges().subscribe(customer_current_order_datas => {
            if (customer_current_order_datas)
              hasCurrentOrder = true
          })

          tmp_orders.push(new order_info(doc.id, customer_name, customer_status, note, total, true))
        }
        this.orders = tmp_orders
      })

    })
  }

  ngOnInit(): void {

  }

  async editNote(id: string) {
    await this.ordersCollection.doc(id).update({
      note: (<HTMLInputElement>document.getElementById(id)).value
    })
  }

  routeTo(path: string) {
    this.router.navigate([path])
  }




}
