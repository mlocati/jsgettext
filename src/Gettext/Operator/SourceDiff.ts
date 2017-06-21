import { Gettext as GettextO } from './Operator';
import { Gettext as GettextTS } from '../Translations';

export namespace Gettext {
    export namespace Operator {
        export class SourceDiff implements GettextO.Operator.Operator {
            /**
             * @see Gettext.Operator.Operator.name
             */
            public readonly name = 'Source diff';

            /**
             * @see Gettext.Operator.Operator.description
             */
            public readonly description = 'Get the source strings present in a translations set but not in other translation sets';

            /**
             * @see Gettext.Operator.Operator.minNumberOfOperands
             */
            public readonly minNumberOfOperands = 2;

            /**
             * @see Gettext.Operator.Operator.maxNumberOfOperands
             */
            public readonly maxNumberOfOperands = undefined;

            /**
             * @see Gettext.Operator.Operator.apply
             */
            public apply(translationsList: GettextTS.Translations[]): GettextTS.Translations {
                let result = (<GettextTS.Translations>translationsList.shift()).clone();
                let some = false;
                result.getTranslations().forEach((translation) => {
                    let found = false;
                    for (let i = 0; i < translationsList.length && found === false; i++) {
                        found = translationsList[i].hasTranslationId(translation.id);
                    }
                    if (found) {
                        result.removeTranslationById(translation.id);
                    } else {
                        some = true;
                    }
                });
                if (some === false) {
                    throw new Error('The first file does not contain translations that are not present in the other file(s)');
                }
                return result;
            }
        }
    }
}

