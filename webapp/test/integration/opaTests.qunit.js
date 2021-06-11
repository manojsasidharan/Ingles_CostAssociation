/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"Ingles/Mock/cost_association/test/integration/AllJourneys"
	], function () {
		QUnit.start();
	});
});