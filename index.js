import { Database } from "./Database.js"

const db = new Database("1TtYPApbzhxtPlyrgn0IzQRCaiS3N7mdBq5wK3legEeQ", {
    serviceAccountKeyPath: "./service-account.secret.json",
})
await db.initialize()

const infoStore = db.getKeyValueStore("Info")

console.log(await infoStore.fetchValue("Color"))


export * from "./Database.js"
export * from "./KeyValueStore.js"
export * from "./QueryFilter.js"
export * from "./Row.js"
export * from "./Store.js"
export * from "./Table.js"
