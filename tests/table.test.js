import { Database, QueryOperators } from "../index.js"
import { ServiceAccountKeyPath, SpreadsheetId } from "./test-env.js"


/** @type {Database} */
let db

beforeAll(async () => {
    db = new Database(SpreadsheetId, {
        serviceAccountKeyPath: ServiceAccountKeyPath,
    })
    await db.initialize()
})

test("Initialize Table", async () => {
    const table = db.getTable("Test")
    expect(table.fields).toEqual(["Name", "Age", "Favorite Color",])
})

test("Query (Table.queryRows)", async () => {
    const table = db.getTable("Test")
    const rows = await table.queryRows([
        { field: "Name", operator: QueryOperators.Contains("i") },
        { field: "Age", operator: QueryOperators.GreaterThan(25) },
    ])
    expect(rows.length).toEqual(2)
    expect(rows.map(row => ({ ...row }))).toEqual([
        { Name: "Miles", Age: 28, "Favorite Color": "Gray" },
        { Name: "Mike", Age: 33, "Favorite Color": "Purple" },
    ])
})

test("Find Rows (Table.findRows)", async () => {
    const table = db.getTable("Test")
    const [row] = await table.findRows(["Name", "Johnny"])
    expect(row).not.toBeUndefined()
})
