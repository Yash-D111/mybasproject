sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    'sap/m/MessageToast',
    "sap/m/MessageBox",
    "sap/ui/core/format/DateFormat",
    'sap/viz/ui5/data/FlattenedDataset',
    'sap/viz/ui5/format/ChartFormatter',
    'sap/viz/ui5/api/env/Format',
    'sap/ui/model/BindingMode',
    'sap/ui/core/util/Export',
    'sap/ui/core/util/ExportTypeCSV',
    'qmreport/model/jsPDF',
    "sap/m/Token",

],
    function (Controller, JSONModel, MessageToast, MessageBox, DateFormat, FlattenedDataset, ChartFormatter, Format, BindingMode, Export, ExportTypeCSV, jsPDF, Token) {
        "use strict";
        var oFilter = [];
        var oFilter2 = [];
        var oFilter3 = [];
        var oFilter4 = [];
        var tdata = [];
        var aTokens = [];
        var existingRecordsCache = [];

        return Controller.extend("qmreport.controller.QMreport", {
            oVizFrame: null,
            onInit: function () {


                var material = this.getView().byId("Material_1");
                var fnValidator = function (args) {
                    var text = args.text;
                    return new Token({ key: text, text: text });
                };

                material.addValidator(fnValidator);
                var obj = {
                    "Plant": "",
                    "CreationDate": "",
                    "Material": "",
                    "InspectionSpecification": ""
                };
                var oModel = new sap.ui.model.json.JSONModel(obj);
                this.getView().setModel(oModel, "localModel");

                var aModel = new sap.ui.model.json.JSONModel();
                this.getView().setModel(aModel, "itemModel");
                $.getScript("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js")
                    .done(function (script, textStatus) {
                        console.log("XLSX library loaded successfully");
                    })
                    .fail(function (jqxhr, settings, exception) {
                        console.error("Failed to load XLSX library");
                    });



            },
            // onSelectionChange: function(oEvent) {
            //     // This function is called when the selection of rows changes
            //     var aSelectedItems = oEvent.getSource().getSelectedItems();
            //     // Store the selected items in the view model or another suitable place if needed
            //     this.getView().getModel("selectedItems").setProperty("/selectedRows", aSelectedItems);
            // },

            formatDate: function (sDate) {
                if (!sDate) {
                    return "";
                }
                var dateTime = new Date(sDate);
                var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "dd.MM.yyyy" });
                var dateStr = dateFormat.format(dateTime);
                return dateStr;
            },

            _onSearch: function (oEvent) {
                var sValue = oEvent.getParameter("value");
                var oFilter = new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.Contains, sValue);
                // var oFilter2 = new sap.ui.model.Filter("InspectionSpecification", sap.ui.model.FilterOperator.Contains, sValue);
                oEvent.getSource().getBinding("items").filter([oFilter]);
            },


            _onMaterialValueHelpRequest: function (oEvent) {
                var that = this;

                // Check if the dialog already exists
                if (!this._Dialog) {
                    this._Dialog = sap.ui.xmlfragment("qmreport.view.materialvaluehelp", this);
                    this.getView().addDependent(this._Dialog);
                }

                // Open the dialog and set it to busy
                this._Dialog.open();
                this._Dialog.setBusy(true);

                this.getView().getModel("YY1_QM_INSPLOTDATASUMMARY_CDS").read("/YY1_QM_InspLotDataSummary", {
                    success: function (oData, oResponse) {
                        var uniqueMaterials = {}, arr = [];

                        for (var i = 0; i < oData.results.length; i++) {
                            var obj = {
                                "Material": oData.results[i].Material,
                            };

                            var sMaterial = oData.results[i].Material;
                            if (!uniqueMaterials[sMaterial]) {
                                uniqueMaterials[sMaterial] = true;
                                arr.push(obj);
                            }
                        }


                        var oModel = new sap.ui.model.json.JSONModel(oData);
                        that.getView().setModel(oModel, "MaterialDataModel");
                        that.getView().getModel("MaterialDataModel").setSizeLimit(1000);
                        that.getView().getModel("MaterialDataModel").setProperty("/results", arr);
                        that._Dialog.setBusy(false);
                    },
                    error: function (err) {
                        sap.m.MessageToast.error(JSON.parse(err.responseText).error.message.value);
                        that._Dialog.setBusy(false);
                    }
                });
            },

            _onMaterialValueHelpClose: function (oEvent) {
                var oSelectedItem = oEvent.getParameter("selectedItem");
                oEvent.getSource().getBinding("items").filter([]);
                if (!oSelectedItem) {
                    return;
                }

                var sTitle = oSelectedItem.getTitle();
                this.getView().getModel("localModel").setProperty("/Material", sTitle);

                // Close the dialog but do not destroy it

            },

            _onMaterialValueHelpConfirm: function (evt) {
                var aSelectedItems = evt.getParameter("selectedItems");

                var oInput = this.byId("Material_1");
                if (aSelectedItems && aSelectedItems.length > 0) {
                    aSelectedItems.forEach(function (oItem) {
                        oInput.addToken(new Token({
                            text: oItem.getTitle()
                        }));
                    });
                }
            },


            _onMICValueHelpRequest: function (oEvent) {
                var that = this;

                if (!this._micDialog) {
                    this._micDialog = sap.ui.xmlfragment("qmreport.view.MICValuehelp", this);
                    this.getView().addDependent(this._micDialog);
                }

                this._micDialog.open();
                this._micDialog.setBusy(true);

                this.getView().getModel("YY1_QM_SUMMARYREPORT_4_CDS").read("/YY1_QM_SummaryReport_4", {
                    // filters: aFilters,
                    success: function (oData, oResponse) {
                        var uniqueMIC = {}, arr = [];

                        for (var i = 0; i < oData.results.length; i++) {

                            var obj = {
                                "InspectionSpecification": oData.results[i].InspectionSpecification,

                            };

                            var sMIC = oData.results[i].InspectionSpecification;
                            if (!uniqueMIC[sMIC]) {

                                uniqueMIC[sMIC] = true;
                                arr.push(obj);
                            }

                        }
                        var oModel = new sap.ui.model.json.JSONModel(oData);
                        that.getView().setModel(oModel, "MICDataModel");
                        that.getView().getModel("MICDataModel").setProperty("/results", arr);
                        that._micDialog.setBusy(false);
                    },
                    error: function (err) {
                        sap.m.MessageToast.error(JSON.parse(err.responseText).error.message.value);
                        that._micDialog.setBusy(false);
                    }
                });
            },

            _onMICValueHelpClose: function (oEvent) {
                var oSelectedItem = oEvent.getParameter("selectedItem");
                oEvent.getSource().getBinding("items").filter([]);
                if (!oSelectedItem) {
                    return;
                }
                var sTitle = oSelectedItem.getTitle();
                var sDescription = oSelectedItem.getDescription();
                this.getView().getModel("localModel").setProperty("/InspectionSpecification", sTitle);
                that._micDialog.close();



            },


            _onMICValueHelpConfirm: function (evt) {
                var that = this
                var aSelectedItems = evt.getParameter("selectedItems");
                var oInput = this.byId("MIC_1");
                var selectedMIC = [];

                if (aSelectedItems && aSelectedItems.length > 0) {
                    selectedMIC = aSelectedItems.map(function (oItem) {
                        return oItem.getTitle();
                    });

                    oInput.setValue(selectedMIC); // Set selected values to input box
                }

                // Store selected values in local model
                this.getView().getModel("localModel").setProperty("/InspectionSpecification", selectedMIC);
                // this._micDialog = null;
                // this._micDialog.close()
                //    that.getView().byId("_IDGenSelectDialog2").close();

                // oInput.getBinding("suggestionItems").filter([]);
            },
            _onOwnerValueHelpRequest: function () {
                var that = this;
                this._Dialog = sap.ui.xmlfragment("qmreport.view.producttypevaluehelp", this);
                this.getView().addDependent(this._Dialog);
                this._Dialog.open();
                this._Dialog.setBusy(true);
                this.getView().getModel("YY1_QM_INSPLOTDATASUMMARY_CDS").read("/YY1_QM_InspLotDataSummary", {
                    success: function (oData, oResponse) {
                        var uniqueMIC = {}, arr = [];

                        for (var i = 0; i < oData.results.length; i++) {

                            var obj = {
                                "ProductType": oData.results[i].ProductType,

                            };

                            var sMIC = oData.results[i].ProductType;
                            if (!uniqueMIC[sMIC]) {

                                uniqueMIC[sMIC] = true;
                                arr.push(obj);
                            }
                        }


                        var oModel = new sap.ui.model.json.JSONModel(oData);
                        that.getView().setModel(oModel, "OwnerModel");
                        that.getView().getModel("OwnerModel").setProperty("/results", arr);
                        that._Dialog.setBusy(false);
                    },
                    error: function (err) {
                        MessageToast.error(JSON.parse(err.responseText).error.message.value);
                        that._Dialog.setBusy(false);
                    }
                });
            },

            _onOwnerValueHelpConfirm: function (oEvent) {
                var oSelectedItem = oEvent.getParameter("selectedItem");
                oEvent.getSource().getBinding("items").filter([]);
                if (!oSelectedItem) {
                    return;
                }
                this.getView().getModel("localModel").setProperty("/ProductType", oSelectedItem.getTitle());
            },

            _onOwnerSearch: function (oEvent) {
                var sValue = oEvent.getParameter("value");
                var oFilter = new sap.ui.model.Filter("ProductType", sap.ui.model.FilterOperator.Contains, sValue);
                oEvent.getSource().getBinding("items").filter([oFilter]);
            },

            setFilters: function (aProperty, aTokens) {
                for (var i = 0; i < aTokens.length; i++) {
                    oFilter.push(new sap.ui.model.Filter(aProperty, sap.ui.model.FilterOperator.EQ, aTokens[i].getText()));
                };
            },

            onExecute: function () {
                var that = this;
                oFilter = [];
                oFilter2 = [];
                oFilter3 = [];
                oFilter4 = [];
                tdata = []
                aTokens = [];
                // var sMaterial = this.getView().getModel("localModel").getProperty("/Material");
                var sPlant = that.getView().getModel("localModel").getProperty("/Plant");
                var sDate = this.getView().byId("idFrom").getValue();
                var tDate = this.getView().byId("idto").getValue();
                var mic = this.getView().getModel("localModel").getProperty("/InspectionSpecification");
                var sproducttype = this.getView().getModel("localModel").getProperty("/ProductType");

                aTokens = this.getView().byId("Material_1").getTokens();
                if (aTokens) {
                    this.setFilters("Material", aTokens);
                }

                if (sPlant === "" || sPlant === undefined) {

                    sap.m.MessageBox.error("Please enter the required fields!");
                    return;
                } else {
                    oFilter.push(new sap.ui.model.Filter("Plant", sap.ui.model.FilterOperator.EQ, sPlant));
                }

                if (sDate === "" && tDate === "") {
                    sap.m.MessageBox.show("Please enter the Posting Date!");
                    return;
                }
                else if (sDate && tDate) {
                    oFilter.push(new sap.ui.model.Filter("InspLotCreatedOnLocalDate", sap.ui.model.FilterOperator.BT, this.convertDate(sDate), this.convertDate(tDate)));
                } else if (sDate) {
                    oFilter.push(new sap.ui.model.Filter("InspLotCreatedOnLocalDate", sap.ui.model.FilterOperator.EQ, this.convertDate(sDate)));
                } else if (tDate) {
                    oFilter.push(new sap.ui.model.Filter("InspLotCreatedOnLocalDate", sap.ui.model.FilterOperator.EQ, this.convertDate(tDate)));
                }
                if (sproducttype) {

                    oFilter.push(new sap.ui.model.Filter("ProductType", sap.ui.model.FilterOperator.EQ, sproducttype));


                }
                if (mic) {
                    mic.forEach(function (item) {
                        oFilter2.push(new sap.ui.model.Filter("InspectionSpecification", sap.ui.model.FilterOperator.EQ, item));
                    });
                    // oFilter2.push(new sap.ui.model.Filter("InspectionSpecification", sap.ui.model.FilterOperator.EQ, mic)); 
                }
                // Fetch initial data
                this.getView().setBusy(true);
                that.getView().getModel("YY1_QM_INSPLOTDATASUMMARY_CDS").read("/YY1_QM_InspLotDataSummary", {
                    filters: oFilter,
                    success: function (oData) {
                        console.log(oData.results)


                        for (var i = 0; i < oData.results.length; i++) {
                            if (oData.results[i].InspectionLot) {
                                oFilter2.push(new sap.ui.model.Filter("InspectionLot", sap.ui.model.FilterOperator.EQ, oData.results[i].InspectionLot));
                            }
                            var obj = {
                                //             // "SrNo": i + 1,
                                // InspectionLot: oData.results[i].InspectionLot.padStart(12, '0'),
                                InspectionLot: oData.results[i].InspectionLot,
                                Material: oData.results[i].Material,
                                SupplierName: oData.results[i].SupplierName,
                                ProductType: oData.results[i].ProductType,
                                InspLotCreatedOnLocalDate: that.formatDate(oData.results[i].InspLotCreatedOnLocalDate),
                                UUID: oData.results[i].SAP_UUID,
                                NumberofSheets: oData.results[i].NumberofSheets,
                                InspectionLotUsageDecisionCode: oData.results[i].InspectionLotUsageDecisionCode,
                                UsageDecisionCodeText: oData.results[i].UsageDecisionCodeText,
                            };
                            tdata.push(obj);


                        }
                        that.getView().getModel("itemModel").setData({ items: tdata });
                        // that.getView().getModel("itemModel").setProperty("/items", tdata);
                        that._fetchdata1();
                        // that.fetchDataFromCBO();


                    },
                    error: function (oError) {
                        // console.error("Initial Data Fetch Error:", oError);
                        sap.m.MessageBox.error("Data not found!");
                        that.getView().setBusy(false);
                    }
                });
            },

            _fetchdata1: function () {
                var that = this;
                oFilter3 = [];

                let totalInspectionResultMeanValue = 1;
                let totalInspSpecTargetValue = 1;
                let previousInspectionLot = null;

                var oModel = that.getView().getModel("YY1_QM_SUMMARYREPORT_4_CDS")
                that.getView().setBusy(true);


                // Read data from the OData service
                oModel.read("/YY1_QM_SummaryReport_4", {
                    filters: oFilter2,
                    success: function (odata) {


                        console.log("odata of fetchdata1", odata);

                        // Initialize variables for the calculations

                        for (var i = 0; i < odata.results.length; i++) {
                            if (odata.results[i].InspectionLot) {
                                oFilter3.push(new sap.ui.model.Filter("InspectionLot", sap.ui.model.FilterOperator.EQ, odata.results[i].InspectionLot));
                            }
                            if (odata.results[i].InspectionCharacteristic) {
                                oFilter3.push(new sap.ui.model.Filter("InspectionCharacteristic", sap.ui.model.FilterOperator.EQ, odata.results[i].InspectionCharacteristic));
                            }
                            tdata.forEach(function (item) {

                                if (item.InspectionLot == odata.results[i].InspectionLot) {

                                    // Reset values when a new inspection lot is encountered
                                    if (previousInspectionLot !== odata.results[i].InspectionLot) {
                                        totalInspectionResultMeanValue = 1;
                                        totalInspSpecTargetValue = 1;
                                        previousInspectionLot = odata.results[i].InspectionLot;
                                    }
                                    // Set common fields

                                    item.InspectionLot = odata.results[i].InspectionLot;
                                    item.InspectionLotQuantity = odata.results[i].InspectionLotQuantity;
                                    item.InspectionLotQuantityUnit = odata.results[i].InspectionLotQuantityUnit;

                                    // Set the values and accumulate for calculation based on InspectionSpecification
                                    if (odata.results[i].InspectionSpecification == "LENGTH") {

                                        item.InspSpecTargetValue = parseFloat(odata.results[i].InspSpecTargetValue).toFixed(2);
                                        item.InspectionResultMeanValue = parseFloat(odata.results[i].InspectionResultMeanValue).toFixed(2);
                                        item.InspectionSpecification = odata.results[i].InspectionSpecification;
                                        item.InspSpecLowerLimit = parseFloat(odata.results[i].InspSpecLowerLimit);
                                        item.InspSpecUpperLimit = parseFloat(odata.results[i].InspSpecUpperLimit);
                                        item.InspectionCharacteristic = odata.results[i].InspectionCharacteristic;
                                    }
                                    if (odata.results[i].InspectionSpecification == "WIDTH") {
                                        item.InspSpecTargetValue1 = parseFloat(odata.results[i].InspSpecTargetValue).toFixed(2);

                                        item.InspectionResultMeanValue1 = parseFloat(odata.results[i].InspectionResultMeanValue).toFixed(2);
                                        item.InspectionSpecification1 = odata.results[i].InspectionSpecification;
                                        item.InspSpecLowerLimit1 = parseFloat(odata.results[i].InspSpecLowerLimit);
                                        item.InspSpecUpperLimit1 = parseFloat(odata.results[i].InspSpecUpperLimit);
                                        item.InspectionCharacteristic1 = odata.results[i].InspectionCharacteristic;
                                    }
                                    if (odata.results[i].InspectionSpecification == "THK") {
                                        item.InspSpecTargetValue2 = parseFloat(odata.results[i].InspSpecTargetValue).toFixed(2);
                                        item.InspSpecTargetValue_1 = parseFloat(odata.results[i].InspSpecTargetValue).toFixed(2);
                                        item.InspectionResultMeanValue2 = parseFloat(odata.results[i].InspectionResultMeanValue).toFixed(2);
                                        item.InspectionSpecification2 = odata.results[i].InspectionSpecification;
                                        item.InspSpecLowerLimit2 = parseFloat(odata.results[i].InspSpecLowerLimit);
                                        item.InspSpecUpperLimit2 = parseFloat(odata.results[i].InspSpecUpperLimit);
                                        item.InspectionCharacteristic2 = odata.results[i].InspectionCharacteristic;

                                    }
                                    if (item.InspectionLot !== odata.results[i].InspectionLot) {
                                        totalInspectionResultMeanValue = 1;
                                        totalInspSpecTargetValue = 1;
                                    }

                                    //  final calculation 
                                    totalInspSpecTargetValue = (parseFloat(totalInspSpecTargetValue) * parseFloat(odata.results[i].InspSpecTargetValue));
                                    totalInspectionResultMeanValue = (parseFloat(totalInspectionResultMeanValue) * parseFloat(odata.results[i].InspectionResultMeanValue));

                                    // Perform the final calculations using the accumulated values
                                    let finalSysweight = parseFloat((totalInspectionResultMeanValue * 7.86) / 1000000).toFixed(2);
                                    let finalActualWeightPsheetRead = parseFloat((totalInspSpecTargetValue * 7.86) / 1000000).toFixed(2);
                                    item.Sysweight = finalActualWeightPsheetRead;
                                    item.actualweightpsheetread = finalSysweight;
                                    item.calculate = item.InspSpecTargetValue + "*" + item.InspSpecTargetValue1 + "*" + item.InspSpecTargetValue2;
                                }
                            });
                        }

                        console.log("tdata", tdata);
                        that.fetchdata2();

                    },
                    error: function (oError) {
                        sap.m.MessageBox.error("Data not found!");
                        console.error("Error fetching data:", oError);
                        that.getView().setBusy(false);
                    }
                });
            },

            fetchdata2: function () {


                var that = this;
                that.getView().setBusy(true);
                var recordsToUpdate = [];

                // Initialize an object to track counts of values for each characteristic and specification combination
                var valueCounters = {};

                that.getView().getModel("YY1_QM_INSPECTIONRESULTSUM_CDS").read("/YY1_QM_InspectionResultSum", {
                    filters: oFilter3,
                    success: function (oData) {
                        console.log("odata of fetchdata2", oData);

                        for (var i = 0; i < oData.results.length; i++) {
                            if (oData.results[i].InspectionLot) {
                                oFilter4.push(new sap.ui.model.Filter("InspectionLot", sap.ui.model.FilterOperator.EQ, oData.results[i].InspectionLot));
                            }
                            tdata.forEach(function (item) {
                                var keyLength = item.InspectionLot + "_LENGTH";
                                var keyWidth = item.InspectionLot + "_WIDTH";
                                var keyThk = item.InspectionLot + "_THK";

                                // Initialize counters for each key if not already present
                                valueCounters[keyLength] = valueCounters[keyLength] || 0;
                                valueCounters[keyWidth] = valueCounters[keyWidth] || 0;
                                valueCounters[keyThk] = valueCounters[keyThk] || 0;

                                // Set values for LENGTH specification
                                if (item.InspectionLot == oData.results[i].InspectionLot &&
                                    item.InspectionCharacteristic == oData.results[i].InspectionCharacteristic &&
                                    oData.results[i].InspectionSpecification == "LENGTH" &&
                                    valueCounters[keyLength] < 5) {

                                    item[`InspectionResultlenOriginalValue${valueCounters[keyLength] || ''}`] = parseFloat(oData.results[i]?.InspectionResultOriginalValue);
                                    valueCounters[keyLength]++;
                                }

                                // Set values for WIDTH specification
                                if (item.InspectionLot == oData.results[i].InspectionLot &&
                                    item.InspectionCharacteristic1 == oData.results[i].InspectionCharacteristic &&
                                    oData.results[i].InspectionSpecification == "WIDTH" &&
                                    valueCounters[keyWidth] < 5) {

                                    item[`InspectionResultwidthOriginalValue${valueCounters[keyWidth] || ''}`] = parseFloat(oData.results[i]?.InspectionResultOriginalValue);
                                    valueCounters[keyWidth]++;
                                }

                                // Set values for THK specification
                                if (item.InspectionLot == oData.results[i].InspectionLot &&
                                    item.InspectionCharacteristic2 == oData.results[i].InspectionCharacteristic &&
                                    oData.results[i].InspectionSpecification == "THK" &&
                                    valueCounters[keyThk] < 5) {

                                    item[`InspectionResultthkOriginalValue${valueCounters[keyThk] || ''}`] = parseFloat(oData.results[i]?.InspectionResultOriginalValue);
                                    valueCounters[keyThk]++;
                                }
                            });
                        }

                        console.log("tdata after featchdata 2", tdata);
                        that.onfeatchdata3();
                        // var oModel = that.getView().getModel("itemModel");
                        // oModel.setData({ items: tdata });

                        // that.getView().getModel("itemModel").setProperty("/items", itemdata);
                        that.getView().setBusy(false);
                        // that.checkExistingRecords(tdata);
                    },
                    error: function () {
                        sap.m.MessageBox.error("Data not found!");
                        that.getView().setBusy(false);
                    }
                });
            },

            onfeatchdata3: function () {
                var that = this;
                that.getView().setBusy(true);
                var recordsToUpdate = [];

                // Initialize an object to track counts of values for each characteristic and specification combination
                var valueCounters = {};

                that.getView().getModel("YY1_QM_MICSUMMARYREPORT_CDS").read("/YY1_QM_MICSUMMARYREPORT", {
                    filters: oFilter4,
                    success: function (oData) {
                        console.log("odata of fetchdata2", oData);

                        for (var i = 0; i < oData.results.length; i++) {
                            tdata.forEach(function (item) {

                                // Set values for LENGTH specification
                                if (item.InspectionLot == (oData.results[i].InspectionLot * 1).toString()) {

                                    item.TotalWeightsystem = oData.results[i].Totalweightasperthesystem;
                                    item.TotalWeightRead = oData.results[i].Totalweightactualaspertherea;
                                    item.weightdifferencestandard = oData.results[i].WeightDifferenceGRNTotalsyst;
                                    item.weigthdifferenceactual = oData.results[i].WeightDifferenceGRNTotalread;
                                    item.location = oData.results[i].Location;



                                }


                            });
                        }

                        console.log("tdata after featchdata 3",);
                        var oModel = that.getView().getModel("itemModel");
                        oModel.setData({ items: tdata });

                        // that.getView().getModel("itemModel").setProperty("/items", itemdata);
                        that.getView().setBusy(false);
                        // that.checkExistingRecords(tdata);
                    },
                    error: function () {
                        sap.m.MessageBox.error("Data not found!");
                        that.getView().setBusy(false);
                    }
                });
            },

            onInputLiveChange: function (oEvent) {
                var oInput = oEvent.getSource();
                var sValue = oEvent.getParameter("value");
                var oBindingContext = oInput.getBindingContext("itemModel");
                var sPath = oBindingContext.getPath();

                // Get the model and retrieve properties
                var oModel = this.getView().getModel("itemModel");
                var NumberofSheets = parseFloat(oModel.getProperty(sPath + "/NumberofSheets")) || 0;
                var actualweightpsheetread = parseFloat(oModel.getProperty(sPath + "/actualweightpsheetread")) || 0;
                var systemweigth = parseFloat(oModel.getProperty(sPath + "/Sysweight")) || 0;
                var InspectionLotQuantity = parseFloat(oModel.getProperty(sPath + "/InspectionLotQuantity")) || 0;
                // var weightdiffstd = parseFloat(oModel.getProperty(sPath + "/weightdifferencestandard")) || 0;
                // var weightdiffact = parseFloat(oModel.getProperty(sPath + "/weigthdifferenceactual")) || 0;
                // Update the Nosheet property with the new value
                oModel.setProperty(sPath + "/NumberofSheets", sValue);

                // Recalculate TotalWeightRead and TotalWeightsystem
                var newNosheet = parseFloat(sValue) || 0; // Use the new value
                var calTotalWeightRead = (newNosheet * actualweightpsheetread).toFixed(2);
                oModel.setProperty(sPath + "/TotalWeightRead", calTotalWeightRead);

                var calTotalWeightsystem = (newNosheet * systemweigth).toFixed(2);
                oModel.setProperty(sPath + "/TotalWeightsystem", calTotalWeightsystem);

                var claweightdiffstd = (InspectionLotQuantity - calTotalWeightsystem).toFixed(2)
                oModel.setProperty(sPath + "/weightdifferencestandard", claweightdiffstd);

                var calweightdiffact = (InspectionLotQuantity - calTotalWeightRead).toFixed(2);
                oModel.setProperty(sPath + "/weigthdifferenceactual", calweightdiffact);
            },


            convertDate: function (sDate) {
                var dateTime = new Date(sDate);
                if (dateTime !== undefined && dateTime !== null && dateTime !== "") {
                    var offSet = dateTime.getTimezoneOffset();
                    var offSetVal = dateTime.getTimezoneOffset() / 60;
                    var h = Math.floor(Math.abs(offSetVal));
                    var m = Math.floor((Math.abs(offSetVal) * 60) % 60);
                    dateTime = new Date(dateTime.setHours(h, m, 0, 0));
                    return dateTime;
                }
            },
            onSave: function () {
                var that = this;
                var oTable = this.byId("idTable");
                var oModel = this.getView().getModel("itemModel");
                var RData = oModel.getData();
                var selectedIndices = oTable.getSelectedIndices();
                var oHeaders = {
                    'X-Requested-With': 'X',
                    'Accept': 'application/json'
                };
                var mModel = that.getView().getModel("YY1_QM_MICSUMMARYREPORT_CDS")
                mModel.setUseBatch(true);
                var count = 0;
                for (var i = 0; i < selectedIndices.length; i++) {
                    var index = selectedIndices[i];
                    var selectedRowData = RData.items[index];
                    if (selectedRowData.UUID == "00000000-0000-0000-0000-000000000000") {
                        if ((selectedRowData.InspectionLot).length !== 12) {
                            selectedRowData.inspectionLot = (selectedRowData.InspectionLot).padStart(12, '0');
                        }
                        var uEntry = {

                            "InspectionLot": selectedRowData.InspectionLot,
                            "Material": selectedRowData.Material,
                            "NumberofSheets": selectedRowData.NumberofSheets,
                            "Location": selectedRowData.location,
                            "Totalweightasperthesystem": selectedRowData.TotalWeightsystem,
                            "Totalweightactualaspertherea": selectedRowData.TotalWeightRead,
                            "WeightDifferenceGRNTotalsyst": selectedRowData.weightdifferencestandard,
                            "WeightDifferenceGRNTotalread": selectedRowData.weigthdifferenceactual,
                        };
                        var sPath = "/YY1_QM_MICSUMMARYREPORT";
                        that.getView().getModel("YY1_QM_MICSUMMARYREPORT_CDS").create(sPath, uEntry, {
                            method: "POST",
                            headers: oHeaders,
                            changeSetId: "changeset " + i,
                            success: function (oData, oResponse) {
                                count += 1;
                                if (count >= selectedIndices.length) {
                                    MessageBox.success("Data Saved SuccesFully");
                                    that.getView().setBusy(false);
                                }
                            },
                            error: function (err) {
                                count += 1;
                                that.getView().setBusy(false);
                            }
                        });
                    } else {
                        var uEntry = {
                            "Material": selectedRowData.Material,
                            "NumberofSheets": selectedRowData.NumberofSheets,
                            "Location": selectedRowData.location,
                            "Totalweightasperthesystem": selectedRowData.TotalWeightsystem,
                            "Totalweightactualaspertherea": selectedRowData.TotalWeightRead,
                            "WeightDifferenceGRNTotalsyst": selectedRowData.weightdifferencestandard,
                            "WeightDifferenceGRNTotalread": selectedRowData.weigthdifferenceactual,
                        };
                        var sPath = "/YY1_QM_MICSUMMARYREPORT(SAP_UUID=guid'" + selectedRowData.UUID + "')";
                        that.getView().getModel("YY1_QM_MICSUMMARYREPORT_CDS").update(sPath, uEntry, {
                            method: "PATCH",
                            headers: oHeaders,
                            changeSetId: "changeset " + i,
                            success: function (oData, oResponse) {
                                count += 1;
                                if (count >= selectedIndices.length) {
                                    MessageBox.success("Data Saved SuccesFully");
                                    that.getView().setBusy(false);
                                }
                            },
                            error: function (err) {
                                count += 1;
                                that.getView().setBusy(false);
                            }
                        });
                    }

                }
                that.getView().setBusy(true);
                oModel.submitChanges({
                    success: function (oData, oResponse) {
                        // console.log("Batch request success:", oData, oResponse);
                    },
                    error: function (err) {
                        // console.error("Batch request error:", err);
                    }
                });
            },
            onexcel: function () {

                var localTableModel = this.getView().getModel("itemModel");
                var tableDataArray = localTableModel.getProperty("/items");
                debugger
                if (tableDataArray && tableDataArray.length > 0) {

                    var aCols = [
                        { label: "Inspection Lot", property: "InspectionLot" },
                        { label: "RM SAP Code", property: "Material" },
                        { label: "RM Recived Date", property: "InspLotCreatedOnLocalDate" },
                        { label: "RM Thickness ", property: "InspSpecTargetValue_1" },
                        { label: "RM Size (mm)", property: "calculate" },
                        { label: "Supplier Name", property: "SupplierName" },
                        { label: "MIC(L) ", property: "InspectionSpecification" },
                        { label: "1(L)", property: "InspectionResultlenOriginalValue" },
                        { label: "2(L)", property: "InspectionResultlenOriginalValue1" },
                        { label: "3(L)", property: "InspectionResultlenOriginalValue2" },
                        { label: "4(L)", property: "InspectionResultlenOriginalValue3" },
                        { label: "5(L)", property: "InspectionResultlenOriginalValue4" },
                        { label: "Average(L) ", property: "InspectionResultMeanValue" },
                        { label: "Target value(L)", property: "InspSpecTargetValue" },
                        { label: "UCL(L)", property: "InspSpecUpperLimit" },
                        { label: "LCL(L)", property: "InspSpecLowerLimit" },
                        { label: "MIC(W)", property: "InspectionSpecification1" },
                        { label: "1(W)", property: "InspectionResultwidthOriginalValue" },
                        { label: "2(W)", property: "InspectionResultwidthOriginalValue1" },
                        { label: "3(W)", property: "InspectionResultwidthOriginalValue2" },
                        { label: "4(W)", property: "InspectionResultwidthOriginalValue3" },
                        { label: "5(W)", property: "InspectionResultwidthOriginalValue4" },
                        { label: "Average(W) ", property: "InspectionResultMeanValue1" },
                        { label: "Target value(W)", property: "InspSpecTargetValue1" },
                        { label: "MAX(W)", property: "InspSpecUpperLimit1" },
                        { label: "Min(W)", property: "InspSpecLowerLimit1" },
                        { label: "MIC(T)", property: "InspectionSpecification2" },
                        { label: "1(T)", property: "InspectionResultthkOriginalValue" },
                        { label: "2(T)", property: "InspectionResultthkOriginalValue1" },
                        { label: "3(T)", property: "InspectionResultthkOriginalValue2" },
                        { label: "4(T)", property: "InspectionResultthkOriginalValue3" },
                        { label: "5(T)", property: "InspectionResultthkOriginalValue4" },
                        { label: "Average(T)", property: "InspectionResultMeanValue2" },
                        { label: "Target value(T)", property: "InspSpecTargetValue2" },
                        { label: "Max(T) ", property: "InspSpecUpperLimit2" },
                        { label: "Min(T)", property: "InspSpecLowerLimit2" },
                        { label: "System Weight per Sheet", property: "Sysweight" },
                        { label: "Actual Weight Per Sheet as per reading", property: "actualweightpsheetread" },
                        { label: "Base Unit of Measure", property: "InspectionLotQuantityUnit" },
                        { label: "No of Sheet Received", property: "NumberofSheets" },
                        { label: "Total Weight as per System", property: "TotalWeightsystem" },
                        { label: "Total Weight Actual as per reading", property: "TotalWeightRead" },
                        { label: "Weight as per GRN", property: "InspectionLotQuantity" },
                        { label: "Weight Difference (GRN Weight - Total System Weight)", property: "weightdifferencestandard" },
                        { label: "Weight Difference (GRN Weight -Total Reading Weight)", property: "weigthdifferenceactual" },
                        { label: "Location", property: "location" },
                        { label: "Product Type", property: "ProductType" },
                        { label: "Inspection Lot Usage Decision Code ", property: "InspectionLotUsageDecisionCode" },
                        { label: "Usage Decision Code Text", property: "UsageDecisionCodeText" }

                    ];



                    // Transform the data
                    var exportDataArray = tableDataArray.map(function (item) {
                        var newItem = {};
                        aCols.forEach(function (col) {

                            newItem[col.label] = String(item[col.property] || "");
                            // }
                        });
                        return newItem;
                    });

                    // Create a new workbook and worksheet
                    var wb = XLSX.utils.book_new();
                    var ws = XLSX.utils.json_to_sheet(exportDataArray, { header: aCols.map(col => col.label) });



                    // Append the worksheet to the workbook
                    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

                    // Write the workbook to a file
                    XLSX.writeFile(wb, "QM Report.xlsx");



                } else {
                    MessageToast.show("No data available to export.");
                }
            },

            // graph content 

            graphcontent1: function () {

                // Fetch the model and the data
                var aModel = this.getView().getModel("itemModel");
                var aItems = aModel.getProperty("/items");

                console.log("aItems", aItems); // For debugging, to ensure data is fetched

                // Prepare the data for the LineMicroChart using the fetched data
                var aData = [
                    {
                        "description": "width",
                        "threshold": 0,
                        "rightTopLabel": "140 M",
                        "leftBottomLabel": "Sept 2016",
                        "rightBottomLabel": "Oct 2016",
                        "showPoints": true,
                        "lines": [
                            {
                                "points": aItems.map(function (data, index) {
                                    return {
                                        x: index, // Assuming incremental x-axis based on data index or modify as needed
                                        y: data.InspectionResultMeanValue1 // y-axis for the first line
                                    };
                                })
                            },
                            {
                                "points": aItems.map(function (data, index) {
                                    return {
                                        x: index, // Assuming incremental x-axis based on data index or modify as needed
                                        y: data.InspSpecTargetValue1 // y-axis for the second line
                                    };
                                })
                            }
                        ]
                    }
                ];

                // Create a new JSON model and set the data for the chart
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData({ multiline: aData });
                // Set the model to the view
                this.getView().setModel(oModel);

                //   
            },


            graphcontent: function () {
                var oavragel = [];
                var otargetl = [];
                var oucll = [];
                var olcll = [];
                var sDate = this.getView().byId("idFrom").getValue();
                var tDate = this.getView().byId("idto").getValue();
                var interval = Math.floor(tdata.length / 1); // Number of points, interval is adjusted

                tdata.forEach(function (item, index) {
                    oavragel.push({
                        "x": index * interval,
                        "y": parseFloat(item.InspectionResultMeanValue) || 0
                    });
                    otargetl.push({
                        "x": index * interval,
                        "y": parseFloat(item.InspSpecTargetValue) || 0
                    });
                    oucll.push({
                        "x": index * interval,
                        "y": parseFloat(item.InspSpecUpperLimit) || 0
                    });
                    olcll.push({
                        "x": index * interval,
                        "y": parseFloat(item.InspSpecLowerLimit) || 0
                    });
                });

                var aData = [
                    {
                        "description": "Length Graph",
                        "threshold": 0,
                        "size": "L",
                        "leftBottomLabel": sDate,
                        "rightBottomLabel": tDate,
                        "showPoints": true,
                        "showThresholdValue": true,
                        "thresholdDisplayValue": "zero",
                        "lines": [
                            { "points": oavragel, "showPoints": true },
                            { "points": otargetl },
                            { "points": oucll },
                            { "points": olcll }
                        ]
                    }
                ];

                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData({ lengthData: aData });

                // Set the model to the view for length data
                this.getView().setModel(oModel, "lengthModel");

                this.displaywidth(); // Call to display the width graph
            },

            displaywidth: function () {
                var oavragew = [];
                var otargetw = [];
                var ouclw = [];
                var olclw = [];
                var sDate = this.getView().byId("idFrom").getValue();
                var tDate = this.getView().byId("idto").getValue();
                var interval = Math.floor(tdata.length / 1);

                tdata.forEach(function (item, index) {
                    oavragew.push({
                        "x": index * interval,
                        "y": parseFloat(item.InspectionResultMeanValue1) || 0
                    });
                    otargetw.push({
                        "x": index * interval,
                        "y": parseFloat(item.InspSpecTargetValue1) || 0
                    });
                    ouclw.push({
                        "x": index * interval,
                        "y": parseFloat(item.InspSpecUpperLimit1) || 0
                    });
                    olclw.push({
                        "x": index * interval,
                        "y": parseFloat(item.InspSpecLowerLimit1) || 0
                    });

                });

                var oData = [
                    {
                        "description": "Width Graph",
                        "threshold": 0,
                        "size": "L",
                        "leftBottomLabel": sDate,
                        "rightBottomLabel": tDate,
                        "showPoints": true,
                        "showThresholdValue": true,
                        "thresholdDisplayValue": "zero",
                        "lines": [
                            { "points": oavragew, "showPoints": true },
                            { "points": otargetw },
                            { "points": ouclw },
                            { "points": olclw }
                        ]
                    }
                ];

                var aModel = new sap.ui.model.json.JSONModel();
                aModel.setData({ widthData: oData });

                // Set the model to the view for width data
                this.getView().setModel(aModel, "widthModel");

                this.displaythickness();
            },
            displaythickness: function () {
                var oavraget = [];
                var otargett = [];
                var ouclt = [];
                var olclt = [];
                var sDate = this.getView().byId("idFrom").getValue();
                var tDate = this.getView().byId("idto").getValue();
                var interval = Math.floor(tdata.length / 1);
                tdata.forEach(function (item, index) {

                    oavraget.push({
                        "x": index * interval,
                        "y": parseFloat(item.InspectionResultMeanValue2) || 0
                    });
                    otargett.push({
                        "x": index * interval,
                        "y": parseFloat(item.InspSpecTargetValue2) || 0
                    });
                    ouclt.push({
                        "x": index * interval,
                        "y": parseFloat(item.InspSpecUpperLimit2) || 0
                    });
                    olclt.push({
                        "x": index * interval,
                        "y": parseFloat(item.InspSpecLowerLimit2) || 0
                    });
                });

                var oData = [
                    {
                        "description": "Thickness Graph",
                        "threshold": 0,
                        "size": "L",
                        "leftBottomLabel": sDate,
                        "rightBottomLabel": tDate,
                        "showPoints": true,
                        "showThresholdValue": true,
                        "thresholdDisplayValue": "zero",
                        "lines": [
                            { "points": oavraget, "showPoints": true },
                            { "points": otargett },
                            { "points": ouclt },
                            { "points": olclt }
                        ]
                    }
                ];

                var aModel = new sap.ui.model.json.JSONModel();
                aModel.setData({ thicknessData: oData });

                // Set the model to the view for width data
                this.getView().setModel(aModel, "thicknessModel");

            },

            configurelinechart: function () {
                /*Graph codesap */
                this.getView().byId("chart1").setVisible(true);
                var that = this;
                var oTable = this.getView().byId("idTable");
                var selectedIndices = oTable.getSelectedIndices();

                if (selectedIndices.length == 0) {
                    MessageBox.error("Select the data first");
                    return;
                }

                // Get the data model and items

                var oModel = this.getView().getModel("itemModel");
                var oData = oModel.getProperty("/items");

                // Filter the selected data
                var aSelectedData = selectedIndices.map(function (index) {
                    return oData[index];
                });

                // Set the filtered data to the model
                var oFilteredModel = new sap.ui.model.json.JSONModel();
                oFilteredModel.setData({ items: aSelectedData });
                this.getView().setModel(oFilteredModel, "chartModel");


                // Update the VizFrames with the filtered model
                var oVizFrame = this.getView().byId("idVizFrame");
                var oVizFrame1 = this.getView().byId("idVizFrame1");
                var oVizFrame2 = this.getView().byId("idVizFrame2");

                oVizFrame.setModel(oFilteredModel, "chartModel");
                oVizFrame1.setModel(oFilteredModel, "chartModel");
                oVizFrame2.setModel(oFilteredModel, "chartModel");

                Format.numericFormatter(ChartFormatter.getInstance());
                var formatPattern = ChartFormatter.DefaultPattern;

                // Set properties for VizFrames
                oVizFrame.setVizProperties({
                    plotArea: {
                        dataLabel: {
                            formatString: formatPattern.SHORTFLOAT_MFD2,
                            visible: true
                        }
                    },
                    valueAxis: {
                        label: {
                            formatString: formatPattern.SHORTFLOAT
                        },
                        title: {
                            visible: false
                        }
                    },
                    categoryAxis: {
                        title: {
                            visible: false
                        }
                    },
                    title: {
                        visible: true,
                        text: 'Length'
                    }
                });

                oVizFrame1.setVizProperties({
                    plotArea: {
                        dataLabel: {
                            formatString: formatPattern.SHORTFLOAT_MFD2,
                            visible: true
                        }
                    },
                    valueAxis: {
                        label: {
                            formatString: formatPattern.SHORTFLOAT
                        },
                        title: {
                            visible: false
                        }
                    },
                    categoryAxis: {
                        title: {
                            visible: false
                        }
                    },
                    title: {
                        visible: true,
                        text: 'Width'
                    }
                });

                oVizFrame2.setVizProperties({
                    plotArea: {
                        dataLabel: {
                            formatString: formatPattern.SHORTFLOAT_MFD2,
                            visible: true
                        }
                    },
                    valueAxis: {
                        label: {
                            formatString: formatPattern.SHORTFLOAT
                        },
                        title: {
                            visible: false
                        }
                    },
                    categoryAxis: {
                        title: {
                            visible: false
                        }
                    },
                    title: {
                        visible: true,
                        text: 'Thickness'
                    }
                });

                // Connect Popovers
                var oPopOver = this.getView().byId("idPopOver");
                oPopOver.connect(oVizFrame.getVizUid());
                oPopOver.setFormatString(formatPattern.STANDARDFLOAT);

                var oPopOver1 = this.getView().byId("idPopOver1");
                oPopOver1.connect(oVizFrame1.getVizUid());
                oPopOver1.setFormatString(formatPattern.STANDARDFLOAT);

                var oPopOver2 = this.getView().byId("idPopOver2");
                oPopOver2.connect(oVizFrame2.getVizUid());
                oPopOver2.setFormatString(formatPattern.STANDARDFLOAT);

                this.printGraph();

                /*End Code Graph*/
            },

            printGraph: function () {
                var charts = ['idVizFrame', 'idVizFrame1', 'idVizFrame2'];
                var svgs = [];
                var loaded = 0;

                setTimeout(() => { // Delay to ensure charts are rendered
                    charts.forEach((chartId, index) => {
                        var chart = this.getView().byId(chartId);
                        if (chart && chart.getDomRef()) { // Ensure chart DOM is available
                            var svg = chart.getDomRef().getElementsByTagName("svg")[0];
                            if (svg) {
                                svgs.push(svg);
                            } else {
                                console.error("SVG element not found for chart ID:", chartId);
                            }
                        } else {
                            console.error("Chart DOM not found for chart ID:", chartId);
                        }
                    });

                    if (svgs.length === charts.length) {
                        this.generatePDF(svgs);
                    } else {
                        MessageBox.error("Unable to retrieve all charts for PDF generation.");
                    }
                }, 1000); // Adjust delay as necessary
            },

            generatePDF: function (svgs) {
                var canvas = document.createElement("canvas");
                var context = canvas.getContext("2d");
                context.fillStyle = "rgb(255,255,255)";

                var doc = new jspdf.jsPDF('l', 'mm', 'a4'); // A4 landscape 297x210
                var imgHeight;
                var loaded = 0;

                svgs.forEach((svg, i) => {
                    var bBox = svg.getBBox();
                    canvas.width = bBox.width;
                    canvas.height = bBox.height;
                    context.fillRect(0, 0, canvas.width, canvas.height); // Apply background to the chart rect
                    var imageObj = new Image();

                    imageObj.onload = function () {
                        context.drawImage(imageObj, 0, 0, canvas.width, canvas.height);
                        var dataURL = canvas.toDataURL('image/jpeg');
                        imgHeight = 120 * (bBox.height / bBox.width); // Adjusted height for each image
                        doc.addImage(dataURL, 'JPEG', 10, 20 + i * (imgHeight + 10), 277, imgHeight); // Adjust position for each image

                        loaded++;
                        if (loaded === svgs.length) {
                            doc.save('QMReport.pdf'); // Set your desired PDF name here
                        }
                    };

                    imageObj.src = "data:image/svg+xml," + jQuery.sap.encodeURL(
                        svg.outerHTML.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg" version="1.1"')
                    );
                });
            }


        });
    });
