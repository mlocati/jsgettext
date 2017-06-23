///<reference path="../node_modules/@types/jqueryui/index.d.ts" />

import Translations from './Gettext/Translations';
import ExtractorPartialError from './Gettext/Extractor/PartialLoadError';
import PoExtractor from './Gettext/Extractor/Po';
import MoExtractor from './Gettext/Extractor/Mo';
import PoGenerator from './Gettext/Generator/Po';
import MoGenerator from './Gettext/Generator/Mo';
import Charset from './Gettext/Charset';
import LocaleId from './Gettext/LocaleId';
import Language from './Gettext/Language';
import Territory from './Gettext/Territory';
import Plural from './Gettext/Plural';
import OperatorArgumentType from './Gettext/Operator/ArgumentType';
import Operator from './Gettext/Operator/Operator';
import MultipleOperator from './Gettext/Operator/Multiple';
import SourceDiffOperator from './Gettext/Operator/Multiple/SourceDiff';
import SingleOperator from './Gettext/Operator/Single';
import ToPotOperator from './Gettext/Operator/Single/ToPot';
import ToPoOperator from './Gettext/Operator/Single/ToPo';
import FuzzyOperator from './Gettext/Operator/Single/Fuzzy';

import * as $ from 'jquery';
(<any>window).jQuery = $;
import 'bootstrap/js/tooltip.js';
import 'bootstrap/js/collapse.js';
import 'bootstrap/js/dropdown.js';
import 'bootstrap/js/tab.js';
import 'jquery-ui/draggable';
import 'jquery-ui/droppable';
import 'jquery-ui/dialog';
import * as FileSaver from 'file-saver';
$(() => {

    $('[data-toggle="tooltip"]').tooltip({
        container: 'body',
    });

    abstract class BaseView {
        protected readonly $div: JQuery;
        constructor($div: JQuery) {
            $('#main').append(this.$div = $div);
            $div.addClass('base-view')
            this.$div
                .on('dragstop', () => {
                    this.absolutizePosition();
                })
                .draggable({
                    containment: 'parent',
                    handle: '.panel-heading',
                })
                .on('click mousedown', () => {
                    $('div.base-view').removeClass('current');
                    this.$div.addClass('current');
                })
                ;
        }
        protected absolutizePosition(offset?: JQueryCoordinates): void {
            if (!offset) {
                offset = this.$div.offset();
            }
            this.$div.css({ position: 'absolute', left: offset.left + 'px', top: offset.top + 'px' });
        }
        private initializeTooltip(): void {
            this.$div.find('[data-toggle="tooltip"]').tooltip({
                container: 'body',
            });
        }
        protected setTooltip(): void {
            this.initializeTooltip();
            this.$div
                .on('dragstart', () => {
                    this.$div.find('[data-toggle="tooltip"]').tooltip('destroy');
                })
                .on('dragstop', () => {
                    this.initializeTooltip();
                });
        }
        protected destroy(): void {
            this.$div.find('[data-toggle="tooltip"]').tooltip('destroy');
            this.$div.fadeOut('fast', () => this.$div.remove());
        }
    }

    function buildUniqueFilename(original: string, wantedBase: string, wantedExtension: string): string {
        let originalBase = '';
        let originalExtension = '';
        if (original) {
            let m = /^(.*)\.(\w+)$/.exec(original);
            if (m === null) {
                originalBase = original;
            } else {
                originalBase = m[1];
                originalExtension = m[2];
                originalExtension = originalExtension.toLowerCase();
            }
            originalBase = originalBase.replace(/^\s+|[\s\.]+$/g, '');
            m = /^(.*\S)\s+\(\d+\)/.exec(originalBase);
            if (m !== null) {
                originalBase = m[1];
            }
        }
        let base = wantedBase ? wantedBase : (originalBase ? originalBase : 'file');
        let extension = wantedExtension ? wantedExtension : (originalExtension ? originalExtension : 'po');
        let allNames: string[] = [];
        TranslationsView.getAll().forEach((tv: TranslationsView) => {
            allNames.push(tv.name.toLowerCase());
        });
        for (let i = 0; ; i++) {
            let result = base;
            if (i > 0) {
                result += ' (' + i.toString() + ')';
            }
            if (extension) {
                result += '.' + extension;
            }
            if (allNames.indexOf(result.toLowerCase()) < 0) {
                return result;
            }
        }
    }

    function pickLocaleId(callback: (localeId: LocaleId) => boolean, title?: string): void {
        let $languages = $('<select class="form-control" />').append('<option value="" selected="selected">Please select</option>');
        Language.getAll(true).forEach((l) => {
            $languages.append($('<option />').val(l.id).text(l.name));

        });
        let $territories = $('<select class="form-control" />');
        $languages.on('change', () => {
            let currentLanguage = $languages.val() || '';
            let currentTerritory = $territories.val() || '';
            let all = Territory.getAll();
            let preferred = Territory.getForLanguage(currentLanguage);
            $territories.empty().append('<option value="">-- none --</option>');
            if (preferred.length === 0 || preferred.length === all.length) {
                all.forEach((t) => {
                    $territories.append($('<option />').val(t.id).text(t.name));
                });
            } else {
                let $group: JQuery;
                $territories.append($group = $('<optgroup label="Suggested Territories" />'));
                preferred.forEach((t) => {
                    $territories.append($('<option />').val(t.id).text(t.name));
                });
                $territories.append($group = $('<optgroup label="Other Territories" />'));
                all.forEach((t) => {
                    let already = false;
                    preferred.forEach((p) => {
                        if (t.id === p.id) {
                            already = true;
                        }
                    });
                    if (already === false) {
                        $territories.append($('<option />').val(t.id).text(t.name));
                    }
                });
            }
            $territories.val(currentTerritory);
        }).trigger('change');
        Territory.getAll().forEach((t) => {
            $territories.append($('<option />').val(t.id).text(t.name));
        });
        let $div = $('<form />')
            .append($('<div class="form-group" />')
                .append('<label>Language</label>')
                .append($languages)
            )
            .append($('<div class="form-group" />')
                .append('<label>Territory</label>')
                .append($territories)
            )
            ;
        $(document.body).append($div);
        $div.dialog({
            title: title || 'Choose language',
            modal: true,
            resizable: false,
            width: 400,
            buttons: [
                {
                    text: 'Cancel',
                    click: () => {
                        $div.dialog('close');
                    }
                },
                {
                    text: 'OK',
                    click: () => {
                        let languageId = $languages.val();
                        if (!languageId) {
                            $languages.focus();
                            return;
                        }
                        let territoryId = $territories.val();
                        let localeId = new LocaleId(languageId, '', territoryId);
                        if (callback(localeId)) {
                            $div.dialog('close');
                        }
                    }
                }
            ],
            close: () => {
                $div.remove();
            }
        });
    }

    function pickListValue(values: any[], callback: (value: any) => boolean, title?: string): void {
        let $list = $('<ul class="list-unstyled" />')
        let $div = $('<div />').append($list);
        values.forEach((value, index) => {
            let $button = $('<button class="btn btn-primary" style="width: 100%" />')
                .on('click', (e: JQueryEventObject) => {
                    e.preventDefault();
                    if (callback(value)) {
                        $div.dialog('close');
                    }
                });
            if (value === undefined) {
                $button.text('<undefined>');
            } else if (value === null) {
                $button.text('<null>');
            } else {
                $button.text(value.toString());
            }
            let $li = $('<li />').append($button);
            if (index > 0) {
                $li.css('margin-top', '5px');
            }
            $list.append($li);
        });
        $(document.body).append($div);
        $div.dialog({
            title: title || 'Choose a value',
            modal: true,
            resizable: false,
            width: 400,
            buttons: [
                {
                    text: 'Cancel',
                    click: () => {
                        $div.dialog('close');
                    }
                }
            ],
            open: () => {
                $div.closest('.ui-dialog').find('.ui-dialog-buttonset button').focus();
            },
            close: () => {
                $div.remove();
            }
        });
    }

    function configureOperator(operator: Operator, callback: (error?: Error) => void): void {
        let values: { [id: string]: any } = {};
        let keys = Object.keys(operator.configuration);
        let keyIndex = 0;
        function nextKey(): void {
            if (keyIndex === keys.length) {
                setTimeout(
                    () => {
                        let error: Error | undefined = undefined;
                        try {
                            operator.configure(values);
                        } catch (e) {
                            error = e;
                        }
                        callback(error);
                    },
                    0
                );
                return;
            }
            let configurationKey = keys[keyIndex++];
            switch (operator.configuration[configurationKey].type) {
                case OperatorArgumentType.Locale:
                    pickLocaleId(
                        (localeId) => {
                            values[configurationKey] = localeId;
                            nextKey();
                            return true;
                        },
                        operator.configuration[configurationKey].name
                    );
                    break;
                case OperatorArgumentType.LocaleWithPossiblyPlurals:
                    pickLocaleId(
                        (localeId) => {
                            let plural = Plural.search(localeId);
                            if (plural === null) {
                                if (window.confirm('Unable to find the plural rules for ' + localeId.getName() + '.\nProceed anyway?') === false) {
                                    return false;
                                }
                            }
                            values[configurationKey] = localeId;
                            nextKey();
                            return true;
                        },
                        operator.configuration[configurationKey].name
                    );
                    break;
                case OperatorArgumentType.ValueFromList:
                    pickListValue(
                        operator.configuration[configurationKey].data,
                        (value) => {
                            values[configurationKey] = value;
                            nextKey();
                            return true;
                        },
                        operator.configuration[configurationKey].name
                    );
                    break;
                default:
                    callback(new Error('Unknown configuration key type: ' + operator.configuration[configurationKey]))
                    return;
            }
        }
        nextKey();
    }

    class TranslationsView extends BaseView {
        public name: string;
        public readonly translations: Translations;
        private $contents: JQuery;
        private $info: JQuery;
        private positionBeforeDrag: JQueryCoordinates;
        constructor(name: string, translations: Translations) {
            super($('<div class="translations-view panel panel-primary" />'));
            this.name = name;
            this.translations = translations;
            let $operators: JQuery;
            this.$div
                .data('TranslationsView', this)
                .append($('<div class="panel-heading" />')
                    .append($('<div class="base-view-close" />')
                        .append($('<button class="btn btn-xs btn-danger"><i class="fa fa-times" aria-hidden="true"></i></button')
                            .on('click', (e: JQueryEventObject) => {
                                e.preventDefault();
                                this.destroy();
                            })
                        )
                    )
                    .append($('<div class="base-view-name" title="Double-click to rename" />')
                        .text(this.name)
                        .on('dblclick', () => {
                            this.startRename();
                        })
                    )
                )
                .append($('<div class="panel-body" />')
                    .append($('<button class="btn btn-xs btn-info" data-toggle="tooltip" data-placement="bottom" title="View .po"><i class="fa fa-eye"></i></button>')
                        .on('click', (e: JQueryEventObject) => {
                            e.preventDefault();
                            this.showContents();
                        })
                    )
                    .append($('<button class="btn btn-xs btn-info" data-toggle="tooltip" data-placement="bottom" title="Show info"><i class="fa fa-info-circle"></i></button>')
                        .on('click', (e: JQueryEventObject) => {
                            e.preventDefault();
                            this.showInfo();
                        })
                    )
                    .append($('<div class="btn-group" />')
                        .append($('<button type="button" class="btn btn-xs btn-info dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"><i class="fa fa-cog" data-toggle="tooltip" data-placement="bottom" title="Tools"></i> <span class="caret"></span></button>'))
                        .append($operators = $('<ul class="dropdown-menu" />'))
                    )
                    .append($('<div class="btn-group" />')
                        .append($('<button type="button" class="btn btn-xs btn-info dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"><i class="fa fa-download" data-toggle="tooltip" data-placement="bottom" title="Download"></i> <span class="caret"></span></button>'))
                        .append($('<ul class="dropdown-menu" />')
                            .append($('<li />')
                                .append($('<a href="#">Download .' + (/\.pot/i.test(this.name) ? 'pot' : 'po') + '</a>')
                                    .on('click', (e: JQueryEventObject) => {
                                        e.preventDefault();
                                        this.downloadAsPo();
                                    })
                                )
                            )
                            .append($('<li />')
                                .append($('<a href="#">Download .mo</a>')
                                    .on('click', (e: JQueryEventObject) => {
                                        e.preventDefault();
                                        this.downloadAsMo();
                                    })
                                )
                            )
                        )
                    )
                )
                .on('dragstart', () => {
                    this.positionBeforeDrag = this.$div.offset();
                })
                ;
            [
                new ToPotOperator(),
                new ToPoOperator(),
                new FuzzyOperator(),
            ].forEach((operator) => {
                $operators.append($('<li />')
                    .tooltip({
                        container: 'body',
                        placement: 'right',
                        title: operator.description,
                    })
                    .append($('<a href="#" />')
                        .text(operator.name)
                        .on('click', (e: JQueryEventObject) => {
                            e.preventDefault();
                            setTimeout(
                                () => {
                                    this.applyOperator(
                                        operator,
                                        (error) => {
                                            window.alert(error.message || error.toString());
                                        }
                                    );
                                },
                                0
                            );
                        })
                    )
                );
            });
            this.setTooltip();
        }
        protected destroy(): void {
            if (this.$contents !== undefined) {
                this.$contents.dialog('close');
            }
            if (this.$info !== undefined) {
                this.$info.dialog('close');
            }
            super.destroy();
        }
        private applyOperator(operator: SingleOperator, onError: (error: Error) => void) {
            configureOperator(
                operator,
                (error?: Error): void => {
                    if (error !== undefined) {
                        onError(error);
                        return;
                    }
                    try {
                        let translations = operator.apply(this.translations);
                        let name = buildUniqueFilename(this.name, '', operator.outputFileExtension);
                        new TranslationsView(name, translations);
                    } catch (e) {
                        onError(e);
                    }
                }
            );
        }
        public static getAll(): TranslationsView[] {
            let result: TranslationsView[] = [];
            $('.translations-view').each(function () {
                let tv = $(arguments[1]).data('TranslationsView');
                if (tv instanceof TranslationsView) {
                    result.push(tv);
                }
            });

            return result;
        }
        public hide(): void {
            this.$div.hide();
        }
        public restore(position?: JQueryCoordinates) {
            this.absolutizePosition(position || this.positionBeforeDrag);
            this.$div.show();
        }
        public showContents(): void {
            if (this.$contents !== undefined) {
                this.$contents.dialog('moveToTop');
                return;
            }
            let gp = new PoGenerator();
            this.$contents = $('<div />')
                .append($('<textarea class="translations-contents" readonly="readonly" />').val(gp.translationsToString(this.translations)))
                .on('dialogresize', () => {
                    this.$contents.closest('.ui-dialog').find('.ui-dialog-content').css('width', '100%');
                    this.$contents.find('textarea').height(this.$contents.height() - 20);
                })
            $('#main').append(this.$contents);
            this.$contents.dialog({
                buttons: [
                    {
                        text: 'Close',
                        click: () => {
                            this.$contents.dialog('close');
                        }
                    }
                ],
                title: 'Contents of ' + this.name,
                open: (): void => {
                    setTimeout(() => {
                        this.$contents.trigger('dialogresize');
                    }, 10);
                    this.$contents.find('textarea').scrollTop(0);
                },
                width: Math.min(Math.max($(window).width() * .75, 200), 600),
                height: Math.min(Math.max($(window).height() * .75, 200), 400),
                close: (): void => {
                    this.$contents.remove();
                    delete this.$contents;
                },
            });
        }
        public showInfo(): void {
            if (this.$info !== undefined) {
                this.$info.dialog('moveToTop');
                return;
            }
            let stats = this.translations.getStats();
            let $headers : JQuery;
            let id = (new Date()).getTime().toString() + '_' + Math.round(Math.random() * 1000).toString();
            this.$info = $('<div />')
                .append($('<ul class="nav nav-tabs" role="tablist" />')
                    .append($('<li role="presentation" class="active"><a href="#stats-tab-totals_' + id + '" aria-controls="home" role="tab" data-toggle="tab">Totals</a></li>'))
                    .append($('<li role="presentation"><a href="#stats-tab-localization_' + id + '" aria-controls="profile" role="tab" data-toggle="tab">Localization</a></li>'))
                    .append($('<li role="presentation"><a href="#stats-tab-headers_' + id + '" aria-controls="settings" role="tab" data-toggle="tab">Headers</a></li>'))
                )
                .append($('<div class="tab-content" />')
                    .append($('<div role="tabpanel" class="tab-pane active" id="stats-tab-totals_' + id + '" />')
                        .append($('<table class="table table-bordered table-striped stats-table" />')
                            .append($('<tbody />')
                                .append($('<tr><th>Total number of strings</th><td class="text-right">' + stats.totalStrings.toLocaleString() + '</td></tr>'))
                                .append($('<tr class="stats-section"><th>Translated strings</th><td class="text-right">' + stats.translated.toLocaleString() + '</td></tr>'))
                                .append($('<tr><th>Partially translated plural strings</th><td class="text-right">' + stats.partiallyTranslated.toLocaleString() + '</td></tr>'))
                                .append($('<tr><th>Untranslated strings</th><td class="text-right">' + stats.untranslated.toLocaleString() + '</td></tr>'))
                                .append($('<tr class="stats-section"><th>Fuzzy strings</th><td class="text-right">' + stats.fuzzyTranslations.toLocaleString() + '</td></tr>'))
                                .append($('<tr><th>Not fuzzy strings</th><td class="text-right">' + (stats.totalStrings - stats.fuzzyTranslations).toLocaleString() + '</td></tr>'))
                                .append($('<tr class="stats-section"><th>Plural strings</th><td class="text-right">' + stats.pluralStrings.toLocaleString() + '</td></tr>'))
                                .append($('<tr><th>Singular strings</th><td class="text-right">' + (stats.totalStrings - stats.pluralStrings).toLocaleString() + '</td></tr>'))
                            )
                        )
                    )
                    .append($('<div role="tabpanel" class="tab-pane" id="stats-tab-localization_' + id + '" />')
                        .append($('<table class="table table-bordered table-striped stats-table" />')
                            .append($('<tbody />')
                                .append($('<tr><th>Character set</th>')
                                    .append($('<td />')
                                        .append(
                                            stats.charset ?
                                            $('<span />').text(stats.charset) :
                                            '<i>unavailable</i>'
                                        )
                                    )
                                )
                                .append($('<tr><th>Language</th>')
                                    .append($('<td />')
                                        .append(
                                            stats.language ?
                                            $('<span />').text(stats.language) :
                                            '<i>unavailable</i>'
                                        )
                                    )
                                )
                                .append($('<tr><th>Plural cases</th>' + (stats.numPlurals === null ? '<td><i>unavailable</i></td>' : '<td>' + stats.numPlurals.toLocaleString() + '</td>') + '</tr>'))
                                .append($('<tr><th>Plural formula</th>')
                                    .append($('<td />').text(stats.pluralsFormula))
                                )
                            )
                        )
                    )
                    .append($headers = $('<div role="tabpanel" class="tab-pane" id="stats-tab-headers_' + id + '" />'))
                )
                ;
            let headers = this.translations.getHeadersDictionary();
            if (headers.length === 0) {
                $headers.html('<div>No header found</div>');
            } else {
                let $tbody: JQuery;
                $headers.append($('<table class="table table-bordered table-striped stats-table" />')
                    .append($tbody = $('<tbody />'))
                );
                headers.forEach((h) => {
                    $tbody.append($('<tr />')
                        .append($('<th />').text(h.key))
                        .append($('<td />').text(h.value))
                    );
                })
            }
            $(this.$info.find('[data-toggle="tab"]').get().reverse()).tab('show');
            $('#main').append(this.$info);
            this.$info.dialog({
                buttons: [
                    {
                        text: 'Close',
                        click: () => {
                            this.$info.dialog('close');
                        }
                    }
                ],
                title: 'Info about ' + this.name,
                open: () => {
                    this.$info.closest('.ui-dialog').find('.ui-dialog-buttonset button').focus();
                },
                width: Math.min(Math.max($(window).width() * .75, 200), 500),
                height: Math.min(Math.max($(window).height() * .75, 200), 580),
                close: (): void => {
                    this.$info.remove();
                    delete this.$info;
                },
            });
        }
        public downloadAsPo(): void {
            let gp = new PoGenerator();
            let po = gp.translationsToString(this.translations, true);
            let blob = Charset.stringToUtf8Blob(po, 'text/x-po; charset=utf-8');
            let name = this.name;
            if (!/\.pot?/i.test(name)) {
                let match = /^(.+)\.\w+/.exec(name);
                name = (match === null) ? name + '.po' : match[1] + '.po';
            }
            FileSaver.saveAs(blob, name, true);
        }
        public downloadAsMo(): void {
            let gm = new MoGenerator();
            let mo = gm.translationsBytes(this.translations);
            let blob = new Blob([mo], { type: 'application/octet-stream' });
            let match = /^(.+)\.\w+$/.exec(this.name);
            let name = (match === null ? this.name : match[1]) + '.mo';
            FileSaver.saveAs(blob, name, true);
        }
        public startRename(): void {
            let match = /^(.+)(\.\w+)/.exec(this.name);
            let base = match === null ? this.name : match[1];
            let extension = match === null ? '' : match[2];
            let $name: JQuery;
            this.$div.find('.base-view-name')
                .width(this.$div.find('.base-view-name').width())
                .empty()
                .append($name = $('<input type="text" class="form-control" style="width: 100%" />')
                    .data('extension', extension)
                    .val(base)
                    .on('keydown', (e: JQueryEventObject) => {
                        switch (e.which) {
                            case 27: // Esc
                                $name.off('blur');
                                this.$div.find('.base-view-name').css('width', 'auto').empty().text(this.name);
                                break;
                            case 13:
                                let newName = $.trim($name.val()).replace(/\.+$/, '');
                                if (newName.length === 0) {
                                    $name.val('').focus();
                                    return;
                                }
                                $name.off('blur');
                                this.name = newName + $name.data('extension');
                                this.$div.find('.base-view-name').css('width', 'auto').empty().text(this.name);
                                break;
                        }
                    })
                    .on('blur', () => {
                        let newName = $.trim($name.val()).replace(/\.+$/, '');
                        if (newName.length !== 0) {
                            this.name = newName + $name.data('extension');
                        }
                        this.$div.find('.base-view-name').css('width', 'auto').empty().text(this.name);
                    })
                )
                ;
            setTimeout(() => {
                $name.select();
                $name.focus();
            }, 10);
        }
    }

    class TranslationsViewInOperator {
        private readonly translationsView: TranslationsView;
        public readonly name: string;
        public readonly translations: Translations
        public readonly $div: JQuery;
        public constructor(translationsView: TranslationsView, $parent: JQuery) {
            this.name = translationsView.name;
            this.translationsView = translationsView;
            this.translations = translationsView.translations;
            this.$div = $('<div class="translations-view-in-operator" />')
                .text(this.translationsView.name)
                .data('TranslationsViewInOperator', this)
                .draggable({
                    containment: $('#main'),
                })
                .append($('<button class="btn btn-xs btn-info" data-toggle="tooltip" title="View .po"><i class="fa fa-eye"></i></button>')
                    .on('click', (e: JQueryEventObject) => {
                        e.preventDefault();
                        this.translationsView.showContents();
                    })
                )
                ;
            $parent.append(this.$div);
            translationsView.hide();
        }
        public moveTo($newDropZone: JQuery): void {
            $newDropZone.append(this.$div);
            this.$div.css({ left: 0, top: 0 });
        }
        public destroy($positioner?: JQuery): void {
            this.translationsView.restore($positioner ? $positioner.offset() : undefined);
            this.$div.remove();
        }
    }

    class OperatorView extends BaseView {
        private operator: MultipleOperator;
        constructor(operator: MultipleOperator) {
            super($('<div class="operator-view panel panel-info" />'));
            this.operator = operator;
            this.$div
                .data('OperatorView', this)
                .append($('<div class="panel-heading" />')
                    .append($('<div class="base-view-close" />')
                        .append($('<button class="btn btn-xs btn-danger"><i class="fa fa-times" aria-hidden="true"></i></button')
                            .on('click', (e: JQueryEventObject) => {
                                e.preventDefault();
                                this.getArguments().forEach(function (tvio) {
                                    tvio.destroy();
                                });
                                this.destroy();
                            })
                        )
                    )
                    .append($('<div class="base-view-name" />')
                        .text(operator.name)
                    )
                )
                .append($('<div class="panel-body drop-zones" />'))
                .append($('<div class="panel-footer" />')
                    .append($('<button class="btn btn-success pull-right">Process</button>')
                        .on('click', (e: JQueryEventObject) => {
                            e.preventDefault();
                            setTimeout(
                                () => {
                                    this.applyOperator(
                                        (error) => {
                                            window.alert(error.message || error.toString());
                                        }
                                    );
                                },
                                0
                            );
                        })
                    )
                    .append($('<span style="white-space: pre-wrap" />')
                        .text(operator.description)
                    )
                )
                ;
            this.setTooltip();
            this.refreshDropZones();
        }
        private getArguments(): TranslationsViewInOperator[] {
            let result: TranslationsViewInOperator[] = [];
            this.$div.find('.translations-view-in-operator').each(function () {
                result.push($(arguments[1]).data('TranslationsViewInOperator'));
            });
            return result;
        }
        public refreshDropZones(): void {
            let numDropZones: number;
            if (this.operator.maxNumberOfOperands === undefined) {
                let translations = this.getArguments();
                numDropZones = Math.max(this.operator.minNumberOfOperands, translations.length + 1);
            } else {
                numDropZones = this.operator.maxNumberOfOperands;
            }
            for (let i = this.$div.find('.drop-zones').find('.operator-dropzone').length; i < numDropZones; i++) {
                this.createDropZone();
            }
        }
        private createDropZone(): void {
            let $dropZone = $('<div class="operator-dropzone" />');
            this.$div.find('.drop-zones').append($dropZone);
            $dropZone
                .droppable({
                    accept: '.translations-view,.translations-view-in-operator',
                    greedy: true,
                    tolerance: "pointer",
                })
                .on('drop', (e: JQueryEventObject, ui: JQueryUI.DroppableEventUIParam) => {
                    if (!ui || !ui.draggable) {
                        return;
                    }
                    e.stopPropagation();
                    e.cancelBubble = true;
                    this.absolutizePosition();
                    let currentTranslationsViewInOperator = $dropZone.find('>.translations-view-in-operator').data('TranslationsViewInOperator');
                    let tv = ui.draggable.data('TranslationsView');
                    if (tv instanceof TranslationsView) {
                        if (currentTranslationsViewInOperator instanceof TranslationsViewInOperator) {
                            currentTranslationsViewInOperator.destroy();
                        }
                        new TranslationsViewInOperator(tv, $dropZone);
                    } else {
                        tv = ui.draggable.data('TranslationsViewInOperator');
                        if (tv instanceof TranslationsViewInOperator) {
                            if (currentTranslationsViewInOperator instanceof TranslationsViewInOperator) {
                                currentTranslationsViewInOperator.moveTo(tv.$div.parent());
                            }
                            tv.moveTo($dropZone);
                        }
                    }
                    this.refreshDropZones();
                })
                ;
        }
        private applyOperator(onError: (error: Error) => void): void {
            let views = this.getArguments();
            if (views.length < this.operator.minNumberOfOperands) {
                let error: Error;
                if (this.operator.minNumberOfOperands === this.operator.maxNumberOfOperands) {
                    error = new RangeError('Please specify ' + this.operator.minNumberOfOperands.toString() + ' files.');
                } else {
                    error = new RangeError('Please specify at least ' + this.operator.minNumberOfOperands.toString() + ' files.');
                }
                onError(error);
                return;
            }
            if (this.operator.maxNumberOfOperands !== undefined && views.length > this.operator.maxNumberOfOperands) {
                onError(new RangeError('Please specify up to ' + this.operator.minNumberOfOperands.toString() + ' files.'));
                return;
            }
            configureOperator(
                this.operator,
                (error) => {
                    if (error !== undefined) {
                        onError(error);
                        return;
                    }
                    let name = buildUniqueFilename(views.length === 0 ? 'result.po' : views[0].name, '', this.operator.outputFileExtension);
                    let args: Translations[] = [];
                    views.forEach((t) => {
                        args.push(t.translations);
                    });
                    try {
                        let result = this.operator.apply(args);
                        new TranslationsView(name, result);
                    } catch (e) {
                        onError(e);
                    }
                }
            );
        }
    }

    function loadFile(file: File): void {
        let name = file.name;
        try {
            let loader: (arrayBuffer: ArrayBuffer) => Translations;
            if (/\.pot?$/i.test(name)) {
                loader = PoExtractor.getTranslationsFromBuffer;
            } else if (/\.mo$/i.test(name)) {
                loader = MoExtractor.getTranslationsFromBuffer;
            } else {
                throw new Error('Unrecognized file type');
            }
            let fileReader = new FileReader();
            fileReader.onload = function () {
                try {
                    let arrayBuffer = this.result;
                    let translations: Translations | undefined = undefined;
                    try {
                        translations = loader(arrayBuffer);
                    } catch (e) {
                        if (e instanceof ExtractorPartialError) {
                            if (window.confirm('Error parsing ' + name + ':\n' + e.message + '\n\nLoad the file anyway?')) {
                                translations = e.translations;
                            }
                        } else {
                            throw e;
                        }
                    }
                    if (translations !== undefined) {
                        new TranslationsView(name, translations);
                    }
                } catch (e) {
                    window.alert('Error parsing ' + name + ':\n' + (e.message || e.toString()));
                }
            };
            fileReader.readAsArrayBuffer(file);
        } catch (e) {
            window.alert('Error loading ' + name + ':\n' + (e.message || e.toString()));
        }
    }


    (() => {
        var $filePicker: JQuery;
        $('#upload-file').on('click', (e: JQueryEventObject) => {
            e.preventDefault();
            setTimeout(
                () => {
                    if ($filePicker) {
                        $filePicker.remove();
                    }
                    $(document.body).append($filePicker = $('<input type="file" id="file-picker" multiple="multiple" />'));
                    $filePicker.on('change', () => {
                        var input = <HTMLInputElement>$filePicker[0];
                        if (input.files) {
                            for (let i = 0; i < input.files.length; i++) {
                                loadFile(input.files[i]);
                            }
                        }
                    });
                    $filePicker.click();
                },
                0
            );
        });
    })();
    $('#paste-po').on('click', (e: JQueryEventObject) => {
        e.preventDefault();
        let $dialog = $('<div />')
            .append($('<textarea class="translations-contents" />'))
            .on('dialogresize', () => {
                $dialog.find('textarea').height($dialog.height() - 20);
            });
        let $textarea = $dialog.find('textarea');
        $('#main').append($dialog);
        $dialog.dialog({
            buttons: [
                {
                    text: 'Cancel',
                    click: () => {
                        $dialog.dialog('close');
                    }
                },
                {
                    text: 'Parse',
                    click: () => {
                        let translations: Translations;
                        try {
                            translations = PoExtractor.getTranslationsFromString($textarea.val());
                        }
                        catch (e) {
                            window.alert(e.message || e.toString());
                            $textarea.focus();
                            return;
                        }
                        new TranslationsView('pasted.po', translations);
                        $dialog.dialog('close');
                    }
                }
            ],
            title: 'Paste a .po file contents',
            open: (): void => {
                setTimeout(() => {
                    $dialog.trigger('dialogresize');
                }, 10);
                $textarea.focus();
            },
            width: 450,
            height: 300,
            close: (): void => {
                $dialog.remove();
            },
        });
    });

    (() => {
        let $operators = $('#operators');
        [
            new SourceDiffOperator(),
        ].forEach((operator: MultipleOperator) => {
            $operators.append($('<li />')
                .tooltip({
                    container: 'body',
                    placement: 'right',
                    title: operator.description,
                })
                .append($('<a href="#" />')
                    .text(operator.name)
                    .on('click', (e: JQueryEventObject) => {
                        e.preventDefault();
                        new OperatorView(operator);
                    })
                )
            );
        });
    })();

    $('#main')
        .droppable({
            accept: '.translations-view-in-operator'
        })
        .on('drop', (e: JQueryEventObject, ui: JQueryUI.DroppableEventUIParam) => {
            if (!ui || !ui.draggable) {
                return;
            }
            let translationsViewInOperator = ui.draggable.data('TranslationsViewInOperator');
            if (translationsViewInOperator instanceof TranslationsViewInOperator) {
                e.cancelBubble = true;
                e.stopPropagation();
                let ov = ui.draggable.closest('.operator-view').data('OperatorView');
                if (ov instanceof OperatorView) {
                    ov.refreshDropZones();
                }
                translationsViewInOperator.destroy(ui.draggable);
            }
        })
    $(document.body)
        .on('dragover', (e: JQueryEventObject) => {
            e.stopPropagation();
            e.preventDefault();
            let oe: DragEvent = <DragEvent>e.originalEvent;
            oe.dataTransfer.dropEffect = 'copy';
        })
        .on('drop', (e: JQueryEventObject) => {
            e.stopPropagation();
            e.preventDefault();
            let oe: DragEvent = <DragEvent>e.originalEvent;
            if (oe.dataTransfer) {
                for (let i = 0; i < oe.dataTransfer.files.length; i++) {
                    loadFile(oe.dataTransfer.files[i]);
                }
            }
        })
        .removeClass('busy')
        ;
});