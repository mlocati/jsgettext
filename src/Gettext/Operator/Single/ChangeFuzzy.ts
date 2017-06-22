import SingleOperator from '../Single';
import ArgumentType from '../ArgumentType';
import Translations from '../../Translations';
import Translation from '../../Translation';

export default class ChangeFuzzy implements SingleOperator {
    public static readonly FUZZY_REMOVE = 'Remove all fuzzy flags';
    public static readonly FUZZY_SET = 'Set the fuzzy flag for all the translations';
    public static readonly FUZZY_TOGGLE = 'Toggle the fuzzy flag for all the translations';
    /**
     * @see Gettext.Operator.Operator.name
     */
    public readonly name = 'Change fuzzy';

    /**
     * @see Gettext.Operator.Operator.description
     */
    public readonly description = 'Add or remove the fuzzy flag to the translations.';

    /**
     * @see Gettext.Operator.Operator.outputFileExtension
     */
    public readonly outputFileExtension = '';

    /**
     * @see Gettext.Operator.Operator.configuration
     */
    public readonly configuration: { [id: string]: { type: ArgumentType, data?: any } } = {
        fuzzy: {
            type: ArgumentType.ValueFromList,
            data: [
                ChangeFuzzy.FUZZY_REMOVE,
                ChangeFuzzy.FUZZY_SET,
                ChangeFuzzy.FUZZY_TOGGLE,
            ]
        },
    };

    /**
     * @see Gettext.Operator.Operator.configure
     */
    public configure(values: { [id: string]: any }): void {
        for (let key in values) {
            switch (key) {
                case 'fuzzy':
                    this.setFuzzy(values[key]);
                    break;
                default:
                    throw new Error('Unknown configuration key: ' + key);
            }
        }
    }

    /**
     * The destination locale.
     */
    private fuzzy: string;

    /**
     * Set the destination locale.
     *
     * @param value 
     */
    public setFuzzy(value: string): void {
        this.fuzzy = value;
    }

    /**
     * @see Gettext.Operator.Single.Operator.apply
     */
    public apply(translations: Translations): Translations {
        let operation: (translation: Translation) => void;
        switch (this.fuzzy) {
            case ChangeFuzzy.FUZZY_REMOVE:
                operation = (translation) => {
                    translation.removeFlag('fuzzy');
                };
                break;
            case ChangeFuzzy.FUZZY_SET:
                operation = (translation) => {
                    translation.addFlag('fuzzy');
                };
                break;
            case ChangeFuzzy.FUZZY_TOGGLE:
                operation = (translation) => {
                    if (translation.flags.indexOf('fuzzy') >= 0) {
                        translation.removeFlag('fuzzy');
                    } else {
                        translation.addFlag('fuzzy');
                    }
                };
                break;
            default:
                throw new Error('The operation about the fuzzy flag is not configured');
        }
        let result = translations.clone();
        result.getTranslations().map(operation);
        return result;
    }
}
