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
        /**
         * Get all the territory IDs.
        */
        public static getAllIds(): string[] {
            return Object.keys(GettextTD.TerritoryData.data.keys).sort();
        }

        /**
         * Get all the territories.
         */
        public static getAll(): { id: string, name: string }[] {
            let result: { id: string, name: string }[] = [];
            for (let languageId in GettextTD.TerritoryData.data) {
                result.push({ id: languageId, name: GettextTD.TerritoryData.data[languageId] });
            }
            result.sort((a, b): number => {
                let na = a.name.toLowerCase();
                let nb = b.name.toLowerCase();
                if (na < nb) {
                    return -1;
                }
                if (na > nb) {
                    return 1;
                }
                return 0;
            });
            return result;
        }
    }
}
