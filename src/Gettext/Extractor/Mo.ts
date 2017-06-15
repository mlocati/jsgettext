import { Gettext as GettextT } from '../Translation';
import { Gettext as GettextTS } from '../Translations';
import { Gettext as GettextC } from '../Charset';

export namespace Gettext {
    export namespace Extractor {
        /**
         * Extract translations from a gettext .mo file
         */
        export class Mo {
            private data: DataView;
            private littleEndian: boolean;
            private offset: number;
            private fileFormatVersion: number;
            private numberOfStrings: number;
            private originalsOffset: number;
            private originalsTable: number[];
            private translationsOffset: number;
            private translationsTable: number[];
            private hashTableSize: number;
            private hashTableOffset: number;
            private stringIndex: number;
            private charset: string;
            private constructor(data: DataView) {
                this.data = data;
                this.littleEndian = true;
                this.offset = 0;
                // magic number = 0x950412de
                let header = this.getUint32();
                if (header !== 0x950412de) {
                    if (header === 0xde120495) {
                        this.littleEndian = false;
                    } else {
                        throw new Error('Invalid .mo file');
                    }
                }
                // file format revision
                this.fileFormatVersion = this.getUint32();
                if (this.fileFormatVersion !== 0) {
                    throw new Error('Invalid .mo file');
                }
                // number of strings
                this.numberOfStrings = this.getUint32();
                // offset of table with original strings
                this.originalsOffset = this.getUint32();
                // offset of table with translation strings
                this.translationsOffset = this.getUint32();
                // size of hashing table
                this.hashTableSize = this.getUint32();
                // offset of hashing table
                this.hashTableOffset = this.getUint32();
                this.offset = this.originalsOffset;
                this.originalsTable = this.readUInt32Array(this.numberOfStrings * 2);
                this.translationsOffset = this.originalsOffset;
                this.translationsTable = this.readUInt32Array(this.numberOfStrings * 2);
                this.stringIndex = 0;
            }
            private getNextTranslation(): GettextT.Translation | string | null {
                if (this.stringIndex === this.numberOfStrings) {
                    return null;
                }
                let next = this.stringIndex * 2;
                this.offset = this.originalsTable[next + 1];
                let original = this.getString(this.originalsTable[next]);
                this.offset = this.translationsTable[next + 1];
                let translated = this.getString(this.translationsTable[next]);
                this.stringIndex++;
                if (original.length === 0) {
                    return translated;
                }

                let chunks: string[];
                chunks = original.split('\x04', 2);
                let context: string;
                if (chunks.length === 2) {
                    context = chunks[0];
                    original = chunks[1];
                } else {
                    context = '';
                }

                chunks = original.split('\x00', 2);
                let plural: string;
                if (chunks.length === 2) {
                    original = chunks[0];
                    plural = chunks[1];
                } else {
                    plural = '';
                }
                let translation = new GettextT.Translation(context, original, plural);
                if (translated.length > 0) {
                    if (plural.length === 0) {
                        translation.setTranslation(translated);
                    } else {
                        translation.setTranslations(translated.split('\x00'));
                    }
                }
                return translation;
            }
            private getUint32(): number {
                let result = this.data.getUint32(this.offset, this.littleEndian);
                this.offset += 4;
                return result;
            }
            private getString(length: number): string {
                let result = GettextC.Charset.bufferToString(this.data.buffer, this.charset, this.offset, length);
                this.offset += length;

                return result;
            }
            private readUInt32Array(size: number): number[] {
                let result: number[] = [];
                for (let i = 0; i < size; i++) {
                    result.push(this.getUint32());
                }
                return result;
            }

            public static getTranslationsFromBuffer(buffer: ArrayBuffer): GettextTS.Translations {
                let mo = new Mo(new DataView(buffer));
                mo.charset = GettextTS.Translations.DEFAULT_CHARSET;
                let translations = GettextTS.Translations.createEmpty()
                let translation: GettextT.Translation | string | null;
                while ((translation = mo.getNextTranslation()) !== null) {
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
                        let newCharset = translations.getCharset(true);
                        if (newCharset !== mo.charset) {
                            mo.charset = newCharset;
                        }
                    } else {
                        translations.add(translation);
                    }
                }
                return translations;
            }
        }
    }
}