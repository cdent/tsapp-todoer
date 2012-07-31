$(function() {
    "use strict";

    // see https://gist.github.com/1200559/1c2b2093a661c4727958ff232cd12de8b8fb9db9
    var adler32 = function(a){for(var b=65521,c=1,d=0,e=0,f;f=a.charCodeAt(e++);d=(d+c)%b)c=(c+f)%b;return(d<<16)|c};

    function addTodo(tiddler) {
        var item = $('<li>').attr({'data-tiddler': tiddler.title})
            .append('<label><input type="checkbox"><p>' + tiddler.text + 
                '</p></label>');
        $('.todos').append(item);
    }

    $(document).on('click', '.todos input[type="checkbox"]', function() {
        var listEl = $(this).parent().parent(),
            tiddler = listEl.attr('data-tiddler');

        if ($(this).is(':checked')) {
            listEl.fadeOut();
        }
    });

    $('.dataentry form').submit(function(event) {
        event.stopPropagation();
        event.preventDefault();
        var textarea = $(this).find('textarea'),
            tagsarea = $(this).find('input[name="tags"]'),
            text = textarea.val(),
            tags = tagsarea.val().split('/\s+/'),
            hash = adler32(text + tags + Date.now()),
            space = tiddlyweb.status.space.name,
            uri = '/bags/' + space + '_public/tiddlers/'
                + encodeURIComponent(hash);
    
        tags.push('todo:active')

        var tiddler = {text: text, tags: tags};
        var tiddlerJSON = JSON.stringify(tiddler);

        $.ajax({
            url: uri,
            type: 'PUT',
            contentType: 'application/json',
            data: tiddlerJSON,
            processDate: false,
            success: function() {
                tiddler.title = hash;
                addTodo(tiddler);
                console.log(text, tags, hash);
            }
        });

    });
});
