/*global QUnit*/

sap.ui.define([
	"qmreport/controller/QMreport.controller"
], function (Controller) {
	"use strict";

	QUnit.module("QMreport Controller");

	QUnit.test("I should test the QMreport controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
