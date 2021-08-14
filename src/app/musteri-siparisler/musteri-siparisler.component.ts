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

      this.billCollection.valueChanges().subscribe( orderDocuments => {
        let tmp_bill: Order_info[] = []
        let total: number = 0
        for(let orderDocument of orderDocuments){
          let subtotal = orderDocument.amount * orderDocument.price
          tmp_bill.push(new Order_info(orderDocument.name, orderDocument.amount, subtotal))
          total += subtotal
         }
         this.total = total
         this.bill = tmp_bill
      })

    })

  }

  ngOnInit(): void {


  }

  async menuServed(name: string){

    const orderSnapshot = await this.ordersCollection.ref.where("name", "==", name).get()

    if(orderSnapshot.empty)
      return

    orderSnapshot.forEach(async orderDocument => {

      const billSnapshot = await this.billCollection.ref.where("name", "==", name).get()

      if(billSnapshot.empty){
        this.billCollection.doc().set({
          name: orderDocument.data().name,
          amount: orderDocument.data().amount,
          price: orderDocument.data().price
        })
      }else{
        
        billSnapshot.forEach( billDocument => {
          let newAmount = billDocument.data().amount + orderDocument.data().amount
          billDocument.ref.update({
            amount: newAmount
          })
        })
      }

      orderDocument.ref.delete()

    })
  }

  async removeOrder(name: string){
    
    const orderSnapshot = await this.ordersCollection.ref.where("name", "==", name).get()

    if(orderSnapshot.empty)
      return

    orderSnapshot.forEach(async orderDocument => {

      orderDocument.ref.delete()

    })
  }

}
