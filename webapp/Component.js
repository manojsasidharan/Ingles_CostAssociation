sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"com/ingles/retail_pricing/cost_association/model/models"
], function (UIComponent, Device, models) {
	"use strict";

	return UIComponent.extend("com.ingles.retail_pricing.cost_association.Component", {

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
			this.setModel(models.oViewModel(),"addrow");

			// set the device model
			this.setModel(models.createDeviceModel(), "device");
		},
		destroy: function () {

			sap.ui.core.UIComponent.prototype.destroy.apply(this, arguments);

		}		
	});
});