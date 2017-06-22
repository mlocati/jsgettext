import Operator from './Operator';
import Translations from '../Translations';

interface Multiple extends Operator {
    /**
     * Get the minimum number of operands
     */
    readonly minNumberOfOperands: number;

    /**
     * Get the maximum number of operands
     */
    readonly maxNumberOfOperands: number | undefined;

    /**
     * Apply the operator to the translations sets
     *
     * @throws Error
     */
    apply(translationsList: Translations[]): Translations;
}

export default Multiple;
