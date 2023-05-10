
export class Row {

    /**
     * Creates an instance of Row.
     * @param {import("./Table.js").Table} table
     * @param {object} data
     * @memberof Row
     */
    constructor(table, rowNumber, data) {
        Object.defineProperty(this, Symbol.for("table"), { value: table })
        Object.defineProperty(this, Symbol.for("rowNumber"), { value: rowNumber })

        Object.entries(data).forEach(([key, value]) => {
            this[key] = value
        })
    }

    /**
     * Update the row with new data. Returns a new Row instance with
     * the updated data.
     *
     * @param {object} updateData
     * @return {Promise<Row>}
     * @async
     * @memberof Row
     */
    async update(updateData) {
        const table = this[Symbol.for("table")]
        const rowNumber = this[Symbol.for("rowNumber")]

        // make sure we only use data for valid fields
        const validDataArr = table.fields.map(field => updateData[field] ?? this[field])
        const validData = Object.fromEntries(table.fields.map((field, i) => [field, validDataArr[i]]))

        // update the row in the sheet
        await table.database.sheets.spreadsheets.values.update({
            spreadsheetId: table.database.spreadsheetId,
            range: table.createRange(rowNumber, 1, rowNumber, table.fields.length),
            valueInputOption: "USER_ENTERED",
            includeValuesInResponse: false,
            requestBody: {
                values: [validDataArr],
            }
        })

        // return a new Row instance with the updated data
        return new Row(table, rowNumber, validData)
    }


    /**
     * Delete the row.
     *
     * @async
     * @memberof Row
     */
    async delete() {
        const table = this[Symbol.for("table")]
        const rowNumber = this[Symbol.for("rowNumber")]
        const sheetId = await table.fetchSheetId()

        // delete the row in the sheet
        await table.database.sheets.spreadsheets.batchUpdate({
            spreadsheetId: table.database.spreadsheetId,
            requestBody: {
                requests: [
                    {
                        deleteDimension: {
                            range: {
                                sheetId,
                                dimension: "ROWS",
                                startIndex: rowNumber - 1,
                                endIndex: rowNumber,
                            }
                        }
                    }
                ]
            }
        })
    }
}