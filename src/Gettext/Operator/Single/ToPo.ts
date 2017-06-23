import SingleOperator from '../Single';
import ArgumentType from '../ArgumentType';
import Translations from '../../Translations';
import LocaleId from '../../LocaleId';

export default class ToPo implements SingleOperator {
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
    public readonly configuration: { [id: string]: { name: string, type: ArgumentType, data?: any } } = {
        locale: {
            name: 'Locale of the new PO file',
            type: ArgumentType.LocaleWithPossiblyPlurals
        },
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
    private destinationLocale: LocaleId;

    /**
     * Set the destination locale.
     *
     * @param value 
     */
    public setDestinationLocale(value: LocaleId): void {
        this.destinationLocale = value;
    }

    /**
     * @see Gettext.Operator.Single.Operator.apply
     */
    public apply(translations: Translations): Translations {
        if (!(this.destinationLocale instanceof LocaleId)) {
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
