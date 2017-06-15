import { Gettext as GettextT } from '../Translation';
import { Gettext as GettextTS } from '../Translations';
import { Gettext as GettextC } from '../Charset';

export namespace Gettext {
    export namespace Extractor {    /**
     * Extract translations from a gettext .po/.pot file
     */
        export class Po {
            private lines: string[];
            private lineIndex: number;
            private constructor(string: string) {
                this.lines = string
                    .split('\n')
                    .map(function (line) {
                        return line.replace(/^\s+|\s+$/, '');
                    })
                    .filter(function (line) {
                        return line.length > 0;
                    });
                for (let i = 1; i < this.lines.length; i++) {
                    if (this.lines[i][0] === '"') {
                        i--;
                        if (this.lines[i][this.lines[i].length - 1] === '"') {
                            this.lines[i] = this.lines[i].substr(0, this.lines[i].length - 1) + this.lines[i + 1].substr(1);
                        } else {
                            this.lines[i] += ' ' + this.lines[i + 1];
                        }
                        this.lines.splice(i + 1, 1);
                    }
                }
                this.lineIndex = 0;
            }
            private getNextTranslation(): GettextT.Translation | string | null {
                if (this.lineIndex === this.lines.length) {
                    return null;
                }
                let comments = this.getComments();
                let msgctxt = this.getMsgCtxt();
                let msgids = this.getMsgIds();
                let msgstrs: string[];
                let isPlural = msgids.length > 1;
                if (isPlural === true) {
                    msgstrs = this.getMsgStrPlural();
                } else {
                    msgstrs = [this.getMsgStrSingular()];
                }
                if (isPlural === false && msgids[0] === '') {
                    return msgstrs[0];
                }
                let result = new GettextT.Translation(msgctxt, msgids[0], isPlural ? msgids[1] : '');
                comments.forEach(function (comment: string) {
                    switch (comment[1]) {
                        case '.':
                            result.addExtractedComment(comment.substr(2).replace(/^\s+/, ''));
                            break;
                        case ',':
                            comment.substr(2).replace(/^\s+/, '').split(',').forEach(function (flag: string) {
                                result.addFlag(flag);
                            });
                            break;
                        case '|':
                            result.previousUntranslatedString = comment.substr(2).replace(/^\s+/, '');
                            break;
                        case ':':
                            comment.substr(2).replace(/^\s+/, '').split(',').forEach((reference: string) => {
                                reference = reference.replace(/^\s+|\s+$/, '');
                                if (reference.length === 0) {
                                    return;
                                }
                                let match = /^(.+):(\d+)$/.exec(reference);
                                if (match === null) {
                                    result.addReference(reference);
                                } else {
                                    result.addReference(match[1], parseInt(match[2], 10));
                                }
                            });
                            break;
                        default:
                            result.addTranslatorComment(comment.substr(1).replace(/^\s+/, ''));
                            break;
                    }
                });
                if (isPlural) {
                    result.setTranslations(msgstrs);
                } else {
                    result.setTranslation(msgstrs[0]);
                }
                return result;
            }
            private getComments(): string[] {
                let result: string[] = [];
                while (this.lineIndex < this.lines.length && this.lines[this.lineIndex][0] === '#') {
                    result.push(this.lines[this.lineIndex]);
                    this.lineIndex++;
                }
                return result;
            }
            private getMsgCtxt(): string {
                if (this.lineIndex < this.lines.length) {
                    let match = /^msgctxt "(.+)"$/.exec(this.lines[this.lineIndex]);
                    if (match !== null) {
                        this.lineIndex++;
                        return Po.convertString(match[1]);
                    }
                }
                return '';
            }
            private getMsgIds(): string[] {
                if (this.lineIndex === this.lines.length) {
                    throw new Error('Invalid PO file: expecting msgid "..."');
                }
                let match = /^msgid "(.*)"$/.exec(this.lines[this.lineIndex]);
                if (match === null) {
                    throw new Error('Invalid PO file: expecting msgid "..."');
                }
                let result: string[] = [Po.convertString(match[1])];
                this.lineIndex++;
                if (this.lineIndex === this.lines.length) {
                    throw new Error('Unexpected end of file');
                }
                match = /^msgid_plural "(.+)"$/.exec(this.lines[this.lineIndex]);
                if (match !== null) {
                    result.push(Po.convertString(match[1]));
                    this.lineIndex++;
                }
                return result;
            }
            private getMsgStrSingular(): string {
                if (this.lineIndex === this.lines.length) {
                    throw new Error('Unexpected end of file');
                }
                let match = /^msgstr "(.*)"$/.exec(this.lines[this.lineIndex]);
                if (match === null) {
                    throw new Error('Invalid PO file: expecting msgstr "..."');
                }
                this.lineIndex++;
                return Po.convertString(match[1]);
            }
            private getMsgStrPlural(): string[] {
                let result: string[] = [];
                if (this.lineIndex === this.lines.length) {
                    throw new Error('Unexpected end of file');
                }
                for (let i = 0; ; i++) {
                    let rx = new RegExp('^msgstr\\[' + i.toString() + '\\] "(.*)"$');
                    let match = rx.exec(this.lines[this.lineIndex])
                    if (match === null) {
                        if (i === 0) {
                            throw new Error('Invalid PO file: expecting msgstr[0] "..."');
                        }
                        break;
                    }
                    result.push(Po.convertString(match[1]));
                    this.lineIndex++;
                    if (this.lineIndex === this.lines.length) {
                        break;
                    }
                }
                return result;
            }
            private static convertStringMap: { [id: string]: string } = {
                '\\\\': '\\',
                '\\a': '\x07',
                '\\b': '\x08',
                '\\t': '\t',
                '\\n': '\n',
                '\\v': '\x0b',
                '\\f': '\x0c',
                '\\r': '\r',
                '\\"': '"',
            };
            private static convertString(value: string): string {
                if (!value || value.indexOf('\\') < 0) {
                    return value;
                }
                let result = '';
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
                        return result;
                    }
                    if (minIndex > 0) {
                        result += value.substr(0, minIndex);
                    }
                    result += Po.convertStringMap[minFound];
                    value = value.substr(minIndex + minFound.length);
                }
                return result;
            }
            public static getTranslationsFromBuffer(buffer: ArrayBuffer): GettextTS.Translations {
                let charset = GettextTS.Translations.DEFAULT_CHARSET;
                let string = GettextC.Charset.bufferToString(buffer, charset);
                let rawString = '\n' + string.replace(/[ \t]+/g, ' ').replace(/ \n|\n /g, '\n').replace(/\n\n+/g, '\n').replace(/"\n"/g, '');
                let rawMatches = /\nmsgid ""\nmsgstr ([^\n]+)\n/m.exec(rawString);
                if (rawMatches !== null) {
                    rawMatches = /\\n\s*Content-Type\s*:\s*text\/plain;(.*;)?\s*charset=([\w\-]+)/.exec('\\n' + rawMatches);
                    if (rawMatches !== null) {
                        let newCharset = rawMatches[2].toLowerCase();
                        if (newCharset !== charset) {
                            charset = newCharset;
                            string = GettextC.Charset.bufferToString(buffer, charset);
                        }
                    }
                }
                return Po.getTranslationsFromString(string);
            }
            public static getTranslationsFromString(string: string): GettextTS.Translations {
                let po = new Gettext.Extractor.Po(string);
                let translations = GettextTS.Translations.createEmpty();
                let translation: GettextT.Translation | string | null;
                while ((translation = po.getNextTranslation()) !== null) {
                    if (typeof translation === 'string') {
                        translation.split('\n').forEach(function (header: string) {
                            header = header.replace(/^\s+|\s+$/g, '');
                            if (header.length === 0) {
                                return;
                            }
                            let colonIndex = header.indexOf(':');
                            if (colonIndex > 0) {
                                let headerName = header.substr(0, colonIndex).replace(/\s+$/, '');
                                let headerValue = header.length === colonIndex + 1 ? '' : header.substr(colonIndex + 1).replace(/^\s+/, '');
                                translations.setHeader(headerName, headerValue);
                            } else {
                                translations.setHeader(header, '');
                            }
                        });
                    } else {
                        translations.add(translation);
                    }
                }
                return translations;
            }
        }
    }
}
