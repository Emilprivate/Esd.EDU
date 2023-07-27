//DISCLAIMER: This program has been developed for educational purposes at an introductory level. Certain simplifications has been made
//to keep it comphrehensible. 

//We use EC6 modules!
import fs from 'fs';  //enable use of file system
import * as readline from 'node:readline/promises'  //enable read stdio in console
import { stdin as input, stdout as output } from 'process'

/* ***************************************************
 * Application code for the BMI tracker application 
 * CONSOLE VERSION
 * More, but still relatively simple, JS style programming!
***************************************************** */

const outputFileName="bmiStatus.html";

//constants for validating user input 
const maxHeight=300;
const minHeight=1;
const maxWeight=300;
const minWeight=1;
const minNameLength=1;
const maxNameLength=30;



//is userName OK?
function validateUserName(userName){
  let name=sanitize(userName);  //remove potentially dangerous/undesired characters
  let nameLen=name.length;
  if((nameLen>=minNameLength) && (nameLen<=maxNameLength)) 
     return name;
 //else undefined
}

//function that validates the constraints of the uer input of BMIData object
//bmiData must contain valid name,height,weight attributes
function validateBMIFormData(bmiData){ 
  let userName;
  let height;
  let weight;
  //ensure that object has name,weight,height properties
  //neither must be undefined, and of the right type and ranges
  if(bmiData.userName &&  bmiData.height && bmiData.weight){
    userName=String(bmiData.userName);
    userName=validateUserName(userName);
    height=parseInt(bmiData.height);
    weight=parseInt(bmiData.weight);

    if((minHeight <= height) && (height <= maxHeight) &&
       (minWeight <= weight) && (weight <=maxWeight)) {
        let validBMIData={userName: userName, height: height, weight: weight};
        return validBMIData;
       }
    } 
}

function round2Decimals(floatNumber){
  return Math.round(floatNumber*100)/100;
}


//Constructor Function to create BMI-objects
function BMIEntry(name,height,weight){
    //console.log(`NEW ${name}, ${height}, ${weight}, `);
    this.userName=name;
    this.weight=weight;
    this.height=height;
    this.calcBMI=function(){
        let bmi= this.weight/((this.height/100)*(this.height/100));
        bmi=round2Decimals(bmi);
        return bmi;
    };
  
     this.calcBMIChange=function (otherBMIEntry){
       return round2Decimals(this.calcBMI() - otherBMIEntry.calcBMI());   
     };
  }

  
/* "Database" emulated by maintained an in-memory array of BMIEntry objects 
   Higher index means newer data record: you can insert by simply 
  'push'ing new data records */

function BMIDB() {
  this.bmiData=[]; //
  this.bmiData.push(new BMIEntry("Mickey",180, 90));
  
 //looks up name in bmiDB and returns any found bmiEntry (undefined otherwise)
  this.lookup= function(userName){ // 
       return this.bmiData.find(entry=>entry.userName===userName);
  };
  this.calcDelta= function (name){
      let userEntries=this.selectUserEntries(name);
      if(userEntries.length<=1) return 0; //if there is 0 or only as single record, the delta is 0
      let last=userEntries.length-1;
      const newBMIRecord=userEntries[last];
      const previousBMIRecord=userEntries[last-1];
      return newBMIRecord.calcBMIChange(previousBMIRecord);   
  };
   //Process the request that adds a new BMI reading to the DB
   //It is to return the change in BMI back to the user as a bmiStatus
   //object containing the new BMI and delta to the previously store reading (0 if none)
  this.recordBMI=function(bmiRecord){
    const newBMIEntry= new BMIEntry(bmiRecord.userName,bmiRecord.height, bmiRecord.weight)
    this.bmiData.push(newBMIEntry);
    return newBMIEntry;
  };

  this.selectUserEntries=function(userName){
    return this.bmiData.filter(e=>e.userName===userName);
  };
}

const theBMIDB=new BMIDB();

//The main Input and Outout functions
const rl = readline.createInterface({input, output})

let more=true;
while(more){
  let bmiInput={};
  //promises and await is a later lecture ;-) 
  bmiInput.userName= await rl.question("Enter Name ");
  if(bmiInput.userName==="q"){
      more = false;
  }
  else {
    bmiInput.height = await rl.question("Enter Height "); 
    bmiInput.weight= await rl.question("Enter Weight "); 
    let validatedBMIRecord=validateBMIFormData(bmiInput);
    if(validatedBMIRecord) {
       if(!theBMIDB.lookup(validatedBMIRecord.userName)) 
          console.log("Welcome New User"); //lookup welcome new user
       const bmiEntry=theBMIDB.recordBMI(validatedBMIRecord);
       fileOut(bmiEntry);
       console.log("Output is in file "+outputFileName);
    }
    else 
      console.log("Don't input that nonsens!");
  }
}
rl.close();


//remove potentially dangerous/undesired characters 
function sanitize(str){
    str=str
  .replace(/&/g, "")
  .replace(/</g, "")
  .replace(/>/g, "")
  .replace(/"/g, "")
  .replace(/'/g, "")
  .replace(/`/g, "")
  .replace(/\//g, "");
  return str.trim();
  }
/* ********************************************************************************
 * You need not read/understand the code below (YET);
 * simply writes the program output into an html file
 ********************************************************************************  */

function fileOut(bmiEntry){
  let htmlPage=renderHTMLBMIStatus(bmiEntry);
  fs.writeFileSync(outputFileName, htmlPage);
}

function renderHTMLBMIStatus(bmiEntry){
  let page=renderHTMLHdr("BMI Status",["simple.css"]);
  page+=`<body><section>
<h1> BMI Status of ${bmiEntry.userName} </h1>
<output>
  Your BMI is ${bmiEntry.calcBMI()}. Since last, it has changed ${theBMIDB.calcDelta(bmiEntry.userName)}.  
</output>
</section>
<section>
${renderHTMLBMITableExtended(bmiEntry.userName)}
${renderAnchor("Get Help","help.html")}
</section>
</body></html>`;
 return page;
}


function renderHTMLBMITableExtended(userName){
  const userEntries=theBMIDB.selectUserEntries(userName);
 let bmiTable=`
  <table id="scoretable">
  <thead>
  <tr>
  <th colspan="3">BMI history for user ${userName} </th>
</tr>
    <tr><th>Weight </th><th>BMI</th> <th>Delta</th></tr>
  </thead>
  <tbody>`;
  let prev;//undefined
  for(let entry of userEntries) {
    bmiTable+= `<tr><td> ${entry.weight}</td> <td> ${entry.calcBMI()} </td>
    <td>${prev?round2Decimals(entry.calcBMI()-prev.calcBMI()):0} </td>
    </tr>`;
    prev=entry;
  }
  bmiTable+=`</tbody></table>`
  return bmiTable;
}


function renderAnchor(text,url){
  return `<a href="${url}"> ${text}</a>`;
}

function renderHTMLHdr(title,csss=[],scripts=[]){

  let cssString="";
  for(let i=0;i<csss.length;i++){
    let css=csss[i];
    cssString+=`${css===""?"":"<link rel=\"stylesheet\" href=\""+css+"\">\n"}`;
  } 
  let scriptString="";
  for(let i=0;i<scripts.length;i++){
    let script=scripts[i];
    scriptString+=   `${script===""?"":"<script defer src=\""+script+"\"></script>\n"}`;
  } 
  
  let str=`
  <!DOCTYPE html>
  <html lang="da">
  <head>
    <title>${title}</title>
    <meta charset="utf-8">
    ${cssString}
    ${scriptString}
      </head>`;
  return str;
}
