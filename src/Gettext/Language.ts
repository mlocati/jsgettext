import { Gettext as GettextLD } from './LanguageData';

export namespace Gettext {
    /**
     * Helper class to work with languages.
     */
    export class Language extends GettextLD.LanguageData {
        /**
         * Get the name of a language given its id.
         *
         * @param languageId The language identifier
         */
        public static getName(languageId: string): string {
            return (languageId in GettextLD.LanguageData.data) ? GettextLD.LanguageData.data[languageId] : '';
        }
    }
}
