const config = require("config");
const { create } = require("axios");
const { dsvFormat } = require("d3-dsv");
const { timeParse } = require("d3-time-format");

const BASE_URL = config.get("services.climate_change.base_url");
const TIMEOUT = config.get("services.climate_change.timeout");

const dataRequest = create({
  timeout: TIMEOUT,
  baseURL: BASE_URL,
});

function readBasicFile(pth) {
  return dataRequest.get(pth).then(function (response) {
    const textString = response.data;

    var rows = textString.split("\n");
    var new_rows = [];
    var special_data = {};
    var cnt = 0;

    for (var i = 0; i < rows.length; i++) {
      if (rows[i].length > 3) {
        if (rows[i].charAt(0) != "%") {
          items = rows[i].trim().split(" ");
          items_new = [];
          for (var j = 0; j < items.length; j++) {
            if (items[j].length > 0) {
              items_new.push(items[j]);
            }
          }
          new_rows.push(items_new.join(" "));
        } else if (rows[i].charAt(0) == "%" && rows[i].charAt(1) == "%") {
          items = rows[i].substring(2, rows[i].length).trim().split(":");
          if (items.length == 2) {
            special_data[items[0].trim()] = items[1].trim();
          } else {
            special_data["Unknown" + String(cnt++)] = items.join(":");
          }
        }
      }
    }

    data = dsvFormat(" ").parseRows(new_rows.join("\n"));

    special_data["content"] = data;

    return special_data;
  });
}

exports.readTemperatureFile = (pth) => {
  return readBasicFile(pth).then(function (data) {
    var content = data["content"];
    var new_content = [];

    for (var i = 0; i < content.length; i++) {
      date = timeParse("%Y-%m")(content[i][0] + "-" + content[i][1]);
      for (var j = 2; j < content[i].length; j++) {
        if (content[i][j] == "NaN") {
          content[i][j] = null;
        } else {
          content[i][j] = Number(content[i][j]);
        }
      }
      new_content.push({
        date: date.getTime(),
        monthly_value: content[i][2],
        monthly_unc: content[i][3],
        annual_value: content[i][4],
        annual_unc: content[i][5],
        five_value: content[i][6],
        five_unc: content[i][7],
        ten_value: content[i][8],
        ten_unc: content[i][9],
        twenty_value: content[i][10],
        twenty_unc: content[i][11],
      });
    }
    data["content"] = new_content;

    var mean_val = data["Estimated Jan 1951-Dec 1980 absolute temperature (C)"];
    mean_val = mean_val.split("+/-");
    data["baseline_value"] = Number(mean_val[0]);
    data["baseline_unc"] = Number(mean_val[1]);

    var seasonal_string = data["Unknown0"];

    var seasonal_averages = [];
    seasonal_string = seasonal_string.split(" ");
    for (var i = 0; i < seasonal_string.length; i++) {
      if (seasonal_string[i] != "") {
        seasonal_averages.push(Number(seasonal_string[i]));
      }
    }

    delete data["Unknown0"];

    data["Seasonal Averages"] = seasonal_averages;

    var seasonal_string = data["Unknown1"];

    var seasonal_unc = [];
    seasonal_string = seasonal_string.split(" ");
    for (var i = 1; i < seasonal_string.length; i++) {
      if (seasonal_string[i] != "") {
        seasonal_unc.push(Number(seasonal_string[i]));
      }
    }

    delete data["Unknown1"];

    data["Seasonal Uncertainty"] = seasonal_unc;

    return data;
  });
};

exports.readCountsFile = (pth) => {
  return readBasicFile(pth).then(function (data) {
    var content = data["content"];
    var new_content = [];

    var isLocal = "Location" in data;

    for (var i = 0; i < content.length; i++) {
      date = timeParse("%Y-%m")(content[i][0] + "-" + content[i][1]);
      for (var j = 2; j < content[i].length; j++) {
        if (content[i][j] == "NaN") {
          content[i][j] = null;
        } else {
          content[i][j] = Number(content[i][j]);
        }
      }

      if (!isLocal) {
        new_content.push({
          date: date.getTime(),
          inside: content[i][2],
          plus10: content[i][3],
          plus50: content[i][4],
          plus100: content[i][5],
          plus250: content[i][6],
          plus500: content[i][7],
          plus1000: content[i][8],
        });
      } else {
        new_content.push({
          date: date.getTime(),
          plus10: content[i][2],
          plus50: content[i][3],
          plus100: content[i][4],
          plus250: content[i][5],
          plus500: content[i][6],
          plus1000: content[i][7],
        });
      }
    }
    data["content"] = new_content;

    return data;
  });
};
