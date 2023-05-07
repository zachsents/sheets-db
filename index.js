import { Database } from "./Database.js"
import { QueryOperators } from "./QueryFilter.js"
import { Store } from "./Store.js"

const db = new Database("1TtYPApbzhxtPlyrgn0IzQRCaiS3N7mdBq5wK3legEeQ", {
    serviceAccountKeyPath: "./service-account.secret.json",
})
await db.initialize()

const infoStore = db.getKeyValueStore("Info")

console.log(await infoStore.fetchValue("Color"))