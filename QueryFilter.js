
/**
 * @typedef QueryFilter
 * @property {string} field
 * @property {Function} operator
 */

export const QueryOperators = {
    Equals: b => a => a == b,
    NotEquals: b => a => a != b,
    GreaterThan: b => a => a > b,
    LessThan: b => a => a < b,
    GreaterThanOrEqual: b => a => a >= b,
    LessThanOrEqual: b => a => a <= b,
    Contains: b => a => a.includes(b),
    NotContains: b => a => !a.includes(b),
    IsContained: b => a => b.includes(a),
    IsNotContained: b => a => !b.includes(a),
}