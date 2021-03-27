sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/Token",
	"sap/ui/comp/library",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/m/Label",
	"sap/ui/model/FilterOperator",
	"sap/m/ColumnListItem",
	"sap/ui/model/type/String",
	"sap/m/SearchField",
	"sap/m/MessageToast",
	"sap/ui/model/Sorter",
	"sap/ui/core/message/Message",
	"sap/ui/core/IconPool",
	"sap/m/MessageView",
	"sap/m/Dialog",
	"sap/m/Bar",
	"sap/m/Text",
	"sap/ui/core/Core",
	"sap/m/Button",
	"sap/m/MessageItem",
	"sap/m/MessagePopover"
], function (Controller, Token, compLibrary, JSONModel, Filter, Label, FilterOperator,
	ColumnListItem, typeString, SearchField, MessageToast, Sorter, Message, IconPool, MessageView, Dialog, Bar, Text, Core, Button,
	MessageItem, MessagePopover
) {
	"use strict";

	return Controller.extend("com.ingles.retail_pricing.cost_association.controller.Master", {
		onInit: function () {
			this.oRouter = this.getOwnerComponent().getRouter();
			this.oRouter.getRoute("Master").attachPatternMatched(this.getQuery, this);
			this._oMultiInput = this.getView().byId("multiInput");
			this._oMultiInputWithSuggestions = this.getView().byId("multiInput");
			this._oMultiInput.addValidator(this._onMultiInputValidate);
			this._oMultiInput.setTokens(this._getDefaultTokens());
			this.getView().byId("slName").setEnabled(false);
			var scPath = jQuery.sap.getModulePath("com.ingles.retail_pricing.cost_association", "/test/data/columnsModel.json");
			this.oColModel = new JSONModel(scPath);
			var sPPath = jQuery.sap.getModulePath("com.ingles.retail_pricing.cost_association", "/test/data/products.json");
			this.oProductsModel = new JSONModel(sPPath);
			this.getView().setModel(this.oProductsModel);
			this._messageManager = Core.getMessageManager();
			this._messageManager.registerObject(this.getView(), true);
			this.oView.setModel(this._messageManager.getMessageModel(), "message");

			var oFilter = this.getView().byId("filterbar"),
				that = this;

			oFilter.addEventDelegate({
				"onAfterRendering": function (oEvent) {
					var oResourceBundle = that.getOwnerComponent().getModel("i18n").getResourceBundle();

					var oButton = oEvent.srcControl._oRestoreButtonOnFB;
					oButton.setText(oResourceBundle.getText("restoreButton"));
				}
			});

		},
		onunit: function (oEvent) {
			var value = this.getView().byId("case").getValue();
			var select = this.getView().byId("slName").getSelectedKey();
			var datevalue = this.getView().byId("date").getDateValue();
			var pack = this.getView().byId("casepack").getValue();
			var date = new Date(datevalue);
			// var allow = this.getView().byId("allow").getValue();
			var datef = ((date.getMonth() > 8) ? (date.getMonth() + 1) : ('0' + (date.getMonth() + 1))) + '/' + ((date.getDate() > 9) ? date.getDate() :
				('0' + date.getDate())) + '/' + date.getFullYear();
			var selected = this.getView().byId("Table").getSelectedIndices();

			if (selected.length === 0) {
				MessageToast.show("Select atleast one row");
				return;
			}
			var number;
			if (select === "001") {
				number =  ( parseFloat(value, 2) ) / pack; //( parseFloat(value, 2) - parseFloat(allow,2) ) / pack;
			} else if (select === "002") {
				number = ( parseFloat(value, 2) ) / pack;  //( parseFloat(value, 2) - parseFloat(allow,2) ) / pack;
			} else {
				number = ( parseFloat(value, 2) ) / pack;  //( parseFloat(value, 2) - parseFloat(allow,2) ) / pack;
			}
			this.getView().byId("unitCost").setValue(number.toFixed(2));
			var oTable = this.getView().byId("Table");
			var model = this.getView().byId("Table").getModel();
			// var allowance = this.getView().byId("allow").getValue();
			//var oRows = oTable.getRows();
			for (var i = 0; i < selected.length; i++) {
				model.setProperty("/Data/" + selected[i] + "/Price", value);
				model.setProperty("/Data/" + selected[i] + "/valid_from", datef);
				// model.setProperty("/Data/" + selected[i] + "/Allowance", allowance);
				model.setProperty("/Data/" + selected[i] + "/Last_Cost", pack);
				//var oCell = oRows[selected[i]].getCells()[3];
				//oCell.getItems()[0].setValue(value);
				//oCell = oRows[selected[i]].getCells()[4];
				//oCell.setDateValue(datevalue);
				this.calculate(selected[i], oTable);
			}

		},

		calculate: function (row, oTable) {

			var cost = this.getView().byId("unitCost").getValue();
			var model = this.getView().byId("Table").getModel();
			var retailprice = model.getProperty("/Data/" + row + "/RetailPrice");
			var allowance = model.getProperty("/Data/" + row + "/Allowance");
			allowance = (isNaN(allowance))? 0 : allowance;
			var calculatedallow, finalallow;
			var casecost = this.getView().byId("case").getValue();
			var casepack = this.getView().byId("casepack").getValue();
			var retailwithoutallowance = parseFloat(casecost, 2) / parseFloat(casepack,2);

			var calculated = ((parseFloat(retailprice, 2) - parseFloat(retailwithoutallowance, 2)) / parseFloat(retailprice, 2)) * 100;
			calculatedallow = ( (parseFloat(retailprice, 2) - parseFloat(cost, 2) - parseFloat(allowance, 2) ) / parseFloat(retailprice, 2)) *	100;

			var finalcal = calculated.toFixed(2);
			finalallow = calculatedallow.toFixed(2);
			var check = model.getProperty("/Data/" + row + "/Material");
			if (check !== "") {
				model.setProperty("/Data/" + row + "/gm", finalcal);
				model.setProperty("/Data/" + row + "/allow", finalallow);
				// oTable.getRows()[row].getCells()[12].setText();
				// oTable.getRows()[row].getCells()[13].setText(finalallow);
			}

		},
		oncasecost: function () {
			var value = this.getView().byId("case").getValue();
			var select = this.getView().byId("slName").getSelectedKey();
			var pack = this.getView().byId("casepack").getValue();
			// var allow = this.getView().byId("allow").getValue();
			var number;
			if (select === "001") {
				number = ( parseFloat(value, 2)) / parseFloat(pack,2);//( parseFloat(value, 2) - parseFloat(allow,2) ) / parseFloat(pack,2);
			} else if (select === "002") {
				number = ( parseFloat(value, 2)) / parseFloat(pack,2);//( parseFloat(value, 2) - parseFloat(allow,2) ) / parseFloat(pack,2);
			} else {
				number = ( parseFloat(value, 2)) / parseFloat(pack,2);//( parseFloat(value, 2) - parseFloat(allow,2) ) / parseFloat(pack,2);
			}
			this.getView().byId("unitCost").setValue(number.toFixed(2));
		},
		onSearch: function (oEvent) {
			//	debugger;
			//this.getView().byId("messagepage").setVisible(false);
			var primary = this.getView().byId("slName").getEnabled();
			var select = this.getView().byId("slName").getSelectedKey();
			var conditionTable = this.getView().byId("Table");
			var casecost = this.getView().byId("case").getValue();
			var count = this.getView().byId("Table").getBinding().iLength;
			var afilters = [];
			var tokens = this.getView().byId("multiInput").getTokens();

			if (select === "0" & primary) {
				MessageToast.show("Please select Price Family or Vendor");
				return;
			}
			// if(casecost === ""){
			// 	MessageToast.show("Please enter Case Cost");
			// 	return;
			// }
			if (primary) {

				if (select === "001") {
					this.getView().byId("Ttitle").setText("Cost Association (" + 4 + ")");
					var sPath = jQuery.sap.getModulePath("com.ingles.retail_pricing.cost_association", "/test/data/Pricingdata.json");

				} else {
					this.getView().byId("Ttitle").setText("Cost Association (" + 2 + ")");
					sPath = jQuery.sap.getModulePath("com.ingles.retail_pricing.cost_association", "/test/data/Pricingdata2.json");

				}

			} else {
				sPath = jQuery.sap.getModulePath("com.ingles.retail_pricing.cost_association", "/test/data/data.json");

				this.getView().byId("Ttitle").setText("Cost Association (" + count + ")");
			}

			var attModel = new JSONModel(sPath);
			attModel.setDefaultBindingMode("TwoWay");
			conditionTable.setModel(attModel);
			conditionTable.bindRows("/Data");
			attModel.refresh();
			if (!primary) {
				for (var i = 0; i < tokens.length; i++) {
					var oFilter = new Filter("Vendor", FilterOperator.EQ, tokens[i].getKey());
					afilters.push(oFilter);
				}
				conditionTable.getBinding().filter(afilters);
				var title = this.getView().byId("Ttitle");
				conditionTable.getBinding().attachChange(function (oEvent1) {
					title.setText("Cost Association (" + oEvent1.getSource().iLength + ")");
				});
			}

			if (primary) {
				conditionTable.setEnableSelectAll(false);
				if (select === "001") {
					conditionTable.addSelectionInterval(0, 3);
				} else if (select === "002") {
					conditionTable.addSelectionInterval(0, 1);
				}
			} else {
				conditionTable.setEnableSelectAll(true);
				conditionTable.removeSelectionInterval(0, 3);
			}
			this.getView().byId("Table").rerender();
			this.getView().byId("Table").getModel().refresh();
			this.onfirstdisplay();

		},
		getQuery: function (oArgs) {

			var sPath = jQuery.sap.getModulePath("com.ingles.retail_pricing.cost_association", "/test/data/data.json");
			var conditionTable = this.getView().byId("Table");
			var attModel = new JSONModel(sPath);
			attModel.setDefaultBindingMode("TwoWay");
			this.getView().setModel(attModel);

			conditionTable.bindRows("/Data");
			attModel.refresh();
			this.getView().byId("Table").rerender();
			this.onfirstdisplay();
			var that = this;
			setTimeout(function () {
				var count = that.getView().byId("Table").getBinding().iLength;
				that.getView().byId("Ttitle").setText("Cost Association (" + count + ")");
			}, 1000);

		},
		ongroup: function () {
			var aSorters = [];
			aSorters.push(new Sorter("Vendor", false, true));
			this.getView().byId("Table").getBinding("rows").sort(aSorters);
			this.getView().byId("Table").rerender();
		},
		onfirstdisplay: function (oEvent) {

			var oTable = this.getView().byId("Table");
			var oRows = oTable.getRows();
			for (var i = 0; i < oRows.length; i++) {
				// var oCell = oRows[i].getCells()[4];
				// oCell.setProperty("editable", true);
				// oCell = oRows[i].getCells()[5];
				// var oCell.setProperty("editable", true);
				var oCell = oRows[i].getCells()[0];
				oCell.setProperty("editable", true);
				oCell = oRows[i].getCells()[1];
				oCell.setProperty("editable", true);
				// oCell = oRows[i].getCells()[4];
				// oCell.setProperty("editable", false);
				oCell = oRows[i].getCells()[3];
				oCell.getItems()[0].setProperty("editable", true);
				oCell = oRows[i].getCells()[4];
				oCell.setProperty("editable", true);
			}
			this.onEditAction();
			var that = this;
			setTimeout(function () {
				that.firstcalculate();
			}, 1000);
		},

		firstcalculate: function () {
			var oTable = this.getView().byId("Table");
			var model = this.getView().byId("Table").getModel();
			var oRows = oTable.getModel().getData().Data,
				cost, retailprice, calculated, finalcal, calculatedallow, finalallow;
			var casecost = this.getView().byId("case").getValue();
			var casepack = this.getView().byId("casepack").getValue();
			var retailwithoutallowance = parseFloat(casecost, 2) / parseFloat(casepack,2);
			// var allowance = this.getView().byId("allow").getValue();
			for (var i = 0; i < oRows.length; i++) {
				cost = this.getView().byId("unitCost").getValue();

				retailprice = model.getProperty("/Data/" + i + "/RetailPrice");

				calculated = ((parseFloat(retailprice, 2) - parseFloat(retailwithoutallowance, 2)) / parseFloat(retailprice, 2)) * 100;
				calculatedallow = ( (parseFloat(retailprice, 2) - parseFloat(cost, 2) ) / parseFloat(retailprice, 2)) *
				100;
				finalcal = calculated.toFixed(2);
				finalallow = calculatedallow.toFixed(2);
				var check = model.getProperty("/Data/" + i + "/Material");

				if (check === "") {
					//oRows[i].getCells()[12].setText("");
					//oRows[i].getCells()[13].setText("");
					model.setProperty("/Data/" + i + "/gm", "");
					model.setProperty("/Data/" + i + "/allow", "");
				} else {
					model.setProperty("/Data/" + i + "/gm", finalcal);
					model.setProperty("/Data/" + i + "/allow", finalallow);
					//oRows[i].getCells()[12].setText(finalcal);
					//	oRows[i].getCells()[13].setText(finalallow);
				}

			}

		},
		onEditAction: function (oEvent) {
			this.getView().byId("Tfilter").setVisible(true);
			this.getView().byId("Treset").setVisible(true);
			this.getView().byId("Tcreate").setVisible(true);

			//this.getView().byId("BCopy").setVisible(true);
			this.getView().byId("iclone").setVisible(true);
			this.getView().byId("isave").setVisible(true);

		},
		onDeletePress: function (oEvent) {
			var itemModel = this.getView().byId("Table").getModel(),
				conditionTable = this.getView().byId("Table"),
				oRow = oEvent.getParameter("row"),
				sIndex = oRow.getBindingContext().sPath.split("/")[2];
			var length = this.getView().byId("Table").getModel().getData().Data.length - 1;
			itemModel.getData().Data.splice(sIndex, 1);
			itemModel.refresh();

			this.getView().byId("Ttitle").setText("Cost Association (" + itemModel.getData().Data.length + ")");
			conditionTable.removeSelectionInterval(length, length);
		},
		onAddRows: function (oEvent) {
			this.addRowsDialog = sap.ui.xmlfragment("com.ingles.retail_pricing.cost_association.fragments.AddRows", this);

			//this.getOwnerComponent().getModel("addrow").setData("");
			this.addRowsDialog.setModel(this.getOwnerComponent().getModel("addrow"));
			this.getView().addDependent(this.addRowsDialog);
			this.addRowsDialog.open();
		},
		onCopyRows: function (oEvent) {
			var conditionTable = this.getView().byId("Table");
			var item = conditionTable.getSelectedIndices();
			if (item.length === 0) {
				MessageToast.show("Please select one Vendor for clone");
				return;
			}
			var vendor, tabledata = conditionTable.getModel().getData().Data;
			var flag = true;
			for (var i = 0; i < item.length; i++) {
				if (item[i] < 0) {
					continue;
				}
				if (vendor === undefined) {
					vendor = tabledata[item[i]].Vendor;
				}
				if (tabledata[item[i]].Vendor !== vendor) {
					flag = false;
					break;
				}
			}
			if (flag) {
				this.copyRowsDialog = sap.ui.xmlfragment("com.ingles.retail_pricing.cost_association.fragments.Copy", this);
				var sPath = jQuery.sap.getModulePath("com.ingles.retail_pricing.cost_association", "/test/data/products.json");
				var copymodel = new JSONModel(sPath);
				//this.getOwnerComponent().getModel("addrow").setData("");
				this.copyRowsDialog.setModel(copymodel);
				this.getView().addDependent(this.copyRowsDialog);
				this.copyRowsDialog.open();
				this.bGrouped = false;
				this.bDescending = false;
				this.sSearchQuery = 0;
			} else {
				MessageToast.show("Please select one Vendor for clone");
			}

		},
		onCopyDialogSubmit: function () {
			this.copyRowsDialog.close();
			this.copyRowsDialog.destroy();
			MessageToast.show("Vendor clone is successfully executed");
		},
		onAddDialogSubmit: function (oEvent) {
			this.addRowsDialog.close();
			this.addRowsDialog.destroy();
			var value = this.addRowsDialog.getModel().getData().data.row,
				i;
			var primary = this.getView().byId("slName").getEnabled();
			var initialcheck = 0,
				initialdata;
			var itemModel = this.getView().getModel();
			var afilters = [];

			if (itemModel.getData().Data === undefined) {
				var exist = itemModel.getData();
				exist.Data = [];
				itemModel.setData(exist);
				initialcheck = 1;
				initialdata = 0;
			} else {
				initialdata = itemModel.getData().Data.length;
			}

			var tokens = this.getView().byId("multiInput").getTokens();
			var stoken = [];
			for (var k = 0; k < tokens.length; k++) {
				stoken[k] = tokens[k].getKey();
			}
			if (!primary) {
				var iIndex = itemModel.getData().Data.filter(function (item) {
					return stoken.includes(item.Vendor);
				});
			} else {
				iIndex = this.getView().byId("Table").getModel().getData().Data;
			}

			for (i = 0; i < value; i++) {
				iIndex.push({
					"LocationCode": "",
					"Material": "",
					"Vendor": "",
					"Description": "",
					"valid_from": "",
					"valid_to": "12/31/9999",
					"Last_Cost": "",
					"Price": "",
					"Margin": "",
					"Unit_sell": "",
					"Multiplier": "",
					"Vendor_item": "",
					"Vendor_desc": "",
					"allow": ""
				});
			}
			var tamodel = new JSONModel({
				"Data": iIndex
			});
			tamodel.setDefaultBindingMode("TwoWay");

			this.getView().byId("Table").setModel(tamodel);
			this.getView().byId("Table").bindRows("/Data");
			//}
			this.getView().byId("Ttitle").setText("Cost Association (" + iIndex.length + ")");
			//this.getView().byId("Table").setVisibleRowCount(itemModel.getData().Data.length);
			itemModel.refresh();
			this.getView().byId("Table").getModel().refresh();
			this.getView().byId("Table").rerender();
			//this.geteditrows(initialdata, initialdata + parseInt(value));

			var primary = this.getView().byId("slName").getEnabled();
			var select = this.getView().byId("slName").getSelectedKey();
			var conditionTable = this.getView().byId("Table");
			if (primary) {
				if (select === "001") {
					conditionTable.addSelectionInterval(0, iIndex.length - 1);
				} else if (select === "002") {
					conditionTable.addSelectionInterval(0, iIndex.length - 1);
				}
			}
			var that = this;
			setTimeout(function () {
				that.firstcalculate();
			}, 1000);

		},
		geteditrows: function (start, end) {
			var oTable = this.getView().byId("Table");
			var oRows = oTable.getRows();
			for (var i = start; i < end; i++) {
				// var oCell = oRows[i].getCells()[4];
				// oCell.setProperty("editable", true);
				// oCell = oRows[i].getCells()[5];
				// oCell.setProperty("editable", true);
				var oCell = oRows[i].getCells()[0];
				oCell.setProperty("editable", true);
				oCell = oRows[i].getCells()[1];
				oCell.setProperty("editable", true);
				// oCell = oRows[i].getCells()[4];
				// oCell.setProperty("editable", true);
				oCell = oRows[i].getCells()[7];
				oCell.getItems()[0].setProperty("editable", true);
			}
			this.onEditAction();
		},
		onAddDialogCancel: function () {
			this.addRowsDialog.close();
			this.addRowsDialog.destroy();
		},
		onCopyDialogCancel: function () {
			this.copyRowsDialog.close();
			this.copyRowsDialog.destroy();
		},
		clearAllFilters: function (oEvent) {
			var conditionTable = this.getView().byId("Table");
			var aColumns = conditionTable.getColumns();

			for (var i = 0; i < aColumns.length; i++) {
				conditionTable.filter(aColumns[i], null);
			}
			var filters = [];
			conditionTable.getBinding("rows").filter(filters, sap.ui.model.FilterType.Application);

		},
		onSync: function (oEvent) {
			var primary = this.getView().byId("slName").getEnabled();
			var select = this.getView().byId("slName").getSelectedKey();
			var afilters = [];
			var tokens = this.getView().byId("multiInput").getTokens();
			var count = this.getView().byId("Table").getBinding().iLength;
			if (primary) {
				if (select === "001") {
					var sPath = jQuery.sap.getModulePath("com.ingles.retail_pricing.cost_association", "/test/data/Pricingdata.json");
					this.getView().byId("Ttitle").setText("Cost Association (" + 4 + ")");
				} else {
					sPath = jQuery.sap.getModulePath("com.ingles.retail_pricing.cost_association", "/test/data/Pricingdata2.json");
					this.getView().byId("Ttitle").setText("Cost Association (" + 2 + ")");
				}
			} else {
				sPath = jQuery.sap.getModulePath("com.ingles.retail_pricing.cost_association", "/test/data/data.json");
				this.getView().byId("Ttitle").setText("Cost Association (" + count + ")");

			}

			var conditionTable = this.getView().byId("Table");
			var attModel = new JSONModel(sPath);
			attModel.setDefaultBindingMode("TwoWay");
			conditionTable.setModel(attModel);
			conditionTable.bindRows("/Data");

			this.getView().getModel().refresh();
			conditionTable.rerender();
			//conditionTable.setVisibleRowCount(9);
			if (primary) {
				if (select === "001") {
					conditionTable.addSelectionInterval(0, 3);
				} else if (select === "002") {
					conditionTable.addSelectionInterval(0, 1);
				}
			} else {
				conditionTable.removeSelectionInterval(0, 3);
			}
			if (!primary) {
				for (var i = 0; i < tokens.length; i++) {
					var oFilter = new Filter("Vendor", FilterOperator.EQ, tokens[i].getKey());
					afilters.push(oFilter);
				}
				conditionTable.getBinding().filter(afilters);
				var title = this.getView().byId("Ttitle");
				conditionTable.getBinding().attachChange(function (oEvent1) {
					title.setText("Cost Association (" + oEvent1.getSource().iLength + ")");
				});
			}
			var that = this;
			setTimeout(function () {
				that.firstcalculate();
			}, 250);
		},
		_onMultiInputValidate: function (oArgs) {
			if (oArgs.suggestionObject) {
				var oObject = oArgs.suggestionObject.getBindingContext().getObject(),
					oToken = new Token();

				oToken.setKey(oObject.ProductId);
				//oToken.setText(oObject.Name + " (" + oObject.ProductId + ")");
				oToken.setText(oObject.ProductId);
				return oToken;
			}

			return null;
		},
		onSelectChange: function (oEvent) {
			if (oEvent.getSource().getSelectedIndex() >= 1) {
				this.getView().byId("multiInput").removeAllTokens();
				this.getView().byId("multiInput").setEnabled(false);

			} else {

				this.getView().byId("multiInput").setEnabled(true);
			}

			var select = oEvent.getSource().getSelectedKey();

			if (select === "001") {
				this.getView().byId("casepack").setValue(2);
			} else if (select === "002") {
				this.getView().byId("casepack").setValue(4);
			}

		},
		ondel: function (oEvent) {
			var tokens = oEvent.getSource().getTokens();
			if (tokens.length === 1) {
				this.getView().byId("slName").setEnabled(true);
			}
		},
		_getDefaultTokens: function () {
			//var ValueHelpRangeOperation = compLibrary.valuehelpdialog.ValueHelpRangeOperation;
			var oToken1 = new Token({
				key: "1011",
				text: "1011"
			});
			var oToken2 = new Token({
				key: "1022",
				text: "1022"
			});
			// var oToken3 = new Token({
			// 	key: "214",
			// 	text: "214"
			// });
			// var oToken4 = new Token({
			// 	key: "401",
			// 	text: "401"
			// });

			// var oToken5 = new Token({
			// 	key: "12",
			// 	text: "12"
			// });

			// var oToken2 = new Token({
			// 	key: "range_0",
			// 	text: "!(=HT-1000)"
			// }).data("range", {
			// 	"exclude": true,
			// 	"operation": ValueHelpRangeOperation.EQ,
			// 	"keyField": "ProductId",
			// 	"value1": "HT-1000",
			// 	"value2": ""
			// });

			return [oToken1, oToken2];
		},
		onValueHelpRequested: function () {
			var aCols = this.oColModel.getData().cols;
			this._oBasicSearchField = new SearchField({
				showSearchButton: false
			});

			this._oValueHelpDialog = sap.ui.xmlfragment("com.ingles.retail_pricing.cost_association.fragments.ValueHelpDialogFilterbar", this);
			this.getView().addDependent(this._oValueHelpDialog);

			this._oValueHelpDialog.setRangeKeyFields([{
				label: "Product",
				key: "ProductId",
				type: "string",
				typeInstance: new typeString({}, {
					maxLength: 7
				})
			}]);

			var oFilterBar = this._oValueHelpDialog.getFilterBar();
			oFilterBar.setFilterBarExpanded(false);
			oFilterBar.setBasicSearch(this._oBasicSearchField);

			this._oValueHelpDialog.getTableAsync().then(function (oTable) {
				oTable.setModel(this.oProductsModel);
				oTable.setModel(this.oColModel, "columns");

				if (oTable.bindRows) {
					oTable.bindAggregation("rows", "/ProductCollection");
				}

				if (oTable.bindItems) {
					oTable.bindAggregation("items", "/ProductCollection", function () {
						return new ColumnListItem({
							cells: aCols.map(function (column) {
								return new Label({
									text: "{" + column.template + "}"
								});
							})
						});
					});
				}

				this._oValueHelpDialog.update();
			}.bind(this));

			this._oValueHelpDialog.setTokens(this._oMultiInput.getTokens());
			this._oValueHelpDialog.open();
		},
		onValueHelpOkPress: function (oEvent) {
			var aTokens = oEvent.getParameter("tokens");
			this.getView().byId("casepack").setValue("12");
			aTokens.map(function (item) {
				return item.setText(item.getKey());
			});
			this._oMultiInput.setTokens(aTokens);
			this._oValueHelpDialog.close();

			if (aTokens.length === 0) {
				this.getView().byId("slName").setEnabled(true);
			} else {
				this.getView().byId("slName").setEnabled(false);
			}
		},

		onValueHelpCancelPress: function () {
			this._oValueHelpDialog.close();
		},

		onValueHelpAfterClose: function () {
			this._oValueHelpDialog.destroy();
		},
		onFilterBarSearch: function (oEvent) {
			var sSearchQuery = this._oBasicSearchField.getValue(),
				aSelectionSet = oEvent.getParameter("selectionSet");
			var aFilters = aSelectionSet.reduce(function (aResult, oControl) {
				if (oControl.getValue()) {
					aResult.push(new Filter({
						path: oControl.getName(),
						operator: FilterOperator.Contains,
						value1: oControl.getValue()
					}));
				}

				return aResult;
			}, []);

			aFilters.push(new Filter({
				filters: [
					new Filter({
						path: "ProductId",
						operator: FilterOperator.Contains,
						value1: sSearchQuery
					}),
					new Filter({
						path: "Name",
						operator: FilterOperator.Contains,
						value1: sSearchQuery
					})
				],
				and: false
			}));

			this._filterTable(new Filter({
				filters: aFilters,
				and: true
			}));
		},
		_filterTable: function (oFilter) {
			var oValueHelpDialog = this._oValueHelpDialog;

			oValueHelpDialog.getTableAsync().then(function (oTable) {
				if (oTable.bindRows) {
					oTable.getBinding("rows").filter(oFilter);
				}

				if (oTable.bindItems) {
					oTable.getBinding("items").filter(oFilter);
				}

				oValueHelpDialog.update();
			});
		},
		onValueHelpWithSuggestionsRequested: function () {
			var aCols = this.oColModel.getData().cols;
			this._oBasicSearchFieldWithSuggestions = new SearchField({
				showSearchButton: false
			});

			this._oValueHelpDialogWithSuggestions = sap.ui.xmlfragment(
				"com.ingles.retail_pricing.cost_association.fragments.ValueHelpDialogFilterbarWithSuggestions", this);
			this.getView().addDependent(this._oValueHelpDialogWithSuggestions);

			this._oValueHelpDialogWithSuggestions.setRangeKeyFields([{
				label: "Product",
				key: "ProductId",
				type: "string",
				typeInstance: new typeString({}, {
					maxLength: 7
				})
			}]);

			var oFilterBar = this._oValueHelpDialogWithSuggestions.getFilterBar();
			oFilterBar.setFilterBarExpanded(false);
			oFilterBar.setBasicSearch(this._oBasicSearchFieldWithSuggestions);

			this._oValueHelpDialogWithSuggestions.getTableAsync().then(function (oTable) {
				oTable.setModel(this.oProductsModel);
				oTable.setModel(this.oColModel, "columns");

				if (oTable.bindRows) {
					oTable.bindAggregation("rows", "/ProductCollection");
				}

				if (oTable.bindItems) {
					oTable.bindAggregation("items", "/ProductCollection", function () {
						return new ColumnListItem({
							cells: aCols.map(function (column) {
								return new Label({
									text: "{" + column.template + "}"
								});
							})
						});
					});
				}

				this._oValueHelpDialogWithSuggestions.update();
			}.bind(this));

			this._oValueHelpDialogWithSuggestions.setTokens(this._oMultiInput.getTokens());
			this._oValueHelpDialogWithSuggestions.open();
		},
		onValueHelpWithSuggestionsOkPress: function (oEvent) {

			var aTokens = oEvent.getParameter("tokens");
			this._oMultiInputWithSuggestions.setTokens(aTokens);
			this._oValueHelpDialogWithSuggestions.close();
		},

		onValueHelpWithSuggestionsCancelPress: function () {
			this._oValueHelpDialogWithSuggestions.close();
		},

		onValueHelpWithSuggestionsAfterClose: function () {
			this._oValueHelpDialogWithSuggestions.destroy();
		},
		onFilterBarWithSuggestionsSearch: function (oEvent) {
			var sSearchQuery = this._oBasicSearchFieldWithSuggestions.getValue(),
				aSelectionSet = oEvent.getParameter("selectionSet");
			var aFilters = aSelectionSet.reduce(function (aResult, oControl) {
				if (oControl.getValue()) {
					aResult.push(new Filter({
						path: oControl.getName(),
						operator: FilterOperator.Contains,
						value1: oControl.getValue()
					}));
				}

				return aResult;
			}, []);

			aFilters.push(new Filter({
				filters: [
					new Filter({
						path: "ProductId",
						operator: FilterOperator.Contains,
						value1: sSearchQuery
					}),
					new Filter({
						path: "Name",
						operator: FilterOperator.Contains,
						value1: sSearchQuery
					})

				],
				and: false
			}));

			this._filterTableWithSuggestions(new Filter({
				filters: aFilters,
				and: true
			}));
		},
		_filterTableWithSuggestions: function (oFilter) {
			var oValueHelpDialog = this._oValueHelpDialogWithSuggestions;

			oValueHelpDialog.getTableAsync().then(function (oTable) {
				if (oTable.bindRows) {
					oTable.getBinding("rows").filter(oFilter);
				}

				if (oTable.bindItems) {
					oTable.getBinding("items").filter(oFilter);
				}

				oValueHelpDialog.update();
			});
		},
		selectline: function (oEvent) {
			var table = this.getView().byId("Table"),
				oRow = oEvent.getSource().getParent().getParent().getBindingContext().getPath().slice(6);
			table.addSelectionInterval(oRow, oRow);
		},
		onreset: function (oEvent) {
			var primary = this.getView().byId("slName").getEnabled();
			var select = this.getView().byId("slName").getSelectedKey();

			if (primary) {
				if (select === "001") {
					var sPath = jQuery.sap.getModulePath("com.ingles.retail_pricing.cost_association", "/test/data/Pricingdata.json");
				} else {
					sPath = jQuery.sap.getModulePath("com.ingles.retail_pricing.cost_association", "/test/data/Pricingdata2.json");
				}
			} else {
				sPath = jQuery.sap.getModulePath("com.ingles.retail_pricing.cost_association", "/test/data/data.json");

			}

			var attModel = new JSONModel();
			attModel.loadData(sPath, null, false);

			var path = oEvent.getSource().getParent().getParent().getBindingContext().getPath();
			var data = attModel.getProperty(path + "/Price");
			var date = attModel.getProperty(path + "/valid_from");
			var allowance = attModel.getProperty(path + "/Allowance");
			var casepack = attModel.getProperty(path + "/Last_Cost");
			oEvent.getSource().getParent().getItems()[0].setValue(data);
			oEvent.getSource().getParent().getParent().getCells()[4].setValue(date);
			oEvent.getSource().getParent().getParent().getCells()[10].setText(allowance);
			oEvent.getSource().getParent().getParent().getCells()[5].setText(casepack);
			var table = this.getView().byId("Table"),
				oRow = oEvent.getSource().getParent().getParent().getBindingContext().getPath().slice(6);
			this.calculate(oRow, table);
			primary = this.getView().byId("slName").getEnabled();
			if (!primary) {
				table.removeSelectionInterval(oRow, oRow);
			}

		},
		onrow: function (oEvent) {
			var primary = this.getView().byId("slName").getEnabled();
			var oRow = oEvent.getParameter("rowIndex");
			var table = this.getView().byId("Table");
			if (primary) {
				table.addSelectionInterval(oRow, oRow);
			}
		},
		onFilter: function (oEvent) {
			this.sSearchQuery = oEvent.getSource().getValue();
			this.fnApplyFiltersAndOrdering(oEvent);
		},
		fnApplyFiltersAndOrdering: function (oEvent) {
			var aFilters = [],
				aSorters = [];

			if (this.bGrouped) {
				aSorters.push(new Sorter("ProductId", this.bDescending, this._fnGroup));
			} else {
				aSorters.push(new Sorter("ProductId", this.bDescending));
			}

			if (this.sSearchQuery) {
				var oFilter = new Filter("Name", FilterOperator.Contains, this.sSearchQuery);
				aFilters.push(oFilter);
			}

			oEvent.getSource().getParent().getParent().getBinding("items").filter(aFilters).sort(aSorters);
		},
		onReset: function (oEvent) {
			this.bGrouped = false;
			this.bDescending = false;
			this.sSearchQuery = 0;

			//this.fnApplyFiltersAndOrdering(oEvent);
			var that = this;
			setTimeout(function () {
				that.onunit();
			}, 250);
		},

		onGroup: function (oEvent) {
			this.bGrouped = !this.bGrouped;
			this.fnApplyFiltersAndOrdering(oEvent);
		},

		onSort: function (oEvent) {
			this.bDescending = !this.bDescending;
			this.fnApplyFiltersAndOrdering(oEvent);
		},
		_fnGroup: function (oContext) {
			var sSupplierName = oContext.getProperty("Name");

			return {
				key: sSupplierName,
				text: sSupplierName
			};
		},
		_VendorGroup: function (oContext) {
			var sSupplierName = oContext.getProperty("Vendor");

			return {
				key: sSupplierName,
				text: sSupplierName
			};
		},
		onsave: function (oEvent) {
			sap.ui.getCore().getMessageManager().removeAllMessages();
			this.addMessageToTarget("", "", "Cost Association 45778 created successfully!!", "Success",
				"UPC: 18200-00769 Material: 106216 Vendor: 407807 Successfully posted",
				"S", "");

			//this.addMessageToTarget("", "", "Please enter valid Price", "Error", "Please check the Price at Row 2", "E", "");

			this.createdialog();
		},
		createdialog: function () {
			var that = this;
			var oBackButton = new Button({
				icon: IconPool.getIconURI("nav-back"),
				visible: false,
				press: function () {
					that.oMessageView.navigateBack();
					this.setVisible(false);
				}
			});

			this.oMessageView = new MessageView({
				showDetailsPageHeader: false,
				itemSelect: function () {
					oBackButton.setVisible(true);
				},
				items: {
					path: "message>/",
					template: new MessageItem({
						title: "{message>message}",
						subtitle: "{message>additionalText}",
						activeTitle: true,
						description: "{message>description}",
						type: "{message>type}"
					})
				},
				groupItems: true
			});

			this.getView().addDependent(this.oMessageView);
			this.oDialog = new Dialog({
				content: this.oMessageView,
				contentHeight: "50%",
				contentWidth: "50%",
				endButton: new Button({
					text: "Close",
					press: function () {
						this.getParent().close();
					}
				}),
				customHeader: new Bar({
					contentMiddle: [
						new Text({
							text: "Confirmation"
						})
					],
					contentLeft: [oBackButton]
				}),

				verticalScrolling: false
			});
			this.oMessageView.navigateBack();
			this.oDialog.open();
		},
		createMessagePopover: function () {
			this.oMP = new MessagePopover({
				items: {
					path: "message>/",
					template: new MessageItem({
						title: "{message>message}",
						subtitle: "{message>additionalText}",
						activeTitle: true,
						description: "{message>description}",
						type: "{message>type}"
					})
				}
			});
			this.oMP._oMessageView.setGroupItems(true);
			this.oMP._oPopover.setContentWidth("600px");
			this.oView.addDependent(this.oMP);
		},
		addMessageToTarget: function (sTarget, controlId, errorMessage, errorTitle, errorDescription, msgType, groupName) {
			var oMessage = new Message({
				message: errorMessage,
				type: this.getMessageType(msgType),
				additionalText: errorTitle,
				description: errorDescription,
				target: sTarget,
				processor: this._mainModel,
				code: groupName
			});

			if (controlId !== "") {
				oMessage.addControlId(controlId);
			}

			this._messageManager.addMessages(oMessage);
		},
		getMessageType: function (msgType) {
			var rtnType;
			switch (msgType) {
			case "E":
				rtnType = sap.ui.core.MessageType.Error;
				break;
			case "S":
				rtnType = sap.ui.core.MessageType.Success;
				break;
			case "I":
				rtnType = sap.ui.core.MessageType.Information;
				break;
			case "W":
				rtnType = sap.ui.core.MessageType.Warning;
				break;
			default:
				rtnType = sap.ui.core.MessageType.None;
				break;
			}
			return rtnType;
		}
	});
});