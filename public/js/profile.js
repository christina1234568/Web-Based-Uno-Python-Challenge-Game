$(document).ready(function() {
    $("#deleteButton").click(function(event) {
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

$(document).ready(function() {
    $("#backButton").click(function(event) {
        event.preventDefault();
        window.location.href = "/homepage";
    });

});


$(document).ready(function() {
    $("#cancelDelete").click(function(event) {
        event.preventDefault();
        window.location.href = "/profile";
    });

});

// trigeerng the delete route to deleet updtae the user table 
$(document).ready(function() {
    $("#confirmDelete").click(function(event) {
        event.preventDefault();
        $.ajax({
            url: "/delete",
            method: "POST",
            success: function(response) {
                if (response.success) {
                    alert(response.message);
                    window.location.href = "/logout";
                } else {
                    $("#errorMessage").text("The deletion could not be processed. Please sign up again.");
                }
            },
            error: function(xhr) {
                $("#errorMessage").text(xhr.responseJSON?.error || "The deletion could not be processed. Please sign up again.");
            }
        });
    });
});



