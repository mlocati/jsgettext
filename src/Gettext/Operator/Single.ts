import { Gettext as GettextO } from './Operator';
import { Gettext as GettextTS } from '../Translations';

export namespace Gettext {
    export namespace Operator {
        export interface Single extends GettextO.Operator.Operator {
            /**
             * Apply the operator to the translations
             *
             * @throws Error
             */
            apply(translations: GettextTS.Translations): GettextTS.Translations;
        }
    }
}
