// Adapted from Michel Plungjan (https://jsfiddle.net/mplungjan/r5v7q1js/)
function buildTable (header, data) {
  var table = document.createElement("table");
  table.className="gridtable";
  var thead = document.createElement("thead");
  var tbody = document.createElement("tbody");
  var headRow = document.createElement("tr");
  header.forEach(function(el) {
    var th=document.createElement("th");
    th.appendChild(document.createTextNode(el));
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead); 
  data.forEach(function(el) {
    var tr = document.createElement("tr");
    for (var o in el) {  
      var td = document.createElement("td");
      td.appendChild(document.createTextNode(el[o]))
      tr.appendChild(td);
    }
    tbody.appendChild(tr);  
  });
  table.appendChild(tbody);             
  return table;
}

module.exports = {buildTable}