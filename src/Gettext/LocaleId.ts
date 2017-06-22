import Language from './Language';
import Script from './Script';
import Territory from './Territory';

/**
 * Represent a locale identifier
 */
export default class LocaleId {
    /**
     * The language identifier.
     */
    public readonly languageId: string;

    /**
     * The script identifier.
     */
    public readonly scriptId: string;

    /**
     * The territory identifier.
     */
    public readonly territoryId: string;

    /**
     * Initialize the instance.
     */
    public constructor(languageId: string, scriptId: string, territoryId: string) {
        this.languageId = languageId.toLowerCase();
        if (scriptId) {
            this.scriptId = scriptId[0].toUpperCase() + scriptId.slice(1).toLowerCase();
        } else {
            this.scriptId = '';
        }
        if (territoryId) {
            this.territoryId = territoryId.toUpperCase();
        } else {
            this.territoryId = '';
        }
    }

    /**
     * Parse a locale identifier string.
     *
     * @param identifier The string identifier to be parsed
     *
     * @returns LocaleId|null
     */
    public static parse(identifier: string): LocaleId | null {
        if (!identifier) {
            return null;
        }
        let matches = /^([a-z]{2,3})(?:[_\-]([a-z]{4}))?(?:[_\-]([a-z]{2}|[0-9]{3}))?(?:$|-)/i.exec(identifier);
        if (matches === null) {
            return null;
        }
        return new LocaleId(matches[1], matches[2], matches[3]);
    }

    /**
     * Get a string representation of this locale identifier.
     *
     * @return string
     */
    public toString(): string {
        let result: string[] = [this.languageId];
        if (this.scriptId.length > 0) {
            result.push(this.scriptId);
        }
        if (this.territoryId.length > 0) {
            result.push(this.territoryId);
        }
        return result.join('_');
    }
    /**
     * Get the locale display name (or an empty string if it's not available).
     * @returns string
     */
    public getName(): string {
        let addScript = false, addTerritory = false;
        let name = Language.getName(this.languageId + '-' + this.scriptId + '-' + this.territoryId);
        if (name.length === 0) {
            name = Language.getName(this.languageId + '-' + this.territoryId);
            if (name.length > 0) {
                addScript = true;
            } else {
                name = Language.getName(this.languageId + '-' + this.scriptId);
                if (name.length > 0) {
                    addTerritory = true;
                } else {
                    name = Language.getName(this.languageId);
                    if (name.length > 0) {
                        addScript = true;
                        addTerritory = true;
                    } else {
                        return this.toString();
                    }
                }
            }
        }
        if (addTerritory && this.territoryId.length > 0) {
            name += ' (' + (Territory.getName(this.territoryId) || this.territoryId) + ')';
        }
        if (addScript && this.scriptId.length > 0) {
            name += ' [' + (Script.getName(this.scriptId) || this.scriptId) + ']';
        }
        return name;
    }
}
