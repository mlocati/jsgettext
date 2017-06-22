import PluralCase from './PluralCase';
import LocaleId from './LocaleId';

import _d from './data/plural.json';
let data = <{ [id: string]: { formula: string, cases: number[], examples: Array<string | null> } }>_d;

/**
 * Helper class to work with territories.
 */
export default class Plural {
    public readonly localeId: string;
    public readonly numPlurals: number;
    public readonly cases: PluralCase[];
    public readonly formula: string;
    public readonly examples: Array<string | null>;

    /**
     * The Plural instances
     */
    private static instances: { [id: string]: Plural } | undefined;

    /**
     * Get the Plural instances.
     * @returns {[id: string]: Plural}
     */
    private static getInstances(): { [id: string]: Plural } {
        if (Plural.instances !== undefined) {
            return Plural.instances;
        }
        let instances: { [id: string]: Plural } = {};
        for (let localeId in data) {
            let pluralData = data[localeId];
            instances[localeId] = new Plural(localeId, pluralData.cases, pluralData.formula, pluralData.examples);
        }
        Plural.instances = instances;
        return instances;
    }

    /**
     * Initialize the instance
     *
     * @param localeId The locale identifier
     * @param cases The list of plural cases
     * @param formula The formula discriminating the plural case
     * @param examples The examples for every plural case
     */
    private constructor(localeId: string, cases: PluralCase[], formula: string, examples: Array<string | null>) {
        this.localeId = localeId;
        this.numPlurals = cases.length;
        this.cases = cases;
        this.formula = formula;
        this.examples = examples;
    }

    /**
     * Get the value to be used in gettext files header.
     *
     * @return string
     */
    public getGettextHeaderValue(): string {
        return 'nplurals=' + this.numPlurals + '; plural=' + this.formula + ';';

    }

    /**
     * Search the plural definition for a specific locale.
     *
     * @param localeId The locale for which you want the definition
     *
     * @return Plural|null
     */
    public static search(localeId: LocaleId): Plural | null {
        if (!localeId) {
            return null;
        }
        let keys: string[] = [
            [localeId.languageId, localeId.scriptId, localeId.territoryId].join('-'),
            [localeId.languageId, localeId.territoryId].join('-'),
            [localeId.languageId, localeId.scriptId].join('-'),
            localeId.languageId,
        ];
        let instances = Plural.getInstances();
        for (let i = 0; i < keys.length; i++) {
            if (instances.hasOwnProperty(keys[i])) {
                return instances[keys[i]];
            }
        }
        return null;
    }
}
