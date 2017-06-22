import SingleOperator from '../Single';
import ArgumentType from '../ArgumentType';
import Translations from '../../Translations';
import Translation from '../../Translation';

export default class CleanFuzzy implements SingleOperator {
    public static readonly FUZZY_UNTRANSLATE = 'Remove translations from fuzzy strings';
    public static readonly FUZZY_REMOVE = 'Remove fuzzy strings';
    /**
     * @see Gettext.Operator.Operator.name
     */
    public readonly name = 'Clean fuzzy';

    /**
     * @see Gettext.Operator.Operator.description
     */
    public readonly description = 'Remove the strings marked as fuzzy, or clear their translations.';

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
                CleanFuzzy.FUZZY_UNTRANSLATE,
                CleanFuzzy.FUZZY_REMOVE,
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
        let operation: (translation: Translation) => boolean;
        switch (this.fuzzy) {
            case CleanFuzzy.FUZZY_UNTRANSLATE:
                operation = (translation) => {
                    if (translation.hasPlural) {
                        translation.setTranslations(Array(translation.getPluralCount()).join('.').split('.'));
                    } else {
                        translation.setTranslation('');
                    }
                    return false;
                };
                break;
            case CleanFuzzy.FUZZY_REMOVE:
                operation = () => {
                    return true;
                };
                break;
            default:
                throw new Error('The operation about the fuzzy flag is not configured');
        }
        let result = translations.clone();
        let some = false;
        result.getTranslations().forEach((translation) => {
            if (translation.flags.indexOf('fuzzy') < 0) {
                return;
            }
            some = true;
            if (operation(translation) === true) {
                result.removeTranslationById(translation.id);
            } else {
                translation.removeFlag('fuzzy');
            }
        });
        if (some === false) {
            throw new Error('No fuzzy translations have been found');
        }
        return result;
    }
}
