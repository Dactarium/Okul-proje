import { CursorError } from '@angular/compiler/src/ml_parser/lexer';
import { Component, OnInit } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreCollectionGroup, DocumentReference } from '@angular/fire/firestore';
import { ActivatedRoute, Params } from '@angular/router';
import { AuthService } from '../services/auth.service';

interface menu {
  name: string
  type: string
  price: number
}

interface current_order {
  id: string
  menu_ref: DocumentReference<menu>
  amount: number
}

interface order {
  menu_ref: DocumentReference<menu>
  amount: number
}

interface order_info {
  id:  string
  name: string
  amount: number
  total_price: number
}

@Component({
  selector: 'app-musteri-siparisler',
  templateUrl: './musteri-siparisler.component.html',
  styleUrls: ['./musteri-siparisler.component.css']
})
export class MusteriSiparislerComponent implements OnInit {
  ordersCollection!: AngularFirestoreCollection
  current_orderCollection!: AngularFirestoreCollection<current_order>
  orderCollection!: AngularFirestoreCollection<order>
  customer_id!: string
  total: number = 0
  current_orders: order_info[] = []
  orders: order_info[] = []

  constructor(private router: ActivatedRoute, auth: AuthService, angularFirestore: AngularFirestore) {
    this.router.params.subscribe((params: Params) => { this.customer_id = params['id'] });
    auth.getCurrentUser().then(result => {
      this.ordersCollection = angularFirestore.collection("users").doc(result?.email?.toLowerCase()).collection("orders")

      this.current_orderCollection = this.ordersCollection.doc(this.customer_id).collection("current_order")
      this.current_orderCollection.valueChanges().subscribe(async current_order_array => {
        var tmp_current_orders: order_info[] = []
        for (let current_order of current_order_array) {
          const menu_ref = await current_order.menu_ref.get()
          if (!menu_ref.exists) {
            console.log('No menu ref')
          } else {
            const order_info: order_info = {id: current_order.id, name: menu_ref.data()?.name!, amount: current_order.amount, total_price: 0}
            tmp_current_orders.push(order_info)
          }
        }
        this.current_orders = tmp_current_orders
      })

      this.orderCollection = this.ordersCollection.doc(this.customer_id).collection("order")
      this.orderCollection.valueChanges().subscribe(async order_array => {
        var tmp_orders: order_info[] = []
        var tmp_total: number = 0
        for (let order of order_array) {
          const menu_ref = await order.menu_ref.get()
          if (!menu_ref.exists) {
            console.log('No menu ref')
          } else {
            const subtotal = order.amount * menu_ref.data()?.price!
            const order_info: order_info = {id: "", name: menu_ref.data()?.name!, amount: order.amount, total_price: subtotal}
            tmp_orders.push(order_info)
            tmp_total += subtotal
          }
        }
        this.orders = tmp_orders
        this.total = tmp_total
      })
    })

  }

  ngOnInit(): void {


  }

  async menuServed(id: string){
    const current_order_ref = this.current_orderCollection.doc(id).ref
    const newOrder = await current_order_ref.get()
    if(!newOrder.exists)
      console.log('No Current Order Document')
    else{
      const orderSnapshot = await this.orderCollection.ref.where("menu_ref", "==", newOrder.data()?.menu_ref!).get()
      if(orderSnapshot.empty)
        this.orderCollection.add({menu_ref: newOrder.data()?.menu_ref!, amount: newOrder.data()?.amount!})
      else{
        orderSnapshot.forEach(doc => this.orderCollection.doc(doc.id).update({amount: (doc.data().amount + newOrder.data()?.amount!)}))
      }
      this.current_orderCollection.doc(id).delete()
    }
  }

  removeCurrentOrder(id: string){
    if(confirm("Siparişi iptal etmek istediğinize emin misiniz?"))
      this.current_orderCollection.doc(id).delete()
  }

}
