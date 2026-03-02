// Light stub: virtual keyboard (class) — no-op
export class VirtualKeyboard {
  visible = false;
  boundingRect: DOMRect = new DOMRect();
  show(): void {}
  hide(): void {}
  connect(): void {}
  disconnect(): void {}
  update(): void {}
  executeCommand(): boolean { return false; }
  addEventListener(): void {}
  removeEventListener(): void {}
  dispatchEvent(): boolean { return true; }
}

