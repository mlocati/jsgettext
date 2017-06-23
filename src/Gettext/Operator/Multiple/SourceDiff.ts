import MultipleOperator from '../Multiple';
import ArgumentType from '../ArgumentType';
import Translations from '../../Translations';

export default class SourceDiff implements MultipleOperator {
    /**
     * @see Gettext.Operator.Operator.name
     */
    public readonly name = 'Source diff';

    /**
     * @see Gettext.Operator.Operator.description
     */
    public readonly description = 'Get the source strings present in a file but not in other files.';

    /**
     * @see Gettext.Operator.Operator.outputFileExtension
     */
    public readonly outputFileExtension = '';

    /**
     * @see Gettext.Operator.Operator.configuration
     */
    public readonly configuration: { [id: string]: { name: string, type: ArgumentType, data?: any } } = {};

    /**
     * @see Gettext.Operator.Operator.configure
     */
    public configure(values: { [id: string]: any }): void {
        if (values && Object.keys(values).length > 0) {
            throw new Error('This operator does not have any configuration option');
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
     * @see Gettext.Operator.Multiple.Operator.apply
     */
    public apply(translationsList: Translations[]): Translations {
        let result = (<Translations>translationsList.shift()).clone();
        let some = false;
        result.getTranslations().forEach((translation) => {
            let found = false;
            for (let i = 0; i < translationsList.length && found === false; i++) {
                found = translationsList[i].hasTranslationId(translation.id);
            }
            if (found) {
                result.removeTranslationById(translation.id);
            } else {
                some = true;
            }
        });
        if (some === false) {
            throw new Error('The first file does not contain source strings that are not present in the other file(s)');
        }
        return result;
    }
}
