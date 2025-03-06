import { Component,HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Idestination } from './destination.model';
import Swal from 'sweetalert2';
import { IFlightRequest } from './flightRequest.model';
import { from } from 'rxjs';


@Component({
  selector: 'app-search-engine',
  templateUrl: './search-engine.component.html',
  styleUrls: ['./search-engine.component.css']
})
export class SearchEngineComponent {
  searchQuery: string = '';
  //searchResults: any[] = [];
  isAIMode:boolean = false;
  startDate:string = this.getDateWithDays(1);
  untilDate:string = this.getDateWithDays(5);
  amountofPass:Number = 2;
  isdropDownList:boolean = false;
  isdropDownList_dest:boolean=false;
  isclickedAlready = false;

  chosenOrigin:Idestination|undefined =this.getDefaultOrigin();
  chosenDestination:Idestination | undefined;


  chosenOriginToDisplay:string='Tel-Aviv ⭐';
  chosenDestToDisplay:string=''
  listDestinations:Idestination[] = [];

  //try somthing here..
  listDestinationsFilterd:Idestination[]=[];
  listOriginsFilterd:Idestination[]=[];

  flightRequest : IFlightRequest|any

  

  constructor() { }


  // General EVENTs
  // @HostListener('window:click', ['$event'])

  ngAfterViewInit() {
    // Attach the listener after the view has been initialized
    window.addEventListener('click', this.onWindowClick.bind(this));
  }

  ngOnDestroy() {
    // Remove the listener to prevent memory leaks
    window.removeEventListener('click', this.onWindowClick.bind(this));
  }
  onWindowClick(e:Event){
    const target = e.target as HTMLElement;
    // console.log('event:target  ',target,target.id);
    if (target.id!='originIN') {
      this.isdropDownList = false;
    }
    
    if (this.listOriginsFilterd.length>0 && target.id=='originIN') {
      
      this.isdropDownList = true;
      
    }
    if (target.id!='destinationIN') {
      this.isdropDownList_dest=false;
    }
    if (this.listDestinationsFilterd.length>0 && target.id=='destinationIN') {
      this.isdropDownList_dest=true;
    }
    if (this.listDestinationsFilterd.length==0 && target.id=='destinationIN' && !this.isclickedAlready) {
      this.isclickedAlready=true;
      this.listDestinationsFilterd = this.listDestinations.slice(0,10);
      //this.listDestinationsFilterd.length= 10;
      this.isdropDownList_dest=true;
    }
    
  }

  ngOnInit(){
    fetch('https://localhost:44340/api/Destinations?isActive=true')
      .then(response => response.json())
      .then(data => {
        this.listDestinations = data;
        console.log('im here in the res : ',this.listDestinations)
        this.chosenOrigin = this.getDefaultOrigin();
        
        
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });

      
  }




  //Passenger change event
  passengerChange(e:Event){
    
    const inputElement = e.target as HTMLInputElement;
    const amountOfPass = inputElement.valueAsNumber;
    if (amountOfPass<1) {
      this.amountofPass = 1
    }
    else if (amountOfPass>9) {
      this.amountofPass = 9
    }
    else if (amountOfPass>=1 && amountOfPass<=9) {
      this.amountofPass = amountOfPass;
    }

    //console.log(this.amountofPass,amountOfPass)
  }

  //DATES EVENTs
  ChangeReDateEvent(e:Event){
    //on return date change ! 
    const inputElement = e.target as HTMLInputElement;
    const returnDate = inputElement.valueAsDate
    const depDate = new Date(this.startDate);
    if (returnDate) {
      //console.log(returnDate<=depDate)
      if (returnDate<=depDate) {
        Swal.fire({
          title: 'הכנסת תאריכים שגויה',
          text: 'תאריך חזור לא יכול להיות לפני או זהה לתאריך ההתחלה \n יש לבחור תאריכים תקינים',
          icon: 'warning',
          confirmButtonText: 'הבנתי'
        });
        this.untilDate = new Date(depDate.setDate(depDate.getDate() + 4)).toISOString().split('T')[0];
      }
    }
  
    
    

    //console.log('in return date change \nstart:',depDate,'\n return:',returnDate);
  }
  ChangeDepDateEvent(e:Event){
    const inputElement = e.target as HTMLInputElement;
    const depDate = inputElement.valueAsDate;
    const today = new Date();
    //set the return date to 2 days after the dep date on change event 
    if (depDate) {
      if (depDate<=today) {
        this.startDate=this.getDateWithDays(1,today)
      }
      if (depDate>new Date(this.getDateWithDays(361))) {
        this.startDate = this.getDateWithDays(361);
      }
      if (depDate>today && depDate<= new Date(this.getDateWithDays(361))) {
        const returnDate = new Date(depDate);
        returnDate.setDate(depDate.getDate() + 4);
        this.untilDate = returnDate.toISOString().split('T')[0];
      }
      

    }


  }


  //INPUTS init VALUES

  getDefaultOrigin():Idestination{
    return this.get_Destination(64);
  }


  getDateWithDays(days: number, date?: Date): string {
    const baseDate = date ? new Date(date) : new Date();
    baseDate.setDate(baseDate.getDate() + days);
    return baseDate.toISOString().split('T')[0];
  }
  getMinimumReturnDate(){
    return this.getDateWithDays(1,new Date(this.startDate))
  }


  //*************************auto compeltions section*************************
  //general function with flag to reconigz which one of the drop down is onfocus
  onFocusWithFlag(flag=true){
    if (flag) {
      if (this.listOriginsFilterd.length>0) {
        this.isdropDownList = true;
      }
    }
    else{
      if (this.listOriginsFilterd.length>0) {
        this.isdropDownList_dest = true;
      }
    }

    
  }
  onClickToSelectText(e:Event){
    const inputElement = e.target as HTMLInputElement;
    inputElement.select();
  }
  onGeneralInput(event: Event,flag=true): void {
    const inputElement = event.target as HTMLInputElement;
    const inputText = inputElement.value.toLowerCase().trim();
    const destList:Idestination[]=[];
    this.listDestinations.forEach(dest=>{
      if (dest.hebrewName.startsWith(inputText) || dest.name.toLowerCase().startsWith(inputText) || dest.country.toLowerCase().startsWith(inputText)) {
        destList.push(dest);
      }
      
    })
    if (destList.length==0) {
      this.listDestinations.forEach(dest=>{
        if (dest.hebrewName.includes(inputText) || dest.name.toLowerCase().includes(inputText) || dest.country.toLowerCase().includes(inputText)) {
          destList.push(dest);
        }
      })
    }
    if (destList.length>10) {
      destList.length = 10;
    }
    console.log('destList: ', destList,this.listDestinations)
    flag?this.listOriginsFilterd = destList:this.listDestinationsFilterd=destList;
    flag?this.isdropDownList = true:this.isdropDownList_dest=true;
    flag?console.log('this.listOriginsFilterd', this.listOriginsFilterd):console.log('this.listDestinationsFilterd', this.listDestinationsFilterd)
    flag?this.chosenOrigin = undefined:this.chosenDestination=undefined;
  }

  pickFromAutoCompleteList(e:Event,flag=true){
    const li = e.target as HTMLElement;
    const id =parseInt(li.id);

    const destObj = this.get_Destination(id)
    if (flag) {
      this.chosenOrigin = destObj;
      this.chosenOriginToDisplay = this.chosenOrigin?this.chosenOrigin.name:'';
      if (this.chosenOrigin && this.chosenOrigin.isPopular) {
        //console.log('im here is popular origin')
        this.chosenOriginToDisplay+=' ⭐';
      }
      // console.log(`in pickOriginFromList: this.chosenOrigin:${JSON.stringify(this.chosenOrigin)}
      // and this.chosenOriginToDisplay:${this.chosenOriginToDisplay} `)
    }
    else {
      if (destObj.id == this.chosenOrigin?.id) {
        Swal.fire({
          title:`מוצא ויעד לא יכולים להיות זהים !`,
          text:`שגיאה במוצא ויעד, נא להחליף מוצא או יעד למיקום אחר`,
          icon:'warning',
          confirmButtonText:'הבנתי'
        })
        this.chosenDestination = undefined;
        this.chosenDestToDisplay='';
      }
      else {
        this.chosenDestination = destObj;
        this.chosenDestToDisplay = this.chosenDestination?this.chosenDestination.name:'';
        if (this.chosenDestination && this.chosenDestination.isPopular) {
          //console.log('im here is popular origin')
          this.chosenDestToDisplay+=' ⭐';
        }
        // console.log(`in pickOriginFromList: this.chosenDestination:${JSON.stringify(this.chosenDestination)}
        // and this.chosenDestToDisplay:${this.chosenDestToDisplay} `)
      }

    }

  }





  //helpful function get destination by id or city name 
  get_Destination(id?:number,city?:string):Idestination|any{
    if (this.listDestinations) {
      if (id) {
        return this.listDestinations.find(dest=>dest.id===id);
      }
      else if(city) {
        return this.listDestinations.find(dest=>dest.name===city);
      }
      else{
        throw new Error(`Destination not found ! with these params: id: ${id} || city:${city}`);
      }
    }
  }


  demiAI(searchQuery: string): string {
    // here we simulate the ai response and just send url postfix;
    const from = 64;
    const to = 24;
    const departureDate = new Date().toISOString().split('T')[0];
    const arrivalDate = new Date(new Date().setDate(new Date().getDate() + 3)).toISOString().split('T')[0];
    const passengers =2;
    
    return `/flights/result?from=${from}&to=${to}&departureDate=${departureDate}&arrivalDate=${arrivalDate}&passengers=${passengers}`;
  }


  sendBtnClicked(){
    if (!this.isAIMode) {
      console.log('send button clicked ! \n',
        '\norigin : ',this.chosenOrigin,
        '\ndestination : ', this.chosenDestination,
        '\nstart date : ', this.startDate,
        '\nreturn date : ', this.untilDate,
        '\namount of passengers : ', this.amountofPass,
        '\nsearch mode (is ai mode ?) : ',this.isAIMode,
      )
      if (this.chosenDestination == undefined || this.chosenOrigin==undefined) {
        Swal.fire({
          title:'השדות יעד או מוצא ריקים',
          text:'נא לבחור מוצא וגם יעד',
          icon:'warning',
          confirmButtonText: 'הבנתי'
        })
        return;
      }

      if (this.startDate==''||this.untilDate=='') {
        Swal.fire({
          title:'שדות התאריכים ריקים',
          text:'נא למלא תאריך התחלה וגם תאריך חזור',
          icon:'warning',
          confirmButtonText: 'הבנתי'
        })
        return;
      }

      this.flightRequest = {
        from:this.chosenOrigin.id,
        to:this.chosenDestination.id,
        departureDate: new Date(this.startDate),
        arrivalDate: new Date(this.untilDate),
        passengers:this.amountofPass

      } as IFlightRequest;
      const postfix = `/flights/result?from=${this.flightRequest.from}
      &to=${this.flightRequest.to}
      &departureDate=${this.flightRequest.departureDate.toISOString().split('T')[0]}
      &arrivalDate=${this.flightRequest.arrivalDate.toISOString().split('T')[0]}
      &passengers=${this.flightRequest.passengers}`;
      location.assign(location.origin+postfix.replace(/\s+/g,''));

      
    }
    else{
      console.log(
        '\nsearch mode (is ai mode ?) : ',this.isAIMode,
        'search query : ', this.searchQuery
      )
      if (this.searchQuery=='') {
        Swal.fire({
          title:'שדה החיפוש חופשי ריק',
          text:'נא לכתוב מה תרצו לחפש בשדה החיפוש החופשי',
          icon:'warning',
          confirmButtonText: 'הבנתי'
        })
      }
      else {
        const postfix = this.demiAI(this.searchQuery);
        location.assign(location.origin+postfix.replace(/\s+/g,''));
      }
    }

  }
}
