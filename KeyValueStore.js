import { Store } from "./Store.js"


export class KeyValueStore extends Store {

    static PREFIX = "kv_"

    /**
     * Creates an instance of KeyValueStore.
     * @param {import("./Database.js").Database} database
     * @param {string} name
     * @memberof KeyValueStore
     */
    constructor(database, name) {
        super(database, name)
    }

    async initialize() {

    }

    /**
     * Fetch all the keys for this store.
     *
     * @async
     * @return {Promise<string[]>} 
     * @memberof KeyValueStore
     */
    async fetchKeys() {
        const { data } = await this.database.sheets.spreadsheets.values.get({
            spreadsheetId: this.database.spreadsheetId,
            range: this.createRange("A1:A"),
            majorDimension: "COLUMNS",
        })
        return data.values[0]
    }

    /**
     * Fetch all the values for this store.
     *
     * @async
     * @return {Promise<any[]>} 
     * @memberof KeyValueStore
     */
    async fetchValues() {
        const { data } = await this.database.sheets.spreadsheets.values.get({
            spreadsheetId: this.database.spreadsheetId,
            range: this.createRange("B1:B"),
            majorDimension: "COLUMNS",
        })
        return data.values[0]
    }

    /**
     * Fetch the row index for a given key.
     *
     * @async
     * @param {string} key
     * @param {object} options
     * @param {boolean} [options.throwIfNotExists=true]
     * @return {Promise<number>} 
     * @memberof KeyValueStore
     */
    async fetchKeyRow(key, {
        throwIfNotExists = true,
    } = {}) {
        const keys = await this.fetchKeys()

        const index = keys.indexOf(key)
        if (throwIfNotExists && index === -1)
            throw new Error(`Key ${key} does not exist in store ${this.displayName}`)

        return index + 1
    }

    /**
     * Fetch the value for a given key.
     *
     * @async
     * @param {string} key
     * @return {Promise<any>} 
     * @memberof KeyValueStore
     */
    async fetch(key) {
        // get key row number
        const keyRow = await this.fetchKeyRow(key)

        // get value from sheet
        const { data } = await this.database.sheets.spreadsheets.values.get({
            spreadsheetId: this.database.spreadsheetId,
            range: this.createRange(keyRow, 2),
        })

        return data.values[0][0]
    }


    /**
     * Set the value for a given key.
     *
     * @async
     * @param {string} key
     * @param {*} value
     * @param {object} options
     * @memberof KeyValueStore
     */
    async set(key, value, {
        createIfNotExists = true,
    } = {}) {
        // get key row number
        const keyRow = await this.fetchKeyRow(key, {
            throwIfNotExists: !createIfNotExists,
        })

        // Key exists - update it
        if (keyRow) {
            await this.database.sheets.spreadsheets.values.update({
                spreadsheetId: this.database.spreadsheetId,
                range: this.createRange(keyRow, 2),
                valueInputOption: "USER_ENTERED",
                includeValuesInResponse: false,
                requestBody: {
                    values: [[value]],
                }
            })
            return
        }

        // Key doesn't exist, append it
        await this.database.sheets.spreadsheets.values.append({
            spreadsheetId: this.database.spreadsheetId,
            range: this.createRange("A1:Z"),    // see if this works
            valueInputOption: "USER_ENTERED",
            insertDataOption: "INSERT_ROWS",
            includeValuesInResponse: false,
            requestBody: {
                values: [[key, value]],
            }
        })
    }


    /**
     * Update the value for a given key.
     *
     * @async
     * @param {string} key
     * @param {*} value
     * @memberof KeyValueStore
     */
    async update(key, value) {
        await this.set(key, value, {
            createIfNotExists: false,
        })
    }


    /**
     * Delete an entry.
     *
     * @async
     * @param {string} key
     * @memberof KeyValueStore
     */
    async delete(key) {
        // get key row number
        const keyRow = await this.fetchKeyRow(key)

        // get sheet ID
        const sheetId = await this.fetchSheetId()

        // delete the row in the sheet
        await this.database.sheets.spreadsheets.batchUpdate({
            spreadsheetId: this.database.spreadsheetId,
            requestBody: {
                requests: [
                    {
                        deleteDimension: {
                            range: {
                                sheetId,
                                dimension: "ROWS",
                                startIndex: keyRow - 1,
                                endIndex: keyRow,
                            }
                        }
                    }
                ]
            }
        })
    }
}
