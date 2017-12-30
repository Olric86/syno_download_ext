var _onDownloadPageRetrieved = function(e){

	if (e.target)
	{
		var button = e.target.button;
		
		var downloadURL = "";
		if (button && button.fileID)
		{
			var r = e.target.responseText;
			try {
				var resp = JSON.parse(r);
				if (resp.status && resp.status.toLowerCase() === "success") {
					var bFound = false;
					resp.content.every(function(val){
						if (val.id === button.fileID) {
							bFound = true;
							downloadURL = val.link;
							return false;
						}
						return true;
					});
				} else {
					_onDownloadError.call(e);	
				}
			} catch (e) {
				_onDownloadError.call(e);
			}
		} else if (button && button.folderID) {
			var r = e.target.responseText;
			try {
				var resp = JSON.parse(r);
				if (resp.status && resp.status.toLowerCase() === "success") {					
					downloadURL = resp.location;					
				} else {
					_onDownloadError.call(e);	
				}
			} catch (e) {
				_onDownloadError.call(e);
			}
		}
		if (downloadURL) {
			try {				
				// add the event listener
				// the request takes to much time and the response in the
				// sendMessage func cannot be used

				var _onMessageReceived = function(message, sender) {
					if (message.url && message.url == downloadURL)
					{
						// change the icon
						var span = button.querySelector("span.glyphicon");
						switch (message.msg) {
							case "downloadOK":
								button.title = "Done!";
								button.className = "btn btn-success";
								if (span) {
									span.className = "glyphicon glyphicon-ok";
								}
								button.disabled = false;
								button.classList.add('done');
								break;
							case "downloadKO":
								// button.textContent = "Error";
								button.disabled = false;
								button.className = "btn btn-danger";
								button.title = "Error getting the zip download link";
								if (span) {
									span.className = "glyphicon glyphicon-exclamation-sign";
								}
								break;
							case "invalidConfiguration":
							default:
								// button.textContent = "Error";
								button.title = "Configuration error";
								button.disabled = false;
								button.className = "btn btn-danger";
								if (span) {
									span.className = "glyphicon glyphicon-exclamation-sign";
								}
								break;
						}
						// magic!! remove the listener. God I love Javascript closures
						chrome.runtime.onMessage.removeListener(_onMessageReceived);
					}
				};				
				chrome.runtime.onMessage.addListener(_onMessageReceived);

				chrome.runtime.sendMessage({
					action: 'download',
					url: downloadURL
				});
			} catch (ex) {
				console.error(ex);
				_onDownloadError(e);
			}
		} else {
			_onDownloadError.call(e);
		}		
	}
};

var _onDownloadError = function(e) {
	if (e.target)
	{
		var button = e.target.button;
		// button.textContent = "Error";
		button.title = "Error creating the download";
		// change the icon
		var span = button.querySelector("span.glyphicon");
		if (span) {
			span.className = "glyphicon glyphicon-exclamation-sign";
		}
		button.disabled = false;
		button.className = "btn btn-danger";
	}
};

var _onButtonClicked = function(e){
	// this = button
	if (!this.classList.contains('done'))
	{
		var x = new XMLHttpRequest();
		x.button = this;
		this.disabled = true;
		this.title = "Requesting...";
		// change the icon
		var span = this.querySelector("span.glyphicon");
		if (span) {
			span.className = "glyphicon glyphicon-cog";
		}
		// check if it's a file or a folder
		// in case of file, retrieve the download link
		// in case of folder, request the zip generation.
		var token = null;
		document.cookie.split(";").every(function(val){
			var parts = val.trim().split("=");
				if (parts[0] === "xss-token") {
					token = parts[1];
					return false;
				}
			return true;
		});

		if (this.fileID && token) {
			var url = "https://www.premiumize.me/api/folder/list";
						
			x.open("GET", url, true);
			x.setRequestHeader("x-csrf-token", token);
			x.addEventListener('error', _onDownloadError, false);
			x.addEventListener('load', _onDownloadPageRetrieved, false);
			x.send(null);

		} else if (this.folderID && token) {
			x.open("POST", "https://www.premiumize.me/api/zip/generate", true);
			x.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			x.setRequestHeader("x-csrf-token", token);
			x.addEventListener('error', _onDownloadError, false);
			x.addEventListener('load', _onDownloadPageRetrieved, false);
			var formData = encodeURIComponent("items[0][id]") + "=" + encodeURIComponent(this.folderID) + "&" +
				encodeURIComponent("items[0][type]") + "=" + encodeURIComponent("folder");
			x.send(formData);
		} else {
			_onDownloadError.call(x);
		}
	}
};

var _onInterval = function(){
	var nodes = document.querySelectorAll("div.pmcard-row.row");
	for (var i = 0; i < nodes.length; i++){
		var n = nodes[i];
		var deleteButton = n.querySelector("span.glyphicon.glyphicon-trash");
		if (deleteButton && !deleteButton.parentNode.parentNode.classList.contains("syno"))
		{
			// Is the progress bar present?
			var progressBar = n.querySelector("div.progress");
			var downloadLink = n.querySelector('a:not(.hidden)');
			var folderID = null;
			var fileID = null;
			if (!progressBar && downloadLink)
			{
				// create a new button
				var btn = document.createElement("button");
				btn.className = "btn btn-primary";

				var url = downloadLink.href;
				var aParts = url.split("file_id=");
				if (aParts.length === 2) {
					fileID = aParts[1].trim();
				} else {
					aParts = url.split("folder_id=");
					if (aParts.length === 2) {
						folderID = aParts[1].trim();
					}
				}

				btn.downloadLink = downloadLink.href;
				btn.folderID = folderID;
				btn.fileID = fileID;
				btn.addEventListener('click', _onButtonClicked, false);

				var icon = document.createElement("span");
				icon.className = "glyphicon glyphicon-arrow-up";

				// var text = document.createElement("span");
				// text.textContent = "Send";

				btn.title = "Send to the configured Synology Nas Server";
				btn.appendChild(icon);
				// btn.appendChild(text);

				deleteButton.parentNode.parentNode.insertBefore(btn, deleteButton.parentNode);
				deleteButton.parentNode.parentNode.classList.add("syno");
			}
		}
	}
};



var interval = setInterval(_onInterval, 2000);
