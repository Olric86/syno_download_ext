var App = (function(){
  var host = localStorage['olric86.synology.host'] ? localStorage['olric86.synology.host'] : "";
  var protocol = "http://";
  var port = localStorage['olric86.synology.port'] ? localStorage['olric86.synology.port'] : "5000";
  var username = localStorage['olric86.synology.username'] ? localStorage['olric86.synology.username'] : "";  
  var password = localStorage['olric86.synology.password'] ? localStorage['olric86.synology.password'] : "";
  var authInfo = null;
  var downloadTaskInfo = null;
  var authAPIName = "SYNO.API.Auth";
  var downloadTaskAPIName = "SYNO.DownloadStation.Task";
  var loggedIn = false;

  var _readConf = function() {
  	host = localStorage['olric86.synology.host'] ? localStorage['olric86.synology.host'] : "";
	  protocol = "http://";
	  port = localStorage['olric86.synology.port'] ? localStorage['olric86.synology.port'] : "5000";
	  username = localStorage['olric86.synology.username'] ? localStorage['olric86.synology.username'] : "";  
	  password = localStorage['olric86.synology.password'] ? localStorage['olric86.synology.password'] : "";
  };

  var errors = {
    100: "Unknown error",
    101: "Invalid parameter",
    102: "The requested API does not exist",
    103: "The requested method does not exist",
    104: "The requested version does not support the functionality",
    105: "The logged in session does not have permission",
    106: "Session timeout",
    107: "Session interrupted by duplicate login",
    400: "No such account or incorrect password",
    401: "Max number of tasks reached",
    402: "Destination denied",
    403: "Destination does not exist",
    404: "Invalid task id",
    405: "Invalid task action",
    406: "No default destination",
    407: "Set destination failed",
    408: "File does not exist"
  };

  var _noop = function(){};

  var _extends = function(target, o){
    for (var key in o)
    {
      target[key] = o[key];
    }
  };

  var _checkResponseOK = function(o) {
    var bVal = false;
    if (o.success === true)
    {
      bVal = true;
    }
    else
    {
      if (o.error && o.error.code && errors[o.error.code])
      {
        console.log("API Response error: " + errors[o.error.code]);
      }
    }
    return bVal;
  };

  var _jsonPromise = function(params) {
    return new Promise(function(resolve, reject){
      var p = {
        url: "",
        method: "GET",
        data: {}              
      };

      _extends(p, params);
      var postParams = null;
      if (p.url)
      {
        var sParams = (function(){
          var sVal = "";
          for (var key in p.data) {
            sVal += "" + key + "=" + encodeURIComponent(p.data[key]) + "&";
          }

          return sVal.slice(0, -1);
        })();

        if (p.method.toUpperCase() == "GET")
        {
          var concChar = "?";
          if (p.url.indexOf("?") >= 0)
          {
            concChar = "&";
          }
          p.url = p.url + concChar + sParams;
        }
        else if (p.method.toUpperCase() == "POST")
        {
          postParams = sParams;
        }
        var x = new XMLHttpRequest();
        x.open(p.method, p.url, true);
        x.addEventListener('load', function(){
          var o = null;
          try
          {
            o = JSON.parse(x.responseText);
            if (_checkResponseOK(o))
            {
              resolve(o);
            }
            else
            {
              reject(x);   
            }

          }
          catch (e)
          {
            reject(x);
          }
        });
        x.addEventListener('error', function(){ reject(x); });
        x.send(postParams);
      }
    });
  };
  
  var _onApiInfoSucceded = function(o) {    
    // we need to determine the auth and downloadstation path
    var d = o.data;
    if (d[authAPIName] && d[downloadTaskAPIName])
    {
      authInfo = d[authAPIName];
      downloadTaskInfo = d[downloadTaskAPIName];        
    }        
  };


  var _getApiInfo = function(){      
      
    var url = protocol + host + ":" + port + 
              "/webapi/query.cgi";
    var data = {
      api: "SYNO.API.Info",
      version: 1,
      method: "query",
      query: authAPIName + "," + downloadTaskAPIName
    };

    return _jsonPromise({
      url: url,
      data: data      
    }).then(_onApiInfoSucceded, function(x){ "Error: " + x });        
  };

  var _requestLogin = function(username, password) {
    return _getApiInfo().then(function(){
      var url = protocol + host + ":" + port + 
              "/webapi/" + authInfo.path;
      var data = {
        api: authAPIName,
        version: authInfo.maxVersion,
        method: "login",
        account: username,
        passwd: password,
        session: "DownloadStation",
        format: "cookie"
      };

      return _jsonPromise({
        url: url,
        data: data,        
      }).then(function(o){ loggedIn = true; }, function(){ loggedIn = false; });
    });    
  };

  var _requestLogout = function() {
    if (loggedIn)
    {
      var url = protocol + host + ":" + port + 
              "/webapi/" + authInfo.path;
      var data = {
        api: authAPIName,
        version: authInfo.maxVersion,
        method: "logout",        
        session: "DownloadStation"        
      };

      return _jsonPromise({
        url: url,
        data: data        
      }).then(function(){ loggedIn = false; });
    }
    else
    {
    	return new Promise(function(resolve, reject){ resolve(); })
    }
  };

  var _requestDownload = function(username, password, dUrl) {
    loggedIn = false;
    return _requestLogin(username, password).then(function(){
      if (loggedIn)
      {
        var url = protocol + host + ":" + port + 
                "/webapi/" + downloadTaskInfo.path;
        var data = {
          api: downloadTaskAPIName,
          version: downloadTaskInfo.maxVersion,
          method: "create",        
          uri: dUrl        
        };        
        return _jsonPromise({
          url: url,
          data: data          
        }).then(_requestLogout);        
      }
      else
      {
      	return new Promise(function(resolve, reject){ reject(); })
      }
    });
    
  };


  chrome.contextMenus.onClicked.addListener(function(info, tab){
		if (info.menuItemId == 'addToSynologyMenu'){
			host = localStorage['olric86.synology.host'] ? localStorage['olric86.synology.host'] : "";
  		protocol = "http://";
  		port = localStorage['olric86.synology.port'] ? localStorage['olric86.synology.port'] : "5000";
  		username = localStorage['olric86.synology.username'] ? localStorage['olric86.synology.username'] : "";  
  		password = localStorage['olric86.synology.password'] ? localStorage['olric86.synology.password'] : "";
			chrome.browserAction.setBadgeBackgroundColor({color: "#FFFD70"});
      chrome.browserAction.setBadgeText({text: "..."});      
      _requestDownload(username, password, info.linkUrl).then(function(){
        chrome.browserAction.setBadgeBackgroundColor({color: "#8DFF70"});
        chrome.browserAction.setBadgeText({text: "Ok"});      
        setTimeout(function(){
          chrome.browserAction.setBadgeText({text: ""});      
        }, 2000);
      }, function(){
        chrome.browserAction.setBadgeBackgroundColor({color: "#FF173E"});
        chrome.browserAction.setBadgeText({text: "KO"});      
        setTimeout(function(){
          chrome.browserAction.setBadgeText({text: ""});      
        }, 2000);
      });
		}
	});

	if (chrome.runtime) {	
		chrome.runtime.onInstalled.addListener(function(){
			chrome.contextMenus.create({
				type: "normal",
				id:   "addToSynologyMenu",
				contexts: ["link"],
				title: "Add to my synology"
			});
		});

		// register the message that will be sent by the content script
		chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse){
			_readConf();
			if (msg.action == "download" && msg.url)
			{				
				if (host != "" && username != "" && password != "")
				{
					_requestDownload(username, password, msg.url).then(function(){						
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
              chrome.tabs.sendMessage(tabs[0].id, {msg: "downloadOK", url: msg.url});
            });
					}, function(){
						chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
              chrome.tabs.sendMessage(tabs[0].id, {msg: "downloadKO", url: msg.url});
            });
					});	
				}
				else
				{
					sendResponse({msg: "invalidConfiguration"});
				}
				
			}			
      else if (msg.action == "checkLogin" && msg.usr && msg.pwd && msg.id)
      {
        _requestLogin(msg.usr, msg.pwd).then(function(){
          if (loggedIn)
          {
            chrome.runtime.sendMessage({action: 'loginChecked', msg: "authOK", id: msg.id});          
          }
          else
          {
            chrome.runtime.sendMessage({action: 'loginChecked', msg: "authKO", id: msg.id});  
          }
        }, function(){
          chrome.runtime.sendMessage({action: 'loginChecked', msg: "authKO", id: msg.id});
        });
      }
		});

	}
})();


