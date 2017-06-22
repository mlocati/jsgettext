import _d from './data/territory.json';
let data = <{ [id: string]: string }>_d;
import _d2 from './data/territories-for-language.json';
let dataForLanguage = <{ [id: string]: string[] }>_d2;

/**
 * Helper class to work with territories.
 */
export default class Territory {
    /**
     * Get the name of a territory given its id.
     *
     * @param territoryId The territory identifier
     */
    public static getName(territoryId: string): string {
        return (territoryId in data) ? data[territoryId] : '';
    }
    /**
     * Get all the territory IDs.
    */
    public static getAllIds(): string[] {
        return Object.keys(data.keys).sort();
    }

    /**
     * Get all the territories.
     */
    public static getAll(): { id: string, name: string }[] {
        let result: { id: string, name: string }[] = [];
        for (let languageId in data) {
            result.push({ id: languageId, name: data[languageId] });
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

    /**
     * Get the territories where a language is spoken.
     */
    public static getForLanguage(languageId: string): { id: string, name: string }[] {
        let result: { id: string, name: string }[] = [];
        if (dataForLanguage.hasOwnProperty(languageId)) {
            dataForLanguage[languageId].forEach((territoryId) => {
                let territoryName = Territory.getName(territoryId);
                if (territoryName.length !== 0) {
                    result.push({ id: territoryId, name: territoryName });
                }
            });
            result.sort((a, b) => {
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
        }
        return result;
    }
}
