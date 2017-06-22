import { Gettext as GettextO } from './Operator';
import { Gettext as GettextTS } from '../Translations';

export namespace Gettext {
    export namespace Operator {
        export interface Multiple extends GettextO.Operator.Operator {
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
