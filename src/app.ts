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

import * as $ from 'jquery';
(<any>window).jQuery = $;
import 'bootstrap/js/tooltip.js';
import 'bootstrap/js/dropdown.js';
import 'jquery-ui/draggable';
import 'jquery-ui/dialog';
import * as FileSaver from 'file-saver';
$(() => {

    class TranslationsView {
        public name: string;
        public readonly translations: GettextTS.Translations;
        public readonly $div: JQuery;
        private $contents: JQuery;
        constructor(name: string, translations: GettextTS.Translations) {
            let me = this;
            this.name = name;
            this.translations = translations;
            $('#main').append(
                this.$div = $('<div class="translations-view panel panel-default" />')
                    .append($('<div class="panel-heading" />')
                        .append($('<div class="name" title="Double-click to rename" />')
                            .text(this.name)
                            .on('dblclick', () => {
                                me.startRename();
                            })
                        )
                    )
                    .append($('<div class="panel-body" />')
                        .append($('<button class="btn btn-xs btn-info" data-toggle="tooltip" title="View .po"><i class="fa fa-eye"></i></button>')
                            .on('click', (e: JQueryEventObject) => {
                                e.preventDefault();
                                me.showContents();
                            })
                        )
                        .append($('<button class="btn btn-xs btn-info" data-toggle="tooltip" title="Create language-specific .po"><i class="fa fa-arrow-right"></i>.po</button>')
                            .on('click', (e: JQueryEventObject) => {
                                e.preventDefault();
                                me.toPo();
                            })
                        )
                        .append($('<button class="btn btn-xs btn-info" data-toggle="tooltip" title="Create empty .pot dictionary"><i class="fa fa-arrow-right"></i>.pot</button>')
                            .on('click', (e: JQueryEventObject) => {
                                e.preventDefault();
                                me.toPot();
                            })
                        )
                        .append($('<div class="btn-group" />')
                            .append($('<button type="button" class="btn btn-xs btn-info dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"><i class="fa fa-download" title="Download"></i> <span class="caret"></span></button>'))
                            .append($('<ul class="dropdown-menu" />')
                                .append($('<li />')
                                    .append($('<a href="#">Download .' + (/\.pot/i.test(me.name) ? 'pot' : 'po') + '</a>')
                                        .on('click', (e: JQueryEventObject) => {
                                            e.preventDefault();
                                            me.downloadAsPo();
                                        })
                                    )
                                )
                                .append($('<li />')
                                    .append($('<a href="#">Download .mo</a>')
                                        .on('click', (e: JQueryEventObject) => {
                                            e.preventDefault();
                                            me.downloadAsMo();
                                        })
                                    )
                                )
                            )
                        )
                        .append($('<button class="btn btn-xs btn-danger" data-toggle="tooltip"><i class="fa fa-trash-o" title="Remove"></i></button>')
                            .on('click', (e: JQueryEventObject) => {
                                e.preventDefault();
                                me.$div.remove();
                            })
                        )
                    )
                    .draggable({
                        containment: 'parent',
                        handle: '.panel-heading',
                    })
                    .on('click mousedown', () => {
                        $('div.translations-view').removeClass('current');
                        me.$div.addClass('current');
                    })
            );
            this.$div.find('[data-toggle="tooltip"]').tooltip();
        }
        public showContents(): void {
            if (this.$contents !== undefined) {
                this.$contents.dialog('moveToTop');
                return;
            }
            let me = this;
            let gp = new GettextGP.Generator.Po();
            me.$contents = $('<div />')
                .append($('<textarea class="translations-contents" readonly="readonly" />').val(gp.translationsToString(me.translations)))
                .on('dialogresize', () => {
                    me.$contents.closest('.ui-dialog').find('.ui-dialog-content').css('width', '100%');
                    me.$contents.find('textarea').height(me.$contents.height() - 20);
                })
            $('#main').append(me.$contents);
            me.$contents.dialog({
                buttons: [
                    {
                        text: 'Close',
                        click: () => {
                            me.$contents.dialog('close');
                        }
                    }
                ],
                title: 'Contents of ' + me.name,
                open: (): void => {
                    setTimeout(() => {
                        me.$contents.trigger('dialogresize');
                    }, 10);
                    me.$contents.find('textarea').scrollTop(0);
                },
                width: Math.min(Math.max($(window).width() * .75, 200), 600),
                height: Math.min(Math.max($(window).height() * .75, 200), 400),
                close: (): void => {
                    me.$contents.remove();
                    delete me.$contents;
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
            let me = this;
            let match = /^(.+)(\.\w+)/.exec(me.name);
            let base = match === null ? me.name : match[1];
            let extension = match === null ? '' : match[2];
            let $name : JQuery;
            me.$div.find('.name')
                .width(me.$div.find('.name').width())
                .empty()
                .append($name = $('<input type="text" class="form-control" style="width: 100%" />')
                    .data('extension', extension)
                    .val(base)
                    .on('keydown', (e: JQueryEventObject) => {
                        switch (e.which) {
                            case 27: // Esc
                                $name.off('blur');
                                me.$div.find('.name').css('width', 'auto').empty().text(me.name);
                                break;
                            case 13:
                                let newName = $.trim($name.val()).replace(/\.+$/, '');
                                if (newName.length === 0) {
                                    $name.val('').focus();
                                    return;
                                }
                                $name.off('blur');
                                me.name = newName + $name.data('extension');
                                me.$div.find('.name').css('width', 'auto').empty().text(me.name);
                                break;
                        }
                    })
                    .on('blur', () => {
                        let newName = $.trim($name.val()).replace(/\.+$/, '');
                        if (newName.length !== 0) {
                            me.name = newName + $name.data('extension');
                        }
                        me.$div.find('.name').css('width', 'auto').empty().text(me.name);
                    })
                )
                ;
            setTimeout(() => {
                $name.select();
                $name.focus();
            }, 10);
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
            fileReader.onload = function() {
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
            for (let i = 0; i < oe.dataTransfer.files.length; i++) {
                loadFile(oe.dataTransfer.files[i]);
            }
        })
        .removeClass('busy')
        ;
});