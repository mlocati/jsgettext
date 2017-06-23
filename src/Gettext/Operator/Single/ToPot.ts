import SingleOperator from '../Single';
import ArgumentType from '../ArgumentType';
import Translations from '../../Translations';

export default class ToPot implements SingleOperator {
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
     * @see Gettext.Operator.Single.Operator.apply
     */
    public apply(translations: Translations): Translations {
        return translations.toPot();
    }
}
