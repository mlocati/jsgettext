export namespace Gettext {
    /**
     * Represent a translatable/translated string.
     */
    export class Translation {
        /**
         * The string identifier.
         */
        public readonly id: string;

        /**
         * The string context.
         */
        public readonly context: string;

        /**
         * The original string to be translated.
         */
        public readonly original: string;

        /**
         * The original string to be translated (plural form).
         */
        public readonly plural: string;

        /**
         * Is this a plural translatable string?
         */
        public readonly hasPlural: boolean;

        /**
         * The extracted comments.
         */
        public readonly extractedComments: string[];

        /**
         * The string references.
         */
        public readonly references: { filename: string, line: Number | null }[];

        /**
         * The flags comments.
         */
        public readonly flags: string[];

        /**
         * The previous untranslated string.
         */
        public previousUntranslatedString: string;

        /**
         * The translator comments.
         */
        public readonly translatorComments: string[];

        /**
         * The translations.
         */
        private translations: string[];

        /**
         * Initializes the instance.
         *
         * @param context The string context
         * @param original The original string to be translated
         * @param plural The original string to be translated (plural form)
         */
        constructor(context: string, original: string, plural?: string) {
            this.context = context || '';
            this.original = original || '';
            this.plural = plural || '';
            this.hasPlural = this.plural.length > 0;
            this.id = Translation.generateId(this.context, this.original)
            this.extractedComments = [];
            this.references = [];
            this.flags = [];
            this.previousUntranslatedString = '';
            this.translatorComments = [];
            this.translations = [];
        }

        /**
         * Add an extracted comment (if it's not already in the list).
         *
         * @param comment The comment to be added
         */
        public addExtractedComment(comment: string): void {
            if (this.extractedComments.indexOf(comment) < 0) {
                this.extractedComments.push(comment);
            }
        }

        /**
         * Add a reference (if it's not already in the list).
         *
         * @param filename The file name
         * @param line The line number
         */
        public addReference(filename: string, line?: Number | null): void {
            line = line || null;
            for (let index = 0; index < this.references.length; index++) {
                if (this.references[index].filename === filename && this.references[index].line === line) {
                    return;
                }
            }
            this.references.push({ filename: filename, line: line });
        }

        /**
         * Add a flag (if it's not already in the list).
         *
         * @param flag The flag to be assed
         */
        public addFlag(flag: string): void {
            if (this.flags.indexOf(flag) < 0) {
                this.flags.push(flag);
            }
        }

        /**
         * Add a translator comment (if it's not already in the list).
         *
         * @param comment The comment to be added
         */
        public addTranslatorComment(comment: string): void {
            if (this.translatorComments.indexOf(comment) < 0) {
                this.translatorComments.push(comment);
            }
        }

        /**
         * Get the translation.
         *
         * @param index The translation index (for plural translations)
         *
         * @throws RangeError
         *
         * @returns stirng
         */
        public getTranslation(index?: number): string {
            if (!index) {
                index = 0;
            }
            if (index > 0 && this.hasPlural !== true) {
                throw new RangeError('This string is not plural');
            }
            return this.translations.length > index ? this.translations[index] : '';
        }

        /**
         * Set the translation.
         *
         * @param value The translation text
         * @param index The translation index (for plural translations)
         *
         * @throws RangeError
         */
        public setTranslation(value: string, index?: number): void {
            if (!index) {
                index = 0;
            }
            if (index > 0 && this.hasPlural !== true) {
                throw new RangeError('This string is not plural');
            }
            for (let i = this.translations.length; i < index; i++) {
                this.translations[i] = '';
            }
            this.translations[index] = value;
        }

        /**
         * Get the translations.
         *
         * @param pluralCount The number of plural rules.
         *
         * @returns string[]
         */
        public getTranslations(pluralCount?: number): string[] {
            if (pluralCount === undefined) {
                return this.translations;
            }
            var size = this.hasPlural ? pluralCount : 1;
            var delta = this.translations.length - size;
            if (delta === 0) {
                return this.translations.slice(0);
            }

            if (delta < 0) {
                return this.translations.slice(0, size);
            }
            return this.translations.slice(0).concat(Array(delta).join('.').split('.'));
        }

        /**
         * Set the translations.
         *
         * @param translations The array of translations for this string
         *
         * @throws RangeError
         */
        public setTranslations(translations: string[]): void {
            if (this.hasPlural === false && translations.length > 1) {
                throw new RangeError('This string is not plural');
            }
            this.translations = new Array().concat(translations);
        }

        /**
         * Is this translation fully translated?
         *
         * @param pluralCount The number of plural forms.
         *
         * @returns boolean
         */
        public isTranslated(pluralCount: number): boolean {
            var size = this.hasPlural ? pluralCount : 1;
            if (this.translations.length < size) {
                return false;
            }
            let i = this.translations.indexOf('');
            return i < 0 || i >= size;
        };

        /**
         * Get an untranslated clone of this translation.
         *
         * @returns Translation
         */
        public getUntranslatedCopy(): Translation {
            let result = new Translation(this.context, this.original, this.plural);
            result.setTranslations(this.hasPlural ? ['', ''] : ['']);
            result.extractedComments.concat(this.extractedComments);
            result.flags.concat(this.flags);
            result.previousUntranslatedString = this.previousUntranslatedString;
            this.references.forEach(function (reference) {
                result.references.push({ filename: reference.filename, line: reference.line });
            });
            return result;
        }

        /**
         * Generate a Translation identifier.
         *
         * @param context The string context
         * @param original The original string to be translated
         *
         * @returns string
         */
        public static generateId(context: string, original: string): string {
            return (context || '') + '\x04' + (original || '');
        }
    }
}
