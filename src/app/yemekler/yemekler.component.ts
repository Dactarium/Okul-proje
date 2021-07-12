import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreCollectionGroup, AngularFirestoreDocument } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

interface menuType{
  name: string
}

interface menu_item{
  name: string
  type: string
  price: number
}

@Component({
  selector: 'app-yemekler',
  templateUrl: './yemekler.component.html',
  styleUrls: ['./yemekler.component.css']
})
export class YemeklerComponent implements OnInit {
  menuCollection!: AngularFirestoreCollection<menu_item>
  menuTypeCollection!: AngularFirestoreCollection<menuType>
  menu: menu_item[] = []
  menu_types: menuType[] = []
  
  constructor(auth: AuthService, angularFirestore: AngularFirestore) { 
    auth.getCurrentUser().then(result => {
      const userCollection = angularFirestore.collection("users").doc(result?.email?.toLowerCase())
      this.menuCollection = userCollection.collection("menu")
      this.menuTypeCollection = userCollection.collection("menu_type")

      this.menuCollection.valueChanges().subscribe(datas => {
        this.menu = []
        for(let data of datas){
            this.menu.push(data)
        }
        this.menu.sort((a, b) => a.type.localeCompare(b.type))
      })

      this.menuTypeCollection.valueChanges().subscribe(datas => {
        this.menu_types = []
        for(let data of datas){
          this.menu_types.push(data)
      }
      this.menu_types.sort((a, b) => a.name.localeCompare(b.name))
      })
    
    })
  }

  ngOnInit(): void {
  }

  async addRemoveType(input_type: string, operation: boolean){
    if(operation){
      const snapshot = await this.menuTypeCollection.ref.where("name","==",input_type).get();
      if(snapshot.empty){
        if(confirm(input_type + " isimli menü tipini eklemek istiyor musunuz?")){
          this.menuTypeCollection.add({
            name: input_type
          })
        }
      }
    }else{
      if(confirm(input_type + " adlı menü tipini silmek istiyor musunuz?")){
        const searchedCustomer = await this.menuTypeCollection.ref.where("name", "==" , input_type).get()
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

  async addUpdateMenu(input_name: string, input_type: any, input_price_text:string){
    console.log(input_type)
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
