import * as encoding from 'text-encoding';

export namespace Gettext {
    /**
     * Helper class to work with strings.
     */
    export class Charset {
        private static decoders: { [id: string]: encoding.TextDecoder } = {};
        private static encoder: encoding.TextEncoder;
        public static bufferToString(buffer: ArrayBuffer, charset: string, byteOffset?: number, numberOfBytes?: number): string {
            byteOffset = byteOffset || 0;
            if (numberOfBytes === undefined) {
                numberOfBytes = buffer.byteLength - byteOffset;
            }
            if (numberOfBytes === 0) {
                return '';
            }
            if (numberOfBytes < 0 || numberOfBytes + byteOffset > buffer.byteLength) {
                throw new Error('Invalid number of bytes to convert to string');
            }
            charset = charset ? charset.toLocaleLowerCase() : '';
            let bytes = new Uint8Array(buffer, byteOffset, numberOfBytes);

            if (!Charset.decoders.hasOwnProperty(charset)) {
                Charset.decoders[charset] = new encoding.TextDecoder(charset, { fatal: true });
            }
            let decoder: encoding.TextDecoder = Charset.decoders[charset];
            return decoder.decode(bytes);
        }
        public static stringToUtf8Uint8Array(string: string): Uint8Array {
            if (Charset.encoder === undefined) {
                Charset.encoder = new encoding.TextEncoder();
            }
            return Charset.encoder.encode(string);
        }
        public static stringToUtf8Blob(string: string, contentType: string): Blob {
            return new Blob([string], { type: contentType, endings: "transparent" });
        }
    }
}
