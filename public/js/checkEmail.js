$(document).ready(function () {
    $('#email').on('input', function () {
        var email = $('#email').val();
        var formType = $('#email').data('form-type');

        var url = formType === 'update' ? '/checkUpdateEmail' : '/checkSignupEmail';

        $.ajax({
            url: url,
            data: { email: email },
            success: function (data) {
                if (data.exists) {
                    $('#submitButton').prop('disabled', true);
                    $('#submitButton').css({
                        'background-color': '#ff7f6e',
                        'color': 'black'
                    });
                    $('#email').css('background-color', '#ffc0b8');
                    $('#emailError').text('This email is already connected to another account!').css('color', 'red');
                } else {
                    $('#submitButton').prop('disabled', false);
                    $('#email').css('background-color', '#d7ffb8');
                    $('#submitButton').css({
                        'background-color': '#28527A',
                        'color': 'white'
                    });
                    $('#emailError').text('Email is available!').css('color', 'green');
                }
            }
        });
    });
});


