window.onload=function(){
//1、添加事件函数
function addLoadEvent(func){
  var oldonload=window.onload;
  if(typeof window.onload!="function"){
    window.onload=func;
  }else{
    window.onload=function(){
      oldonload();
      func();
    }
  }
}
//2、insertAfter
function insertAfter(newEle,targetElement){
  var parent=targetetElement.parentNode;
  if(parent.lastChild==targetElement){
    parent.appendChild(newEle);
  }else{
    parent.insertBefore(newEle,targetElement.nextSibling)
  }
}
//3、addClass函数
function addClass(elemnt,value ){
  if(!element.className){
    element.className=vaule;
  }else{
    newClassName=element.className;
    newClassName+=" ";
    newClassName+=value;
    element.className=newClassName;
  }
}
//4、当前链接
function hilightPage(){
  if(!document.getElementsByTagName)return false;
  if(!document.getElementById)return false;
  var headers=document.getElementsByTagName("header");
  if(headers.length==0)return false;
  var navs=headers[0].getElementsByTagName("nav");
  if(navs.length==0)return false;
  var links=navs[0].getElementsByTagName("a");
  var linkurl;
  for(var i=0;i<links.length;i++){
    linkurl=links[i].getAttribute("href");
    if(window.location.href.indexOf(linkurl)!=-1){
      links[i].className="here";
      var link=links[i].lastChild.nodeValue.toLowerCase()
      document.body.setAttribute("id",link)
    }
  }
}
//5、图片预览
 addLoadEvent(hilightPage());
}
