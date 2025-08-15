import { LightningElement, wire, api, track } from "lwc";
import getObjectData from "@salesforce/apex/PicklistWonderMainCtrl.getObjectData";
import getRecordTypeNames from  "@salesforce/apex/PicklistWonderMainCtrl.getRecordTypeNames";
import getPicklistOrder from  "@salesforce/apex/PicklistWonderMainCtrl.getPicklistOrder";
import getPicklistValues from  "@salesforce/apex/PicklistWonderMainCtrl.getPicklistValues";

//import SheetJS from '@salesforce/resourceUrl/SheetJS'; // The static resource for SheetJS
//import { loadScript, loadStyle } from 'lightning/platformResourceLoader';



import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { getObject } from 'lightning/uiObjectInfoApi';


export default class PicklistWonderMain extends LightningElement {
  // In a method or within a wire service
  objectOptions;
  error;
  @track selectedObject;
  @track selectedRecordType;
  @track selectedParentPicklist;
  recordTypeList;
  fieldDefinationList;
  parentPicklistList = [];
  picklistValueFieldMap = {};

  @track columns = [
  { label: "Parent Picklist", fieldName: "parentPicklist", editable: true },
  { label: "Child Picklist", fieldName: "childPicklist", editable: true },
  {
    label: "Grandchild Picklist",
    fieldName: "grandchildPicklist",
    editable: true
  }
  //{ label: "CloseAt", fieldName: "closeAt", type: "date", editable: true },
  //{ label: "Balance", fieldName: "amount", type: "currency", editable: true }
  ];

  @track data = [{
      parentPicklist: "test",
      childPicklist: "test2",
      grandchildPicklist: "test3"
    },{
      parentPicklist: "test",
      childPicklist: "test2",
      grandchildPicklist: "test3"
    },{
      parentPicklist: "test",
      childPicklist: "test2",
      grandchildPicklist: "test3"
    },{
      parentPicklist: "test",
      childPicklist: "test2",
      grandchildPicklist: "test3"
    }];
  //columns = columns;
  rowOffset = 0;
  draftValues = [];

  async connectedCallback() {
        //await loadScript(this, SheetJS); // load the library
        // At this point, the library is accessible with the `XLSX` variable
        //this.version = XLSX.version;
        //console.log('version: '+this.version);   
    }
  
/*exportToExcel() {
    // Sample table data for demonstration purposes
      
    const tableData = [
      ['John Doe', 30, 'john.doe@example.com'],
      ['Jane Smith', 28, 'jane.smith@example.com'],
      ['Michael Johnson', 35, 'michael.johnson@example.com'],
      // Add more data as needed
    ];
      console.log('exportToExcel in')
    const filename = 'ExportToExcel.xlsx';
      console.log('exportToExcel in')
    const workbook = XLSX.utils.book_new();
    const headers = [];
    const worksheetData = [];
    console.log('exportToExcel fn --',JSON.stringify(tableData))
    for (const record of tableData) {
        worksheetData.push({
            "Name": record[0],
            "Age": record[1],
            "Email":record[2]
           
        });
    }
    const worksheet = XLSX.utils.json_to_sheet(worksheetData, { header: headers });
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ExportToExcel');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

    // Create a download link and click it programmatically to initiate the download
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    // Release the object URL to free up memory
    URL.revokeObjectURL(a.href);
  }
  
   // Example: Reading an Excel file and displaying as an HTML table
  handleFileChange(event) {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = () => {
            const fileContents = reader.result;
            const workbook = window.XLSX.read(fileContents, {type: 'binary'});
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const htmlTable = XLSX.utils.sheet_to_html(sheet);

            this.tableHtml = htmlTable; // Update a property in your component
            // Or, use the tableHtml to update an HTML element in your template
        };
        reader.readAsBinaryString(file);
  }
*/

  @wire(getObjectData)
  wiredGetObjects({data,error}){
    if(data) {
			this.objectOptions=data;
			this.error = undefined;
		}else {
			this.objectOptions =undefined;
			this.error = error;
		}
  }

  get options(){
    return this.getLabelValueHelper(this.objectOptions);
  }

  getLabelValueHelper(arr){
    let tempArr =[];
      for(let tempData in arr){
        let rec = arr[tempData];
        if(!rec.objectLabel.includes('MISSING LABEL') && !rec.objectLabel.includes('Data Action Job Summary') ){
          tempArr.push({label:rec.objectLabel, value:rec.objectApiName});
        }
      }
     return tempArr.sort((a, b) => a.label.localeCompare(b.label));
  }

  handleObjectChange(event) {
    this.selectedObject = event.detail.value;
    console.log("Selected Object:", this.selectedObject);
    this.getRecordTypes(this.selectedObject);
    this.getPicklistOrder(this.selectedObject);
  }



  getRecordTypes(selectedObject){
    getRecordTypeNames({ sObjectName : selectedObject })
		.then(result => {
			this.recordTypeList = result;
			this.error = undefined;
		})
		.catch(error => {
			this.error = error;
			this.recordTypeList = undefined;
		})
  }

 get recordTypes() {
    return this.getLabelValueHelper(this.recordTypeList);
 }

 getPicklistOrder(selectedObject){
    getPicklistOrder({ sObjectName : selectedObject })
		.then(result => {
			this.fieldDefinationList = result;
			this.error = undefined;
      console.log('this.fieldDefinationList',this.fieldDefinationList)
      this.fetchParentPicklist(this.fieldDefinationList);
		})
		.catch(error => {
			this.error = error;
			this.fieldDefinationList = undefined;
		})
 }

 fetchParentPicklist(fdList){
  console.log('fdList',fdList)
  let tempList = [];
  for(let fd in fdList){
     if(fdList[fd].ControllingFieldDefinitionId == undefined){
        tempList.push({label : fdList[fd].Label, value : fdList[fd].QualifiedApiName });
     }  
  }
  this.parentPicklistList = tempList;
  //console.log(JSON.stringify(this.parentPicklistList));
 }

 get parentPicklist(){
  return this.parentPicklistList;
 }

 set parentPicklist(value){
   this.parentPicklistList = value;
 }

  handleRecordTypeChange(event){
    this.selectedRecordType = event.detail.value;
    console.log("Selected Object:", this.selectedRecordType);
  }

  handlePicklistChange(event){
    this.selectedParentPicklist = event.detail.value;
    console.log("Selected Object:", this.selectedParentPicklist);
    console.log("this.fieldDefinationList-->",JSON.stringify(this.fieldDefinationList))
    let tempColumns = [];
    let tempControllingField = ''
    for(let tempData in this.fieldDefinationList){
        let rec = this.fieldDefinationList[tempData];
        if (rec.QualifiedApiName ==  this.selectedParentPicklist || rec.ControllingFieldDefinitionId == tempControllingField ){
          tempColumns.push({ label: rec.Label, fieldName: rec.QualifiedApiName , editable: true })
          tempControllingField = rec.DurableId;
        }
    }
    this.columns = tempColumns;

    this.fetchPicklistEntries(tempColumns);

    /*columns = [
      { label: "Parent Picklist", fieldName: "parentPicklist", editable: true },
      { label: "Child Picklist", fieldName: "childPicklist", editable: true },
      {
        label: "Grandchild Picklist",
        fieldName: "grandchildPicklist",
        editable: true
      }
    ];*/
  }

   fetchPicklistEntries(cols){
    console.log('selected cols - ',JSON.stringify(cols))
    console.log(this.selectedObject)
    let tempFieldList = [];
    for(let col in cols){
      tempFieldList.push(cols[col].fieldName);
    }

   getPicklistValues({ objectName : 'Binarybespoke__c',fieldNameList :  JSON.stringify(tempFieldList)})
		.then(result => {
			this.picklistValueFieldMap = JSON.parse(result);
      console.log('getPicklistValues---',JSON.stringify(this.picklistValueFieldMap))
      this.setTableData(JSON.parse(result));
			this.error = undefined;
		})
		.catch(error => {
			this.error = error;
			this.picklistValueFieldMap = undefined;
		})
  }

  setTableData(){
    console.log('picklistEntriesMap--',JSON.stringify(this.picklistEntriesMap))
    /*{
      parentPicklist: "test",
      childPicklist: "test2",
      grandchildPicklist: "test3"
    }*/
  const keysIterator = this.picklistEntriesMap.keys();
  let tempDataObj = [];
  for (const key of keysIterator) {
     console.log(key); // Output: a, b, c
     console.log(this.picklistEntriesMap.get(key)); // Output: 1, 2, 3
     for(let picklistValue in this.picklistEntriesMap.get(key)){
         tempDataObj.push({
            Parent__c:"Parent__c",
            Child__c:"Parent__c",
            Grandchild__c:"ssdssd"
         })
     }
     this.data =tempDataObj;
   }
  }


}