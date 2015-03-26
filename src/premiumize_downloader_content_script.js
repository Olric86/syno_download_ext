var _onDownloadPageRetrieved = function(e){
	
	if (e.target)
	{
		var r = e.target.responseText;
		var button = e.target.button;
		// try  to retrieve the link
		var d = document.createElement("div");
		d.innerHTML = r;
		var a = d.querySelectorAll("#container > h2 > a")[0];		
		
		// add the event listener
		// the request takes to much time and the response in the
		// sendMessage func cannot be used

		var _onMessageReceived = function(message, sender) {
			if (message.url && message.url == a.href)
			{
				switch (message.msg) {
					case "downloadOK":
						button.textContent = "Done!";
						button.disabled = false;	
						button.classList.add('done');
						break;
					case "downloadKO":
						button.textContent = "Error creating the download";
						button.disabled = false;	
						button.className = "btn btn-danger";
						break;
					case "invalidConfiguration":
					default:
						button.textContent = "Configuration error";
						button.disabled = false;	
						button.className = "btn btn-danger";
						break;
				}
				// magic!! remove the listener. God I love Javascript closures
				chrome.runtime.onMessage.removeListener(_onMessageReceived);
			}
		};

		chrome.runtime.onMessage.addListener(_onMessageReceived);

		chrome.runtime.sendMessage({
			action: 'download',
			url: a.href
		});
	}
};


var _onButtonClicked = function(e){
	// this = button
	if (!this.classList.contains('done'))
	{
		var x = new XMLHttpRequest();
		x.button = this;
		this.disabled = true;
		this.textContent = "Requesting...";
		x.open("GET", this.downloadLink, true);
		x.addEventListener('error', function(e) { console.log(e); }, false);
		x.addEventListener('load', _onDownloadPageRetrieved, false);
		x.send(null);
	}
};

var _onInterval = function(){
	var nodes = document.querySelectorAll("div.torrentItem");
	for (var i = 0; i < nodes.length; i++){
		var n = nodes[i];
		var btnContainer = n.querySelector(".text-center");
		if (btnContainer && !btnContainer.classList.contains("syno"))
		{
			var downloadButton = btnContainer.querySelector(".btn.btn-primary");
			// download button present ?
			// and not disabled ?
			if (downloadButton && !downloadButton.classList.contains("disabled"))
			{
				// create a new button
				var btn = document.createElement("button");
				btn.className = "btn btn-primary";
				btn.textContent = "Add to my Synology";
				btn.style.marginLeft = "4px";
				btn.downloadLink = downloadButton.href;
				btn.addEventListener('click', _onButtonClicked, false);
				btnContainer.appendChild(btn);
				btnContainer.classList.add("syno");
			}
		}
	}
};



var interval = setInterval(_onInterval, 1000);