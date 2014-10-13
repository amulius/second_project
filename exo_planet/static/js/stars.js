    $('.more_info').on('click', function () {
        var star = $(this).data('star');
        var id = $(this).attr('id');
        $.ajax({
            url: "details/"+star,
            type: "GET",
//            dataType: "json",
            success: function (data) {
                $('#starInfo'+id).html(data);
            },
            error: function (data) {
                console.log('bad');
                console.log(data);
            }
        });
    });