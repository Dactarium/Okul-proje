import { CursorError } from '@angular/compiler/src/ml_parser/lexer';
import { Component, OnInit } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreCollectionGroup, DocumentReference } from '@angular/fire/firestore';
import { ActivatedRoute, Params } from '@angular/router';
import { AuthService } from '../services/auth.service';

interface Order {
  name: string
  price: number
  amount: number
}

class Order_info {
  name: string
  amount: number
  total: number

  constructor(name: string, amount: number, total: number){
    this.name = name
    this.amount = amount
    this.total = total
  }
}

@Component({
  selector: 'app-musteri-siparisler',
  templateUrl: './musteri-siparisler.component.html',
  styleUrls: ['./musteri-siparisler.component.css']
})
export class MusteriSiparislerComponent implements OnInit {
  billCollection!: AngularFirestoreCollection<Order>
  ordersCollection!: AngularFirestoreCollection<Order>
  customer_id!: string
  total: number = 0
  bill: Order_info[] = []
  orders: Order_info[] = []

  constructor(private router: ActivatedRoute, auth: AuthService, angularFirestore: AngularFirestore) {
    this.router.params.subscribe((params: Params) => { this.customer_id = params['id'] });
    auth.getCurrentUser().then(result => {

      this.ordersCollection = angularFirestore.collection("restaurants").doc(result?.email!).collection("customers").doc(this.customer_id).collection("orders")
      this.billCollection = angularFirestore.collection("restaurants").doc(result?.email!).collection("customers").doc(this.customer_id).collection("bill")

      this.ordersCollection.valueChanges().subscribe( orderDocuments => {
       let tmp_orders: Order_info[] = []

       for(let orderDocument of orderDocuments){
        let total: number = orderDocument.amount * orderDocument.price
        tmp_orders.push(new Order_info(orderDocument.name, orderDocument.amount, total))
       }

       this.orders = tmp_orders
      })
      

      /*
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
      })*/
    })

  }

  ngOnInit(): void {


  }

  async menuServed(){
    /*const current_order_ref = this.current_orderCollection.doc(id).ref
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
    }*/
  }

  removeOrder(){
    /*if(confirm("Siparişi iptal etmek istediğinize emin misiniz?"))
      this.current_orderCollection.doc(id).delete()*/
  }

}
