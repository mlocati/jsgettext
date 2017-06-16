import { Gettext as GettextT } from '../Translation';
import { Gettext as GettextTS } from '../Translations';

export namespace Gettext {
    export namespace Generator {
        export class Po {
            public translationsToString(translations: GettextTS.Translations, setUtf8Charset?: boolean): string {
                let headers: string;
                {
                    let previousCharset = translations.getCharset();
                    let revertPreviousCharset = setUtf8Charset && previousCharset.toUpperCase() !== 'UTF-8';
                    try {
                        if (revertPreviousCharset) {
                            translations.setCharset('UTF-8');
                        }
                        headers = translations.getHeaders().join('\n');
                        if (revertPreviousCharset) {
                            translations.setCharset(previousCharset);
                            revertPreviousCharset = false;
                        }
                    } catch (e) {
                        if (revertPreviousCharset) {
                            translations.setCharset(previousCharset);
                        }
                        throw e;
                    }
                }
                let lines: string[] = [];
                lines.push('msgid ""');
                lines.push('msgstr ' + Po.convertString(headers));
                translations.getTranslations().forEach(function (translation: GettextT.Translation): void {
                    lines.push('');
                    translation.translatorComments.forEach(function (comment: string): void {
                        lines.push('#  ' + comment);
                    });
                    translation.extractedComments.forEach(function (comment: string): void {
                        lines.push('#. ' + comment);
                    });
                    translation.references.forEach(function (comment: { filename: string, line: Number | null }): void {
                        lines.push('#: ' + comment.filename + (comment.line ? ':' + comment.line : ''));
                    });
                    if (translation.flags.length > 0) {
                        lines.push('#, ' + translation.flags.join(','));
                    }
                    if (translation.previousUntranslatedString.length > 0) {
                        lines.push('#| ' + translation.previousUntranslatedString);
                    }
                    if (translation.context.length > 0) {
                        lines.push('msgctxt ' + Po.convertString(translation.context));
                    }
                    lines.push('msgid ' + Po.convertString(translation.original));
                    if (translation.hasPlural) {
                        lines.push('msgid_plural ' + Po.convertString(translation.plural));
                        translation.getTranslations().forEach((translation: string, index: number) => {
                            lines.push('msgstr[' + index + '] ' + Po.convertString(translation));
                        });
                    } else {
                        lines.push('msgstr ' + Po.convertString(translation.getTranslation()));
                    }
                });
                lines.push('\n');
                return lines.join('\n');
            }

            private static convertStringMap: { [id: string]: string } = {
                '\\': '\\\\',
                '\x07': '\\a',
                '\x08': '\\b',
                '\t': '\\t',
                '\n': '\\n"\n"',
                '\x0b': '\\v',
                '\x0c': '\\f',
                '\r': '\\r',
                '"': '\\"',
            };

            private static convertString(value: string): string {
                if (!value) {
                    return '"' + value + '"';
                }
                let result = '"';
                while (value.length > 0) {
                    let minIndex: number | null = null;
                    let minFound: string = '';
                    for (let search in Po.convertStringMap) {
                        let index = value.indexOf(search);
                        if (index >= 0 && (minIndex === null || minIndex > index || (minIndex === index && minFound.length < search.length))) {
                            minIndex = index;
                            minFound = search;
                        }
                    }
                    if (minIndex === null) {
                        result += value;
                        break;
                    }
                    if (minIndex > 0) {
                        result += value.substr(0, minIndex);
                    }
                    result += Po.convertStringMap[minFound];
                    value = value.substr(minIndex + minFound.length);
                }
                return result + '"';
            }

        }

    }
}