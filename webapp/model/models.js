sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device"
], function (JSONModel, Device) {
	"use strict";

	return {

		createDeviceModel: function () {
			var oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},
		oViewModel: function () {
			var vModel = new JSONModel({
				"data": [{
					"row": "1"
				}]
			});
			vModel.setDefaultBindingMode("TwoWay");
			return vModel;
		},

		appControlModel: function () {

			var appData = {
				Currency: "USD",
				headerExpanded: true,
				Save: false,
				caseCost: 0.00,
				casePack: 0,
				ModeHideableColumns: [],
				AllHideableColumns: [ //key values should match corresponding column name in Table
					{
						key: "Desc",
						text: "Description"
					}, {
						key: "VItemNo",
						text: "Vend.Item #"
					}, {
						key: "Vendor",
						text: "Vendor"
					}, {
						key: "VendDesc",
						text: "Vendor Name"
					}, {
						key: "CurrRetail",
						text: "Retail Price"
					}, {
						key: "LastCost",
						text: "Last Unit Cost"
					}, {
						key: "CasePack",
						text: "Case Pack"
					}, {
						key: "LastCaseCost",
						text: "Last Case Cost"
					}, {
						key: "Allowance",
						text: "Allowance"
					}, {
						key: "LastGM",
						text: "Last GM %."
					}, {
						key: "NewUnitCost",
						text: "New Unit Cost"
					}, {
						key: "NewGM",
						text: "New GM"
					}, {
						key: "NewGMAllow",
						text: "New GM with All."
					}
				],
				// ColumnsHiddenInCreate: ["NewUnitCost", "LastCaseCost", "LastCost", "LastGM"],
				hiddenColumns: [],
				FilterInput: {
					Vendor: "",
					Mode: 0,
					Edit: false
				}
			};
			var appControl = new JSONModel(appData);
			appControl.setDefaultBindingMode("TwoWay");
			return appControl;
		},

	};
});