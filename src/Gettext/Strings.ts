import * as encoding from "text-encoding";

export namespace Gettext {
    /**
     * Helper class to work with strings.
     */
    export class Strings {
        public static bufferToString(buffer: ArrayBuffer, charset: string, byteOffset?: number, numberOfBytes?: number): string {
            byteOffset = byteOffset || 0;
            if (numberOfBytes === undefined) {
                numberOfBytes = buffer.byteLength - byteOffset;
            }
            if (numberOfBytes === 0) {
                return '';
            }
            if (numberOfBytes < 0 || numberOfBytes + byteOffset >= buffer.byteLength) {
                throw new Error('Invalid number of bytes to convert to string');
            }
            charset = charset ? charset.toLocaleLowerCase() : '';
            let bytes = new Uint8Array(buffer, byteOffset, numberOfBytes);
            let decoder = new encoding.TextDecoder(charset, { fatal: true });
            return decoder.decode(bytes);
        }
    }
}
