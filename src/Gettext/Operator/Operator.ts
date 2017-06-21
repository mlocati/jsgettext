import { Gettext as GettextTS } from '../Translations';

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
             * Get the minimum number of operands
             */
            readonly minNumberOfOperands: number;

            /**
             * Get the maximum number of operands
             */
            readonly maxNumberOfOperands: number | undefined;

            /**
             * Apply the operator to the translations sets
             *
             * @throws Error
             */
            apply(translationsList: GettextTS.Translations[]): GettextTS.Translations;
        }
    }
}
