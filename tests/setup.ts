// Global Vitest setup. Runs for every test file, including ones using the
// default "node" environment — guard DOM-only patches accordingly.
if (typeof HTMLDialogElement !== "undefined") {
  // jsdom doesn't implement <dialog>'s showModal()/close() (no "top layer"
  // support). Polyfill just enough of the open/close lifecycle — including
  // dispatching the native "close" event — for components that listen for
  // it (e.g. MobileNavDrawer, DeleteAssetButton) to behave correctly under
  // test.
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
}
