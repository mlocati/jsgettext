///<reference path="../node_modules/@types/jqueryui/index.d.ts" />

import { Gettext as GettextTS } from './Gettext/Translations';
import { Gettext as GettextEP } from './Gettext/Extractor/Po';
import { Gettext as GettextEM } from './Gettext/Extractor/Mo';
import { Gettext as GettextGP } from './Gettext/Generator/Po';
import { Gettext as GettextGM } from './Gettext/Generator/Mo';
import { Gettext as GettextC } from './Gettext/Charset';
import { Gettext as GettextLI } from './Gettext/LocaleId';
import { Gettext as GettextL } from './Gettext/Language';
import { Gettext as GettextT } from './Gettext/Territory';
import { Gettext as GettextP } from './Gettext/Plural';
import { Gettext as GettextO } from './Gettext/Operator/Operator';
import { Gettext as GettextO_SD } from './Gettext/Operator/SourceDiff';

import * as $ from 'jquery';
(<any>window).jQuery = $;
import 'bootstrap/js/tooltip.js';
import 'bootstrap/js/collapse.js';
import 'bootstrap/js/dropdown.js';
import 'jquery-ui/draggable';
import 'jquery-ui/droppable';
import 'jquery-ui/dialog';
import * as FileSaver from 'file-saver';
$(() => {

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

    class TranslationsView extends BaseView {
        public name: string;
        public readonly translations: GettextTS.Translations;
        private $contents: JQuery;
        private positionBeforeDrag: JQueryCoordinates;
        constructor(name: string, translations: GettextTS.Translations) {
            super($('<div class="translations-view panel panel-primary" />'));
            this.name = name;
            this.translations = translations;
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
                    .append($('<button class="btn btn-xs btn-info" data-toggle="tooltip" title="View .po"><i class="fa fa-eye"></i></button>')
                        .on('click', (e: JQueryEventObject) => {
                            e.preventDefault();
                            this.showContents();
                        })
                    )
                    .append($('<button class="btn btn-xs btn-info" data-toggle="tooltip" title="Create language-specific .po"><i class="fa fa-arrow-right"></i>.po</button>')
                        .on('click', (e: JQueryEventObject) => {
                            e.preventDefault();
                            this.toPo();
                        })
                    )
                    .append($('<button class="btn btn-xs btn-info" data-toggle="tooltip" title="Create empty .pot dictionary"><i class="fa fa-arrow-right"></i>.pot</button>')
                        .on('click', (e: JQueryEventObject) => {
                            e.preventDefault();
                            this.toPot();
                        })
                    )
                    .append($('<div class="btn-group" />')
                        .append($('<button type="button" class="btn btn-xs btn-info dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"><i class="fa fa-download" title="Download"></i> <span class="caret"></span></button>'))
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
            this.setTooltip();
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
            let gp = new GettextGP.Generator.Po();
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
        public toPo(): void {
            pickLocaleId((localeId: GettextLI.LocaleId): boolean => {
                let plural = GettextP.Plural.search(localeId);
                if (plural === null) {
                    if (window.confirm('Unable to find the plural rules for ' + localeId.getName() + '.\nProceed anyway?') === false) {
                        return false;
                    }
                }
                let translations = this.translations.clone();
                ['Last-Translator'].forEach((cleanHeader) => {
                    if (translations.getHeader(cleanHeader)) {
                        translations.setHeader(cleanHeader, '');
                    }
                })
                translations.setLanguage(localeId.toString(), true);
                let match = /^(.+)\.\w+/.exec(this.name);
                let name = (match === null ? this.name : match[1]) + '-' + localeId.toString() + '.po';
                new TranslationsView(name, translations);
                return true;
            });
        }
        public toPot(): TranslationsView {
            let name: string;
            let match: RegExpExecArray | null;
            if ((match = /^(.* )\((\d+\))\.pot/i.exec(this.name)) !== null) {
                name = match[1] + '(' + (1 + parseInt(match[2], 10)).toString() + ').pot';
            } else if ((match = /^(.*)\.pot/i.exec(this.name)) !== null) {
                name = match[1] + ' (1).pot';
            } else if ((match = /^(.*)\.\w+/i.exec(this.name)) !== null) {
                name = match[1] + '.pot';
            } else {
                name = this.name + '.pot';
            }
            let pot = this.translations.toPot();
            return new TranslationsView(name, pot);
        }
        public downloadAsPo(): void {
            let gp = new GettextGP.Generator.Po();
            let po = gp.translationsToString(this.translations, true);
            let blob = GettextC.Charset.stringToUtf8Blob(po, 'text/x-po; charset=utf-8');
            let name = this.name;
            if (!/\.pot?/i.test(name)) {
                let match = /^(.+)\.\w+/.exec(name);
                name = (match === null) ? name + '.po' : match[1] + '.po';
            }
            FileSaver.saveAs(blob, name, true);
        }
        public downloadAsMo(): void {
            let gm = new GettextGM.Generator.Mo();
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
        public readonly translations: GettextTS.Translations
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
        private operator: GettextO.Operator.Operator;
        constructor(operator: GettextO.Operator.Operator) {
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
                            try {
                                this.applyOperator();
                            } catch (e) {
                                window.alert(e.message || e.toString());
                            }
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
        private applyOperator(): void {
            let views = this.getArguments();
            if (views.length < this.operator.minNumberOfOperands) {
                if (this.operator.minNumberOfOperands === this.operator.maxNumberOfOperands) {
                    throw new RangeError('Please specify ' + this.operator.minNumberOfOperands.toString() + ' files.');
                } else {
                    throw new RangeError('Please specify at least ' + this.operator.minNumberOfOperands.toString() + ' files.');
                }
            }
            if (this.operator.maxNumberOfOperands !== undefined && views.length > this.operator.maxNumberOfOperands) {
                throw new RangeError('Please specify up to ' + this.operator.minNumberOfOperands.toString() + ' files.');
            }
            let name = 'result.po';
            if (views.length > 0) {
                let match = /^.(\.\w+)$/.exec(views[0].name);
                if (match !== null) {
                    name = 'result' + match[1];
                }
            }
            let args: GettextTS.Translations[] = [];
            views.forEach((t) => {
                args.push(t.translations);
            });
            let result = this.operator.apply(args);
            new TranslationsView(name, result);
        }
    }

    function loadFile(file: File): void {
        let name = file.name;
        try {
            let loader: (arrayBuffer: ArrayBuffer) => GettextTS.Translations;
            if (/\.pot?$/i.test(name)) {
                loader = GettextEP.Extractor.Po.getTranslationsFromBuffer;
            } else if (/\.mo$/i.test(name)) {
                loader = GettextEM.Extractor.Mo.getTranslationsFromBuffer;
            } else {
                throw new Error('Unrecognized file type');
            }
            let fileReader = new FileReader();
            fileReader.onload = function () {
                try {
                    let arrayBuffer = this.result;
                    let translations = loader(arrayBuffer);
                    new TranslationsView(name, translations);
                } catch (e) {
                    window.alert('Error parsing ' + name + ':\n' + (e.message || e.toString()));
                }
            };
            fileReader.readAsArrayBuffer(file);
        } catch (e) {
            window.alert('Error loading ' + name + ':\n' + (e.message || e.toString()));
        }
    }

    function pickLocaleId(callback: (localeId: GettextLI.LocaleId) => boolean): void {
        let $languages = $('<select class="form-control" />').append('<option value="" selected="selected">Please select</option>');
        GettextL.Language.getAll(true).forEach((l) => {
            $languages.append($('<option />').val(l.id).text(l.name));

        });
        let $territories = $('<select class="form-control" />').append('<option value="" selected="selected">-- none --</option>');
        GettextT.Territory.getAll().forEach((t) => {
            $territories.append($('<option />').val(t.id).text(t.name));
        });
        let $div = $('<form />')
            .append($('<div class="form-group" />')
                .append('<label for="pick-language">Language</label>')
                .append($languages)
            )
            .append($('<div class="form-group" />')
                .append('<label for="pick-territory">Territory</label>')
                .append($territories)
            )
            ;
        $div.dialog({
            title: 'Choose language details',
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
                        let localeId = new GettextLI.LocaleId(languageId, '', territoryId);
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

    (() => {
        var $filePicker: JQuery;
        $('#upload-file').on('click', (e: JQueryEventObject) => {
            e.preventDefault();
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
                        let translations: GettextTS.Translations;
                        try {
                            translations = GettextEP.Extractor.Po.getTranslationsFromString($textarea.val());
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
            new GettextO_SD.Operator.SourceDiff(),
        ].forEach((operator: GettextO.Operator.Operator) => {
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