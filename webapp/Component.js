sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"Ingles/Mock/cost_association/model/models",
	"sap/ui/model/json/JSONModel"	
], function (UIComponent, Device, models, JSONModel) {
	"use strict";

	return UIComponent.extend("Ingles.Mock.cost_association.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function () {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// enable routing
			this.getRouter().initialize();
			this.setModel(models.oViewModel(), "addrow");

			this.setModel(models.appControlModel(), "appControl");

			// set the device model
			this.setModel(models.createDeviceModel(), "device");
		},
		destroy: function () {

			sap.ui.core.UIComponent.prototype.destroy.apply(this, arguments);

		}
	});
});