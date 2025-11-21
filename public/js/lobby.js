$(document).ready(function () {
    //first host clicks start button
    $("#startButton").click(function (event) {
        event.preventDefault();
        var confirmation = confirm("Are you sure you want to start the game?");
        
        if (confirmation) {
            $.ajax({
                url: "/startGame",//redirect to startgame route in lobby.js to update state of the game
                method: "POST",
                success: function (response) {
                    alert(response.message);
                },
                error: function (xhr) {
                    alert(xhr.responseJSON?.error || "There was an error encountered while starting the game. Please try again.");
                }
            });
        }
    });



    //for host to end the game session 
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


    //for players to exit the game session
    $("#exitButton").click(function (event) {
        event.preventDefault();
        var confirmation = confirm("You are leaving the current game session and will not be allowed back in.");
        if (confirmation) {
            window.location.href = "/exitGame";
        }
    });

    //to fetch player joining in the agme
    //to check the state opf the game
    //if it has been ended by the host - players redirected to homepage
    //if it has been started by host - players redirected to game page
    function fetchPlayers() {
        $.ajax({
            url: `/players`,
            method: "GET",
            success: function (data) {
                if (data.error) {
                    $("#errorMessage").text(data.error);
                    return;
                }

                if (data.state === "started") {
                    window.location.href = "/game";
                    return;
                }

                if (data.state === "ended") {
                    alert("The host has ended the game session.");
                    window.location.href = "/homepage";
                    return;
                }

                let playersList = "";
                if (data.players.length > 0) {
                    data.players.forEach(player => {
                        playersList += `<li>${player.username}</li>`;
                    });
                    $("#errorMessage").text("");
                } else {
                    $("#errorMessage").text("");
                }

                $("#players").html(playersList);
            },
            error: function (xhr) {
                const errorMessage = xhr.responseJSON?.error;
                $("#errorMessage").text(errorMessage);
            },
        });
    }

    setInterval(fetchPlayers, 1000);

});




