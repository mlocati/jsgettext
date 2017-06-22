import { Gettext as GettextOAT } from './ArgumentType';

export namespace Gettext {
    export namespace Operator {
        export interface Operator {
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
            readonly configuration: {[id: string]: {type: GettextOAT.Operator.ArgumentType, data?: any}}

            /**
             * Configure the operator
             */
            configure(values: {[id: string]: any}): void;
        }
    }
}
