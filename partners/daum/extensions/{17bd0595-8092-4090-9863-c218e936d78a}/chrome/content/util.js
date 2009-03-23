function zeroPad(n, digits) {
	n = n.toString();
	while (n.length < digits) {
		n = '0' + n;
	}
	return n;
}

function trim(str)
{  
	return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');  
}  

String.prototype.trim = function()
{  
	return this.replace(/^\s\s*/, '').replace(/\s\s*$/, '');  
} 

function reflection(obj, start, viewValue)
{
	var msg = "";
	var i = 0;
	for(var tmp in obj)
	{
		i++;
		if(i < start) continue;
		msg += tmp + " ";
		if(viewValue) msg += "=" + obj[tmp] + "\n";
	}
	alert(msg);
}