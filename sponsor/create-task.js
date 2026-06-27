/* ==========================================================
   CoinGrid Sponsor - Create Task
   Part 1 (Initialization)
========================================================== */

"use strict";

/* ==========================================
   API CONFIG
========================================== */

const API_BASE = "/api";

/* ==========================================
   FORM ELEMENTS
========================================== */

const form = document.getElementById("createTaskForm");

const taskTitle = document.getElementById("taskTitle");
const taskDescription = document.getElementById("taskDescription");
const taskCategory = document.getElementById("taskCategory");

const rewardPerUser = document.getElementById("rewardPerUser");
const availableSlots = document.getElementById("availableSlots");
const timeRequired = document.getElementById("timeRequired");
const approvalTime = document.getElementById("approvalTime");

const taskUrl = document.getElementById("taskUrl");
const targetCountry = document.getElementById("targetCountry");
const deviceType = document.getElementById("deviceType");

const requirements = document.getElementById("requirements");
const taskSteps = document.getElementById("taskSteps");

const proofType = document.getElementById("proofType");
const proofInstructions = document.getElementById("proofInstructions");

const campaignAsset = document.getElementById("campaignAsset");
const selectedFile = document.getElementById("selectedFile");

/* ==========================================
   SUMMARY
========================================== */

const summaryReward = document.getElementById("summaryReward");
const summarySlots = document.getElementById("summarySlots");
const summaryBudget = document.getElementById("summaryBudget");
const summaryFee = document.getElementById("summaryFee");

/* ==========================================
   LIVE PREVIEW
========================================== */

const previewTitle = document.getElementById("previewTitle");
const previewDescription = document.getElementById("previewDescription");
const previewReward = document.getElementById("previewReward");
const previewSlots = document.getElementById("previewSlots");
const previewTime = document.getElementById("previewTime");
const previewProof = document.getElementById("previewProof");

/* ==========================================
   BUTTONS
========================================== */

const publishTaskBtn = document.getElementById("publishTaskBtn");
const saveDraftBtn = document.getElementById("saveDraftBtn");
const resetTaskBtn = document.getElementById("resetTaskBtn");

/* ==========================================
   MODALS
========================================== */

const loadingModal = document.getElementById("loadingModal");
const successModal = document.getElementById("successModal");
const errorModal = document.getElementById("errorModal");

const closeSuccessModal =
document.getElementById("closeSuccessModal");

const closeErrorModal =
document.getElementById("closeErrorModal");

const errorMessage =
document.getElementById("errorMessage");

/* ==========================================
   API STATUS
========================================== */

const apiStatus =
document.getElementById("apiStatus");

const lastSync =
document.getElementById("lastSync");

/* ==========================================
   UTILITIES
========================================== */

function showLoading(){

loadingModal.style.display = "flex";

}

function hideLoading(){

loadingModal.style.display = "none";

}

function showSuccess(){

successModal.style.display = "flex";

}

function hideSuccess(){

successModal.style.display = "none";

}

function showError(message){

errorMessage.textContent = message;

errorModal.style.display = "flex";

}

function hideError(){

errorModal.style.display = "none";

}

closeSuccessModal.addEventListener(
"click",
hideSuccess
);

closeErrorModal.addEventListener(
"click",
hideError
);

/* ==========================================================
   Part 8
   Live Preview + Budget Calculator
========================================================== */

/* ==========================================
   FILE SELECTION
========================================== */

campaignAsset.addEventListener("change", () => {

if(campaignAsset.files.length > 0){

selectedFile.textContent =
campaignAsset.files[0].name;

}else{

selectedFile.textContent =
"No file selected.";

}

});

/* ==========================================
   LIVE TASK PREVIEW
========================================== */

function updatePreview(){

previewTitle.textContent =
taskTitle.value.trim() ||
"Task Title Preview";

previewDescription.textContent =
taskDescription.value.trim() ||
"Task description preview will appear here.";

previewReward.textContent =
"$" +
(Number(rewardPerUser.value || 0)).toFixed(2);

previewSlots.textContent =
availableSlots.value || "0";

previewTime.textContent =
timeRequired.value || "--";

previewProof.textContent =
proofType.value;

}

/* ==========================================
   BUDGET SUMMARY
========================================== */

function updateBudget(){

const reward =
parseFloat(rewardPerUser.value) || 0;

const slots =
parseInt(availableSlots.value) || 0;

const budget =
reward * slots;

summaryReward.textContent =
"$" + reward.toFixed(2);

summarySlots.textContent =
slots;

summaryBudget.textContent =
"$" + budget.toFixed(2);

/*

Platform fee can later come
from backend subscription API.

*/

summaryFee.textContent =
"Calculated Later";

}

/* ==========================================
   AUTO UPDATE
========================================== */

[
taskTitle,
taskDescription,
rewardPerUser,
availableSlots,
timeRequired,
proofType
].forEach(element=>{

element.addEventListener("input",()=>{

updatePreview();

updateBudget();

});

});

proofType.addEventListener(
"change",
updatePreview
);

/* ==========================================
   INITIAL LOAD
========================================== */

updatePreview();

updateBudget();

/* ==========================================================
   Part 9
   Load Sponsor Information
========================================================== */

async function loadSponsorData(){

try{

const response = await fetch(
API_BASE + "/sponsor/profile",
{
credentials:"include"
}
);

if(!response.ok){

throw new Error("Unable to load sponsor profile.");

}

const data = await response.json();

document.getElementById(
"companyName"
).value =
data.company_name || "";

document.getElementById(
"sponsorId"
).value =
data.sponsor_id || "";

document.getElementById(
"sponsorEmail"
).value =
data.email || "";

document.getElementById(
"accountStatus"
).value =
data.status || "Active";

}catch(error){

console.error(error);

}

}

/* ==========================================================
   Load Subscription
========================================================== */

async function loadSubscription(){

try{

const response = await fetch(
API_BASE + "/sponsor/subscription",
{
credentials:"include"
}
);

if(!response.ok){

throw new Error();

}

const data = await response.json();

document.getElementById(
"subscriptionPlan"
).textContent =
data.plan;

document.getElementById(
"monthlyLimit"
).textContent =
data.monthly_limit;

document.getElementById(
"tasksUsed"
).textContent =
data.tasks_used;

document.getElementById(
"tasksRemaining"
).textContent =
data.remaining_tasks;

}catch(error){

console.error(error);

}

}

/* ==========================================================
   Load Wallet
========================================================== */

async function loadWallet(){

try{

const response = await fetch(
API_BASE + "/sponsor/wallet",
{
credentials:"include"
}
);

if(!response.ok){

throw new Error();

}

const data = await response.json();

document.getElementById(
"walletBalance"
).textContent =
"$" +
Number(data.balance).toFixed(2);

document.getElementById(
"reservedBalance"
).textContent =
"$" +
Number(data.reserved).toFixed(2);

document.getElementById(
"totalSpent"
).textContent =
"$" +
Number(data.spent).toFixed(2);

}catch(error){

console.error(error);

}

}

/* ==========================================================
   Worker Status
========================================================== */

async function checkApiStatus(){

try{

const response = await fetch(
API_BASE + "/health"
);

if(response.ok){

apiStatus.textContent =
"🟢 Connected";

apiStatus.style.color =
"var(--green)";

}else{

throw new Error();

}

}catch(error){

apiStatus.textContent =
"🔴 Offline";

apiStatus.style.color =
"var(--red)";

}

lastSync.textContent =
new Date().toLocaleString();

}

/* ==========================================================
   Initial Page Load
========================================================== */

window.addEventListener(
"load",
async()=>{

await loadSponsorData();

await loadSubscription();

await loadWallet();

await checkApiStatus();

}
);

/* ==========================================================
   Auto Refresh
========================================================== */

setInterval(()=>{

checkApiStatus();

},60000);

/* ==========================================================
   Part 10
   Validation + Publish + Save Draft
========================================================== */

/* ==========================================
   VALIDATION
========================================== */

function validateForm(){

if(taskTitle.value.trim()===""){
showError("Please enter a task title.");
taskTitle.focus();
return false;
}

if(taskCategory.value===""){
showError("Please select a task category.");
taskCategory.focus();
return false;
}

if(taskDescription.value.trim()===""){
showError("Please enter a task description.");
taskDescription.focus();
return false;
}

if(rewardPerUser.value==="" || Number(rewardPerUser.value)<=0){
showError("Reward per user must be greater than 0.");
rewardPerUser.focus();
return false;
}

if(availableSlots.value==="" || Number(availableSlots.value)<=0){
showError("Please enter available slots.");
availableSlots.focus();
return false;
}

if(taskUrl.value.trim()===""){
showError("Please enter the task URL.");
taskUrl.focus();
return false;
}

if(requirements.value.trim()===""){
showError("Please enter task requirements.");
requirements.focus();
return false;
}

if(taskSteps.value.trim()===""){
showError("Please enter task steps.");
taskSteps.focus();
return false;
}

if(!document.getElementById("checkPolicy").checked){
showError("Please accept the Sponsor Policy.");
return false;
}

if(!document.getElementById("checkLegal").checked){
showError("Please confirm legal compliance.");
return false;
}

if(!document.getElementById("checkBudget").checked){
showError("Please confirm the budget agreement.");
return false;
}

if(!document.getElementById("checkAccuracy").checked){
showError("Please confirm task accuracy.");
return false;
}

return true;

}

/* ==========================================
   SAVE DRAFT
========================================== */

saveDraftBtn.addEventListener("click",()=>{

const draft={

taskTitle:taskTitle.value,
taskCategory:taskCategory.value,
taskDescription:taskDescription.value,
rewardPerUser:rewardPerUser.value,
availableSlots:availableSlots.value,
timeRequired:timeRequired.value,
approvalTime:approvalTime.value,
taskUrl:taskUrl.value,
targetCountry:targetCountry.value,
deviceType:deviceType.value,
requirements:requirements.value,
taskSteps:taskSteps.value,
proofType:proofType.value,
proofInstructions:proofInstructions.value

};

localStorage.setItem(
"coingrid_task_draft",
JSON.stringify(draft)
);

alert("Draft saved successfully.");

});

/* ==========================================
   LOAD SAVED DRAFT
========================================== */

(function(){

const saved=

localStorage.getItem(
"coingrid_task_draft"
);

if(!saved) return;

const draft=JSON.parse(saved);

taskTitle.value=draft.taskTitle||"";
taskCategory.value=draft.taskCategory||"";
taskDescription.value=draft.taskDescription||"";
rewardPerUser.value=draft.rewardPerUser||"";
availableSlots.value=draft.availableSlots||"";
timeRequired.value=draft.timeRequired||"";
approvalTime.value=draft.approvalTime||"";
taskUrl.value=draft.taskUrl||"";
targetCountry.value=draft.targetCountry||"";
deviceType.value=draft.deviceType||"";
requirements.value=draft.requirements||"";
taskSteps.value=draft.taskSteps||"";
proofType.value=draft.proofType||"Screenshot";
proofInstructions.value=draft.proofInstructions||"";

updatePreview();
updateBudget();

})();

/* ==========================================
   PUBLISH TASK
========================================== */

form.addEventListener("submit",async(e)=>{

e.preventDefault();

if(!validateForm()) return;

showLoading();

try{

const formData=new FormData();

formData.append("taskTitle",taskTitle.value);
formData.append("taskCategory",taskCategory.value);
formData.append("taskDescription",taskDescription.value);
formData.append("rewardPerUser",rewardPerUser.value);
formData.append("availableSlots",availableSlots.value);
formData.append("timeRequired",timeRequired.value);
formData.append("approvalTime",approvalTime.value);
formData.append("taskUrl",taskUrl.value);
formData.append("targetCountry",targetCountry.value);
formData.append("deviceType",deviceType.value);
formData.append("requirements",requirements.value);
formData.append("taskSteps",taskSteps.value);
formData.append("proofType",proofType.value);
formData.append("proofInstructions",proofInstructions.value);

if(campaignAsset.files.length>0){

formData.append(
"campaignAsset",
campaignAsset.files[0]
);

}

const response=await fetch(

API_BASE+"/sponsor/tasks",

{

method:"POST",

credentials:"include",

body:formData

}

);

const result=await response.json();

hideLoading();

if(!response.ok){

throw new Error(

result.message||

"Unable to publish task."

);

}

localStorage.removeItem(
"coingrid_task_draft"
);

form.reset();

selectedFile.textContent=
"No file selected.";

updatePreview();
updateBudget();

showSuccess();

}catch(error){

hideLoading();

showError(

error.message||

"Something went wrong."

);

}

});

/* ==========================================
   RESET
========================================== */

resetTaskBtn.addEventListener("click",()=>{

setTimeout(()=>{

selectedFile.textContent=
"No file selected.";

updatePreview();

updateBudget();

},50);

});

/* ==========================================
   END OF FILE
========================================== */

console.log(
"CoinGrid Create Task Loaded Successfully."
);
