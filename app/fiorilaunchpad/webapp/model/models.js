"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDeviceModel = createDeviceModel;
const JSONModel_1 = __importDefault(require("sap/ui/model/json/JSONModel"));
const Device_1 = __importDefault(require("sap/ui/Device"));
function createDeviceModel() {
    const model = new JSONModel_1.default(Device_1.default);
    model.setDefaultBindingMode("OneWay");
    return model;
}
