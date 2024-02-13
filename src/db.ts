export class MemoryDatabase {
  #data: Map<string, string>;

  constructor() {
    this.#data = new Map();
  }
  insert(key: string, value: string) {
    this.#data.set(key, value);
    return key
  }
  get(key: string) {
    return this.#data.get(key);
  }
  delete(key: string) {
    this.#data.delete(key);
  }
  update(key: string, value: string) {
    this.#data.set(key, value);
    return key
  }
}
