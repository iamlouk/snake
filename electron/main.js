const { app, BrowserWindow } = require('electron');

let window = null;

app.on('ready', () => {

	window = new BrowserWindow({
		width: 506,
		height: 528,
		show: false,
		frame: true,
		fullscreenable: false,
		resizable: true,
		transparent: true
	});

	window.loadURL('file://'+__dirname+'/index.html');
	window.show();

});

app.on('window-all-closed', () => app.quit());
