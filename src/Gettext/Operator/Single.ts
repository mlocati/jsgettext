import Operator from './Operator';
import Translations from '../Translations';

interface Single extends Operator {
    /**
     * Apply the operator to the translations
     *
     * @throws Error
     */
    apply(translations: Translations): Translations;
}

export default Single;
