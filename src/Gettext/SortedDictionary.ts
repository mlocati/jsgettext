/**
 * A dictionary whose keys order is preserved.
 */
export default class SortedDictionary {
    /**
     * The actual dictionary values.
     */
    private dictionary: { [id: string]: any };

    /**
     * The sorted list of dictionary keys.
     */
    private list: string[];

    /**
     * Initialize the instance.
     */
    public constructor() {
        this.dictionary = {};
        this.list = [];
    }

    /**
     * Add or replace a value to the dictionary (if it already existed, the previous order is set).
     *
     * @param key The dictionary key
     * @param value The value to store
     */
    public set(key: string, value: any): void {
        let index = this.list.indexOf(key);
        if (index < 0) {
            this.list.push(key);
        }
        this.dictionary[key] = value;
    }

    /**
     * Check if the dictionary contains a key.
     *
     * @param key The key to be ckecked
     *
     * @returns boolean
     */
    public has(key: string): boolean {
        return this.list.indexOf(key) >= 0;
    }

    /**
     * Get the keys of all the values present in the dictionary.
     *
     * @returns string[]
     */
    public getKeys(): string[] {
        return this.list.slice();
    }

    /**
     * Remove a value given its key.
     *
     * @param key The key of the value to be removed
     */
    public remove(key: string): void {
        let index = this.list.indexOf(key);
        if (index >= 0) {
            this.list.splice(index, 1);
            delete this.dictionary[key];
        }
    }

    /**
     * Get a dictionary value given its key
     *
     * @param key The key of the dictionary value to be retrieved.
     *
     * @returns any|undefined
     */
    public get(key: string): any | undefined {
        let index = this.list.indexOf(key);
        if (index >= 0) {
            return this.dictionary[key];
        }
    }

    /**
     * Get all the dictionary contents.
     *
     * @returns {key: string, value: any}[]
     */
    public all(): { key: string, value: any }[] {
        let result: { key: string, value: any }[] = [];
        let dictionary = this.dictionary;
        this.list.forEach(function (key: string) {
            result.push({ key: key, value: dictionary[key] });
        });

        return result;
    }


    /**
     * Get all the dictionary contents.
     *
     * @returns any[]
     */
    public values(): any[] {
        let result: any[] = [];
        let dictionary = this.dictionary;
        this.list.forEach(function (key: string) {
            result.push(dictionary[key]);
        });

        return result;
    }

    /**
     * Clear the dictionary.
     */
    public clear(): void {
        this.dictionary = {}
        this.list = [];
    }

    /**
     * Check if this dictionary is empty.
     *
     * @returns bool
     */
    public isEmpty(): boolean {
        return this.list.length === 0;
    }

    /**
     * Create a clone of this dictionary.
     * Please remark that dictionary items are not cloned (until they are objects that implements the clone method).
     */
    public clone(): SortedDictionary {
        let me = this;
        let result = new SortedDictionary();
        result.list = me.list.slice(0);
        result.list.forEach((key) => {
            let item = me.dictionary[key];
            result.dictionary[key] = (item && item.clone && item.clone.apply && item.clone.call) ? item.clone() : item;
        })
        return result;
    }
}
