import Translations from './Translations';

/**
 * Holds stats about a translations set.
 */
export default class TranslationsStats {
    /**
     * The total number of strings.
     */
    public readonly totalStrings: number;

    /**
     * The total number of plural strings.
     */
    public readonly pluralStrings: number;

    /**
     * The total number of fully translated strings.
     */
    public readonly translated: number;

    /**
     * The total number of untranslated strings.
     */
    public readonly untranslated: number;

    /**
     * The total number of partially translated plural strings.
     */
    public readonly partiallyTranslated: number;

    /**
     * The total number of fuzzy translations.
     */
    public readonly fuzzyTranslations: number;

    /**
     * Initialize the instance.
     *
     * @param translations
     */
    public constructor(translations: Translations) {
        let list = translations.getTranslations();
        this.totalStrings = list.length;
        let pluralStrings = 0;
        let translated = 0;
        let untranslated = 0;
        let partiallyTranslated = 0;
        let fuzzyTranslations = 0;
        list.forEach((translation) => {
            if (translation.hasPlural) {
                pluralStrings++;
            }
            if (translation.isPluralPartiallyTranslated()) {
                partiallyTranslated++;
            } else if (translation.isTranslated()) {
                translated++;
            } else {
                untranslated++;
            }
            if (translation.flags.indexOf('fuzzy') >= 0) {
                fuzzyTranslations++;
            }
        });
        this.pluralStrings = pluralStrings;
        this.translated = translated;
        this.untranslated = untranslated;
        this.partiallyTranslated = partiallyTranslated;
        this.fuzzyTranslations = fuzzyTranslations;
    }
}
