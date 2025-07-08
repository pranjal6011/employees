import Controller from "sap/ui/core/mvc/Controller";
import Event from "sap/ui/base/Event";
import GenericTile from "sap/m/GenericTile";

/**
 * @namespace fiorilaunchpad.controller
 */
export default class fioriLaunchpad extends Controller {
    public onInit(): void {}

    public onTilePress(oEvent: Event): void {
        const oTile = oEvent.getSource() as GenericTile;
        const sLink = oTile.data("link") as string;

        if (sLink) {
            window.location.href = sLink;
        } else {
            console.warn("No link defined in tile customData.");
        }
    }
}
