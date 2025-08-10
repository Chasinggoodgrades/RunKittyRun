export const PROD: boolean = compiletime(() => require('process').env.npm_lifecycle_event === 'build') as any

// npm_lifecycle_event doesn't work when scripts are including eachother therefor we're using our own script variable
export const SCRIPT_VAR: string = compiletime(() => require('process').env.SCRIPT || '') as any
