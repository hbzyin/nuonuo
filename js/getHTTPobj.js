function getHTTPObject(){
	if(typeof XMLHttpRequest=="undefined"){
	XMLHttpRequest=function(){
		try{return new ActiveXObject();}
		catch(e){}
		return false;
		}	
	}
	return new XMLHttpRequest();
}
