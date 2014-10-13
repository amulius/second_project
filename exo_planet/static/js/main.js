//$(document).ready(function () {


    var init = function() {
    $.ajax({
            url: "/test/",
            type: "GET",
            success: function (data) {
                $('#starList').html(data);
            },
            error: function (data) {
                console.log('bad');
                console.log(data);
            }

        });
    };

    $('#data').on('click', function () {
        $.ajax({
            url: "/test/",
            type: "GET",
            success: function (data) {
                $('#starList').html(data);
            },
            error: function (data) {
                console.log('bad');
                console.log(data);
            }

        });
    });

    init();

//    $('#solar').on('click', function () {
//        $.ajax({
//            url: "/solar/",
//            type: "GET",
//            success: function (data) {
//                $('#main').html(data);
//            },
//            error: function (data) {
//                console.log('bad');
//                console.log(data);
//            }
//
//        });
//    });




//});