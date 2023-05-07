

export class Store {

    /** @type {string} */
    static PREFIX

    /**
     * Creates an instance of Store.
     * @param {import("./Database.js").Database} database
     * @param {string} name
     * @memberof Store
     */
    constructor(database, name) {
        this.database = database

        if (!name.startsWith(this.constructor.PREFIX))
            throw new Error(`Table name must start with ${this.constructor.PREFIX}`)

        this.name = name
    }

    get displayName() {
        return this.name.replace(this.constructor.PREFIX, "")
    }

    /**
     * Initializes the store. Must be implemented by subclasses.
     *
     * @memberof Store
     */
    async initialize() {
        throw new Error("Stores are not meant to be initialized directly.")
    }

    /**
     * Create a range string for this table.
     *
     * @param {string} range
     * @return {string} 
     * @memberof Store
     */
    createRange(...args) {
        // case 1: ["A1:B2"]
        if (args.length === 1 && typeof args[0] === "string")
            return `'${this.name}'!${args[0]}`

        // case 2: ["A", 1, "B", 2]
        if (typeof args[0] === "string")
            return `'${this.name}'!`
                + (args[0] ?? "")
                + (args[1] ?? "")
                + (args[2] != null || args[3] != null ? ":" : "")
                + (args[2] ?? "")
                + (args[3] ?? "")

        // case 3: [1, 1, 2, 2]
        if (typeof args[0] === "number")
            return `'${this.name}'!`
                + (args[0] != null ? `R${args[0]}` : "")
                + (args[1] != null ? `C${args[1]}` : "")
                + (args[2] != null || args[3] != null ? ":" : "")
                + (args[2] != null ? `R${args[2]}` : "")
                + (args[3] != null ? `C${args[3]}` : "")
    }


    /**
     * Fetches the sheet ID of this store.
     *
     * @return {Promise<number>} 
     * @memberof Store
     */
    async fetchSheetId() {
        const { data } = await this.database.sheets.spreadsheets.get({
            spreadsheetId: this.database.spreadsheetId,
            includeGridData: false,
        })
        return data.sheets.find(sheet => sheet.properties.title === this.name).properties.sheetId
    }
}