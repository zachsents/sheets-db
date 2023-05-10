import { Database, KeyValueStore } from "../index.js"
import { ServiceAccountKeyPath, SpreadsheetId } from "./test-env.js"

const NEW_KEY = "New Key"
const NEW_VALUE = "New Value"

/** @type {KeyValueStore} */
let kv

beforeAll(async () => {
    const db = new Database(SpreadsheetId, {
        serviceAccountKeyPath: ServiceAccountKeyPath,
    })
    await db.initialize()
    kv = db.getKeyValueStore("Info")
})

afterAll(async () => {
    await kv.set("Color", "red")
})

test("List Keys", async () => {
    const keys = await kv.fetchKeys()
    expect(keys).toEqual(["API Key", "Color", "Email"])
})

test("List Values", async () => {
    const values = await kv.fetchValues()
    expect(values).toEqual(["djwkjwdjw", "red", "zachsents@gmail.com"])
})

test("Get Value for Key", async () => {
    expect(await kv.fetch("Email")).toEqual("zachsents@gmail.com")
})

test("Set New Pair", async () => {
    await kv.set(NEW_KEY, NEW_VALUE)
    expect(await kv.fetch(NEW_KEY)).toEqual(NEW_VALUE)
})

test("Update Existing Pair", async () => {
    await kv.update("Color", "blue")
    expect(await kv.fetch("Color")).toEqual("blue")
})

test("Update Non-Existing Pair", async () => {
    expect(kv.update("Non-Existing Key", NEW_VALUE)).rejects.toThrow()
})

test("Delete Pair", async () => {
    await kv.delete(NEW_KEY)
    expect(kv.fetch(NEW_KEY)).rejects.toThrow()
})