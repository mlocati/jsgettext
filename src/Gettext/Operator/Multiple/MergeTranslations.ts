import MultipleOperator from '../Multiple';
import ArgumentType from '../ArgumentType';
import Translations from '../../Translations';

export default class MergeTranslations implements MultipleOperator {
    /**
     * The final file will contain all the strings found in all the source files
     */
    public static readonly OPERATION_MERGE_ALL = 'Merge all strings';

    /**
     * The final file will contain all the strings found in the first file, completed with the translations found in the other files
     */
    public static readonly OPERATION_COMPLETE_FIRST = 'Add only translated strings to first file';

    /**
     * @see Gettext.Operator.Operator.name
     */
    public readonly name = 'Merge translations';

    /**
     * @see Gettext.Operator.Operator.description
     */
    public readonly description = 'Create a new language file merging multiple language files.';

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
                MergeTranslations.OPERATION_MERGE_ALL,
                MergeTranslations.OPERATION_COMPLETE_FIRST,
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
     * @see Gettext.Operator.Multiple.Operator.minNumberOfOperands
     */
    public readonly minNumberOfOperands = 2;

    /**
     * @see Gettext.Operator.Multiple.Operator.maxNumberOfOperands
     */
    public readonly maxNumberOfOperands = undefined;

    /**
     * The operation to perform.
     */
    private operation: string = '';

        /**
     * Set the operation to perform.
     *
     * @param value One of the Fuzzy.OPERATION_... values
     */
    public setOperation(value: string): void {
        this.operation = value;
    }

    /**
     * @see Gettext.Operator.Multiple.Operator.apply
     */
    public apply(translationsList: Translations[]): Translations {
        let result = (<Translations>translationsList.shift()).clone();
        translationsList.forEach((otherTranslations) => {
            switch (this.operation) {
                case MergeTranslations.OPERATION_MERGE_ALL:
                    this.merge(result, otherTranslations, true);
                    break;
                case MergeTranslations.OPERATION_COMPLETE_FIRST:
                    this.merge(result, otherTranslations, false);
                    break;
                default:
                     throw new Error('Unknown operation: ' + this.operation);

            }
        })
        return result;
    }

    private merge(result: Translations, other: Translations, addNew: boolean)
    {
        let pf = result.getPluralForms();
        let resultPluralCount = pf === null ? null : pf.numPlurals;
        other.getTranslationsDictionary().forEach((kv) => {
            let resultTranslation = result.getTranslationById(kv.key);
            if (resultTranslation === null) {
                if (addNew) {
                    result.add(kv.value.clone());
                }
            } else if (!resultTranslation.isTranslated()) {
                if (kv.value.isTranslated()) {
                    if (resultTranslation.hasPlural) {
                        if (resultPluralCount === null) {
                            resultTranslation.setTranslations(kv.value.getTranslations())
                        } else {
                            resultTranslation.setTranslations(kv.value.getTranslations(resultPluralCount))
                        }
                    } else {
                        resultTranslation.setTranslation(kv.value.getTranslation());
                    }
                }
            }
        });
    }
}
