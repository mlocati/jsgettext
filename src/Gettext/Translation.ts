/**
 * Represent a translatable/translated string.
 */
export default class Translation {
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
    public readonly previousUntranslatedStrings: string[];

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
        this.context = context;
        this.original = original;
        this.plural = plural || '';
        this.hasPlural = this.plural.length > 0;
        this.extractedComments = [];
        this.references = [];
        this.flags = [];
        this.previousUntranslatedStrings = [];
        this.translatorComments = [];
        this.translations = this.hasPlural ? ['', ''] : [''];
        this.id = Translation.generateId(this.context, this.original)
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
     * @param flag The flag to be added
     */
    public addFlag(flag: string): void {
        if (this.flags.indexOf(flag) < 0) {
            this.flags.push(flag);
        }
    }

    /**
     * Remove a flag (if it's in the list).
     *
     * @param flag The flag to be removed
     */
    public removeFlag(flag: string): void {
        let i = this.flags.indexOf(flag);
        if (i >= 0) {
            this.flags.splice(i, 1);
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
        if (index > this.translations.length) {
            throw new RangeError(this.hasPlural ? 'This string is not plural' : "There aren't that many translations");
        }
        return this.translations[index];
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
        for (let i = this.translations.length; i < index - 1; i++) {
            this.translations[i] = '';
        }
        this.translations[index] = value;
    }

    /**
     * Get the translations.
     *
     * @param pluralCount The number of plural forms (if not set, you'll get the currently defined translation count).
     *
     * @returns string[]
     */
    public getTranslations(pluralCount?: number): string[] {
        if (pluralCount === undefined) {
            return this.translations.slice()
        }
        if (this.hasPlural === false) {
            return [this.translations[0]];
        }
        var delta = this.translations.length - pluralCount;
        if (delta === 0) {
            return this.translations.slice();
        }
        if (delta < 0) {
            return this.translations.slice(0, pluralCount);
        }
        return this.translations.slice().concat(Array(delta).join('.').split('.'));
    }

    /**
     * Set the translations.
     *
     * @param translations The array of translations for this string
     *
     * @throws RangeError
     */
    public setTranslations(translations: string[]): void {
        if (translations.length === 0) {
            throw new RangeError("The translations array can't be empty");
        }
        if (this.hasPlural === false) {
            if (translations.length > 1) {
                throw new RangeError('This string is not plural');
            }
            this.translations = [translations[0]];
            return;
        }
        this.translations = translations.slice();
    }


    /**
     * Get the number of plurals (it will be 1 if the string is not plural).
     *
     */
    public getPluralCount(): number {
        return this.hasPlural ? this.translations.length : 1;
    }

    /**
     * Increase or reduce the number of plurals of this translation (if it's a plural string).
     *
     * @param pluralCount 
     */
    public setPluralCount(pluralCount: number): void {
        if (this.hasPlural === false) {
            return;
        }
        let delta = pluralCount - this.translations.length;
        if (delta > 0) {
            Array.prototype.push.apply(this.translations, Array(delta).join('.').split('.'));
        } else if (delta < 0) {
            this.translations = this.translations.slice(0, delta);
        }
    }

    /**
     * Is this translation fully translated?
     *
     * @returns boolean
     */
    public isTranslated(): boolean {
        if (this.hasPlural === true) {
            return this.translations.indexOf('') < 0;
        }
        return this.translations[0].length > 0;
    };


    /**
     * Is this translation only partially translated (meaningful only for plurals, where some string can be translated and some string can be untranslated)
     *
     * @returns boolean
     */
    public isPluralPartiallyTranslated(): boolean {
        if (this.hasPlural === false) {
            return false;
        }
        let firstUntranslated = this.translations.indexOf('');
        if (firstUntranslated !== 0) {
            return firstUntranslated > 0;
        }
        for (let i = 1; i < this.translations.length; i++) {
            if (this.translations[i].length > 0) {
                return true;
            }
        }
        return false;
    };

    /**
     * Get a clone of this translation, with or without translations.
     */
    private createClone(untranslated: boolean): Translation {
        let result = new Translation(this.context, this.original, this.plural);
        Array.prototype.push.apply(result.extractedComments, this.extractedComments);
        this.references.forEach(function (reference) {
            result.references.push({ filename: reference.filename, line: reference.line });
        });
        if (untranslated && this.flags.indexOf('fuzzy') >= 0) {
            this.flags.forEach((flag) => {
                if (flag !== 'fuzzy') {
                    result.flags.push(flag);
                }
            })
        } else {
            Array.prototype.push.apply(result.flags, this.flags);
        }
        Array.prototype.push.apply(result.previousUntranslatedStrings, this.previousUntranslatedStrings);
        if (untranslated) {
            if (this.hasPlural || this.translations.length !== 2) {
                result.setTranslations(Array(this.translations.length).join('.').split('.'))
            }
        } else {
            Array.prototype.push.apply(result.translatorComments, this.translatorComments);
            result.setTranslations(this.getTranslations());
        }
        return result;
    }

    /**
     * Get a clone of this translation.
     */
    public clone(): Translation {
        return this.createClone(false);
    }

    /**
     * Get an untranslated clone of this translation.
     */
    public getUntranslatedCopy(): Translation {
        return this.createClone(true);
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
