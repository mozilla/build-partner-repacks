function place_toolbar_control(a, sControlID)
{
	if(sControlID=='')
	{
		return false;
	}
	var toolbox=a.document.getElementById('navigator-toolbox');
	var aToolbars=toolbox.getElementsByTagName('toolbar');
	for(var i=0; i<aToolbars.length; i++)
	{
		var sControlSet=aToolbars[i].getAttribute('currentset');
		if(sControlSet=='')
		{
			sControlSet=aToolbars[i].getAttribute('defaultset');
		}
		var aControlSet=sControlSet.split(',');
		if( (aControlSet.length==1) && (aControlSet[0]=='__empty') )
		{
			continue;
		}
		for(var j=0; j<aControlSet.length; j++)
		{
			if( aControlSet[j] == sControlID )
			{
				if( j==0 )
				{
					aToolbars[i].insertItem(sControlID,aToolbars[i].firstChild,false,false);
					return true
				}
				else if( j==(aControlSet.length-1) )
				{
					aToolbars[i].insertItem(sControlID,null,false,false);
					return true
				}
				else
				{
					var nButtonsBefore=0;
					for(var k=j; k<aControlSet.length; k++)
					{
						if(
							(aControlSet[k]!='spring')
							&&(aControlSet[k]!='separator')
							&&(aControlSet[k]!='spacer')
						)
						{
							var element=a.document.getElementById(aControlSet[k]);
							if(element!=null)
							{
								for(var l=nButtonsBefore; l>0; l--)
								{
									element=element.previousSibling
								}
								aToolbars[i].insertItem(sControlID,element,false,false);
								return true
							}

						}
						else
						{
							nButtonsBefore++
						}

					}
					if(nButtonsBefore>0)
					{
						var element = aToolbars[i].lastChild;
						for(var l = nButtonsBefore-1; l>0; l--)
						{
							element = element.previousSibling
						}
						aToolbars[i].insertItem(sControlID,h,false,false);
						return true
					}
					return false
				}

			}

		}

	}
	return false
}
function insertAfterChevrone(a)
{
	var b=document.getElementById('mailru_chevron_btn');
	if(b!=null)
	{
		var d=b.nextSibling;
		if(d.nodeName=='toolbarseparator')d=d.nextSibling;
		gMRRefToolbar.insertItem(a,d,false,false);
		return true
	}
	return false
}
function getPosBeforeChevron()
{
	var elChevron = document.getElementById('mailru_chevron_btn');
	if(elChevron!=null)
	{
		var elLastButton=elChevron;
		if(
			(elLastButton.previousSibling!=null)
			&& (elLastButton.previousSibling.nodeName=='toolbarspring')
		)
		{
			elLastButton=elLastButton.previousSibling;
		}
		if(
			(elLastButton.previousSibling!=null)
			&&(elLastButton.previousSibling.nodeName=='toolbarspring')
		)
		{
			elLastButton = elLastButton.previousSibling;
		}
		return elLastButton;
	}
	return null;
}

function insertBeforeChevrone(elControl)
{
	var elLastButton=getPosBeforeChevron();
	if( elLastButton )
	{
		elToolbar.insertItem(elControl,elLastButton,false,false);
		return true
	}
	return false
}

