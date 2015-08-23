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
					switch (message.msg) {
						case "downloadOK":
							button.textContent = "Done!";
							button.disabled = false;
							button.classList.add('done');
							break;
						case "downloadKO":
							button.textContent = "Error";
							button.disabled = false;
							button.className = "btn btn-danger btn-block";
							button.title = "Error getting the zip download link";
							break;
						case "invalidConfiguration":
						default:
							button.textContent = "Error";
							button.title = "Configuration error";
							button.disabled = false;
							button.className = "btn btn-danger btn-block";
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
			button.textContent = "Error";
			button.title = "Error creating the download";
			button.disabled = false;
			button.className = "btn btn-danger btn-block";
		}
	}
};

var _onDownloadError = function(e) {
	if (e.target)
	{
		var button = e.target.button;
		button.textContent = "Error";
		button.title = "Error creating the download";
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
		this.textContent = "Requesting...";
		x.open("GET", this.downloadLink, true);
		x.addEventListener('error', _onDownloadError, false);
		x.addEventListener('load', _onDownloadPageRetrieved, false);
		x.send(null);
	}
};

var _onInterval = function(){
	var nodes = document.querySelectorAll("div.torrentItem");
	for (var i = 0; i < nodes.length; i++){
		var n = nodes[i];
		var deleteButton = n.querySelector("button.torrent-deletebutton");
		if (deleteButton && !deleteButton.parentNode.classList.contains("syno"))
		{
			// Is the progress bar present?
			var progressBar = n.querySelector("div.progress");
			var downloadLink = n.querySelector('a.torrentlink');

			if (!progressBar && downloadLink)
			{
				// create a new button
				var btn = document.createElement("button");
				btn.className = "btn btn-primary btn-block";

				btn.downloadLink = downloadLink.href;
				btn.addEventListener('click', _onButtonClicked, false);

				var icon = document.createElement("span");
				icon.className = "glyphicon glyphicon-arrow-up";

				var text = document.createElement("span");
				text.textContent = "Send";

				btn.title = "Send to the configured Synology Nas Server";
				btn.appendChild(icon);
				btn.appendChild(text);

				deleteButton.parentNode.insertBefore(btn, deleteButton);
				deleteButton.parentNode.classList.add("syno");
			}
		}
	}
};



var interval = setInterval(_onInterval, 2000);
