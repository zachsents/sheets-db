import { sheets_v4 } from "googleapis"
import { Database, Table, KeyValueStore } from "../index.js"
import { ServiceAccountKeyPath, SpreadsheetId } from "./test-env.js"


/** @type {Database} */
let db

beforeAll(async () => {
    db = new Database(SpreadsheetId, {
        serviceAccountKeyPath: ServiceAccountKeyPath,
    })
})

test("Instantiate Database", async () => {
    expect(db.sheets).toBeInstanceOf(sheets_v4.Sheets)
})

test("Initialize Database", async () => {
    await db.initialize()
    expect(db.name).toEqual("SheetsDB Test")
    expect(db.tables.length).toBeGreaterThanOrEqual(1)
    expect(db.kvStores.length).toBeGreaterThanOrEqual(1)
    db.tables.forEach(table => expect(table).toBeInstanceOf(Table))
    db.kvStores.forEach(kvStore => expect(kvStore).toBeInstanceOf(KeyValueStore))
})

test("Get Table (Database.getTable)", () => {
    expect(db.getTable("Test")).toBeInstanceOf(Table)
    expect(db.getTable("Not a real table")).toBeUndefined()
})

test("Get Key Value Store (Database.getKeyValueStore)", () => {
    expect(db.getKeyValueStore("Info")).toBeInstanceOf(KeyValueStore)
    expect(db.getKeyValueStore("Not a real store")).toBeUndefined()
})

test("Create Table (Database.createTable)", async () => {
    const table = await db.createTable("Created By Test", {
        fields: ["Col 1", "Col 2"],
    })
    expect(table).toBeInstanceOf(Table)
    expect(table.name).toEqual("tbl_Created By Test")
    expect(table.displayName).toEqual("Created By Test")
    expect(table.fields).toEqual(["Col 1", "Col 2"])
    expect(db.tables).toContain(table)
})