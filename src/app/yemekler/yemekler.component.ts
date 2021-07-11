import { Component, OnInit } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

class menu_item{
  name: string
  type: string
  price: number

  constructor(name: string, type: string, price: number){
    this.name = name
    this.type = type
    this.price = price
  }
}

@Component({
  selector: 'app-yemekler',
  templateUrl: './yemekler.component.html',
  styleUrls: ['./yemekler.component.css']
})
export class YemeklerComponent implements OnInit {
  menuCollection!: AngularFirestoreCollection<menu_item>
  menu_data!: Observable<menu_item[]>
  menu: menu_item[] = []

  constructor(auth: AuthService, angularFirestore: AngularFirestore) { 
    auth.getCurrentUser().then(result => {
     this.menuCollection = angularFirestore.collection("users").doc(result?.email?.toLowerCase()).collection("menu")
     this.menu_data = this.menuCollection.valueChanges()
     this.menu_data.subscribe(datas => {
       this.menu = []
       for(let data of datas){
          this.menu.push(new menu_item(data.name, data.type, data.price))
       }
       this.menu.sort((a, b) => a.type.localeCompare(b.type))
     })
    })
  }

  ngOnInit(): void {
  }

  async addUpdateMenu(input_name: string, input_type:string, input_price_text:string){
    if(input_name == "" || input_type == "" || input_price_text == ""){
      alert("Lütfen tüm alanları doldurunuz")
    }else{
      var input_price = parseFloat(input_price_text)
      const snapshot = await this.menuCollection.ref.where("name","==",input_name).get();
      if(snapshot.empty){
        if(confirm(input_name + " isimli menü şu şekilde eklenecek:\n\tTip: "+input_type+"\n\tFiyat: "+input_price+" TL")){
          this.menuCollection.add({
            name: input_name,
            type: input_type,
            price: input_price
          })
        }
      }else{
        snapshot.forEach(doc => {
          if(confirm(input_name + " isimli menü şu şekilde güncellenecek:\n\tTip: "+input_type+"\n\tFiyat: "+input_price+" TL")){
            doc.ref.set({
              name: input_name,
              type: input_type,
              price: input_price
            })
          }
          
        })
      }
    }
  }

  async removeMenu(selectedMenu_item: menu_item){
    if(confirm(selectedMenu_item.name + " adlı menüyü silmek istiyor musunuz?")){
      const searchedCustomer = await this.menuCollection.ref.where("name", "==" , selectedMenu_item.name).get()
      if(searchedCustomer.empty){
        console.error("No matching documents.")
        return
      }
      searchedCustomer.forEach( doc => {
        doc.ref.delete();
        console.log("Menu silme işlemi başarıyla gerçekleşti!")
      })
    }else{
      console.log("Menu silme işlemi tarafınızca reddedildi!")
    }
  }

}
