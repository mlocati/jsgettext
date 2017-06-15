import { Gettext as GettextST } from './SortedDictionary';
import { Gettext as GettextT } from './Translation';

export namespace Gettext {
    /**
     * Represent a set of translatable/translated strings.
     */
    export class Translations {
        public static readonly DEFAULT_CHARSET = 'iso-8859-1';
        private static readonly HEADER_LANGUAGE = 'Language';
        private static readonly HEADER_PLURALFORMS = 'Plural-Forms';
        private static readonly HEADER_CONTENTTYPE = 'Content-Type';
        public static defaultHeaders: GettextST.SortedDictionary;

        private readonly headers: GettextST.SortedDictionary;
        private readonly list: GettextST.SortedDictionary;

        private constructor() {
            this.headers = new GettextST.SortedDictionary();
            this.list = new GettextST.SortedDictionary();
        }

        public static createEmpty(): Translations {
            return new Translations();
        }
        public static createWithDefaultHeaders(): Translations {
            let result = Translations.createEmpty();

            Translations.defaultHeaders.all().forEach(function (kv) {
                result.setHeader(kv.key, kv.value && kv.value.call ? kv.value.call(kv.value) : kv.value);
            });

            return result;
        }

        public add(translation: GettextT.Translation) {
            this.list.set(translation.id, translation);
        }
        public getTranslations(): GettextT.Translation[] {
            return this.list.values();
        }

        public getHeaders(): string[] {
            let result: string[] = [];
            this.headers.all().forEach(function (element) {
                result.push(element.key + ': ' + element.value);
            });
            return result;
        }

        public getHeader(key: string): string | undefined {
            return this.headers.get(key)
        }

        public setHeader(key: string, value: string): void {
            switch (key) {
                case Translations.HEADER_LANGUAGE:
                    this.setLanguage(value);
                    break;
                case Translations.HEADER_PLURALFORMS:
                    this.setPluralForms(value);
                    break;
                case Translations.HEADER_CONTENTTYPE:
                    this.setContentType(value);
                    break;
                default:
                    this.headers.set(key, value);
                    break;
            }
        }

        public getLanguage(): string {
            return this.getHeader(Translations.HEADER_LANGUAGE) || '';
        }

        public setLanguage(languageId: string): void {
            this.headers.set(Translations.HEADER_LANGUAGE, languageId);
        }

        public getPluralForms(): string {
            return this.getHeader(Translations.HEADER_LANGUAGE) || '';
        }

        public setPluralForms(pluralForms: string): void {
            this.headers.set(Translations.HEADER_PLURALFORMS, pluralForms);
        }

        public getContentType(): string {
            return this.getHeader(Translations.HEADER_CONTENTTYPE) || '';
        }

        public setContentType(contentType: string): void {
            this.headers.set(Translations.HEADER_CONTENTTYPE, contentType);
        }

        public getCharset(fallbackToDefault?: boolean): string {
            let contentType = this.getContentType();
            let matches = contentType ? /^text\/plain;(.*;)?\s*charset=([\w\-]+)/.exec(contentType) : null;
            if (matches !== null) {
                return matches[2].toLowerCase();
            }
            return fallbackToDefault ? Translations.DEFAULT_CHARSET : '';
        }

        public setCharset(charset: string): void {
            if (charset) {
                this.setContentType('text/plain; charset=' + charset);
            } else {
                this.setContentType('text/plain');
            }
        }

        public clearHeaders(): void {
            this.headers.clear();
        }

        public toPot(): Translations {
            let result = Translations.createEmpty();
            this.headers.all().forEach((header: { key: string, value: string }): void => {
                switch (header.key) {
                    case Translations.HEADER_LANGUAGE:
                        result.setLanguage('');
                        break;
                    case Translations.HEADER_PLURALFORMS:
                        result.setPluralForms('');
                        break;
                    case 'PO-Revision-Date':
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
