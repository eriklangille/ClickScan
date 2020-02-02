// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const serialport = require('serialport')
const Readline = require('@serialport/parser-readline');
const {ipcRenderer} = require('electron')
const {buildTable} = require('./buildTable')

function runSerial(serialNumberText, serialChannelId) {
  serialport.list((err, ports) => {
    console.log('ports', ports);
    if (err) {
      document.getElementById('error').textContent = err.message
      return
    } else {
      document.getElementById('error').textContent = ''
    }

    if (ports.length === 0) {
      document.getElementById('error').textContent = 'No ports discovered'
    }

    let scannerPort = null

    ports.forEach(port => {
      if(port.serialNumber === serialNumberText) {
        scannerPort = port;
        return
      }
    })

    if (scannerPort !== null) {
      var port = new serialport(scannerPort.comName, {
        baudRate: 115200
      });
      port.on("open", function () {
        console.log('open');
        port.write(serialChannelId+"\n")
        console.log('Sent ', serialChannelId)
        const parser = port.pipe(new Readline({ delimiter: '\n' }));
        parser.on('data', data =>{
          if (!paused) {
            console.log(data);
          }
          const dataArray = data.replace(/(\r\n|\n|\r)/gm, "").split('-')
          const dataDict = dataArray.length === 3 ? {'UniqueID': dataArray[0], 'Answer': dataArray[1], 'ClickerID': dataArray[2], 'TimeStamp': Date.now()} : null
          if(dataDict !== null && !paused) {  
            ipcRenderer.send('add-input', dataDict)
          }
        });
      });
    }

    const headers = Object.keys(ports[0])
    let portsTable = []
    ports.forEach(port => portsTable.push(port))
    document.getElementById("ports").innerHTML = ``
    document.getElementById("ports").appendChild(buildTable(headers, portsTable))
  })
}

module.exports = {runSerial}
