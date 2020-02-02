const Chart = require('chart.js');

module.exports = {
  renderGraph: function (ctx, numA, numB, numC, numD, numE) {
    var myBarChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['A', 'B', 'C', 'D', 'E'],
        datasets: [{
          label: '# of Votes',
          data: [numA, numB, numC, numD, numE],
          // data: [numA, numB, numC, numD, numE],
          backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(255, 206, 86, 0.2)',
            'rgba(75, 192, 192, 0.2)',
            'rgba(153, 102, 255, 0.2)',
          ],
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true,
              precision: 0
            }
          }],
          xAxes: [{
            barPercentage: 0.8,
            barThickness: 'flex',
            // maxBarThickness: 20,
            // minBarLength: 2,
            gridLines: {
              offsetGridLines: true
            }
          }]
        },
        legend: {
          display: false
        }
      }
    });
    return myBarChart
  },

  renderArea: function (ctx, records1, startTime) {
    var myLineChart = new Chart(ctx, {
      type: 'line',
      data: {
        // labels: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120]
      },
      options: {
        responsive: true,
        scales: {
          yAxes: [{
           ticks: {
              beginAtZero: true,
              precision: 0
            }
          }],
          xAxes: [{
            // maxBarThickness: 20,
            // minBarLength: 2,
            type: 'linear',
            gridLines: {
              offsetGridLines: true
            },
            ticks: {
              beginAtZero: false,
              precision: 0
            } 
          }]
        },
        elements: {
          line: {
              tension: 0 // disables bezier curves
          }
        },
        legend: {
          display: true
        }
      }
    });
  
    // A
    myLineChart.data.datasets.push({
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      borderColor: 'rgba(255, 99, 132, 0.9)',
      label: "A",
      data: []
    })
    // B
    myLineChart.data.datasets.push({
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      borderColor: 'rgba(54, 162, 235, 0.9)',
      label: "B",
      data: []
    })
    // C
    myLineChart.data.datasets.push({
      backgroundColor: 'rgba(255, 206, 86, 0.2)',
      borderColor: 'rgba(255, 206, 86, 0.9)',
      label: "C",
      data: []
    })
    // D
    myLineChart.data.datasets.push({
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      borderColor: 'rgba(75, 192, 192, 0.9)',
      label: "D",
      data: []
    })
    // E
    myLineChart.data.datasets.push({
      backgroundColor: 'rgba(153, 102, 255, 0.2)',
      borderColor: 'rgba(153, 102, 255, 0.9)',
      label: "E",
      data: []
    })
  
    const numbers = {A: 0, B: 1, C: 2, D: 3, E: 4}
    const count = [0, 0, 0, 0, 0]
  
      records1.forEach (record => {
        var num = numbers[record.Answer]
        var num2 = record.LastAnswer !== '' ? numbers[record.LastAnswer] : -1
        myLineChart.data.datasets[num].data.push(
          {x: Math.round((record.TimeStamp - startTime)/1000), y: count[num] + 1}
        )
        if (num2 > -1) {
          myLineChart.data.datasets[num2].data.push(
            {x: Math.round((record.TimeStamp - startTime)/1000), y: count[num2] - 1}
          )        
          count[num2] = count[num2] - 1
        }
        count[num] = count[num] + 1
      })
  
    myLineChart.update()
  
    return myLineChart
  },

  updateGraph: function (ctx, numA, numB, numC, numD, numE) {
    var i = 0
    var nums = [numA, numB, numC, numD, numE]
    ctx.data.datasets[0].data.forEach(element => {
      ctx.data.datasets[0].data[i] = nums[i]
      i = i + 1
    });
    ctx.update()
  },
  
  updateArea: function (ctx, record, prevRecord, recordTally) {
    const numbers = {'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4}
    var num = numbers[record.Answer]
    ctx.data.datasets[num].data.push(
      {x: Math.round((record.TimeStamp - startingTime)/1000), y: recordTally[record.Answer]}
    )
    if (prevRecord !== null) {
      var num2 = numbers[prevRecord.Answer]
      ctx.data.datasets[num2].data.push(
        {x: Math.round((record.TimeStamp - startingTime)/1000), y: recordTally[prevRecord.Answer]}
      )
    }
    ctx.update()
  },
}