import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreCollectionGroup, AngularFirestoreDocument } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

interface menuType {
  name: string
}

interface menu_item {
  name: string
  type: string
  price: number
}

class menu_item_info {
  name: string
  type: string
  price: number
  isEdit: boolean = false

  constructor(menu_item: menu_item) {
    this.name = menu_item.name
    this.type = menu_item.type
    this.price = menu_item.price
  }

}

@Component({
  selector: 'app-yemekler',
  templateUrl: './yemekler.component.html',
  styleUrls: ['./yemekler.component.css']
})
export class YemeklerComponent implements OnInit {
  menuCollection!: AngularFirestoreCollection<menu_item>
  menuTypeCollection!: AngularFirestoreCollection<menuType>
  menu: menu_item_info[] = []
  menu_types: menuType[] = []

  constructor(auth: AuthService, angularFirestore: AngularFirestore) {
    auth.getCurrentUser().then(result => {
      const userCollection = angularFirestore.collection("users").doc(result?.email?.toLowerCase())
      this.menuCollection = userCollection.collection("menu")
      this.menuTypeCollection = userCollection.collection("menu_type")

      this.menuCollection.valueChanges().subscribe(datas => {
        this.menu = []
        for (let data of datas) {
          this.menu.push(new menu_item_info(data))
        }
        this.menu.sort((a, b) => a.type.localeCompare(b.type))
      })

      this.menuTypeCollection.valueChanges().subscribe(datas => {
        this.menu_types = []
        for (let data of datas) {
          this.menu_types.push(data)
        }
        this.menu_types.sort((a, b) => a.name.localeCompare(b.name))
      })

    })
  }

  ngOnInit(): void {
  }

  clearInputs(){
    (<HTMLInputElement>document.getElementById("addTypeInput")).value = "";
    (<HTMLInputElement>document.getElementById("addMenuNameInput")).value = "";
    (<HTMLInputElement>document.getElementById("addMenuPriceInput")).value = "";
  }

  async addType() {
    var input_type = (<HTMLInputElement>document.getElementById("addTypeInput")).value
    const snapshot = await this.menuTypeCollection.ref.where("name", "==", input_type).get();
    if (snapshot.empty) {
      if (confirm(input_type + " isimli menü tipini eklemek istiyor musunuz?")) {
        this.menuTypeCollection.add({
          name: input_type
        })
      }
    }

    this.clearInputs()

  }

  async removeType() {
    var id = "type_remove_select"
    var input_type = (<HTMLSelectElement>document.getElementById(id)).value

    this.clearInputs()
    
    if (confirm(input_type + " adlı menü tipini silmek istiyor musunuz?\nBu tipe sahip tüm menüler silinecektir.")) {
      const searchedMenuType = await this.menuTypeCollection.ref.where("name", "==", input_type).get()
      if (searchedMenuType.empty) {
        console.error("No matching documents.")
        return
      }
      searchedMenuType.forEach(doc => {
        doc.ref.delete();
        console.log("Menu silme işlemi başarıyla gerçekleşti!")
      })
      const snapshot = await this.menuCollection.ref.where("type","==",input_type).get()
      if(snapshot.empty){
        return
      }
      var count = 0
      snapshot.forEach(doc => {
        doc.ref.delete()
        count++
      })
      console.warn(count+" adet menü silindi!")
    } else {
      console.log("Menu silme işlemi tarafınızca reddedildi!")
    }

  }

  async addMenu() {
    var input_name = (<HTMLInputElement>document.getElementById("addMenuNameInput")).value
    var input_type = (<HTMLSelectElement>document.getElementById("addMenuSelect")).value
    var input_price_text = (<HTMLInputElement>document.getElementById("addMenuPriceInput")).value
    const input_price = parseFloat(input_price_text);
    if (input_name == "" || input_type == "" || input_price_text == "") {
      alert("Lütfen tüm alanları doldurunuz")
    } else {
      const snapshot = await this.menuCollection.ref.where("name", "==", input_name).get()
      if (snapshot.empty) {
        if (confirm(input_name + " isimli menü şu şekilde eklenecek:\n\tTip: " + input_type + "\n\tFiyat: " + input_price + " TL")) {
          this.menuCollection.add({
            name: input_name,
            type: input_type,
            price: input_price
          })
        }
      } else {
        alert(input_name + " isimli menü hali hazırda var!")
      }
    }
    
    this.clearInputs()
  }

  async editMenu(menu_item: menu_item) {
    var id = menu_item.name
    var input_type = (<HTMLSelectElement>document.getElementById(id + "_type")).value
    var input_price_text = (<HTMLInputElement>document.getElementById(id + "_price")).value

    console.log((<HTMLSelectElement>document.getElementById(id + "_type")))

    const input_price = parseFloat(input_price_text)

    if (input_type == "" || input_price_text == "") {
      alert("Lütfen tüm alanları doldurunuz")
    } else if (input_type == menu_item.type && input_price == menu_item.price) {
      return
    } else {
      const snapshot = await this.menuCollection.ref.where("name", "==", menu_item.name).get();
      if (snapshot.empty) {
        console.error("No matching menu.")
        return
      } else {
        if (confirm(menu_item.name + " isimli menü şu şekilde güncellenecek:\n\tTip: " + input_type + "\n\tFiyat: " + input_price + " TL")) {
          snapshot.forEach(doc => {
            doc.ref.update({
              type: input_type,
              price: input_price
            })
          })
        }
      }
    }

   
  }

  async removeMenu(selectedMenu_item: menu_item) {
    if (confirm(selectedMenu_item.name + " adlı menüyü silmek istiyor musunuz?")) {
      const searchedMenu = await this.menuCollection.ref.where("name", "==", selectedMenu_item.name).get()
      if (searchedMenu.empty) {
        console.error("No matching menu.")
        return
      }
      searchedMenu.forEach(doc => {
        doc.ref.delete();
        console.log("Menu silme işlemi başarıyla gerçekleşti!")
      })
    } else {
      console.log("Menu silme işlemi tarafınızca reddedildi!")
    }
  }

}
