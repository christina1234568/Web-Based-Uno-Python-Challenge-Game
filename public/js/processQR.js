document.addEventListener("DOMContentLoaded", function () {
  
    function onScanSuccess(decodedText) {
        console.log("Scanned QR Code:", decodedText);

        fetch(`/processingQR/${decodedText}`)
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    alert(data.message);
                    return;
                }

                // displaying the modal to show the question
                $("#questionModal").fadeIn();
                $("#questionModal").attr("data-locked", "true");

                //disabling the close option in the questin modal to prevent the player from cheating
                $("#closeQuestionModal").css("pointer-events", "none").css("opacity", "0.5");

                $("#questionText").text(data.question_text);
                $("#username").text(data.username || "Unknown");

                //displaying the options in gthe container and 
                const buttons = $(".optionsContainer button");
                buttons.each((index, button) => {
                    if (data.options[index]) {
                        $(button).text(`${data.options[index].option_character}. ${data.options[index].option_text}`)
                            .attr("data-option-id", data.options[index].option_id)
                            .show()
                            .off("click")
                            .on("click", function () {
                                submitAnswer(data.options[index].option_id, data.question_id);
                                //submitting the answer chosen 
                            });
                    } else {
                        $(button).hide();
                    }
                });
            })
            .catch(error => console.error("Error fetching question:", error));
    }

    var html5QrcodeScanner = new Html5QrcodeScanner(
        "reader", { fps: 10, qrbox: { width: 250, height: 250 } }
    );
    html5QrcodeScanner.render(onScanSuccess);
});



function submitAnswer(option_id, question_id) {
    $.ajax({
        url: "/validateAnswer",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({ option_id, question_id }),
        success: function (response) {
            if (response.message) {
                $("#isCorrect").text(`${response.message}`).css("color", "red");
                return;
            }

            $(".optionsContainer button").prop("disabled", true);

            if (response.correct) {
                $("#isCorrect").text("You are correct!").css("color", "green");
            } else {
                $("#isCorrect").text("You are incorrect!").css("color", "red");
                $(`button[data-option-id='${option_id}']`).css({ "background-color": "red" });
            }

            $(`button[data-option-id='${response.correct_option_id}']`).css({ "background-color": "green" });

            $("#consequence").text(`${response.consequence}`).css("font-weight", "bold");

            $("#closeQuestionModal").css("pointer-events", "auto").css("opacity", "1");
            $("#questionModal").removeAttr("data-locked");
        },
        error: function (xhr) {
            if (!$("#isCorrect").text().trim()) {
                let errorMessage = xhr.responseJSON?.message || "An unexpected error occurred.";
                $("#isCorrect").text(errorMessage).css("color", "red");
            }
        }
    });
}






