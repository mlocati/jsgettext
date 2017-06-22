import ArgumentType from './ArgumentType';

interface Operator {
    /**
     * Get the operator name
     */
    readonly name: string;

    /**
     * Get the operator description
     */
    readonly description: string;

    /**
     * Get the file extension of the output file (if empty: keep the original translation)
     */
    readonly outputFileExtension: string;

    /**
     * Get the operator configuration options.
     */
    readonly configuration: {[id: string]: {type: ArgumentType, data?: any}}

    /**
     * Configure the operator
     */
    configure(values: {[id: string]: any}): void;
}

export default Operator;