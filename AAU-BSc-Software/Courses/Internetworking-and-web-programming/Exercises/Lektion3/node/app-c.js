//DISCLAIMER: This program has been developed for educational purposes at an introductory level. Certain simplifications has been made
//to keep it comphrehensible. 

//We use EC6 modules!
import fs from 'fs';  //enable use of file system
import * as readline from 'node:readline/promises'  //enable read stdio in console
import { stdin as input, stdout as output } from 'process'

/* ***************************************************
 * Application code for the BMI tracker application 
 * CONSOLE VERSION
 * Mostly C-style programming!
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
  let weight;
  let height;

  //ensure that object has name,weight,height properties
  //neither must be undefined, and of the right type and ranges
  if(bmiData.userName && bmiData.weight && bmiData.height){
    userName=String(bmiData.userName);
    userName=validateUserName(userName);
    weight=parseInt(bmiData.weight);
    height=parseInt(bmiData.height);
  
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

function calcBMI(height,weight){
  let bmi= weight/(height/100*height/100);
  bmi=round2Decimals(bmi);
  return bmi;
}

/* "Database" emulated by maintained an in-memory array of BMI Entry objects 
   Higher index means newer data entry: you can insert by simply 
  'push'ing a new data entry */

let sampleBMIData={userName: "Mickey", height: 180, weight:90};
let bmiDB=[sampleBMIData]; //



//compare the latest two entries for 'name' and compute difference of bmi numbers
//return a delta of 0 if only one or no record is found
//The solution uses C-like JS, and can be simplified using filter and map, indexOf
function calcDelta(name){
  //console.log("looking up "+name);
  
  let newBMIIndex=-1;
  let previousBMIIndex=-1;
  let i=0;
  //find newest entry (hence search backward  in array)
  for(i=bmiDB.length-1; i>=0;i--)
   if(bmiDB[i].userName===name) {
     newBMIIndex=i;
     //console.log("NEW "+i);
     break;
   } 
   //search for second oldest
   for(--i;i>=0;i--) 
     if(bmiDB[i].userName===name) {
      previousBMIIndex=i;
      //console.log("PREV "+i);
      break;
     } 
   if(newBMIIndex>=0 && previousBMIIndex>=0) 
     return round2Decimals(calcBMI(bmiDB[newBMIIndex].height, bmiDB[newBMIIndex].weight)-
     calcBMI(bmiDB[previousBMIIndex].height, bmiDB[previousBMIIndex].weight));   
   else 
   return 0;
}


//looks up name in bmiDB and returns any found bmiEntry (undefined otherwise)
function bmiLookup(name){
  //console.log("looking up "+name);
  let i=0;

  for(i=bmiDB.length-1; i>=0;i--)
   if(bmiDB[i].userName===name) {
     return bmiDB[i]; 
  }
  //else undefined
}

//Process the request that adds a new BMI reading to the DB
//It is to return the change in BMI back to the user as a bmiStatus
//object containing the new BMI and delta to the previously store reading (0 if none)
function recordBMI(bmiEntry){

  bmiDB.push(bmiEntry);
  const bmiStatus={};
  bmiStatus.userName=bmiEntry.userName;
  bmiStatus.bmi=calcBMI(bmiEntry.height, bmiEntry.weight);
  bmiStatus.delta=calcDelta(bmiEntry.userName);
  console.log(bmiStatus);

  return bmiStatus;
}


//The main Input and Outout functions
const rl = readline.createInterface({input, output})

let more=true;
while(more){
  let bmiInput={};
  //promises and await is a later lecture ;-) 
  bmiInput.userName= await rl.question("Enter Name ");
  if(bmiInput.userName==="q")
      more = false;
  else {
    bmiInput.height = await rl.question("Enter Height "); 
    bmiInput.weight= await rl.question("Enter Weight "); 
    let validatedBMIEntry=validateBMIFormData(bmiInput);
    if(validatedBMIEntry) {
       if(!bmiLookup(validatedBMIEntry.userName)) 
          console.log("Welcome New User"); //lookup welcome new user
       let bmiStatus=recordBMI(validatedBMIEntry);
       fileOut(bmiStatus);
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
 * You need not read  the code below (YET);
 * It simply writes the program's output into an html file
 ********************************************************************************  */

function fileOut(bmiStatus){
  let htmlPage=renderHTMLBMIStatus(bmiStatus);
  fs.writeFileSync(outputFileName, htmlPage);
}

function renderHTMLBMIStatus(bmiStatus){
  let page=renderHTMLHdr("BMI Status",["simple.css"]);
  page+=`<body><section>
<h1> BMI Status of ${bmiStatus.userName} </h1>
<output>
  Your BMI is ${bmiStatus.bmi}. Since last, it has changed ${bmiStatus.delta}.  
</output>
</section>
<section>
${renderHTMLBMITableExtended(bmiStatus.userName)}
${renderAnchor("Get Help","help.html")}
</section>
</body></html>`;
 return page;
}

function selectUserEntries(userName){
  return bmiDB.filter(e=>e.userName===userName);
}

function renderAnchor(text,url){
  return `<a href="${url}"> ${text}</a>`;
}
function renderHTMLBMITableExtended(userName){
  const userEntries=(selectUserEntries(userName));
 let bmiTable=`
  <table id="scoretable">
  <thead>
  <tr>
  <th colspan="3">BMI history for user ${userName} </th>
</tr>
    <tr><th>Weight </th><th>BMI</th><th>Delta</th></tr>
  </thead>
  <tbody>`
  let prev; //undefined
  for(let entry of userEntries) {
    bmiTable+= `<tr><td> ${entry.weight}</td> <td> ${calcBMI(entry.height,entry.weight)} </td>
    <td>${prev?round2Decimals(calcBMI(entry.height,entry.weight)-calcBMI(prev.height,prev.weight)):0} </td>
    </tr>`
    prev=entry;
  }

  bmiTable+=`</tbody></table>`
  return bmiTable;
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
/* Very simple basic test function with manual check 
function testValidation(){
  let validBMIData=validateBMIFormData({name:"Brian",weight:"90", height:"181"});
  console.log(validBMIData);
  validBMIData=validateBMIFormData({weight:"90", height:"181"});
  console.log(validBMIData); //should be undefined
  validBMIData=validateBMIFormData({name:"Brian",weight:"90", height:"1812"});
  console.log(validBMIData);
}
//BtestValidation();
*/
