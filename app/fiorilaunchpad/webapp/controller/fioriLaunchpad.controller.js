"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Controller_1 = __importDefault(require("sap/ui/core/mvc/Controller"));
/**
 * @namespace fiorilaunchpad.controller
 */
class fioriLaunchpad extends Controller_1.default {
    onInit() { }
    onTilePress(oEvent) {
        const oTile = oEvent.getSource();
        const sLink = oTile.data("link");
        if (sLink) {
            window.location.href = sLink;
        }
        else {
            console.warn("No link defined in tile customData.");
        }
    }
}
exports.default = fioriLaunchpad;
