import { Table } from "./types"

let data: Record<string, Map<string, string>> | null = null
let instance: typeof MemoryDatabase.prototype

type Table = keyof typeof Table

export class MemoryDatabase {
  constructor() {
    if (instance) {
      throw new Error("Cannot create multiple instances of MemoryDatabase")
    }
    data = {
      [Table.AUTH]: new Map(),
      [Table.DISCUSSION]: new Map(),
      [Table.DISCUSSION_REFERENCES]: new Map()
    }
    instance = this
  }
  insert(table: Table, { key, value }: { key: string, value: string }) {
    data?.[table].set(key, value);
    return key
  }
  get(table: Table, { key }: { key: string }) {
    return data?.[table].get(key);
  }
  contains(table: Table, { query }: { query: string }) {
    const matchingEntries = {}
    data?.[table].forEach((val, key) => {
      const referencePrefix = key.split('.')[0]
      if (query === referencePrefix) {
        // @ts-expect-error 
        matchingEntries[key] = val
      }
    })
    return matchingEntries
  }
  delete(table: Table, { key }: { key: string }) {
    data?.[table].delete(key);
  }
  update(table: Table, { key, value }: { key: string, value: string }) {
    data?.[table].set(key, value);
    return key
  }
}

export const db = Object.freeze(new MemoryDatabase())
