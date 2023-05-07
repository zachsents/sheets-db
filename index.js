import { Database } from "./Database.js"
import { QueryOperators } from "./QueryFilter.js"

const db = new Database("1TtYPApbzhxtPlyrgn0IzQRCaiS3N7mdBq5wK3legEeQ", {
    serviceAccountKeyPath: "./service-account.secret.json",
})

await db.initialize()

// const result = await db.getTable("Test").queryRows([
//     {
//         field: "Age",
//         operator: QueryOperators.GreaterThan(23),
//     },
//     // {
//     //     field: "Name",
//     //     operator: QueryOperators.Contains("Z"),
//     // }
// ])
// console.log(result)

// const newRow = await db.getTable("Test").addRow({
//     Name: "Zach",
//     Age: 24,
//     "Favorite Color": "Blue",
// })

// console.log(newRow)

const [ryan] = await db.getTable("Test").findRows(["Name", "Ryan"])

console.log(ryan)