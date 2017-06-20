import _d from './data/script.json';
let data = <{ [id: string]: string }>_d;

export namespace Gettext {
    /**
     * Helper class to work with scripts.
     */
    export class Script {
        /**
         * Get the name of a script given its id.
         *
         * @param scriptId The script identifier
         */
        public static getName(scriptId: string): string {
            return (scriptId in data) ? data[scriptId] : '';
        }
    }
}
