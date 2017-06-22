import { Gettext as GettextO_S } from '../Single';
import { Gettext as GettextOAT } from '../ArgumentType';
import { Gettext as GettextTS } from '../../Translations';

export namespace Gettext {
    export namespace Operator {
        export namespace Single {
            export class ToPot implements GettextO_S.Operator.Single {
                /**
                 * @see Gettext.Operator.Operator.name
                 */
                public readonly name = 'Convert to .pot';

                /**
                 * @see Gettext.Operator.Operator.description
                 */
                public readonly description = 'Strip out all the translations and remove all the language-specific data.';

                /**
                 * @see Gettext.Operator.Operator.outputFileExtension
                 */
                public readonly outputFileExtension = 'pot';

                /**
                 * @see Gettext.Operator.Operator.configuration
                 */
                public readonly configuration: { [id: string]: GettextOAT.Operator.ArgumentType } = {};

                /**
                 * @see Gettext.Operator.Operator.configure
                 */
                public configure(values: { [id: string]: any }): void {
                    if (values && Object.keys(values).length > 0) {
                        throw new Error('This operator does not have any configuration option');
                    }
                }

                /**
                 * @see Gettext.Operator.Single.Operator.apply
                 */
                public apply(translations: GettextTS.Translations): GettextTS.Translations {
                    return translations.toPot();
                }
            }
        }
    }
}
