import Translations from '../Translations';

/**
 * An error thrown when the extractor was able to only load partially the strings.
 */
export default class PartialLoadError extends Error {
    __proto__: Error;
    /**
     * The number of expected strings (if available).
     */
    public readonly expectedStrings: number | null;

    /**
     * The number strings actually read.
     */
    public readonly loadedStrings: number;

    /**
     * The partially loaded translations.
     */
    public readonly translations: Translations;

    /**
     * Initialize the instance.
     * @param failureReason 
     * @param expectedStrings 
     * @param loadedStrings 
     * @param translations 
     */
    public constructor(failureReason: string, expectedStrings: number | null, loadedStrings: number, translations: Translations) {
        let message: string;
        if (expectedStrings === null) {
            message = 'Only ' + loadedStrings.toString() + ' strings were loaded before the following error occurred: ' + failureReason;
        } else {
            message = expectedStrings.toString() + ' strings were expected, but only ' + loadedStrings.toString() + '  were loaded because of the following error: ' + failureReason;
        }
        const trueProto = new.target.prototype;
        super(message);
        this.__proto__ = trueProto;
        this.expectedStrings = expectedStrings;
        this.loadedStrings = loadedStrings;
        this.translations = translations;
    }
}
