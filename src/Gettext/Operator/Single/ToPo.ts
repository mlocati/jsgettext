import { Gettext as GettextO_S } from '../Single';
import { Gettext as GettextOAT } from '../ArgumentType';
import { Gettext as GettextTS } from '../../Translations';
import { Gettext as GettextLI } from '../../LocaleId';

export namespace Gettext {
    export namespace Operator {
        export namespace Single {
            export class ToPo implements GettextO_S.Operator.Single {
                /**
                 * @see Gettext.Operator.Operator.name
                 */
                public readonly name = 'Convert to .po';

                /**
                 * @see Gettext.Operator.Operator.description
                 */
                public readonly description = 'Convert a file to a new .po file, by specifying the language and fixing the plural forms.';

                /**
                 * @see Gettext.Operator.Operator.outputFileExtension
                 */
                public readonly outputFileExtension = 'po';

                /**
                 * @see Gettext.Operator.Operator.configuration
                 */
                public readonly configuration: { [id: string]: GettextOAT.Operator.ArgumentType } = {
                    locale: GettextOAT.Operator.ArgumentType.LocaleWithPossiblyPlurals,
                };

                /**
                 * @see Gettext.Operator.Operator.configure
                 */
                public configure(values: { [id: string]: any }): void {
                    for (let key in values) {
                        switch (key) {
                            case 'locale':
                                this.setDestinationLocale(values[key]);
                                break;
                            default:
                                throw new Error('Unknown configuration key: ' + key);
                        }
                    }
                }

                /**
                 * The destination locale.
                 */
                private destinationLocale: GettextLI.LocaleId;

                /**
                 * Set the destination locale.
                 *
                 * @param value 
                 */
                public setDestinationLocale(value: GettextLI.LocaleId): void {
                    this.destinationLocale = value;
                }

                /**
                 * @see Gettext.Operator.Single.Operator.apply
                 */
                public apply(translations: GettextTS.Translations): GettextTS.Translations {
                    if (!(this.destinationLocale instanceof GettextLI.LocaleId)) {
                        throw new Error('In order to generate a .po file, the destination locale is required');
                    }
                    let result = translations.clone();
                    [
                        'Last-Translator',
                        'Language-Team',
                    ].forEach((cleanHeader) => {
                        if (result.getHeader(cleanHeader)) {
                            result.setHeader(cleanHeader, '');
                        }
                    });
                    result.setLanguage(this.destinationLocale.toString(), true);
                    return result;
                }
            }
        }
    }
}
