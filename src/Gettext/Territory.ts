import { Gettext as GettextTD } from './TerritoryData';

export namespace Gettext {
    /**
     * Helper class to work with territories.
     */
    export class Territory extends GettextTD.TerritoryData {
        /**
         * Get the name of a territory given its id.
         *
         * @param territoryId The territory identifier
         */
        public static getName(territoryId: string): string {
            return (territoryId in GettextTD.TerritoryData.data) ? GettextTD.TerritoryData.data[territoryId] : '';
        }
    }
}
