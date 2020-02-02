const { ipcRenderer } = require('electron')
const {renderGraph, renderArea, updateGraph, updateArea} = require('./renderCharts')
const {runSerial} = require('./serial')

var SerialNumber = ""
var ChannelId = ""
var graph = null
var graph2 = null
var startingTime = 0
var paused = false
var serial = null

function renderStorage (records) {
  const recordItems = records.reduce((html, record) => {
    html += `<li class="record-item">[${new Date(record.TimeStamp).toLocaleTimeString('en-US', { hour12: false })}] ${record.Answer} ${record.ClickerID}</li>`

    return html
  }, '')
  return recordItems
}

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1) ) + min;
}

function changeBtnPressed() {
  var i = 0
  graph.data.datasets[0].data.forEach(element => {
    graph.data.datasets[0].data[i] = element + 1
    i = i + 1
  });
  graph.update()
}

function newQBtnPressed () {
  ipcRenderer.send('new-question')
}

function newRecordBtnPressed () {
  const letterChoices = ['A', 'B', 'C', 'D', 'E']
  const record = {'UniqueID': 0, 'Answer': letterChoices[getRndInteger(0,4)], 'ClickerID': 'EE00'+String(getRndInteger(10,99))+'EE', 'TimeStamp': Date.now()}
  ipcRenderer.send('add-input', record)
}

function saveSBtnPressed() {
  const serialNumberInput = document.getElementById('settings__serialnumber')
  const channelIdInput = document.getElementById('settings__channelid')
  SerialNumber = serialNumberInput.value
  ChannelId = channelIdInput.value
  ChannelId = ChannelId.toUpperCase().slice(0,2)
  ChannelId = /^[a-eA-E]*$/.test(ChannelId) ? ChannelId : 'AA'
  ipcRenderer.send('save-settings', {serialNumber: SerialNumber, channelId: ChannelId})
  HideOverlay()
}

function caBtnPressed (answer) {
  ipcRenderer.send('correct-answer', answer)
}

function clearChecked () {
  const radio_A = document.getElementById('radio_A')
  const radio_B = document.getElementById('radio_B')
  const radio_C = document.getElementById('radio_C')
  const radio_D = document.getElementById('radio_D')
  const radio_E = document.getElementById('radio_E')
  radio_A.checked = radio_B.checked = radio_C.checked = radio_D.checked = radio_E.checked = false
}

function showChecked (checked_char) {
  if (checked_char !== '') {
    const radio_A = document.getElementById('radio_A')
    const radio_B = document.getElementById('radio_B')
    const radio_C = document.getElementById('radio_C')
    const radio_D = document.getElementById('radio_D')
    const radio_E = document.getElementById('radio_E')
    const checked = {'A': radio_A, 'B': radio_B, 'C': radio_C, 'D': radio_D, 'E': radio_E}
    checked[checked_char].checked = true
  } else {
    clearChecked()
  }
}

function ShowOverlay() {
  document.getElementById("overlay").style.display = "block";
  document.getElementById("settings__serialnumber").value = SerialNumber
  document.getElementById("settings__channelid").value = ChannelId
}

function HideOverlay() {
  document.getElementById("overlay").style.display = "none";
}

function prevQBtnPressed () {
  ipcRenderer.send("prev-question")
}

function nextQBtnPressed () {
  ipcRenderer.send("next-question")
}

function deleteBtnPressed () {
  ipcRenderer.send("delete-question")
}

function pauseBtnPressed () {
  const playButton = document.getElementById('navbar__play')
  const pauseButton = document.getElementById('navbar__pause')
  ipcRenderer.send("pause-question")
  paused = !paused
  console.log("pause press")
  if (paused) {
    pauseButton.style.display = 'none'
    playButton.style.display = 'block'
  } else {
    pauseButton.style.display = 'block'
    playButton.style.display = 'none'
  }
  console.log("Paused: ", paused)
}

function clrBtnPressed () {
  clearChecked()
}

ipcRenderer.send('rendered')

ipcRenderer.on('canswer-input', (event, input) => {
  showChecked(input)
})

// on receive records
ipcRenderer.on('question', (event, question, id, sortedQ) => {
  // get the recordList ul
  const recordList = document.getElementById('recordList')
  const questionNum = document.getElementById('question-number')
  questionNum.innerHTML = `Question ${id+1}`
  // create html string

  // set list html to the record items
  // recordList.innerHTML = renderStorage(sortedQ)

  // add click handlers to delete the clicked record
  // recordList.querySelectorAll('.record-item').forEach(item => {
  //   item.addEventListener('click', deleteRecord)
  // })
})

ipcRenderer.on('settings', (event, settings, mainPaused) => {
  SerialNumber = settings.serialNumber
  ChannelId = settings.channelId
  const serialNumberInput = document.getElementById('settings__serialnumber')
  const channelIdInput = document.getElementById('settings__channelid')
  runSerial(settings.serialNumber, settings.channelId)
  serialNumberInput.value = `${settings.serialNumber}`
  serialNumberInput.value = `${settings.channelId}`
  paused = mainPaused
  console.log('yoy', mainPaused)
  if (mainPaused) {
    console.log('switching icons')
    const playButton = document.getElementById('navbar__play')
    const pauseButton = document.getElementById('navbar__pause')
    pauseButton.style.display = 'none'
    console.log('pButton display:',pauseButton.style.display)
    playButton.style.display = 'block'
  }
})


ipcRenderer.on('records', (event, newRecord) => {
  const recordList = document.getElementById('recordList')

  recordList.innerHTML = recordList.innerHTML + `<li class="record-item">[${new Date(newRecord.TimeStamp).toLocaleTimeString('en-US', { hour12: false })}] ${newRecord.Answer} ${newRecord.ClickerID}</li>`
})

ipcRenderer.on('record-tally', (event, recordTally) => {
  // get the recordList ul
  const recordTallyDoc = document.getElementById('record-tally')

  recordTallyDoc.innerHTML = `A:${recordTally.A} B:${recordTally.B} C:${recordTally.C} D:${recordTally.D} E:${recordTally.E}`
})

ipcRenderer.on('record-graph', (event, recordTally) => {
  updateGraph(graph, recordTally.A, recordTally.B, recordTally.C, recordTally.D, recordTally.E)
})

ipcRenderer.on('record-time-graph', (event, record, prevRecord, RecordTally) => {
  updateArea(graph2, record, prevRecord, RecordTally)
})

ipcRenderer.on('record-graph-new', (event, recordTally) => {
  var recordGraphDoc = document.getElementById('answer-graph')
  if (graph !== null) {
    updateGraph(graph, recordTally.A, recordTally.B, recordTally.C, recordTally.D, recordTally.E)
  } else {
    graph = renderGraph(recordGraphDoc, recordTally.A, recordTally.B, recordTally.C, recordTally.D, recordTally.E)
  }
})

ipcRenderer.on('record-time-graph-new', (event, records, qstartTime) => {
  const startTime = records.length > 0 ? records[0].TimeStamp : qstartTime
  var recordGraphDoc2 = document.getElementById('time-graph')
  if (graph2 !== null) {
    graph2.destroy()
  }
  graph2 = renderArea(recordGraphDoc2, records, startTime)
  startingTime = startTime
})