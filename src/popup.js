var App = (function(){
  var host = localStorage['olric86.synology.host'] ? localStorage['olric86.synology.host'] : "";
  var protocol = "http://";
  var port = localStorage['olric86.synology.port'] ? localStorage['olric86.synology.port'] : "5000";
  var username = localStorage['olric86.synology.username'] ? localStorage['olric86.synology.username'] : "";  
  var password = localStorage['olric86.synology.password'] ? localStorage['olric86.synology.password'] : "";
  
  var _setConf = function() {
    localStorage['olric86.synology.host'] = document.getElementById("host").value;
    localStorage['olric86.synology.port'] = document.getElementById("port").value;
    localStorage['olric86.synology.username'] = document.getElementById("username").value;
    localStorage['olric86.synology.password'] = document.getElementById("password").value;
  };

  document.addEventListener("DOMContentLoaded", function(){
    document.getElementById('host').value = host;
    document.getElementById('port').value = port;
    document.getElementById('username').value = username;
    document.getElementById('password').value = password;
    document.getElementById('saveButton').addEventListener('click', function(){
      _setConf();
      window.close();
    }, false);

    document.getElementById('testButton').addEventListener('click', function(){
      _setConf();
      if (localStorage['olric86.synology.username'] && 
          localStorage['olric86.synology.password'] )
      {
        
        var id = Date.now();
        var messageText = document.getElementById('messageText');
        var preloader = document.getElementById('preloader');
        var messageEl = document.getElementById('message');

        var _onMessageReceived = function(message, sender) {
          if (message.id == id && message.action == 'loginChecked')
          {            
            // magic!! remove the listener. God I love Javascript closures
            chrome.runtime.onMessage.removeListener(_onMessageReceived);        
            
            // Check the status
            if (message.msg == "authOK")
            {
              messageText.textContent = "Success!";
              messageText.className = "success";              
              messageEl.classList.add('visible');
              preloader.classList.remove('visible');

              setTimeout(function(){
                messageEl.classList.remove('visible');
              }, 4000);
              
            }
            else
            {
              messageText.textContent = "Error!";
              messageText.className = "error";
              preloader.classList.remove('visible');
              messageEl.classList.add('visible');
              
              setTimeout(function(){
                messageEl.classList.remove('visible');
              }, 4000);
            }
          }
        };
        
        chrome.runtime.onMessage.addListener(_onMessageReceived);
        
        preloader.classList.add('visible');
        
        // send a message to the extension
        chrome.runtime.sendMessage({
          action: 'checkLogin',
          id: id,
          usr: localStorage['olric86.synology.username'],
          pwd: localStorage['olric86.synology.password']
        });
      }
      

    }, false);
  });


})();