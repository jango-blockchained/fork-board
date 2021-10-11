const {app, BrowserWindow, Menu, MenuItem, ipcMain} = require('electron') 
const url = require('url') 
const path = require('path')  
const axios = require('axios')
const https = require('https');
const agent = new https.Agent({rejectUnauthorized: false});
let baseAllTheBlocksApiUrl = "https://api.alltheblocks.net";

let win
let walletDetails

function createWindow() { 
   win = new BrowserWindow({width: 1000, height: 900}) 
   win.loadURL(url.format ({ 
      pathname: path.join(__dirname, 'index.html'), 
      protocol: 'file:', 
      slashes: true 
   })) 
}

function createWalletDetailsWindow(coin) {
   walletDetails = new BrowserWindow({
     width: 600,
     height: 600,
     modal: true,
     show: false,
     parent: win, // Make sure to add parent window here
     autoHideMenuBar: true,
   
     // Make sure to add webPreferences with below configuration
     webPreferences: {
       nodeIntegration: true,
       contextIsolation: false,
       enableRemoteModule: true,
     },
   });
   
   walletDetails.loadURL(url.format ({ 
      pathname: path.join(__dirname, 'walletDetails.html'), 
      protocol: 'file:', 
      slashes: true 
   })) 

   walletDetails.once("show", function() {
      console.log('Sending load-wallet-details event: ' + coin);
      walletDetails.webContents.send("load-wallet-details", [coin]);
    });

   walletDetails.once("ready-to-show", () => {
      
      console.log('Ready to show');
      walletDetails.show();
   });
}

function createNFTRecoveryWindow() {
   walletDetails = new BrowserWindow({
     width: 1000,
     height: 800,
     modal: true,
     show: false,
     parent: win, // Make sure to add parent window here
     autoHideMenuBar: true,
   });
   
   walletDetails.loadURL(url.format ({ 
      pathname: '/nft-recovery', 
      protocol: 'https', 
      hostname: 'alltheblocks.net'
   })) 

   walletDetails.once("ready-to-show", () => {
      
      console.log('Ready to show');
      walletDetails.show();
   });


}

ipcMain.on("close-wallet-details", (event, arg) => {
   console.log('Hiding wallet details');
   walletDetails.hide();
});

ipcMain.on("open-wallet-details", (event, arg) => {

   if (arg.length == 1)
   {  
      let coin = arg[0];

      console.log("Create wallet details window for :" + coin)
      
      createWalletDetailsWindow(coin);
   }
});

ipcMain.on("open-nft-recovery-site", (event, arg) => {
   createNFTRecoveryWindow();
});

// Event handler for asynchronous incoming messages
ipcMain.on('async-get-wallet-balance', (event, arg) => {
   console.log('Received async-get-wallet-balance event');
   if (arg.length == 3)
   {
      let wallet = arg[0];
      let coin = arg[1];
      let multiplier = arg[2];
      let url = baseAllTheBlocksApiUrl + "/" + coin + "/address/" + wallet;

      console.log('Wallet: ' + wallet + ', Coin: ' + coin + ', Multiplier: ' + multiplier); 

      axios.get(url, { httpsAgent: agent })
      .then((result) => {
         console.log('Sending async-get-wallet-balance-reply event');
         event.sender.send('async-get-wallet-balance-reply', [coin, wallet, result.data.balance*multiplier, result.data.balanceBefore*multiplier]);
      })
      .catch((error) => {
         console.log(error);
      });
   }
});



ipcMain.on('async-get-recoverable-wallet-balance', (event, arg) => {
   console.log('Received async-get-recoverable-wallet-balance event');
   if (arg.length == 1)
   {
      //https://api.alltheblocks.net/atb/nft/{0}/eligible
      let launcherid = arg[0];
      let url = baseAllTheBlocksApiUrl + "/atb/nft/" + launcherid + "/eligible";

      axios.get(url, { httpsAgent: agent })
      .then((result) => {
         console.log('Sending async-get-recoverable-wallet-balance-reply event');
         event.sender.send('async-get-recoverable-wallet-balance-reply', result.data);
      })
      .catch((error) => {
         console.log(error);
      });
   }
});

//https://xchscan.com/api/chia-price

const template = [
   {
      label: 'File',
      submenu: [
         {
            label: 'Add Wallet',
            click() {
               win.webContents.send('async-add-wallet', []);
            }
         },
         {
            label: 'Refresh',
            click() {
               win.webContents.send('async-refresh-wallets', []);
            }
         },
         {
            type: 'separator'
         },
         {
            role: 'close'
         }
      ]
   },
   {
      label: 'View',
      submenu: [
         {
            role: 'toggledevtools'
         },
         {
            role: 'reload'
         },
         {
            type: 'separator'
         },
         {
            role: 'resetzoom'
         },
         {
            role: 'zoomin'
         },
         {
            role: 'zoomout'
         },
         {
            type: 'separator'
         },
         {
            role: 'togglefullscreen'
         }
      ]
   },   
   {
      role: 'help',
      submenu: [
         {
            label: 'Learn More'
         }
      ]
   }
]

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu);

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on ('ready', createWindow);

app.on('window-all-closed', () => {
   if (process.platform !== 'darwin') {
     app.quit();
   }
 });

 app.on('activate', () => {
   if (BrowserWindow.getAllWindows().length === 0) {
     createWindow();
   }
 });