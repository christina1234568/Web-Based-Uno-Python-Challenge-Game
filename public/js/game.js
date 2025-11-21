$(document).ready(function () {

    //function to fetch the score of the players who have answered at least a question
    function fetchScoreboard() {
        $.ajax({
            url: "/scoreboard",
            method: "GET",
            success: function (data) {
                $("#scoreboardList").empty();

                // filteriing the scores - making the maiximums go at the top of the scoreboard
                const maxScore = Math.max(...data.players.map(p => p.total_score), 1);

                data.players.forEach(player => {
                    let percentage = (player.total_score / maxScore) * 100;

                    // hiding the bar if the score of the player is 0
                    let barStyle = player.total_score > 0 ? `width: ${percentage}%` : `display: none`;

                    $("#scoreboardList").append(`
                            <div class="score-item">
                                <div class="score-bar" style="${barStyle}">
                                    <span class="score-text">${player.username} (${player.total_score})</span>
                                </div>
                            </div>
                        `);
                });
            },
            error: function (xhr) {
                const response = xhr.responseJSON || { error: "An unknown error occurred." };
                $("#errorMessage").text(response.error);
            }
        });
    }

    //connected to the players route in lobby.js - to chcek the game of the players
    function checkGameStatus() {
        $.ajax({
            url: `/players`,
            method: "GET",
            success: function (data) {
                if (data.state === "ended") {
                    alert("The host has ended the game session. You will be redirected to the homepage.");
                    window.location.href = "/exitGame";
                }
            },
            error: function (xhr) {
                const response = xhr.responseJSON || { error: "There was an error encountered while checking the game status." };
                $("#errorMessage").text(response.error);
            }
        });
    }

    //leading to endGame route in lobby.js - used to end the game and update the state of the game
    $("#endButton").click(function (event) {
        event.preventDefault();
        var confirmation = confirm("Are you sure you want to end the game?");
        if (confirmation) {
            $.ajax({
                url: "/endGame",
                method: "POST",
                success: function (response) {
                    if (response.success) {
                        window.location.href = "/homepage";
                    } else {
                        alert("Unexpected error. Please try again.");
                    }
                },
                error: function (xhr) {
                    alert(xhr.responseJSON?.error || "Error ending the game. Please try again.");
                }
            });
        }
    });


    //exitButton event - leading to exitGame route in lobby.js
    $("#exitButton").click(function (event) {
        event.preventDefault();
        var confirmation = confirm("You are leaving the current game session and will not be allowed back in.");
        if (confirmation) {
            window.location.href = "/exitGame";
        }
    });


    //chceking the score for additional reward
    let lastShownScore = 0;

    function checkScore() {
        fetch('/getScore')
            .then(response => response.json())
            .then(data => {
                if (data.reward && data.totalScore !== lastShownScore) {
                    lastShownScore = data.totalScore;
                    document.getElementById("rewardMessage").textContent = data.reward;
                    $("#rewardModal").fadeIn();
                }
            })
            .catch(error => {
                console.error('Error fetching score:', error);
                document.getElementById("errorMessage").textContent = error.message;
            });
    }

    setInterval(checkScore, 3000);
    setInterval(fetchScoreboard, 3000);
    setInterval(checkGameStatus, 3000);

    //modal fucntions

    $("#scoreboardButton").click(function (event) {
        event.preventDefault();
        $("#scoreboardModal").fadeIn();
        fetchScoreboard();
    });

    $("#closeScoreboardModal").click(function () {
        $("#scoreboardModal").fadeOut();
    });

    $(window).click(function (event) {
        if ($(event.target).is(".modal")) {
            let modalId = $(event.target).attr("id");
    
            if (modalId === "questionModal" && $("#questionModal").attr("data-locked") === "true") {
                return;
            }
    
            $("#" + modalId).fadeOut();
            location.reload();
        }
    });

    $("#closeQuestionModal").click(function () {
        $("#questionModal").fadeOut();
        location.reload();
    });
    

    $("#closeRewardModal").click(function () {
        $("#rewardModal").fadeOut();
    });

});
