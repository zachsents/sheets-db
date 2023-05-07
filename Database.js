import { google } from "googleapis"
import { TABLE_PREFIX, Table } from "./Table.js"


/**
 * @typedef DatabaseConfiguration
 * @property {string} serviceAccountKeyPath
 */


export class Database {

    /** @type {string} */
    name = "Uninitialized Database"

    /** @type {Table[]} */
    tables = []

    /**
     * Creates an instance of Database.
     * @param {string} spreadsheetId
     * @param {DatabaseConfiguration} [config={}]
     * @memberof Database
     */
    constructor(spreadsheetId, config = {}) {
        this.spreadsheetId = spreadsheetId
        this.config = config

        // set up auth client
        this.auth = new google.auth.GoogleAuth({
            keyFile: this.config.serviceAccountKeyPath,
            // scopes: ['https://www.googleapis.com/auth/cloud-platform'],
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        })

        // set up sheets client
        this.sheets = google.sheets({ version: "v4", auth: this.auth })
    }

    /**
     * Initialize the database. This must be called after Database is created. 
     * Looks through all the sheets to find tables and key-value stores.
     *
     * @async
     * @memberof Database
     */
    async initialize() {
        const { data: generalData } = await this.sheets.spreadsheets.get({
            spreadsheetId: this.spreadsheetId,
            includeGridData: false,
            ranges: [],
        })

        this.name = generalData.properties.title

        await Promise.all(
            generalData.sheets.map((sheet) => {
                // Tables
                if (sheet.properties.title.startsWith(TABLE_PREFIX)) {
                    const table = new Table(this, sheet.properties.title)
                    this.tables.push(table)
                    return table.initialize()
                }

                // TODO: Key-value stores
            })
        )
    }

    /**
     * Get a table by name.
     *
     * @param {string} name
     * @return {Table} 
     * @memberof Database
     */
    getTable(name) {
        return this.tables.find((table) => table.name === name || table.displayName === name)
    }

    /**
     * Create a new table.
     *
     * @param {string} displayName
     * @param {object} [options={}]
     * @param {string[]} [options.fields=[]]
     * @returns {Promise<Table>}
     * @async
     * @memberof Database
     */
    async createTable(displayName, {
        fields = [],
    } = {}) {
        const name = `tbl:${displayName}`

        // create sheet for table
        await this.sheets.spreadsheets.batchUpdate({
            spreadsheetId: this.spreadsheetId,
            requestBody: {
                requests: [{
                    addSheet: {
                        properties: {
                            title: name,
                        },
                    },
                }],
            },
        })

        // create table object
        const table = new Table(this, name)
        table.fields = fields

        // initialize table -- this writes the fields to the sheet
        await table.initialize()

        // add table to database
        this.tables.push(table)

        return table
    }
}