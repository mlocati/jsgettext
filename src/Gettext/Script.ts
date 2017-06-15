import { Gettext as GettextSD } from './ScriptData';

export namespace Gettext {
    /**
     * Helper class to work with scripts.
     */
    export class Script extends GettextSD.ScriptData {
        /**
         * Get the name of a script given its id.
         *
         * @param scriptId The script identifier
         */
        public static getName(scriptId: string): string {
            return (scriptId in GettextSD.ScriptData.data) ? GettextSD.ScriptData.data[scriptId] : '';
        }
    }
}
