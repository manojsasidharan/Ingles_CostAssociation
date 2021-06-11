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

	return Controller.extend("Ingles.Mock.cost_association.controller.Master", {
		getToday: function () {
			var d = new Date(),
				month = "" + (d.getMonth() + 1),
				day = "" + d.getDate(),
				year = d.getFullYear();

			if (month.length < 2) {
				month = "0" + month;
			}
			if (day.length < 2) {
				day = "0" + day;
			}

			return [month, day, year].join("/");
		},

		onInit: function () {
			this.oRouter = this.getOwnerComponent().getRouter();
			this.oRouter.getRoute("Master").attachPatternMatched(this.getQuery, this);
			this._oMultiInput = this.getView().byId("multiInput");
			this._oMultiInputWithSuggestions = this.getView().byId("multiInput");
			this._oMultiInput.addValidator(this._onMultiInputValidate);
			this._oMultiInput.setTokens(this._getDefaultTokens());
			// this.getView().byId("slName").setEnabled(false);
			// this.getView().byId("strategy").setEnabled(false);
			var scPath = jQuery.sap.getModulePath("Ingles.Mock.cost_association", "/test/data/columnsModel.json");
			this.oColModel = new JSONModel(scPath);
			var sPPath = jQuery.sap.getModulePath("Ingles.Mock.on", "/test/data/products.json");
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

			var today = this.getToday();
			this.getView().byId("date").setValue(today);

		},

		onSearch: function (oEvent) {
			var family = this.getView().byId("Family").getSelectedKey();
			var strategy = this.getView().byId("Strategy").getSelectedKey();
			var vendTokens = this.getView().byId("multiInput").getTokens();
			var conditionTable = this.getView().byId("Table");

			if (family === "" && strategy === "" && vendTokens.length === 0) {
				MessageToast.show("Please enter Price Family/Strategy/Vendor #");
				return;
			}
			var sPath = jQuery.sap.getModulePath("Ingles.Mock.on", "/test/data/CostAssoc.json");
			var attModel = new JSONModel(sPath);
			var dataArray = [];
			var filteredArray = [];
			this.getOwnerComponent().getModel("appControl").setProperty("/Save", false);
			attModel.attachRequestCompleted(function () {
				dataArray = attModel.getData().Data;
				for (var i = 0; i < dataArray.length; i++) {
					if (((family !== "" && dataArray[i].Family === family) || family === "") && ((strategy !== "" && dataArray[i].Strategy ===
							strategy) || strategy === "")) {
						if (vendTokens.length === 0)
							filteredArray.push(dataArray[i]);
						else {
							for (var j = 0; j < vendTokens.length; j++) {
								if (dataArray[i].Vendor === vendTokens[j].getKey()) {
									filteredArray.push(dataArray[i]);
									break;
								}
							}
						}
					}
				}
				this.getView().setModel(new JSONModel({
					Data: filteredArray
				}));
				conditionTable.bindRows("/Data");
				this.getView().byId("Ttitle").setText("Cost Association (" + filteredArray.length + ")");
				this.calculate(true, "", "");

			}.bind(this));

		},

		calculate: function (DefaultValues, NewCost, NewValidFrom) {
			var oTable = this.getView().byId("Table");
			var oModel = oTable.getModel();
			var rowPath = "";
			// var tableData = model.getProperty("/Data");
			// var RetailPrice = 0,
			// 	CaseCost = 0,
			// 	CasePack = 1,
			// 	Allowance = 0,
			// 	GM = 0,
			// 	GMallow = 0;
			for (var i = 0; i < oModel.getData().Data.length; i++) {
				rowPath = "/Data/" + i;
				this.calculateRow(oModel, DefaultValues, NewCost, NewValidFrom, rowPath);

				// if (NewCost !== "")
				// 	tableData[i].New_Cost = NewCost;
				// if (NewValidFrom !== "")
				// 	tableData[i].valid_from = NewValidFrom;

				// RetailPrice = tableData[i].RetailPrice;	
				// CaseCost =  tableData[i].New_Cost;	
				// CasePack = tableData[i].Case_Pack;	
				// Allowance = tableData[i].Allowance;	

				// GM = ((parseFloat(RetailPrice,2 ) - (parseFloat(CaseCost, 2) / parseFloat(CasePack, 2))) / parseFloat(RetailPrice, 2)) * 100;	
				// tableData[i].gm = isNaN(GM) ? 0 : GM.toFixed(2);

				// GMallow = ((parseFloat(RetailPrice, 2) - (parseFloat(CaseCost, 2) / parseFloat(CasePack, 2)) + parseFloat(Allowance, 2)) / parseFloat(RetailPrice, 2)) * 100;	
				// tableData[i].gmallow = isNaN(GMallow) ? 0 : GMallow.toFixed(2);

				// rowPath = "/Data/" + i;
				// model.setProperty(rowPath, tableData[i]);
			}
			oModel.refresh();

		},

		calculateRow: function (oModel, DefaultValues, NewCaseCost, NewEffDate, rowPath) {
			var tableData = oModel.getProperty(rowPath);
			var lRetailPrice = 0;
			var lNewCaseCost = 0;
			var lCasePack = 0;
			var lAllowance = 0;
			var lGM = 0,
				lGMallow = 0;

			if (NewEffDate !== "") {
				tableData.valid_from = NewEffDate;
			}

			if (NewCaseCost !== "") {
				tableData.NewCaseCost = NewCaseCost;
				tableData.NewUnitCost = NewCaseCost / tableData.CasePack;
			} else if (DefaultValues) {
				tableData.NewUnitCost = tableData.UnitCost;
				tableData.NewCaseCost = tableData.UnitCost * tableData.CasePack;
				tableData.NewCaseCost = tableData.NewCaseCost.toFixed(2);
				tableData.CaseCost = tableData.UnitCost * tableData.CasePack;
				tableData.CaseCost = tableData.CaseCost.toFixed(2);
				lGM = ((parseFloat(tableData.RetailPrice, 2) - parseFloat(tableData.UnitCost)) / parseFloat(tableData.RetailPrice, 2)) * 100;
				tableData.Margin = isNaN(lGM) ? 0 : lGM.toFixed(2);
			}

			lRetailPrice = tableData.RetailPrice;
			lNewCaseCost = tableData.NewCaseCost;
			lCasePack = tableData.CasePack;
			lAllowance = tableData.Allowance;

			lGM = ((parseFloat(lRetailPrice, 2) - (parseFloat(lNewCaseCost, 2) / parseFloat(lCasePack, 2))) / parseFloat(lRetailPrice, 2)) *
				100;
			tableData.newgm = isNaN(lGM) ? 0 : lGM.toFixed(2);

			lGMallow = ((parseFloat(lRetailPrice, 2) - (parseFloat(lNewCaseCost, 2) / parseFloat(lCasePack, 2)) + parseFloat(lAllowance, 2)) /
				parseFloat(lRetailPrice, 2)) * 100;
			tableData.newgmallow = isNaN(lGMallow) ? 0 : lGMallow.toFixed(2);

			oModel.setProperty(rowPath, tableData);

		},

		onapply: function (oEvent) {
			var value = this.getView().byId("case").getValue();
			var datevalue = this.getView().byId("date").getDateValue();
			var date = new Date(datevalue);
			var datef = ((date.getMonth() > 8) ? (date.getMonth() + 1) : ('0' + (date.getMonth() + 1))) + '/' + ((date.getDate() > 9) ? date.getDate() :
				('0' + date.getDate())) + '/' + date.getFullYear();
			this.calculate(false, value, datef);
			this.getOwnerComponent().getModel("appControl").setProperty("/Save", true);
		},

		colorCode: function (isParent, Family, Material) {
			if (Family !== "") {
				if (isParent) return "#0d6733"; //Dark Green
				else return "#16ab54"; //Light Green
			} else if (Material !== "" && Material !== undefined)
				return "#72b5f8"; //Blue
			else return "";
		},

		showFamilyInfo: function (oEvent) {
			var itemModel = this.getView().byId("Table").getModel();
			var sPath = oEvent.getSource().getParent().getBindingContext().sPath;
			var selected = itemModel.getProperty(sPath);
			if (selected.Family !== "") {
				var filePath = jQuery.sap.getModulePath("Ingles.Mock.ta/CostAssocFamily.json");
				var attModel = new JSONModel(filePath);
				attModel.attachRequestCompleted(function () {
					var dataArray = attModel.getData().Data;
					var familyinfo = dataArray.filter(function (obj) {
						return obj.Family.toString() === selected.Family.toString();
					});
					if (familyinfo.length > 1)
						this.openFamilyPopup("DISPLAY", selected, familyinfo, -1);
					else MessageToast.show("Selected item is not part of a Cost Family");
				}.bind(this));
			}
		},

		openFamilyPopup: function (action, selected, family, rowPath) {
			this.FamilyDialog = sap.ui.xmlfragment("Ingles.Mock.
			var title = "";
			var message = "";
			var showContinue = true;
			if (action === "INPUT") {
				if (selected.IsParent) {
					title = "Parent item of Cost Family entered";
					message = "Click Continue to insert parent item";
					showContinue = true;
				} else {
					title = "Child item of Cost Family entered";
					message = "Click Replace to replace with parent item";
					showContinue = false;
				}
			} else if (action === "DISPLAY") {
				title = "Cost Family Details";
				// message = "You have selected a " + (selected.IsParent ? "Parent" : "Child") + " item";
				showContinue = true;
			}

			var popupinfo = new JSONModel({
				title: title,
				message: message,
				selected: selected,
				familyID: selected.Family,
				familyinfo: family,
				rowPath: rowPath,
				action: action,
				showContinue: showContinue
			});
			this.getView().setModel(popupinfo, "family");
			this.getView().addDependent(this.FamilyDialog);
			this.FamilyDialog.open();
		},
		closeFamilyPopup: function () {
			var popupinfo = this.getView().getModel("family").getData();
			if (popupinfo.action === "INPUT") {
				if (popupinfo.selected.IsParent) {
					popupinfo.selected = this.setMargins(popupinfo.selected);
					this.getView().getModel().setProperty(popupinfo.rowPath, popupinfo.selected);
				} else {
					var selected = popupinfo.familyinfo.filter(function (obj) {
						return obj.IsParent;
					});
					if (selected.length > 0) {
						selected[0] = this.setMargins(selected[0]);
						this.getView().getModel().setProperty(popupinfo.rowPath, selected[0]);
					}
				}
			}
			this.cancelFamilyPopup();
		},
		cancelFamilyPopup: function () {
			this.FamilyDialog.close();
			this.FamilyDialog.destroy();
		},
		
		setHideableColumns: function () {  //NOT USED YET
			var appControlData = this.getOwnerComponent().getModel("appControl").getData();
			appControlData.hiddenColumns = [];
			// var mode = this.getView().getModel("query").getProperty("/Mode");
			// var add = true;
			// appControlData.ModeHideableColumns = [];
			// for (var i = 0; i < appControlData.AllHideableColumns.length; i++) {
			// 	add = true;
			// 	if (mode === "01" && appControlData.ColumnsHiddenInCreate.indexOf(appControlData.AllHideableColumns[i].key) >= 0)
			// 		add = false;
			// 	if (add) appControlData.ModeHideableColumns.push(appControlData.AllHideableColumns[i]);
			// }
			appControlData.ModeHideableColumns = appControlData.AllHideableColumns;
			this.getOwnerComponent().getModel("appControl").setData(appControlData);
		},
		
		onHideColumnsChange: function (oEvent) {
			// var mode = this.getView().getModel("query").getProperty("/Mode");
			var appControlData = this.getOwnerComponent().getModel("appControl").getData();
			var aColumnsSelected = appControlData.hiddenColumns;

			var aTableColumns = this.getView().byId("Table").getColumns();
			var toHide = false;
			for (var i = 0; i < aTableColumns.length; i++) {
				toHide = false;
				for (var j = 0; j < aColumnsSelected.length; j++) {
					if (aTableColumns[i].getName() === aColumnsSelected[j]) {
						toHide = true;
						break;
					}
				}
				if (toHide)
					aTableColumns[i].setVisible(false);
				else
					aTableColumns[i].setVisible(true);
			}
		},

		// oncasecost: function () {
		// 	var value = this.getView().byId("case").getValue();
		// 	var select = this.getView().byId("slName").getSelectedKey();
		// 	var pack = this.getView().byId("casepack").getValue();
		// 	// var allow = this.getView().byId("allow").getValue();
		// 	var number;
		// 	if (pack > 0) {
		// 		if (select === "001") {
		// 			number = (parseFloat(value, 2)) / parseFloat(pack, 2); //( parseFloat(value, 2) - parseFloat(allow,2) ) / parseFloat(pack,2);
		// 		} else if (select === "002") {
		// 			number = (parseFloat(value, 2)) / parseFloat(pack, 2); //( parseFloat(value, 2) - parseFloat(allow,2) ) / parseFloat(pack,2);
		// 		} else {
		// 			number = (parseFloat(value, 2)) / parseFloat(pack, 2); //( parseFloat(value, 2) - parseFloat(allow,2) ) / parseFloat(pack,2);
		// 		}
		// 		this.getView().byId("unitCost").setValue(number.toFixed(2));
		// 	}
		// },

		getQuery: function (oArgs) {

			// var sPath = jQuery.sap.getModulePath("Ingles.Mock.
			// var conditionTable = this.getView().byId("Table");
			// var attModel = new JSONModel(sPath);
			// attModel.setDefaultBindingMode("TwoWay");
			// this.getView().setModel(attModel);

			// conditionTable.bindRows("/Data");
			// attModel.refresh();
			// // this.getView().byId("Table").rerender();
			// this.onfirstdisplay();
			// var that = this;
			// setTimeout(function () {
			// 	var count = that.getView().byId("Table").getBinding().iLength;
			// 	that.getView().byId("Ttitle").setText("Cost Association (" + count + ")");
			// }, 1000);

		},

		// onfirstdisplay: function (oEvent) {
		// 	var oTable = this.getView().byId("Table");
		// 	var oRows = oTable.getRows();
		// 	for (var i = 0; i < oRows.length; i++) {
		// 		// var oCell = oRows[i].getCells()[4];
		// 		// oCell.setProperty("editable", true);
		// 		// oCell = oRows[i].getCells()[5];
		// 		// var oCell.setProperty("editable", true);
		// 		// var oCell = oRows[i].getCells()[0];
		// 		// oCell.setProperty("editable", true);
		// 		// oCell = oRows[i].getCells()[1];
		// 		// oCell.setProperty("editable", true);
		// 		// oCell = oRows[i].getCells()[4];
		// 		// oCell.setProperty("editable", false);
		// 		// oCell = oRows[i].getCells()[3];
		// 		// oCell.getItems()[0].setProperty("editable", true);
		// 		// oCell = oRows[i].getCells()[4];
		// 		// oCell.setProperty("editable", true);
		// 	}
		// 	this.onEditAction();
		// 	var that = this;
		// 	setTimeout(function () {
		// 		that.firstcalculate();
		// 	}, 1000);
		// },

		ongroup: function () {
			var aSorters = [];
			aSorters.push(new Sorter("Vendor", false, true));
			this.getView().byId("Table").getBinding("rows").sort(aSorters);
			this.getView().byId("Table").rerender();
		},

		firstcalculate: function () {
			var oTable = this.getView().byId("Table");
			var model = this.getView().byId("Table").getModel();
			var oRows = oTable.getModel().getData().Data,
				cost, retailprice, calculated, finalcal, calculatedallow, finalallow;
			// var casecost = this.getView().byId("case").getValue();
			// var casepack = this.getView().byId("casepack").getValue();
			// cost = this.getView().byId("unitCost").getValue();			
			// var retailwithoutallowance = parseFloat(casecost, 2) / parseFloat(casepack,2);
			// var allowance = this.getView().byId("allow").getValue();
			var allowance;
			for (var i = 0; i < oRows.length; i++) {

				cost = model.getProperty("/Data/" + i + "/Price") / model.getProperty("/Data/" + i + "/Last_Cost");
				allowance = model.getProperty("/Data/" + i + "/Allowance");
				retailprice = model.getProperty("/Data/" + i + "/RetailPrice");

				calculated = ((parseFloat(retailprice, 2) - parseFloat(cost, 2)) / parseFloat(retailprice, 2)) * 100;
				calculatedallow = ((parseFloat(retailprice, 2) - parseFloat(cost, 2) + parseFloat(allowance, 2)) / parseFloat(retailprice, 2)) *
					100;
				finalcal = isNaN(calculated) ? 0 : calculated.toFixed(2);
				finalallow = isNaN(calculatedallow) ? 0 : calculatedallow.toFixed(2);
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
			// this.getView().byId("Tfilter").setVisible(true);
			this.getView().byId("Treset").setVisible(true);
			// this.getView().byId("Tcreate").setVisible(true);

			//this.getView().byId("BCopy").setVisible(true);
			// this.getView().byId("iclone").setVisible(true);
			this.getView().byId("isave").setVisible(true);

		},
		onDeletePress: function (oEvent) {
			// var itemModel = this.getView().byId("Table").getModel(),
			// 	conditionTable = this.getView().byId("Table"),
			// 	oRow = oEvent.getParameter("row"),
			// 	sIndex = oRow.getBindingContext().sPath.split("/")[2];
			// var length = this.getView().byId("Table").getModel().getData().Data.length - 1;
			// itemModel.getData().Data.splice(sIndex, 1);
			// itemModel.refresh();

			var itemModel = this.getView().byId("Table").getModel();
			var oTable = this.getView().byId("Table");
			var indices = oTable.getSelectedIndices();
			if (indices.length === 0) {
				MessageToast.show("Select atleast one row");
				return;
			}
			indices.sort(function (a, b) {
				return b - a;
			});
			for (var i = 0; i < indices.length; i++) {
				itemModel.getData().Data.splice(indices[i], 1);
			}
			itemModel.refresh();

			this.getView().byId("Ttitle").setText("Cost Association (" + itemModel.getData().Data.length + ")");
			oTable.removeSelectionInterval(length, length);
		},

		onAddRows: function (oEvent) {
			this.addRowsDialog = sap.ui.xmlfragment("Ingles.Mock.;

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
				this.copyRowsDialog = sap.ui.xmlfragment("Ingles.Mock.on.fragments.Copy", this);
				var sPath = jQuery.sap.getModulePath("Ingles.Mock.cost_association", "/test/data/products.json");
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
			var strategy = this.getView().byId("strategy").getSelectedKey();
			var conditionTable = this.getView().byId("Table");
			// if (primary) {
			// 	if (select === "001" || strategy === "207") {
			// 		conditionTable.addSelectionInterval(0, iIndex.length - 1);
			// 	} else if (select === "002" || strategy === "001") {
			// 		conditionTable.addSelectionInterval(0, iIndex.length - 1);
			// 	}
			// }
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
			var strategy = this.getView().byId("strategy").getSelectedKey();
			var afilters = [];
			var tokens = this.getView().byId("multiInput").getTokens();
			var count = this.getView().byId("Table").getBinding().iLength;
			if (primary) {
				if (select === "001" || strategy === "207") {
					var sPath = jQuery.sap.getModulePath("Ingles.Mock.cost_association", "/test/data/Pricingdata.json");
					this.getView().byId("Ttitle").setText("Cost Association (" + 4 + ")");
				} else {
					sPath = jQuery.sap.getModulePath("Ingles.Mock.cost_association", "/test/data/Pricingdata2.json");
					this.getView().byId("Ttitle").setText("Cost Association (" + 2 + ")");
				}
			} else {
				sPath = jQuery.sap.getModulePath("Ingles.Mock.cost_association", "/test/data/data.json");
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

			/*			var select = oEvent.getSource().getSelectedKey();

						if (select === "001") {
							this.getView().byId("casepack").setValue(2);
						} else if (select === "002") {
							this.getView().byId("casepack").setValue(4);
						}*/

		},
		ondel: function (oEvent) {
			// var tokens = oEvent.getSource().getTokens();
			// if (tokens.length === 1) {
			// 	this.getView().byId("slName").setEnabled(true);
			// 	this.getView().byId("strategy").setEnabled(true);
			// }
		},
		_getDefaultTokens: function () {
			//var ValueHelpRangeOperation = compLibrary.valuehelpdialog.ValueHelpRangeOperation;
			var oToken1 = new Token({
				key: "626",
				text: "626"
			});
			var oToken2 = new Token({
				key: "670",
				text: "670"
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

			this._oValueHelpDialog = sap.ui.xmlfragment("Ingles.Mock.cost_association.fragments.ValueHelpDialogFilterbar", this);
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
			// this.getView().byId("casepack").setValue("12");
			aTokens.map(function (item) {
				return item.setText(item.getKey());
			});
			this._oMultiInput.setTokens(aTokens);
			this._oValueHelpDialog.close();

			// if (aTokens.length === 0) {
			// 	this.getView().byId("slName").setEnabled(true);
			// 	this.getView().byId("strategy").setEnabled(true);
			// } else {
			// 	this.getView().byId("slName").setEnabled(false);
			// 	this.getView().byId("strategy").setEnabled(false);
			// }
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
				"Ingles.Mock.cost_association.fragments.ValueHelpDialogFilterbarWithSuggestions", this);
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
		// selectline: function (oEvent) {
		// 	var table = this.getView().byId("Table"),
		// 		oRow = oEvent.getSource().getParent().getParent().getBindingContext().getPath().slice(6);
		// 	this.calculate(oRow, table);
		// 	table.addSelectionInterval(oRow, oRow);
		// },
		onreset: function (oEvent) {
			var primary = this.getView().byId("slName").getEnabled();
			var select = this.getView().byId("slName").getSelectedKey();
			var strategy = this.getView().byId("strategy").getSelectedKey();

			if (primary) {
				if (select === "001" || strategy === "207") {
					var sPath = jQuery.sap.getModulePath("Ingles.Mock.cost_association", "/test/data/Pricingdata.json");
				} else {
					sPath = jQuery.sap.getModulePath("Ingles.Mock.cost_association", "/test/data/Pricingdata2.json");
				}
			} else {
				sPath = jQuery.sap.getModulePath("Ingles.Mock.cost_association", "/test/data/data.json");

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
			// var primary = this.getView().byId("slName").getEnabled();
			// var oRow = oEvent.getParameter("rowIndex");
			// var table = this.getView().byId("Table");
			// if (primary) {
			// 	table.addSelectionInterval(oRow, oRow);
			// }
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
		onApplyMassUpdate: function (oEvent) {
			this.bGrouped = false;
			this.bDescending = false;
			this.sSearchQuery = 0;

			if (this.getView().byId("case").getValue() === "") {
				MessageToast.show("Enter valid Case Cost");
				return;
			}
			// if (this.getView().byId("casepack").getValue() === "") {
			// 	MessageToast.show("Enter valid Case Pack");
			// 	return;
			// }

			//this.fnApplyFiltersAndOrdering(oEvent);
			var that = this;
			setTimeout(function () {
				that.onapply();
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
			this.addMessageToTarget("", "", "Cost Association update successfully", "Success",
				"",
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