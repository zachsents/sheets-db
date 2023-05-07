import { QueryOperators } from "./QueryFilter.js"
import { Row } from "./Row.js"


export const TABLE_PREFIX = "tbl_"

export class Table {

    /**
     * Creates an instance of Table.
     * @param {import("./Database.js").Database} database
     * @param {string} name
     * @memberof Table
     */
    constructor(database, name) {
        this.database = database

        if (!name.startsWith(TABLE_PREFIX))
            throw new Error(`Table name must start with ${TABLE_PREFIX}`)

        this.name = name
    }

    async initialize() {
        if (this.fields) {
            // set fields
            await this.database.sheets.spreadsheets.values.update({
                spreadsheetId: this.database.spreadsheetId,
                range: this.createRange("A1:1"),
                valueInputOption: "USER_ENTERED",
                includeValuesInResponse: false,
                requestBody: {
                    values: [this.fields],
                }
            })
        }
        else {
            // load fields
            const { data } = await this.database.sheets.spreadsheets.values.get({
                spreadsheetId: this.database.spreadsheetId,
                range: this.createRange("A1:1"),
            })
            this.fields = data.values[0]
        }
    }

    get displayName() {
        return this.name.replace(TABLE_PREFIX, "")
    }

    /**
     * Create a range string for this table.
     *
     * @param {string} range
     * @return {string} 
     * @memberof Table
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
     * Querys a table.
     *
     * @param {import("./QueryFilter.js").QueryFilter} [filters=[]]
     * @returns {Promise<Row[]>}
     * @async
     * @memberof Table
     */
    async queryRows(filters = []) {

        if (!filters.length)
            throw new Error("Must provide at least one filter when querying")

        // create set of unique fields to search
        const searchFields = [...new Set(filters.map(filter => filter.field))]
        const searchFieldIndexes = searchFields.map(field => this.fields.indexOf(field))

        // check for invalid fields
        searchFieldIndexes.forEach((index, i) => {
            if (index === -1)
                throw new Error(`Field not found: ${searchFields[i]}`)
        })

        // fetch data for those fields
        const { data: columnData } = await this.database.sheets.spreadsheets.values.batchGet({
            spreadsheetId: this.database.spreadsheetId,
            ranges: searchFieldIndexes.map(index => this.createRange(2, index + 1, null, index + 1)),
            valueRenderOption: "UNFORMATTED_VALUE",
            majorDimension: "COLUMNS",
        })

        // format into object
        const fieldData = Object.fromEntries(
            columnData.valueRanges.map((valueRange, i) => [searchFields[i], valueRange.values[0]])
        )

        // test filters
        const rowIndexes = filters.reduce((acc, filter) => {
            return acc.filter(rowIndex => filter.operator(fieldData[filter.field][rowIndex]))
        }, fieldData[searchFields[0]].map((_, i) => i))

        // fetch those rows
        const { data: rowData } = await this.database.sheets.spreadsheets.values.batchGet({
            spreadsheetId: this.database.spreadsheetId,
            ranges: rowIndexes.map(rowIndex => this.createRange(rowIndex + 2, 1, rowIndex + 2, null)),
            valueRenderOption: "UNFORMATTED_VALUE",
            majorDimension: "ROWS",
        })

        // format into objects
        const rows = rowData.valueRanges?.map(
            (valueRange, i) => new Row(this, rowIndexes[i] + 2, Object.fromEntries(
                valueRange.values[0].map(
                    (value, i) => [this.fields[i], value]
                )
            ))
        ) ?? []

        return rows
    }


    /**
     * Find rows in a table. Simpler than Table.queryRows.
     *
     * @param {...[string, any]} equalities A list of fields and values to match.
     * @returns {Promise<Row[]>}
     * @async
     * @memberof Table
     */
    findRows(...equalities) {
        return this.queryRows(
            equalities.map(([field, value]) => ({
                field,
                operator: QueryOperators.Equals(value),
            }))
        )
    }


    /**
     * Adds a row to the table.
     *
     * @param {Object.<string, *>} rowData
     * @returns {Promise<Row>}
     * @async
     * @memberof Table
     */
    async addRow(rowData) {

        // make sure we only use data for valid fields
        const validDataArr = this.fields.map(field => rowData[field])
        const validData = Object.fromEntries(this.fields.map((field, i) => [field, validDataArr[i]]))

        // add row to sheet
        const { data } = await this.database.sheets.spreadsheets.values.append({
            spreadsheetId: this.database.spreadsheetId,
            range: this.createRange("A1:Z1000"),
            valueInputOption: "USER_ENTERED",
            insertDataOption: "INSERT_ROWS",
            includeValuesInResponse: false,
            requestBody: {
                values: [validDataArr],
                majorDimension: "ROWS",
            }
        })

        // return row object
        return new Row(this, parseInt(data.updates.updatedRange.match(/(?<=!.+)\d+/)[0]), validData)
    }


    /**
     * Fetches the sheet ID of this table.
     *
     * @return {Promise<number>} 
     * @memberof Table
     */
    async fetchSheetId() {
        const { data } = await this.database.sheets.spreadsheets.get({
            spreadsheetId: this.database.spreadsheetId,
            includeGridData: false,
        })
        return data.sheets.find(sheet => sheet.properties.title === this.name).properties.sheetId
    }
}