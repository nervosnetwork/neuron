"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron = require("electron");
const controllers_app = require("../../dist/controllers/app");
const services_networks = __importDefault(require("../../dist/services/networks"));

electron.ipcMain.on('E2E_EDIT_WALLET', function (event, arg) {
    const walletId = arg[0];
    // TODO: fix navTo
    controllers_app.default.navTo(`/editwallet/${walletId}`);
});

electron.ipcMain.on('E2E_EDIT_NETWORK', function (event, arg) {
    const networkId = arg[0];
    // TODO: fix navTo
    controllers_app.default.navTo(`/network/${networkId}`);
});

electron.ipcMain.on('E2E_DELETE_NETWORK', function (event, arg) {
    const networkId = arg[0];
    const networksService = services_networks.default.getInstance();
    networksService.delete(networkId);
})

function findItem(menuItems, labels) {
    var target = labels[0];
    var rest = labels.slice(1);
    var foundItem = menuItems.find(function (item) { return item.label === target; });
    if (rest.length === 0) {
        return foundItem;
    }
    return findItem(foundItem.submenu.items, rest);
}
electron.ipcMain.on('E2E_GET_MENU_ITEM', function (e, labels) {
    var menuItem = findItem(electron.Menu.getApplicationMenu().items, labels);
    if (menuItem) {
        e.returnValue = new electron.MenuItem({
            checked: menuItem.checked,
            enabled: menuItem.enabled,
            label: menuItem.label,
            visible: menuItem.visible
        });
    }
    else {
        e.returnValue = ({
            label: ''
        });
    }
});
electron.ipcMain.on('E2E_CLICK_MENU_ITEM', function (e, labels) {
    var item = findItem(electron.Menu.getApplicationMenu().items, labels);
    item.click();
});

electron.ipcMain.on('E2E_QUIT_APP', function () {
    electron.app.quit()
})
