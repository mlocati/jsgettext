import Translation from '../Translation';
import Translations from '../Translations';
import SortedDictionary from '../SortedDictionary';
import Charset from '../Charset';

export default class Mo {
    public littleEndian: boolean = true;
    private static concatenateBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
        let result = new Uint8Array(a.byteLength + b.byteLength);
        result.set(a, 0);
        result.set(b, a.byteLength);
        return result;
    }
    public translationsBytes(translations: Translations): Uint8Array {
        let headers: string[];
        {
            let previousCharset = translations.getCharset();
            let revertPreviousCharset = previousCharset.toUpperCase() !== 'UTF-8';
            try {
                if (revertPreviousCharset) {
                    translations.setCharset('UTF-8');
                }
                headers = translations.getHeaders();
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
        let messages = new SortedDictionary();
        if (headers.length > 0) {
            let header = new Translation('', '');
            header.setTranslation(headers.join('\n') + '\n');
            messages.set(header.id, header);
        }
        translations.getTranslations().forEach((translation: Translation): void => {
            if (translation.isTranslated()) {
                messages.set(translation.id, translation);
            }
        });
        let translationIds = messages.getKeys().sort();
        let originalsTable = new Uint8Array(0);
        let translationsTable = new Uint8Array(0);
        let originalsIndex: { relativeOffset: number, length: number }[] = [];
        let translationsIndex: { relativeOffset: number, length: number }[] = [];
        translationIds.forEach((messageId: string): void => {
            let translation: Translation = messages.get(messageId);
            let originalString: string;
            if (translation.context.length !== 0) {
                originalString = translation.context + '\x04' + translation.original;
            } else {
                originalString = translation.original;
            }
            if (translation.hasPlural) {
                originalString += '\x00' + translation.plural;
            }
            originalString += '\x00';
            let originalBytes = Charset.stringToUtf8Uint8Array(originalString);
            originalsIndex.push({
                relativeOffset: originalsTable.byteLength,
                length: originalBytes.byteLength - 1,
            })
            originalsTable = Mo.concatenateBytes(originalsTable, originalBytes);
            let translationString = translation.getTranslations().join('\x00') + '\x00';
            let translationBytes = Charset.stringToUtf8Uint8Array(translationString);
            translationsIndex.push({
                relativeOffset: translationsTable.byteLength,
                length: translationBytes.byteLength - 1,
            });
            translationsTable = Mo.concatenateBytes(translationsTable, translationBytes);
        });
        let numEntries = translationIds.length;
        // Offset of table with the original strings index: right after the header (which is 7 words)
        let originalsIndexOffset = 7 * 4;
        // Size of table with the original strings index
        let originalsIndexSize = numEntries * (4 + 4);
        // Offset of table with the translation strings index: right after the original strings index table
        let translationsIndexOffset = originalsIndexOffset + originalsIndexSize;
        // Size of table with the translation strings index
        let translationsIndexSize = numEntries * (4 + 4);
        // Hashing table starts after the header and after the index table
        let originalsStringsOffset = translationsIndexOffset + translationsIndexSize;
        // Translations start after the keys
        let translationsStringsOffset = originalsStringsOffset + originalsTable.byteLength;
        // Let's generate the .mo file binary data
        let moView = new DataView(new ArrayBuffer(
            4 //  Magic number
            + 4 // File format revision
            + 4 // Number of strings
            + 4 // Offset of table with original strings
            + 4 // Offset of table with translation strings
            + 4 // Size of hashing table
            + 4 // Offset of hashing table
            + 4 * 2 * originalsIndex.length// Original strings indexes
            + 4 * 2 * translationsIndex.length// Translation strings indexes
            + originalsTable.byteLength
            + translationsTable.byteLength
        ));
        let moOffset = 0;
        // Magic number
        moView.setUint32(moOffset, 0x950412de, this.littleEndian);
        moOffset += 4;
        // File format revision
        moView.setUint32(moOffset, 0, this.littleEndian);
        moOffset += 4;
        // Number of strings
        moView.setUint32(moOffset, numEntries, this.littleEndian);
        moOffset += 4;
        // Offset of table with original strings
        moView.setUint32(moOffset, originalsIndexOffset, this.littleEndian);
        moOffset += 4;
        // Offset of table with translation strings
        moView.setUint32(moOffset, translationsIndexOffset, this.littleEndian);
        moOffset += 4;
        // Size of hashing table: we don't use it.
        moView.setUint32(moOffset, 0, this.littleEndian);
        moOffset += 4;
        // Offset of hashing table: it would start right after the translations index table
        moView.setUint32(moOffset, translationsIndexOffset + translationsIndexSize, this.littleEndian);
        moOffset += 4;
        // Write the lengths & offsets of the original strings
        originalsIndex.forEach((index: { relativeOffset: number, length: number }): void => {
            moView.setUint32(moOffset, index.length, this.littleEndian);
            moOffset += 4;
            moView.setUint32(moOffset, originalsStringsOffset + index.relativeOffset, this.littleEndian);
            moOffset += 4;
        });
        // Write the lengths & offsets of the translated strings
        translationsIndex.forEach((index: { relativeOffset: number, length: number }): void => {
            moView.setUint32(moOffset, index.length, this.littleEndian);
            moOffset += 4;
            moView.setUint32(moOffset, translationsStringsOffset + index.relativeOffset, this.littleEndian);
            moOffset += 4;
        });
        let mo = new Uint8Array(moView.buffer);
        mo.set(originalsTable, moOffset);
        moOffset += originalsTable.byteLength;
        mo.set(translationsTable, moOffset);
        moOffset += translationsTable.byteLength;
        return mo;
    }
}
