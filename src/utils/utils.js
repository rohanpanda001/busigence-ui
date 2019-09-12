import React from "react";

export const params = {
  post: {
    method: "post",
    config: {
      headers: {
        "Content-Type": "application/json"
      }
    }
  }
};

export const getAllColumns = selectedElements => {
  const columnList = Object.keys(selectedElements).reduce((acc, key) => {
    return [...acc, ...selectedElements[key]];
  }, []);
  const columnSet = new Set(columnList);
  return Array.from(columnSet);
};

export const getPrimaryKeyList = (selectedElements, selectedTables) => {
  const firstTable = selectedTables[1];
  const secondTable = selectedTables[2];

  const {
    [firstTable]: firstTableKeys = [],
    [secondTable]: secondTableKeys = []
  } = selectedElements;

  return firstTableKeys.filter(key => secondTableKeys.includes(key));
};

export const renderInfo = ({ icon, message }) => (
  <span
    style={{
      fontSize: 10,
      display: "flex",
      paddingTop: 10,
      paddingBottom: 10
    }}
  >
    {icon}
    <span style={{ paddingLeft: 5, alignSelf: "center" }}>{message}</span>
  </span>
);

function convertToCSV(objArray) {
  var array = typeof objArray !== "object" ? JSON.parse(objArray) : objArray;
  var str = "";

  for (var i = 0; i < array.length; i++) {
    var line = "";
    for (var index in array[i]) {
      if (line !== "") line += ",";

      line += array[i][index];
    }

    str += line + "\r\n";
  }

  return str;
}

export function exportCSVFile(document, headers, items, fileTitle) {
  if (headers) {
    items.unshift(headers);
  }

  // Convert Object to JSON
  var jsonObject = JSON.stringify(items);

  var csv = convertToCSV(jsonObject);

  var exportedFilenmae = fileTitle + ".csv" || "export.csv";

  var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  if (navigator.msSaveBlob) {
    // IE 10+
    navigator.msSaveBlob(blob, exportedFilenmae);
  } else {
    var link = document.createElement("a");
    if (link.download !== undefined) {
      // feature detection
      // Browsers that support HTML5 download attribute
      var url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", exportedFilenmae);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}

export function processData(csv) {
  var allTextLines = csv.split(/\r\n|\n/);
  var lines = [];
  for (var i = 0; i < allTextLines.length; i++) {
    var data = allTextLines[i].split(",");
    var tarr = [];
    for (var j = 0; j < data.length; j++) {
      tarr.push(data[j]);
    }
    lines.push(tarr);
  }
  return lines;
}

export const getRows = (data, columns) =>
  data.map(row => {
    return row.reduce((acc, field, index) => {
      const { [index]: key } = columns;
      acc[key] = field;
      return acc;
    }, {});
  });
