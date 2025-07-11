"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const UIComponent_1 = __importDefault(require("sap/ui/core/UIComponent"));
const models_1 = require("./model/models");
/**
 * @namespace fiorilaunchpad
 */
class Component extends UIComponent_1.default {
    init() {
        // call the base component's init function
        super.init();
        // set the device model
        this.setModel((0, models_1.createDeviceModel)(), "device");
        // enable routing
        this.getRouter().initialize();
    }
}
Component.metadata = {
    manifest: "json",
    interfaces: [
        "sap.ui.core.IAsyncContentCreation"
    ]
};
exports.default = Component;
