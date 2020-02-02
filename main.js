const test = true

var paused = false

const electron = require('electron')
    // Module to control application life.
const app = electron.app
    // Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const ipcMain = electron.ipcMain

const path = require('path')
const url = require('url')

const DataStore = require('./DataStore')

const recordData = test ? new DataStore({ name: 'ClickScan Test' }) : new DataStore({ name: 'ClickScan Main' })

var answerCount = {'A' : 0, 'B': 0, 'C': 0, 'D': 0, 'E': 0}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 850,
        icon: 'assets/icon.png',
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js')
        }
    })

    // and load the index.html of the app.
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }))

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()
    
    // 

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        recordData.saveQuestion()
        mainWindow = null
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    app.quit()
})

app.on('activate', function() {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
})

ipcMain.on('correct-answer', (event, input) => {
  recordData.updateQuestion("correctAnswer", input)
})


function renderCommands () {
  const updatedQuestion = recordData.getQuestion()
  const settings = recordData.getSettings()
  const correctAnswer = updatedQuestion.correctAnswer
  const startTime = updatedQuestion.startTime
  const sortedQuestion = recordData.getRecordsByTimeStamp()
  answerCount.A = recordData.getRecordsByField("Answer", "A").length
  answerCount.B = recordData.getRecordsByField("Answer", "B").length
  answerCount.C = recordData.getRecordsByField("Answer", "C").length
  answerCount.D = recordData.getRecordsByField("Answer", "D").length
  answerCount.E = recordData.getRecordsByField("Answer", "E").length
  mainWindow.send('settings', settings, paused)
  mainWindow.send('question', updatedQuestion, recordData.getQuestionId(), sortedQuestion)
  mainWindow.send('record-tally', answerCount)
  mainWindow.send('record-graph-new', answerCount)
  mainWindow.send('canswer-input', correctAnswer)
  mainWindow.send('record-time-graph-new', sortedQuestion, startTime)
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
ipcMain.on('add-input', (event, input) => {
  if (input.Answer !== 'P' && !paused)  {
    const prevQuestion = recordData.getQuestion()
    const prevRecord = recordData.addRecord(input)
    const updatedQuestion = recordData.getQuestion()
    if (prevQuestion.records.length < 1) {
      recordData.updateQuestion("startTime", input.TimeStamp)
    }
    if (prevRecord !== null) {
      answerCount[prevRecord.Answer]--
    }
    answerCount[input.Answer]++
    mainWindow.send('records', input)
    mainWindow.send('record-tally', answerCount)
    mainWindow.send('record-graph', answerCount)
    mainWindow.send('record-time-graph', input, prevRecord, answerCount)
  }
})

ipcMain.on('rendered', (event, input) => {
  renderCommands()
})

ipcMain.on('save-settings', (event, input) => {
  recordData.setSettings(input)
  recordData.saveSettings()
})

ipcMain.on('clear-records', (event, input) => {
  // recordData.deleteAllRecord()
  answerCount.A = answerCount.B = answerCount.C = answerCount.D = answerCount.E = 0
})

ipcMain.on('prev-question', (event, input) => {
  const id = recordData.getQuestionId()
  recordData.loadQuestion(id === 0 ? 0 : id - 1)
  renderCommands()
})

ipcMain.on('next-question', (event, input) => {
  const id = recordData.getQuestionId()
  recordData.loadQuestion(id + 1)
  renderCommands()
})

ipcMain.on('pause-question', (event, input) => {
  paused = !paused
})

ipcMain.on('delete-question', (event, input) => {
  recordData.deleteQuestion()
  renderCommands()
})

ipcMain.on('new-question', (event, input) => {
  if(Object.keys(recordData.getQuestion().records).length > 0) {
    recordData.updateQuestion("endTime", Date.now())
    recordData.newQuestion()
    recordData.updateQuestion("startTime", Date.now())
    renderCommands()
  }
})