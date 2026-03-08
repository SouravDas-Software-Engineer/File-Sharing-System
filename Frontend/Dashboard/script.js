function sendFile(){
alert("File Sent Successfully");
}

function receiveFile(){
alert("Receiving Files...");
}

function downloadFile(){
alert("Downloading File...");
}

function shareFile(){
alert("Share Link Copied");
}

function deleteFile(btn){
btn.parentElement.parentElement.remove();
}

function searchFiles(){

let input=document.getElementById("searchInput").value.toLowerCase();
let rows=document.querySelectorAll("#fileTable tr");

rows.forEach(function(row){

let text=row.innerText.toLowerCase();

row.style.display=text.includes(input)?"":"none";

});

}

function toggleDarkMode(){
document.body.classList.toggle("dark");
}

document.querySelector(".bell").onclick=function(){
alert("No new notifications");
}

document.getElementById("fileInput").addEventListener("change",function(){

let msg=document.getElementById("uploadMessage");

msg.style.display="block";

setTimeout(function(){
msg.style.display="none";
},2000);

});

function previewFile(file){

document.getElementById("previewModal").style.display="block";

document.getElementById("previewFrame").src=file;

}

function closePreview(){

document.getElementById("previewModal").style.display="none";

}
