"use strict";

//const { sign } = require("crypto");


// Class Definition
var KTLogin = function () {
    var _login;
    var validation;

    var _handleSignInForm = function () {      
        var form = document.getElementById('kt_login_signin_form')
        // Init form validation rules. For more info check the FormValidation plugin's official documentation:https://formvalidation.io/
        validation = FormValidation.formValidation(
            form,
            {
                fields: {
                    'user': {
                        validators: {
                            notEmpty: {
                                message: resources.username_not_empty
                            }
                        }
                    },
                    'pass': {
                        validators: {
                            notEmpty: {
                                message: resources.pass_not_empty
                            }
                        }
                    }
                },
                plugins: {
                    trigger: new FormValidation.plugins.Trigger(),
                    bootstrap: new FormValidation.plugins.Bootstrap()
                }
            }
        );

        $('#kt_login_signin_submit').on('click', function (e) {
            e.preventDefault();

            if (validation) {
                validation.validate().then(function (status) {
                    if (status == 'Valid') {

                        SignIn();

                    } else {
                        swal.fire({
                            text: resources.require_all,
                            icon: "error",
                            buttonsStyling: false,
                            confirmButtonText: "Ok, got it!",
                            customClass: {
                                confirmButton: "btn font-weight-bold btn-light-primary"
                            }
                        }).then(function () {
                            KTUtil.scrollTop();
                        });
                    }
                });
            }            
        });

        function SignIn() {
            var form = document.getElementById("kt_login_signin_form");
            var formdata = new FormData(form);
            /* var host = localStorage.getItem("host")*/
            $.ajax({
                /*  url: host+'/Account/loginapi',*/
                url: '/Login/LoginiGMS',
                type: 'Post',
                data: formdata,
                contentType: false,
                processData: false,
                success: function (data) {
                    if (data.code === 200) {
                        $(".form-container").attr("hidden", true);
                        $(".bg-form").attr("hidden", false);
                        window.location.href = "/";
                        //setTimeout(() => {
                        //    window.location.href = "/";
                        //}, 4000);
                    } else {
                        swal.fire({
                            title: "Error!",
                            text: data.message,
                            icon: "error",
                            buttonsStyling: false,
                            heightAuto: false,
                            customClass: {
                                confirmButton: "btn font-weight-bold btn-light-primary"
                            }
                        }).then(function () {
                            KTUtil.scrollTop();
                        });
                        $("#password").val("");
                    }
                },
                error: function () {
                    swal.fire({
                        title: "Error!",
                        text: "Something wrong, try again!",
                        icon: "error",
                        heightAuto: false,
                        buttonsStyling: false,
                        confirmButtonText: "Ok!",
                        customClass: {
                            confirmButton: "btn font-weight-bold btn-light-primary"
                        }
                    }).then(function () {
                        KTUtil.scrollTop();
                    });
                }
            })
        }
    }
    // Public Functions
    return {
        // public functions
        init: function () {
            _handleSignInForm();
        }
    };
}();

// Class Initialization
jQuery(document).ready(function () {
    KTLogin.init();
});

$(".change-language").on("click", function () {
    var culture = $(this).data('culture');

    $.ajax({
        url: '/Login/ChangeCulture',
        type: 'post',
        data: { ddlculture: culture },
        success: function (data) {
            if (data.success == true) {
                localStorage.setItem("language", data.language)
                window.location.reload();
            }
            else {
                console.error('Error changing language');
            }
        },
        error: function (error) {
            console.error('Error', error);
        }
    });
})
