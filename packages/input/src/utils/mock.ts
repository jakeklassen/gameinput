export class MockEventTarget {
  public listeners: { [id: string]: (event?: any) => void } = {};

  public addEventListener(type: string, listener: (event: any) => void): void {
    this.listeners[type] = listener;
  }
}
