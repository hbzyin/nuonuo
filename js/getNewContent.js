function getNewContent(){
	var request=getHTTPObject();
	if(request){
		request.open("GET","example.tex",true);
		request.onreadystatechange=function(){
      if(request.readyState==4){
        var para=document.createElement("p");
        var text=document.createTextNode(request.responseText);
        para.appendChild(txt);
        document.getElementById("new").appendChild(para);
      }    
    };
    request.send(null);
    }else{alert("Sorry your browser dosen\'t support XMLHTTPRequest" )}
	}
}
addLoadEvent(getNewContent);
