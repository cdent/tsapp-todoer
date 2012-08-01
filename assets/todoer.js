/*jslint browser: true */

$(function() {
    "use strict";

    /*
     * provided by /status.js
     *
     * 'space' will be undefined if not in a space, causing the code
     * to error out, which is fine, it's not supposed to work when 
     * not in a space.
     */
    var space = tiddlyweb.status.space.name;

    /*
     * Add a todo item, meaning li element, to the display.
     */
    function addTodo(tiddler, top) {
        var item = $('<li>').attr({'data-tiddler': tiddler.title}).
            append('<label><input type="checkbox"><p>' + tiddler.text +
                '</p></label>');
        if (top) {
            $('.todos').prepend(item);
        } else {
            $('.todos').append(item);
        }
    }

    /*
     * Retrieve a single tiddler with title from the current space's
     * public bag as JSON.
     *
     * For reference, the generated request is
     *
     * GET /bags/<spacename>_public/tiddlers/<title>
     * Accept: application/json
     */
    function getTiddler(title, callback) {
        var uri = '/bags/' + space + '_public/tiddlers/' + title;

        $.ajax({
            url: uri,
            dataType: 'json',
            success: callback
        });
    }

    /*
     * Change this tiddler from an active todo to a done todo and
     * PUT it back to its URI.
     *
     * Then clear the list element that represented the todo.
     *
     * For reference the generated request is:
     * PUT /bags/<spacename>_public/tiddlers/<title>
     * Content-Type: application/json
     * {THE JSON}
     */
    function completeTodo(tiddler) {
        var activeTagIndex = tiddler.tags.indexOf('todo:active'),
            uri = '/bags/' + space + '_public/tiddlers/' + tiddler.title,
            tiddlerJSON;

        if (activeTagIndex !== -1) {
            tiddler.tags.splice(activeTagIndex, 1);
        }

        tiddler.tags.push('todo:done');
        tiddlerJSON = JSON.stringify(tiddler);

        $.ajax({
            url: uri,
            type: 'PUT',
            contentType: 'application/json',
            data: tiddlerJSON,
            processData: false,
            success: function() {
                clearTodo(tiddler);
            }
        });

    }

    /* 
     * Remove the list element associated with a todo tiddler.
     */
    function clearTodo(tiddler) {
        $('li[data-tiddler="' + tiddler.title + '"]').fadeOut();
    }

    /*
     * Establish event handling for clicking on a todo to mark it
     * done.
     */
    $(document).on('click', '.todos input[type="checkbox"]', function() {
        var tiddler = $(this).parent().parent().attr('data-tiddler');
        getTiddler(tiddler, completeTodo);
    });

    /*
     * Handle the creation of a new todo item by listening for submit
     * on the form.
     *
     * Should reuse put code from above but doesn't yet.
     */
    $('.dataentry form').submit(function(event) {
        event.stopPropagation();
        event.preventDefault();
        var textarea = $(this).find('textarea'),
            tagsarea = $(this).find('input[name="tags"]'),
            text = textarea.val(),
            tags = tagsarea.val() ? tagsarea.val().split(/\s+/) : [],
            hash = adler32(text + tags + Date.now()),
            uri = '/bags/' + space + '_public/tiddlers/'
                + encodeURIComponent(hash),
            tiddler,
            tiddlerJSON;

        tags.push('todo:active');
        tiddler = {text: text, tags: tags};
        tiddlerJSON = JSON.stringify(tiddler);

        $.ajax({
            url: uri,
            type: 'PUT',
            contentType: 'application/json',
            data: tiddlerJSON,
            processData: false,
            success: function() {
                tiddler.title = hash;
                textarea.val('');
                tagsarea.val('');
                addTodo(tiddler);
            }
        });

    });

    /*
     * Display a list of todo tiddlers in the DOM.
     */
    function presentList(tiddlers) {
        $('.todos').empty();
        $.each(tiddlers, function(index, tiddler) {
            addTodo(tiddler);
        });
    }

    /*
     * Load a list of todo tiddlers from the server.
     *
     * The request is usually:
     *
     * GET /bags/<spacename>_public/tiddlers?fat=1;select=tag:todo:active;sort=-modified
     * Accept: application/json
     */
    function refreshList(sortKey) {
        var uri = '/bags/' + space +
            '_public/tiddlers?fat=1;select=tag:todo:active';

        if (sortKey) {
            uri = uri + ';sort=' + sortKey;
        }

        $.ajax({
            url: uri,
            type: 'GET',
            dataType: 'json',
            success: presentList
        });
    }


    refreshList('modified');

    /*
     * Hash function used for generating titles for the tiddlers.
     * Taken from:
     * https://gist.github.com/1200559/1c2b2093a661c4727958ff232cd12de8b8fb9db9
     */
    function adler32(a) {
        for(var b=65521,c=1,d=0,e=0,f;f=a.charCodeAt(e++);d=(d+c)%b)
            c=(c+f)%b;
        return(d<<16)|c
    };

});
