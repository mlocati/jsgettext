import SingleOperator from '../Single';
import ArgumentType from '../ArgumentType';
import Translations from '../../Translations';
import Translation from '../../Translation';

/**
 * Operations related to the fuzzy flag.
 */
export default class Fuzzy implements SingleOperator {
    /**
     * Remove the fuzzy flags from all the strings.
     */
    public static readonly OPERATION_FLAG_REMOVE = 'Remove all fuzzy flags';

    /**
     * Set the fuzzy flags for all the strings.
     */
    public static readonly OPERATION_FLAG_SET = 'Set the fuzzy flag for all the translations';

    /**
     * Toggle the fuzzy flags for all the strings.
     */
    public static readonly OPERATION_FLAG_TOGGLE = 'Toggle the fuzzy flag for all the translations';

    /**
     * Remove the translations for the strings marked as fuzzy.
     */
    public static readonly OPERATION_UNTRANSLATE = 'Remove translations from fuzzy strings';

    /**
     * Remove the strings marked as fuzzy.
     */
    public static readonly OPERATION_REMOVE = 'Remove fuzzy strings';

    /**
     * @see Gettext.Operator.Operator.name
     */
    public readonly name = 'Fuzzy operations';

    /**
     * @see Gettext.Operator.Operator.description
     */
    public readonly description = 'Add or remove the fuzzy flag, or process the fuzzy strings.';

    /**
     * @see Gettext.Operator.Operator.outputFileExtension
     */
    public readonly outputFileExtension = '';

    /**
     * @see Gettext.Operator.Operator.configuration
     */
    public readonly configuration: { [id: string]: { name: string, type: ArgumentType, data?: any } } = {
        operation: {
            name: 'Operation type',
            type: ArgumentType.ValueFromList,
            data: [
                Fuzzy.OPERATION_FLAG_REMOVE,
                Fuzzy.OPERATION_FLAG_SET,
                Fuzzy.OPERATION_FLAG_TOGGLE,
                Fuzzy.OPERATION_UNTRANSLATE,
                Fuzzy.OPERATION_REMOVE,
            ]
        },
    };

    /**
     * @see Gettext.Operator.Operator.configure
     */
    public configure(values: { [id: string]: any }): void {
        for (let key in values) {
            switch (key) {
                case 'operation':
                    this.setOperation(values[key]);
                    break;
                default:
                    throw new Error('Unknown configuration key: ' + key);
            }
        }
    }

    /**
     * The operation to perform.
     */
    private operation: string;

    /**
     * Set the operation to perform.
     *
     * @param value One of the Fuzzy.OPERATION_... values
     */
    public setOperation(value: string): void {
        this.operation = value;
    }

    /**
     * @see Gettext.Operator.Single.Operator.apply
     */
    public apply(translations: Translations): Translations {
        let result: Translations;
        let operation: (translation: Translation) => boolean;
        let notSomeMessage: string;
        switch (this.operation) {
            case Fuzzy.OPERATION_FLAG_REMOVE:
                notSomeMessage = 'No fuzzy strings have been found';
                operation = (translation) => {
                    if (translation.flags.indexOf('fuzzy') < 0) {
                        return false;
                    }
                    translation.removeFlag('fuzzy');
                    return true;
                };
                break;
            case Fuzzy.OPERATION_FLAG_SET:
                notSomeMessage = 'All the strings are already marked as fuzzy';
                operation = (translation) => {
                    if (translation.flags.indexOf('fuzzy') >= 0) {
                        return false;
                    }
                    translation.addFlag('fuzzy');
                    return true;
                };
                break;
            case Fuzzy.OPERATION_FLAG_TOGGLE:
                notSomeMessage = "There's no string to me marked/unmarked as fuzzy";
                operation = (translation) => {
                    if (translation.flags.indexOf('fuzzy') >= 0) {
                        translation.removeFlag('fuzzy');
                    } else {
                        translation.addFlag('fuzzy');
                    }
                    return true;
                };
                break;
            case Fuzzy.OPERATION_UNTRANSLATE:
                notSomeMessage = 'No fuzzy strings have been found';
                operation = (translation) => {
                    if (translation.flags.indexOf('fuzzy') < 0) {
                        return false;
                    }
                    if (translation.hasPlural) {
                        translation.setTranslations(Array(translation.getPluralCount()).join('.').split('.'));
                    } else {
                        translation.setTranslation('');
                    }
                    return true;
                }
                break;
            case Fuzzy.OPERATION_REMOVE:
                notSomeMessage = 'No fuzzy strings have been found';
                operation = (translation) => {
                    if (translation.flags.indexOf('fuzzy') < 0) {
                        return false;
                    }
                    result.removeTranslationById(translation.id);
                    return true;
                };
                break;
            default:
                throw new Error('The operation about the fuzzy flag is not configured');
        }
        result = translations.clone();
        let some = false;
        result.getTranslations().forEach((translation) => {
            if (operation(translation) === true) {
                some = true;
            }
        });
        if (some === false) {
            throw new Error(notSomeMessage);
        }
        return result;
    }
}
