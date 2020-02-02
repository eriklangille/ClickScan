const Store = require('electron-store')
const questionParameters = {records: {}, startTime: null, endTime: null, correctAnswer: "", class: ""}
const defaultArray = [questionParameters]
const defaultSettings = {serialNumber: '', channelId: 'AA'}

class DataStore extends Store {
  constructor (settings) {
    super(settings)
    this.settings = this.get('settings') || defaultSettings
    this.questions = this.get('questions') || defaultArray
    this.id = this.questions.length - 1
    this.question =  this.questions[this.id]
  }

  getSettings() {
    return this.settings
  }

  setSettings(settings) {
    this.settings = settings
    return this.settings
  }

  saveSettings() {
    this.set('settings', this.settings)
    return this.settings
  }
  
  saveQuestion() {
    this.questions[this.id] = this.question
    this.set('questions', this.questions)
    // console.log("len: ", this.questions.length)
    return this.question
  }

  loadQuestion (id = -1) {
    this.saveQuestion()
    this.questions = this.get('questions') || defaultArray
    if (this.questions.length > id && id > -1) {
      this.question = this.questions[id]
      this.id = id
      return this.question
    }
    this.id = this.questions.length - 1
    this.question =  this.questions[this.id]
    return this.question
  }

  newQuestion () {
    this.saveQuestion()
    this.id = this.questions.length
    this.question = questionParameters
    this.questions = [ ...this.questions, questionParameters]
    this.questions[this.id].startTime = Date.now()
    this.questions[this.id].records = {}
    this.question = this.questions[this.id]
    // console.log("len: ", this.questions.length)
    return this.saveQuestion()
  }

  updateQuestion (field, value) {
    this.question[field] = value
    return this.question
  }

  deleteQuestion () {
    // this.questions = this.questions.filter(r => r !== question)
    if (this.questions.length > 1) {
      this.questions.splice(this.id, 1)
      this.id = this.questions.length - 1
      this.question = this.questions[this.id]
      this.set('questions', this.questions)
    }
    else {
      this.questions = defaultArray
      this.id = 0
      this.question = this.questions[this.id]
      this.questions[this.id].startTime = Date.now();
      this.set('questions', this.questions)
    }
    return this.question
  }

  getQuestion () {
    return this.question
  }

  getQuestionId () {
    return this.id
  }

  getRecords () {
    return this.question.records
  }

  getRecordsByField (field, value) {
    var match = []
    for (var key in this.question.records) {
      var record = this.question.records[key]
      if(record[record.length - 1][field] !== null && record[record.length - 1][field] === value) {
        match = [ ...match, record]
      }
    }

    return match
  }

  getRecordsByTimeStamp () {
    var records = []
    for (var key in this.question.records) {
      var clicker = this.question.records[key]
      var i = 0
      clicker.forEach(record => {
        records = [ ...records, { ...record, 'LastAnswer': i > 0 ? clicker[i - 1].Answer : ''}]
        // records.push(record)
        i++
      })
    }

    records.sort(function(a,b){return a.TimeStamp > b.TimeStamp ? 1 : -1})
    return records
  }

  sortRecordsByField (field) {
    function compareValues(key, order='asc') {
      return function(a, b) {
        if(!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
          // property doesn't exist on either object
          return 0;
        }
    
        const varA = (typeof a[key] === 'string') ?
          a[key].toUpperCase() : a[key];
        const varB = (typeof b[key] === 'string') ?
          b[key].toUpperCase() : b[key];
    
        let comparison = 0;
        if (varA > varB) {
          comparison = 1;
        } else if (varA < varB) {
          comparison = -1;
        }
        return (
          (order == 'desc') ? (comparison * -1) : comparison
        );
      };
    }
    this.question.records.sort(compareValues(field))
    return this.question
  }

  replaceRecord (field, value, newRecord) {
    var match = []
    var i = 0

    this.question.records.forEach(record => {
      if(record[field] !== null && record[field] === value) {
        match = [ ...match, record]
        this.question.records.splice(i, 1)
      }
      i = i + 1
    });

    this.question.records = [ ...this.question.records, newRecord]
    return match
  }

  addRecord (record) {
    var prevRecord = null
    const recordDict = {'TimeStamp': record.TimeStamp, 'ClickerID' : record.ClickerID, 'Answer': record.Answer}
    try {
      prevRecord = this.question.records[record.ClickerID][this.question.records[record.ClickerID].length - 1]
      this.question.records[record.ClickerID].push(recordDict)
    }
    catch {
      this.question.records[record.ClickerID] = [recordDict]
    }
    return prevRecord
  }

  updateRecord (field, value, newRecord) {
    var match = 0
    var i = 0

    this.question.records.forEach(record => {
      if(record[field] !== null && record[field] === value) {
        this.question.records[i] = newRecord
        match = match + 1
      }
      i = i + 1
    });

    return this.question.records
  }

}

module.exports = DataStore