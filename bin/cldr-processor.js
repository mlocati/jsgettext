#!/usr/bin/env node

'use strict';

function processTemplate(name, placeholders) {
    let fs = require('fs');
    let path = require('path');
    let relativeName = 'templates/' + name + '.ts';
    let template = fs.readFileSync(__dirname + '/' + relativeName, { encoding: 'utf8' });
    template = template.replace(/_____REMOVE_____/g, '');
    template = '// WARNING: this file has been generated from ' + path.basename(__dirname) + '/' + relativeName + ' - do not edit\n\n' + template;
    for (let placeholderName in placeholders) {
        let rx = new RegExp('\\/\\*{5}(.*?)<<' + placeholderName + '>>(.*?)\\*{5}\\/', 'g');
        template = template.replace(rx, '$1' + placeholders[placeholderName] + '$2');
    }
    fs.writeFileSync(__dirname + '/../src/Gettext/' + name + '.ts', template, { encoding: 'utf8' });
}

function createLanguages() {
    let languages = require('./cldr/languages.json').main['en-US'].localeDisplayNames.languages;
    let list = {};
    for (let languageId in languages) {
        if (languageId.indexOf('-alt-') < 0) {
            list[languageId] = languages[languageId];
        }
    }
    processTemplate('LanguageData', { CLDR_LANGUAGES: JSON.stringify(list) });
}

function createScripts() {
    let scripts = require('./cldr/scripts.json').main['en-US'].localeDisplayNames.scripts;
    let list = {};
    for (let scriptId in scripts) {
        if (scriptId.indexOf('-alt-') < 0) {
            list[scriptId] = scripts[scriptId];
        }
    }
    processTemplate('ScriptData', { CLDR_SCRIPTS: JSON.stringify(list) });
}

function createTerritories() {
    let territories = require('./cldr/territories.json').main['en-US'].localeDisplayNames.territories;
    let list = {};
    for (let territoryId in territories) {
        if (territoryId.indexOf('-alt-') < 0) {
            list[territoryId] = territories[territoryId];
        }
    }
    processTemplate('TerritoryData', { CLDR_TERRITORIES: JSON.stringify(list) });
}

function createPlurals() {
    let plurals = require('./cldr/plurals.json');
    let list = {};
    let pluralNameMap = {
        zero: 0,
        one: 1,
        two: 2,
        few: 3,
        many: 4,
        other: 5,
    }
    for (let localeId in plurals) {
        let plural = plurals[localeId];
        delete plural.name;
        delete plural.plurals;
        delete plural.supersededBy;
        plural.cases.forEach(function (pluralName, index) {
            if (!pluralNameMap.hasOwnProperty(pluralName)) {
                throw new RangeError('Unknown plural rule name: ' + pluralName);
            }
            plural.cases[index] = pluralNameMap[pluralName];
        });
        let examples = [/*zero*/ null, /*one*/ null, /*two*/ null, /*few*/ null, /*many*/ null, /*other*/]
        for (let pluralName in plural.examples) {
            if (!pluralNameMap.hasOwnProperty(pluralName)) {
                throw new RangeError('Unknown plural rule name: ' + pluralName);
            }
            examples[pluralNameMap[pluralName]] = plural.examples[pluralName];
        }
        plural.examples = examples;
        list[localeId] = plural;
    }
    processTemplate('PluralData', { CLDR_PLURALS: JSON.stringify(list) });
}
console.log('Parsing languages...');
createLanguages();
console.log('Parsing scripts...');
createScripts();
console.log('Parsing territories...');
createTerritories();
console.log('Parsing plurals...');
createPlurals();
