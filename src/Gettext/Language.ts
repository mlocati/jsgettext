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

        /**
         * Get all the language IDs.
         */
        public static getAllIds(): string[] {
            return Object.keys(GettextLD.LanguageData.data.keys).sort();
        }

        /**
         * Get all the languages.
         */
        public static getAll(excludeCompoundNames?: boolean): { id: string, name: string }[] {
            let result: { id: string, name: string }[] = [];
            for (let languageId in GettextLD.LanguageData.data) {
                if (excludeCompoundNames === false || languageId.indexOf('-') < 0) {
                    result.push({ id: languageId, name: GettextLD.LanguageData.data[languageId] });
                }
            }
            result.sort((a, b): number => {
                let na = a.name.toLowerCase();
                let nb = b.name.toLowerCase();
                if (na < nb) {
                    return -1;
                }
                if (na > nb) {
                    return 1;
                }
                return 0;
            });
            return result;
        }
    }
}
