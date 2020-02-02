const Store = require('electron-store')

class DataStore extends Store {
  constructor (settings) {
    super(settings)

    this.questions = this.get('questions') || []
    this.question = null
  }

  saveQuestions() {
    this.set('questions', this.questions)

    return this
  }

  getQuestions () {
    this.questions = this.get('questions') || []

    return this
  }

  getQuestion (id) {
    if (this.questions.length > id) {
      this.questions = this.get('questions') || []

      return this.questions[id] || []
    }
    return this.questions[this.questions.length - 1]
  }

  getRecords (id) {
    if (this.questions.length > id) {
      this.questions = this.get('questions') || []

      return this.questions[id].records || []
    }
    return this.questions[this.questions.length - 1].records
  }

  getRecordsByField (id, field, value) {
    const questions = this.get('questions') || []
    var match = []

    if (questions.length > 0) {
      questions[id].records.forEach(record => {
        if(record[field] !== null && record[field] === value) {
          match = [ ...match, record]
        }
      });
    }

    return match
  }

  sortRecordsByField (id, field) {
    var questions = this.get('questions') || []

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
    if (questions.length > id) {
      questions[id].records.sort(compareValues(field))
      this.questions = questions
      return this.saveQuestions().questions[id].records
    }
    return this.questions[this.questions.length - 1].records
  }

  replaceRecord (id, field, value, newRecord) {
    var questions = this.get('questions') || []
    var match = 0
    var i = 0

    if (questions.length > id) {
      questions[id].records.forEach(record => {
        if(record[field] !== null && record[field] === value) {
          questions[id].records.splice(i, 1)
          match = match + 1
        }
        i = i + 1
      });

      questions[id].records = [ ...questions[id].records, newRecord]
      
      this.questions = questions
      return this.saveQuestions().questions[id].records
    }
    return this.questions[this.questions.length - 1].records
  }

  addRecord (id, record) {
    if (this.questions.length > id) {
      this.questions[id].records = [ ...this.questions[id].records, record]
    }
    return this.saveQuestions()
  }

  addQuestion () {
    var question = {records: [], startTime: null, endTime: null, correctAnswer: "", class: ""}
    this.questions = [ ...this.questions, question]

    return this.saveQuestions()
  }

  updateQuestion (id, field, value) {
    if (this.questions.length > id) {
      this.questions[id][field] = value
    }
    return this.saveQuestions()
  }

  deleteQuestion (question) {
    this.questions = this.questions.filter(r => r !== question)

    return this.saveQuestions()
  }

  deleteAllQuestions () {
    this.questions = []

    return this.saveQuestions()
  }
}

module.exports = DataStore