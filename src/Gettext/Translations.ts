import { Gettext as GettextST } from './SortedDictionary';
import { Gettext as GettextT } from './Translation';
import { Gettext as GettextLI } from './LocaleId';
import { Gettext as GettextP } from './Plural';

export namespace Gettext {
    /**
     * Represent a set of translatable/translated strings.
     */
    export class Translations {
        /**
         * The default charset to use when it's not (yet) specified.
         */
        public static readonly DEFAULT_CHARSET = 'iso-8859-1';

        /**
         * The name of the language header.
         */
        private static readonly HEADER_LANGUAGE = 'Language';

        /**
         * The name of the plural forms header.
         */
        private static readonly HEADER_PLURALFORMS = 'Plural-Forms';

        /**
         * The name of the content-type header.
         */
        private static readonly HEADER_CONTENTTYPE = 'Content-Type';

        /**
         * The default headers to set when initializing a new Translations instance with the createWithDefaultHeaders method.
         */
        public static defaultHeaders: GettextST.SortedDictionary;

        /**
         * The comments before the header.
         */
        public readonly headerComments: string[];

        /**
         * The gettext headers.
         */
        private readonly headers: GettextST.SortedDictionary;

        /**
         * The list of translations
         */
        private readonly list: GettextST.SortedDictionary;

        /**
         * The current charset.
         */
        private charset: string;

        /**
         * The current plural rules definition (if any).
         */
        private pluralForms: { numPlurals: number, pluralFormula: string } | null;

        /**
         * Initialize the instance.
         */
        private constructor(headers?: GettextST.SortedDictionary, list?: GettextST.SortedDictionary) {
            this.headerComments = [];
            this.headers = headers ? headers : new GettextST.SortedDictionary();
            this.list = list ? list : new GettextST.SortedDictionary();
            this.charset = '';
            this.pluralForms = null;
        }

        /**
         * Create an empty Translations instance (no headers, no translations).
         */
        public static createEmpty(): Translations {
            return new Translations();
        }

        /**
         * Create a Translations instance with the default headers.
         */
        public static createWithDefaultHeaders(): Translations {
            let result = Translations.createEmpty();

            Translations.defaultHeaders.all().forEach(function (kv) {
                result.setHeader(kv.key, kv.value && kv.value.call ? kv.value.call(kv.value) : kv.value);
            });

            return result;
        }

        /**
         * Clear all the headers.
         */
        public clearHeaders(): void {
            this.headers.clear();
            this.charset = '';
            this.pluralForms = null;
        }

        /**
         * Get all the headers.
         */
        public getHeaders(): string[] {
            let result: string[] = [];
            this.headers.all().forEach(function (element) {
                result.push(element.key + ': ' + element.value);
            });
            return result;
        }

        /**
         * Get the value of a header (if it's specified).
         *
         * @param key The case-sensitive name of the header.
         */
        public getHeader(key: string): string | undefined {
            return this.headers.get(key)
        }

        /**
         * Get the charset defined in the headers.
         * Return an empty string if the header is not present, if it's not valid and if the fallbackToDefault argument is falsy.
         *
         * @param fallbackToDefault Should the function fall back to the default charset if the header is not present of if it's not valid?
         */
        public getCharset(fallbackToDefault?: boolean): string {
            return this.charset || (fallbackToDefault ? Translations.DEFAULT_CHARSET : '');
        }

        /**
         * Get the value of the language header.
         * If the language header is not defined, return an empty string.
         */
        public getLanguage(): string {
            return this.getHeader(Translations.HEADER_LANGUAGE) || '';
        }

        /**
         * Get the definition of the plural rules.
         * If it's not defined, or if its definition is not valid, return `null`.
         */
        public getPluralForms(): { numPlurals: number, pluralFormula: string } | null {
            return this.pluralForms;
        }

        /**
         * Set the value of a header (add or replace existing ones).
         * Return `true` if the header has been correctly added/replaced, `false` if the value contains an invalid value.
         *
         * @param key The case-sensitive name of the header.
         * @param value The value of the header
         */
        public setHeader(key: string, value: string): boolean {
            switch (key) {
                case Translations.HEADER_CONTENTTYPE:
                    this.setContentType(value);
                    return true;
                case Translations.HEADER_LANGUAGE:
                    return this.setLanguage(value);
                case Translations.HEADER_PLURALFORMS:
                    return this.setPluralFormsHeader(value);
                default:
                    this.headers.set(key, value);
                    return true;
            }
        }

        /**
         * Set the value of the content-type header.
         *
         * @param value The content-type header value, which should be in form of 'text/plain; charset=...';
         */
        private setContentType(value: string): void {
            this.charset = '';
            if (value) {
                let matches = /^text\/plain;(.*;)?\s*charset=([\w\-]+)/.exec(value);
                if (matches !== null) {
                    this.charset = matches[2].toLowerCase();
                }
            }
            this.headers.set(Translations.HEADER_CONTENTTYPE, value);
        }

        /**
         * Set the charset.
         *
         * @param charset The charset to be used ('utf-8', 'iso-8859-1', ...)
         */
        public setCharset(charset: string): void {
            this.charset = charset;
            this.headers.set(Translations.HEADER_CONTENTTYPE, charset ? 'text/plain; charset=' + charset : 'text/plain');
        }

        /**
         * Set the language identifier to be used.
         * Return `false` if languageId is specified but it's not recognized, otherwise return `true`.
         *
         * @param languageId The language identifier ('en_US', 'it_IT', ...)
         * @param overwriteExistingPluralsDefinition Should we overwrite the currently defined plural rules if languageId is valid and we already have the plural rules?
         */
        public setLanguage(languageId: string, overwriteExistingPluralsDefinition?: boolean): boolean {
            let result: boolean;
            let plural: GettextP.Plural | null = null;
            if (languageId) {
                let localeId = GettextLI.LocaleId.parse(languageId);
                if (localeId !== null) {
                    plural = GettextP.Plural.search(localeId);
                    if (plural !== null && (this.pluralForms === null || overwriteExistingPluralsDefinition)) {
                        this.setPluralForms(plural.numPlurals, plural.formula);
                    }
                }
                result = plural !== null;
            } else {
                result = true;
            }
            this.headers.set(Translations.HEADER_LANGUAGE, languageId);
            return result;
        }

        /**
         * Set the plural forms header.
         * Return `false` if header is not empty and if it contains an invalid value.
         *
         * @param header Should be an empty string, of a string like 'nplurals=2; plural=n != 1;')
         */
        private setPluralFormsHeader(header: string): boolean {
            if (!header) {
                this.pluralForms = null;
                this.headers.set(Translations.HEADER_PLURALFORMS, '');
                return true;
            }
            let match = /^nplurals\s*=\s*([1-9])\s*;\s*plural\s*=\s*(.+?)\s*;?\s*$/.exec(header);
            if (match === null) {
                this.pluralForms = null;
                this.headers.set(Translations.HEADER_PLURALFORMS, header);
                return false;
            }
            this.setPluralForms(parseInt(match[1], 10), match[2]);

            return true;
        }

        /**
         * Set the plural forms.
         *
         * @param numPlurals The number of plural forms.
         * @param pluralFormula The formula to distinguish the plural cases.
         */
        public setPluralForms(numPlurals: number, pluralFormula: string): void {
            let oldPluralCount: number | null = this.pluralForms ? this.pluralForms.numPlurals : null;
            pluralFormula = pluralFormula.replace(/^\s+/, '').replace(/[\s;]+$/, '');
            this.pluralForms = { numPlurals: numPlurals, pluralFormula: pluralFormula };
            this.headers.set(Translations.HEADER_PLURALFORMS, 'nplurals=' + numPlurals.toString() + '; ' + pluralFormula + ';');
            if (oldPluralCount !== numPlurals) {
                this.list.values().forEach((translation: GettextT.Translation): void => {
                    if (translation.hasPlural) {
                        translation.setPluralCount(numPlurals);
                    }
                });
            }
        }

        /**
         * Add (or replace) a translatable/translated string.
         *
         * @param translation The translatable/translated instance to be added.
         */
        public add(translation: GettextT.Translation) {
            if (translation.hasPlural && this.pluralForms !== null) {
                translation.setPluralCount(this.pluralForms.numPlurals)
            }
            this.list.set(translation.id, translation);
        }

        /**
         * Get the list of translations.
         */
        public getTranslations(): GettextT.Translation[] {
            return this.list.values();
        }

        /**
         * Create a clone of this instance.
         */
        public clone(): Translations {
            let result = new Translations(
                this.headers.clone(),
                this.list.clone()
            );
            Array.prototype.push.apply(result.headerComments, this.headerComments);
            result.charset = this.charset;
            if (this.pluralForms !== null) {
                result.pluralForms = { numPlurals: this.pluralForms.numPlurals, pluralFormula: this.pluralForms.pluralFormula };
            }
            return result;
        }
        /**
         * Create a new Translations instance, with empty translatable strings and no language definition.
         */
        public toPot(): Translations {
            let result = Translations.createEmpty();
            Array.prototype.push.apply(result.headerComments, this.headerComments);
            this.headers.all().forEach((header: { key: string, value: string }): void => {
                switch (header.key) {
                    case Translations.HEADER_LANGUAGE:
                        result.setLanguage('');
                        break;
                    case Translations.HEADER_PLURALFORMS:
                        result.setPluralFormsHeader('');
                        break;
                    case 'PO-Revision-Date':
                    case 'Last-Translator':
                    case 'Language-Team':
                        result.setHeader(header.key, '');
                        break;
                    default:
                        result.setHeader(header.key, header.value);
                        break;
                }
            });
            this.getTranslations().forEach((translation: GettextT.Translation): void => {
                result.add(translation.getUntranslatedCopy());
            });
            return result;
        }
    }
    Translations.defaultHeaders = new GettextST.SortedDictionary();
    Translations.defaultHeaders.set('Project-Id-Version', '');
    Translations.defaultHeaders.set('Report-Msgid-Bugs-To', '');
    Translations.defaultHeaders.set('Last-Translator', '');
    Translations.defaultHeaders.set('Language-Team', '');
    Translations.defaultHeaders.set('MIME-Version', '1.0');
    Translations.defaultHeaders.set('Content-Type', 'text/plain; charset=UTF-8');
    Translations.defaultHeaders.set('Content-Transfer-Encoding', '8bit');
    Translations.defaultHeaders.set('POT-Creation-Date', function () { return new Date() });
    Translations.defaultHeaders.set('PO-Revision-Date', function () { return new Date() });
}
