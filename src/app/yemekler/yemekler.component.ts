import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreCollectionGroup, AngularFirestoreDocument, DocumentReference } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { distinctUntilChanged, take } from 'rxjs/operators';
import { isEqual } from 'lodash';

interface Category {
  id: string
  name: string
}

interface Menu {
  name: string
  price: number
}

class Menu_info {
  name: string
  category: string
  price: number
  isEdit: boolean = false

  constructor(menu: Menu, category: Category) {
    this.name = menu.name
    this.price = menu.price
    this.category = category.name
  }

}

@Component({
  selector: 'app-yemekler',
  templateUrl: './yemekler.component.html',
  styleUrls: ['./yemekler.component.css']
})
export class YemeklerComponent implements OnInit {
  menuCollection!: AngularFirestoreCollection<Menu>
  categoryCollection!: AngularFirestoreCollection<Category>
  menu: Menu_info[] = []
  categories: Category[] = []

  constructor(auth: AuthService, angularFirestore: AngularFirestore) {
    auth.getCurrentUser().then(result => {
      const restaurantCollection = angularFirestore.collection("restaurants").doc(result?.email!)
      this.categoryCollection = restaurantCollection.collection("menu")

      this.categoryCollection.valueChanges().pipe(distinctUntilChanged((prev, curr) => isEqual(prev, curr))).subscribe(categoryDocuments => {

        if(!categoryDocuments)
          return

        this.menu = []
        this.categories = []

        for(let categoryDocument of categoryDocuments){

            this.menuCollection = this.categoryCollection.doc(categoryDocument.id).collection("content")
            
            this.menuCollection.valueChanges().subscribe(menuDocuments => {
              
              for(let menuDocument of menuDocuments){
                
                if(!this.menu.find(item => item.name == menuDocument.name))
                this.menu.push(new Menu_info(menuDocument, categoryDocument))
                
              }

            })
            if(!this.categories.find(item => item.name == categoryDocument.name))
            this.categories.push(categoryDocument)
        }
        
        this.menu.sort((a, b) => a.category.localeCompare(b.category))
        this.categories.sort((a, b) => a.name.localeCompare(b.name))
        
      })

    })
  }

  ngOnInit(): void {
  }

  clearInputs(){
    (<HTMLInputElement>document.getElementById("addCategoryInput")).value = "";
    (<HTMLInputElement>document.getElementById("addMenuNameInput")).value = "";
    (<HTMLInputElement>document.getElementById("addMenuPriceInput")).value = "";
  }

  async addCategory() {
    var input_category = (<HTMLInputElement>document.getElementById("addCategoryInput")).value
    const snapshot = await this.categoryCollection.ref.where("name", "==", input_category).get();
    if (snapshot.empty) {
      if (confirm(input_category + " isimli menü Kategoriini eklemek istiyor musunuz?")) {
        var newCategory: DocumentReference<Category> = this.categoryCollection.doc().ref

        newCategory.set({
          id:newCategory.id,
          name: input_category
        })
        
      }
    }

    this.clearInputs()

  }

  async removeCategory() {
    var input_category = (<HTMLSelectElement>document.getElementById("category_remove_select")).value

    this.clearInputs()
    
    if (confirm(input_category + " adlı menü Kategoriini silmek istiyor musunuz?\nBu Kategorie sahip tüm menüler silinecektir.")) {
      const searchedCategory = await this.categoryCollection.ref.where("name", "==", input_category).get()
     
      if (searchedCategory.empty) {
        console.error("No matching documents.")
        return
      }

      searchedCategory.forEach(async categoryDocument => {

        const snapshot = await this.categoryCollection.doc(categoryDocument.id).collection("content").ref.get()

        if(snapshot.empty){
          this.categoryCollection.doc(categoryDocument.id).delete()
          console.log("Category silme işlemi başarıyla gerçekleşti!")

          return
        }

        var count = 0
        snapshot.forEach(doc => {
          doc.ref.delete()
          count++
        })

        console.warn(count + " adet menü silindi!")
 
        this.categoryCollection.doc(categoryDocument.id).delete()
        console.log("Category silme işlemi başarıyla gerçekleşti!")


      })

    } else {
      console.log("Menu silme işlemi tarafınızca reddedildi!")
    }

  }

  async addMenu() {
    var input_name = (<HTMLInputElement>document.getElementById("addMenuNameInput")).value
    var input_category_id = (<HTMLSelectElement>document.getElementById("addMenuCategorySelect")).value
    var input_price_text = (<HTMLInputElement>document.getElementById("addMenuPriceInput")).value

    const input_price = parseFloat(input_price_text);

    if (input_name == "" || input_category_id == "" || input_price_text == "") {

      alert("Lütfen tüm alanları doldurunuz!")

    }else if(isNaN(input_price)){
      alert("Sayısal değer giriniz!")
    } else if(input_price < 0){

      alert("Negatif değer giremezsiniz!")

    } else {

      this.categoryCollection.valueChanges().pipe(take(1)).subscribe(async docs => {
        var isExist :boolean = false

        for(let doc of docs){
          const snapshot = await this.categoryCollection.doc(doc.id).collection("content").ref.where("name", "==", input_name).get()

          if (!snapshot.empty) {
            isExist = true
            alert(input_name + " isimli menü hali hazırda var!")
            return
          }
        }

        if(!isExist){

        var category_name = (await this.categoryCollection.doc(input_category_id).ref.get()).data()?.name

        if (confirm(input_name + " isimli menü şu şekilde eklenecek:\n\tKategori: " + category_name + "\n\tFiyat: " + input_price + " TL")) {

          this.categoryCollection.doc(input_category_id).collection("content").add({
            name: input_name,
            price: input_price
          })

        }

      }

      })

      
    }
    
    this.clearInputs()
  }

  async editMenu(menu_item: Menu_info) {
    var input_category = (<HTMLSelectElement>document.getElementById(menu_item.name + "_category")).value
    var input_price_text = (<HTMLInputElement>document.getElementById(menu_item.name+ "_price")).value

    const input_price = parseFloat(input_price_text)

    if (input_price_text == "") {
      alert("Lütfen tüm alanları doldurunuz")
    } else if (input_category == menu_item.category && input_price == menu_item.price) {
      console.warn("Nothing changed")
      return
    } else if (input_category != menu_item.category){

      const category_id = this.categories.find(item => item.name == menu_item.category)?.id

      const snapshot = await this.categoryCollection.doc(category_id).collection("content").ref.where("name", "==", menu_item.name).get()

      snapshot.forEach(result => {
        result.ref.delete()
      })

      const new_category_id = this.categories.find(item => item.name == input_category)?.id

      this.categoryCollection.doc(new_category_id).collection("content").doc().set({
        name: menu_item.name,
        price: input_price
      })

      this.updateMenuValues()

    }else {
      const category_id = this.categories.find(item => item.name = input_category)?.id

      const snapshot = await this.categoryCollection.doc(category_id).collection("content").ref.where("name", "==", menu_item.name).get()

      snapshot.forEach(result => {
        result.ref.update({
          price: input_price
        })
      })
      
      this.updateMenuValues()
    }
   
  }

  async removeMenu(selectedMenu: Menu_info) {
    if (confirm(selectedMenu.name + " adlı menüyü silmek istiyor musunuz?")) {

      const category_id = this.categories.find(item => item.name == selectedMenu.category)?.id

      const searchedMenu = await this.categoryCollection.doc(category_id).collection("content").ref.where("name", "==", selectedMenu.name).get()
      if (searchedMenu.empty) {
        console.error("No matching menu.")
        return
      }
      searchedMenu.forEach(doc => {
        doc.ref.delete();
        console.log("Menu silme işlemi başarıyla gerçekleşti!")
      })

      this.updateMenuValues()
    } else {
      console.log("Menu silme işlemi tarafınızca reddedildi!")
    }
  }

  private updateMenuValues(){
    this.menu = []

      for(let category of this.categories){

          this.menuCollection = this.categoryCollection.doc(category.id).collection("content")
          
          this.menuCollection.valueChanges().subscribe(menuDocuments => {
            
            for(let menuDocument of menuDocuments){
              
              if(!this.menu.find(item => item.name == menuDocument.name))
              this.menu.push(new Menu_info(menuDocument, category))
              
            }

          })
          
      }
      
      this.menu.sort((a, b) => a.category.localeCompare(b.category))

  }

}
