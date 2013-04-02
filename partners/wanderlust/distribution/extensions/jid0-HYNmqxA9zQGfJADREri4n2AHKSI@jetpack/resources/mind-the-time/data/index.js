/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Javascript for the summary page (index.html)

// clear today's data and set up global variables
document.getElementById("table-today").innerHTML = "";
var sumShowSecsPref = false; // used internally for testing, not user-facing
var todayStamp = undefined;

// load data for today (separately for efficiency)
self.port.on("loadData-A2", function( dmnsZero, mdataZero ) {
    document.getElementById("table-today").innerHTML = "";
    
    MTT_outputTable(dmnsZero, mdataZero[0], "Today, " + mdataZero[2], 0 );
    
    if (mdataZero[1] != todayStamp) {
        todayStamp = mdataZero[1];
        self.port.emit('loadData-B1');
    }
});

// now load data for past week (if the day has changed)
self.port.on("loadData-B2", function( dmns, mdata) {
    document.getElementById("table-week").innerHTML = "";
    
    // past week table
    if (mdata[8][0]>0 ) {   
        MTT_outputTable(dmns[8], mdata[8][0], mdata[8][2], 8);
     
        // daily totals table
        var dailytots = [];
        for (i=1; i<8; i++) {
        
            // only include a day if it's in the past week
            if( mdata[i][0] !=0  &&  mdata[i][1] >= mdata[0][1]-7) {
                dailytots.push( [ mdata[i][2], mdata[i][0] ] );
            }
        }
        MTT_outputTable(dailytots, mdata[8][0], "Daily Totals, " + mdata[8][2], 9 );
    }
    // explanatory text if there's only one day so far
    else if (mdata[7][0] == 0 && mdata[6][0] == 0 && mdata[5][0] == 0 && mdata[4][0] == 0 && mdata[3][0] == 0 && mdata[2][0] == 0 && mdata[1][0] == 0 ) {
        var explainText = document.createTextNode( 
            "When more than one day has been logged, " +
            "additional tables will appear here, " + 
            "eventually showing data from the past seven days, " + 
            "including a combined summary of all data from the past week." 
            );
        var explainDiv = document.createElement('div');
        explainDiv.setAttribute('id', 'explainDiv');
        explainDiv.appendChild(explainText); 
        document.getElementById("table-week").appendChild(explainDiv);
    }
    // tables for each day
    for (i=1; i<8; i++) {
        if( mdata[i][0] !=0 ) {
            MTT_outputTable(dmns[i], mdata[i][0], mdata[i][2], i);   
        }
    }
});

// initiate loading of data
self.port.emit('loadData-A1');

// listen for data refresh call
self.port.on("loadData-A0", function() { self.port.emit('loadData-A1') });

// generate summary tables
function MTT_outputTable(dmns, tsecs, header, tablnum) {
    var len = dmns.length;
    var t;        
    
    // create table
	row=new Array();
	cell=new Array();
	cont=new Array();
	
	tab=document.createElement('table');
	tab.setAttribute('class','newtable');
	
	tbo=document.createElement('tbody');
	
    var getDom;
	var getMain;
	var linktext;
    var rowsShown = 10;
    
    // add table to page
    tab.appendChild(tbo);
    
    if (tablnum == 0) {
        document.getElementById("table-today").appendChild(tab);
    }
    else {
        document.getElementById("table-week").appendChild(tab);
    }
    
    // create date header row
    dateheader = document.createElement('h4');
    dateheader.setAttribute('class', 'dateheader');
    
    datetext = document.createTextNode( header );
    dateheader.appendChild(datetext); 
    
    row[0]=document.createElement('tr');
    row[0].setAttribute('class', 'headerrow');
    
    cell[0]=document.createElement('td');
    cell[0].setAttribute('class', 'headertd');
    cell[0].colSpan = "5";
    cell[0].appendChild(dateheader);
    
    row[0].appendChild(cell[0]);
    
    tbo.appendChild(row[0]);
    
    // create total header row
	row[0]=document.createElement('tr');
	row[0].setAttribute('class','totalrow');

	cont[0]=document.createTextNode(" "); 
	cont[1]=document.createTextNode("Total"); 
	cont[2]=document.createTextNode(MTT_formatTime(tsecs) ); 
	cont[3]=document.createTextNode( "100%" ); 
    cont[4]=MTT_createGraph(tsecs); 
    				
	for(k=0; k<5; k++) {
		cell[k]=document.createElement('td');
		cell[k].appendChild(cont[k]);
		row[0].appendChild(cell[k]);	
	}
	tbo.appendChild(row[0]);

    // create domain rows
    
	for(c=0;c<len;c++){
		row[c]=document.createElement('tr');
            row[c].setAttribute('id', 'trow'+tablnum+c);
            if (c>rowsShown-1) {
                row[c].setAttribute('style', 'display:none');
            }
            
        // row number
		cont[0]=document.createTextNode(c+1 + "."); 

        // domain
        if (tablnum != 9) {
    		cont[1] =document.createElement('a'); 
    			cont[1].setAttribute('href', dmns[c][0]);
    			cont[1].setAttribute('class', 'domainlink');
                cont[1].setAttribute('target', '_blank');
    			
    			getDom=dmns[c][0].replace(/(.*?\/\/).*?/, "");
    			
    			linktext = document.createTextNode(getDom);
    			cont[1].appendChild(linktext);		
        }
        else { // daily totals table
            cont[1] = document.createTextNode( dmns[c][0] );
        }
            
        // time
		cont[2]=document.createTextNode(MTT_formatTime(dmns[c][1]) ); 

        // percent
		if (tsecs==0) { 
			cont[3] = document.createTextNode("0%");
		} else {
			cont[3]=document.createTextNode(Math.round((dmns[c][1] / tsecs) * 100) + "%"); 
		}
        
        // graph
        cont[4]= MTT_createGraph( dmns[c][1] );

        // put it all together
		for(k=0; k<5; k++) {
			cell[k]=document.createElement('td');
            cell[k].appendChild(cont[k]);
			row[c].appendChild(cell[k]);	
		}
		tbo.appendChild(row[c]);
	}
    
    // show more row
    if (len > rowsShown) {
        show = document.createElement('a');
        show.setAttribute('class', 'showmore');
        
        showtext = document.createTextNode( "Show " + (len-rowsShown) + " More" );
        show.appendChild(showtext);
        show.addEventListener("click", function(){ MTT_showMore(tablnum, len, rowsShown, true) }, false);
        
        row[0]=document.createElement('tr');
        row[0].setAttribute('id', 'showrow'+tablnum );

        cell[0]=document.createElement('td');
        cont[0]=document.createTextNode(" "); 
        cell[0].appendChild(cont[0]);
        row[0].appendChild(cell[0]);

        cell[1]=document.createElement('td');
        cell[1].setAttribute('id', 'showCell' + tablnum);
        cell[1].colSpan = "4";
        cell[1].appendChild(show);
        
        row[0].appendChild(cell[1]);
        
        tbo.appendChild(row[0]);  
    }
    
}

// handle "show/hide more rows" 
function MTT_showMore(tablnum, len, rowsShown, showMore) {
    
    var showLink = document.createElement('a');
    
    if (showMore == true) {
        var showWhatText = document.createTextNode( "Show Only First 10" );
        var displayValue = null;
        showLink.addEventListener("click", function() {MTT_showMore(tablnum, len, rowsShown, false)}, false);
    }
    else {
        var showWhatText = document.createTextNode( "Show " + (len-rowsShown) + " More" );
        var displayValue = "none";
        showLink.addEventListener("click", function() {MTT_showMore(tablnum, len, rowsShown, true)}, false);
    }
    
    showLink.setAttribute('class', 'showmore');
    showLink.appendChild(showWhatText);

    var showCell = document.getElementById('showCell'+tablnum);
    showCell.innerHTML = "";
    showCell.appendChild(showLink);

    for (i=rowsShown; i<len; i++) {
        document.getElementById("trow"+tablnum+i).style.display= displayValue;
    }
}

// generate bar graphs
function MTT_createGraph(secs) {
    var minsPerPx = 1.5; 
    var totalMins = Math.floor(secs / 60);
    var hours = Math.floor(totalMins / 60);
    var mins = Math.floor(totalMins % 60);
    graphUL=document.createElement('ul'); 
    graphUL.setAttribute('class', 'graphUL');
    graphUL.style.minWidth= ((hours<10) ? (totalMins / minsPerPx) : ( 600 / minsPerPx)  ) + 12 + "px";
    for (g=0; g<hours; g++) {
        var lig = document.createElement('li');
        lig.setAttribute('class', 'graphLI');
        lig.style.width=((60 / minsPerPx)-1) + "px";
        graphUL.appendChild(lig);
    }
    var lig = document.createElement('li');
    lig.setAttribute('class', 'graphLI');
    lig.style.width= (mins / minsPerPx) + "px";
    graphUL.appendChild(lig);
    return graphUL
}

// formatting time display
function MTT_formatTime(time) {
    time = Math.abs(time);
    var h = Math.floor(time / 3600);
    var m = Math.floor(time / 60) % 60;     
    if (sumShowSecsPref == false || sumShowSecsPref == null) {        
        return ((h<1)   ?   "0:"    :  h+":"  )  
    		 + ((m<10)  ?   ((m<1)   ?   "00"  :  "0"+m  )      :  m );        
    }
    
    // only used for internal testing:
    else { 
        var s = Math.floor(time) & 60;
        return ((h<1)   ?   "0:"    :  h+":"  )  
    		 + ((m<10)  ?   ((m<1)   ?   "00:"  :  "0"+m+":"  )      :  m+":" )
             + ((s<10)  ?   ((s<1)   ?   "00"  :  "0"+s  )      :  s );     
    }
}


// get auto-refresh pref
self.port.emit("getPref", "autoRefreshPref");


self.port.on("getPref", function(prefName, value) {
    if (prefName == "autoRefreshPref"){  
        if (value == false) {
            document.getElementById("reloadLi").style.display="inline-block";
        }
        else if (value == true) {
            document.getElementById("reloadLi").style.display="none";
        }
    }
});

// prefs button handler
document.getElementById("prefsButton").addEventListener("click", function(){
    self.port.emit("goToPrefs");    
}, false);

// reload button handler
document.getElementById("reloadButton").addEventListener("click", function(){
    try {
        self.port.emit("loadData-A1"); 
        document.getElementById("table-today").style.visibility = "hidden";
        setTimeout( function() { document.getElementById("table-today").style.visibility = "visible" }, 100);    
    }
    catch(e){
        window.location.reload();
    }

}, false);