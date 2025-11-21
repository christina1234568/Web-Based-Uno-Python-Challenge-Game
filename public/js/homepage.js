$(document).ready(function() {
    $("#createGameButton").click(function(event) {
        event.preventDefault();
        $("#createModal").fadeIn();
    });

    $("#closeModal").click(function() {
        $("#createModal").fadeOut();
    });

    $(window).click(function(event) {
        if ($(event.target).is(".modal")) {
            $(".modal").fadeOut();
        }
    });

});

$(document).on("click", ".level", function () {
    let selectedLevel = $(this).attr("data-level");

    $.post("/createGame", { level: selectedLevel }, function (response) {
        if (response.success) {
            window.location.href = `/lobby`;
        } else {
            $("#error").text(response.message).show();
        }
    });
});


