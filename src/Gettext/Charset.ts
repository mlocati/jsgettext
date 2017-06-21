import * as encoding from 'text-encoding';

export namespace Gettext {
    /**
     * Helper class to work with strings.
     */
    export class Charset {
        private static _useNative: boolean;
        private static useNative(): boolean {
            if (Charset._useNative === undefined) {
                debugger;
                Charset._useNative = false;
                if (window !== undefined) {
                    let w = <any>window;
                    if (w.TextDecoder && w.TextDecoder.prototype && w.TextEncoder && w.TextEncoder.prototype) {
                        Charset._useNative = true;
                    }
                }
            }
            return Charset._useNative;
        }

        private static _decoders: { [id: string]: encoding.TextDecoder } = {};
        private static getDecoder(charset: string): encoding.TextDecoder {
            charset = charset ? charset.toLocaleLowerCase() : '';
            if (Charset._decoders.hasOwnProperty(charset) === false) {
                let ctor: encoding.TextDecoderStatic;
                if (Charset.useNative()) {
                    ctor = <encoding.TextDecoderStatic>(<any>window).TextDecoder;
                } else {
                    ctor = encoding.TextDecoder;
                }

                Charset._decoders[charset] = new ctor(charset, { fatal: true });
            }
            return Charset._decoders[charset];
        }

        private static _encoder: encoding.TextEncoder;
        private static getEncoder(): encoding.TextEncoder {
            if (Charset._encoder === undefined) {
                let ctor: encoding.TextEncoderStatic;
                if (Charset.useNative()) {
                    ctor = <encoding.TextEncoderStatic>(<any>window).TextEncoder;
                } else {
                    ctor = encoding.TextEncoder;
                }
                Charset._encoder = new ctor();
            }
            return Charset._encoder;
        }

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
            let decoder = Charset.getDecoder(charset);
            let bytes = new Uint8Array(buffer, byteOffset, numberOfBytes);
            return decoder.decode(bytes);
        }

        public static stringToUtf8Uint8Array(string: string): Uint8Array {
            let encoder = Charset.getEncoder();
            return encoder.encode(string);
        }

        public static stringToUtf8Blob(string: string, contentType: string): Blob {
            return new Blob([string], { type: contentType, endings: "transparent" });
        }
    }
}
