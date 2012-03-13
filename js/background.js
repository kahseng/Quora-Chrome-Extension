var result = null;
var xhr = null;
var xhrTimeout = null;
var lastUpdate = 0;
var lastException = null;
		
function checkLogin()
{
	xhr = new XMLHttpRequest();
	url = "http://api.quora.com/api/logged_in_user?fields=inbox,notifs"+"&rand="+Math.random();
	xhr.open("GET", url, true);
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			clearTimeout(xhrTimeout);
		    try
			{
				result = JSON.parse(xhr.responseText.match(/{.*}/));
			}catch(ex)
			{
				lastException = ex;
				result = null;
			}finally
			{
				update();
				setTimeout("checkLogin();", 30000);
			}  	   
		}
	}
	var xhrTimeout = setTimeout("ajaxTimeout();", 30000);
		xhr.send();
}
			
function ajaxTimeout()
{	
	xhr.abort();
	setTimeout("checkLogin();", 30000);
	update();
}	
			
function live()
{
	d = new Date();
	now = d.getTime();
	//alert("I'm alive. Last update:"+(now-lastUpdate));
	
	if(now - lastUpdate > (1000 * 60 * 5))
	{
		checkLogin();
	}
}
			
function userNotLoggedIn()
{
	updateBadgeText("");
}
			
function userLoggedIn()
{
	if(null == result)
	{
		return; 
	}
	
	notifications = parseInt(result.notifs.unseen_aggregated_count);
	inbox = parseInt(result.inbox.unread_count);
	
	badge = "";

if(notifications > 0 && inbox > 0)
{
	badge = notifications.toString() + "/" + inbox.toString();
	}
	else if(notifications > 0)
	{
		badge = notifications.toString();	
	}
	else if (inbox > 0)
	{
		badge = inbox.toString();	
	}
	updateBadgeText(badge);
}
			
function update()
{
	d = new Date();
	now = d.getTime();
	lastUpdate = now;
	if(null == result)
	{
		userNotLoggedIn();
	}else
	{
		userLoggedIn();
	}
}
			
function updateBadgeText(text)
{
	chrome.browserAction.setBadgeText({"text": text})
}
			
function createContextMenu()
{
	chrome.contextMenus.create({"title":"Post to Quora", "onclick": contextPost});
	chrome.contextMenus.create({"title":"Post this link to Quora", "onclick": contextPostUrl, "contexts":["link"]});
	chrome.contextMenus.create({"title":"Post this image to Quora", "onclick": contextPostImage, "contexts":["image"]});
	chrome.contextMenus.create({"title":"Search on Quora", "onclick": contextSearch, "contexts":['selection']});
}
			
function contextPostUrl(clickInfo, tab)
{
	if(clickInfo.linkUrl != null && clickInfo.linkUrl != "")
	{
		postToQuora(clickInfo.linkUrl);
	}
}
			
function contextPostImage(clickInfo, tab)
{
	if(clickInfo.srcUrl != null && clickInfo.srcUrl != "")
	{
		postToQuora(clickInfo.srcUrl);
	}
}
			
function contextSearch(clickInfo, tab)
{
	if(clickInfo.selectionText != null && clickInfo.selectionText != "")
	{
		searchOnQuora(clickInfo.selectionText);
	}
}
			
function contextPost(clickInfo, tab)
{
	postToQuora(tab.url);
}
			
function postToQuora(url)
{
	link = "http://www.quora.com/board/bookmarklet?v=1&url="+encodeURIComponent(url);	
	window.open(link,'_blank','toolbar=0,scrollbars=no,resizable=1,status=1,width=430,height=400');	
}
			
function searchOnQuora(topic)
{
	url = "http://www.quora.com/search?q="+encodeURIComponent(topic);
	create = {"url": url};
	chrome.tabs.create(create);
}
			
function onLoad()
{
	setInterval(live, 1000);
	chrome.extension.onRequest.addListener(
	function(request, sender, sendResponse) 
	{	
	    if (request.data == "login")
    {
      sendResponse({"result": result});
    }
    else if(request.data == "search")
    {
    	searchOnQuora(request.query);
    }
    else if(request.data == "post")
	    {
	    	chrome.tabs.getSelected(null, function(tab) {
				postToQuora(tab.url);
		    });
	    }
	    else
	    {
	     	sendResponse({});
	    }
	});
	createContextMenu();
	checkLogin();
}