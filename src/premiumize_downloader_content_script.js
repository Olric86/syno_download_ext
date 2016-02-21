var _onDownloadPageRetrieved = function(e){

	if (e.target)
	{
		var button = e.target.button;
		try
		{
			var r = e.target.responseText;
			var button = e.target.button;
			// try  to retrieve the link
			var d = document.createElement("div");
			d.innerHTML = r;
			var a = d.querySelector("div.panel-body > div.row p > a");

			// add the event listener
			// the request takes to much time and the response in the
			// sendMessage func cannot be used

			var _onMessageReceived = function(message, sender) {
				if (message.url && message.url == a.href)
				{
					// change the icon
					var span = button.querySelector("span.glyphicon");
					switch (message.msg) {
						case "downloadOK":
							button.title = "Done!";
							button.className = "btn btn-success btn-block";
							if (span) {
								span.className = "glyphicon glyphicon-ok";
							}
							button.disabled = false;
							button.classList.add('done');
							break;
						case "downloadKO":
							// button.textContent = "Error";
							button.disabled = false;
							button.className = "btn btn-danger btn-block";
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
							button.className = "btn btn-danger btn-block";
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
				url: a.href
			});
		}
		catch (e)
		{
			console.log(e);
			button.title = "Error creating the download";
			button.disabled = false;
			// change the icon
			var span = button.querySelector("span.glyphicon");
			if (span) {
				span.className = "glyphicon glyphicon-exclamation-sign";
			}
			button.className = "btn btn-danger btn-block";
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
		button.className = "btn btn-danger btn-block";
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
		x.open("GET", this.downloadLink, true);
		x.addEventListener('error', _onDownloadError, false);
		x.addEventListener('load', _onDownloadPageRetrieved, false);
		x.send(null);
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

			if (!progressBar && downloadLink)
			{
				// create a new button
				var btn = document.createElement("button");
				btn.className = "btn btn-primary btn-block";

				btn.downloadLink = downloadLink.href;
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
