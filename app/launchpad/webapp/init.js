sap.ui.define([
  "sap/m/TileContainer",
  "sap/m/StandardTile"
], function (TileContainer, StandardTile) {
  "use strict";

  new TileContainer({
    tiles: [
      new StandardTile({
        title: "Project Master Data",
        icon: "sap-icon://project-definition-triangle",
        press: function () {
          window.location.href = "/projectmasterdata/index.html";
        }
      }),
      new StandardTile({
        title: "Learning Master Data",
        icon: "sap-icon://learning-assistant",
        press: function () {
          window.location.href = "/learningmasterdata/index.html";
        }
      }),
      new StandardTile({
        title: "Employee Management",
        icon: "sap-icon://employee",
        press: function () {
          window.location.href = "/employeeadministration/index.html";
        }
      })
    ]
  }).placeAt("content");
});