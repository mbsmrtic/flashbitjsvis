/**
 *  MyToolTip provides a tooltip. The code was originally from http://ashishware.com/js/Tooltip.js 
 *  I modified it, changing the code style and removing functionality that I don't need. 
 *  Here is the original notice from that site: 
// Free for any type of use so long as original notice remains unchanged.
// Report errors to feedback@ashishware.com
//Copyrights 2006, Ashish Patil , ashishware.com
 */

function MyToolTip(id) { 
	var isInit = -1;
  	var div, divWidth, divHeight;
  	var xincr = 10, yincr = 10;
  	var html;
  
  	function Init(id){
	   div = document.getElementById(id);
	   if (div == null) return;
	   
	   if((div.style.width=="" || div.style.height=="")) {
	   		alert("Both width and height must be set");
	   		return;
	   }
	   
	   divWidth = parseInt(div.style.width);
	   divHeight= parseInt(div.style.height);
	   if(div.style.overflow!="hidden")div.style.overflow="hidden";
	   if(div.style.display!="none")div.style.display="none";
	   if(div.style.position!="absolute")div.style.position="absolute";
	        
	   isInit++; 
  	}
  	
	this.Show = function(e,strHTML) {
		if(isInit<0) return;
	    
	    var newPosx,newPosy,height,width;
	    if(typeof( document.documentElement.clientWidth ) == 'number' ){
		    width = document.body.clientWidth;
		    height = document.body.clientHeight;}
	    else {
		    width = parseInt(window.innerWidth);
		    height = parseInt(window.innerHeight);
	    }
	    var curPosx = (e.x)?parseInt(e.x):parseInt(e.clientX);
	    var curPosy = (e.y)?parseInt(e.y):parseInt(e.clientY);
	    
	    if(strHTML!=null){
	    	html = strHTML;
	     	div.innerHTML=html;
	    }
	    
	    if((curPosx+divWidth+10)< width)
	    	newPosx= curPosx+10;
	    else
	    	newPosx = curPosx-divWidth;
	
	    if((curPosy+divHeight)< height)
	    	newPosy= curPosy;
	    else
	    	newPosy = curPosy-divHeight-10;
	
		if(window.pageYOffset){ 
	   		newPosy= newPosy+ window.pageYOffset;
	     	newPosx = newPosx + window.pageXOffset;
	   	}
	   	else { 
	   		newPosy= newPosy+ document.body.scrollTop;
	     	newPosx = newPosx + document.body.scrollLeft;
	   	}
	
	   	div.style.display='block';
	   	div.style.top= newPosy + "px";
	   	div.style.left= newPosx+ "px";
	
	   	div.focus();
	}; 

	this.Hide= function(e) {
    	div.style.display='none';
   	};
    
  	this.SetHTML = function(strHTML) {
   		html = strHTML;
    	div.innerHTML=html;
   	}; 
   	
   	Init(id);
}


