"use strict";

//const { sign } = require("crypto");


// Class Definition
var KTLogin = function () {
    var _login;

    var _showForm = function (form) {
        var cls = 'login-' + form + '-on';
        var form = 'kt_login_' + form + '_form';

        _login.removeClass('login-forgot-on');
        _login.removeClass('login-signin-on');
        _login.removeClass('login-signup-on');

        _login.addClass(cls);

        KTUtil.animateClass(KTUtil.getById(form), 'animate__animated animate__backInUp');
    }

    var _handleSignInForm = function () {
        var validation;

        // Init form validation rules. For more info check the FormValidation plugin's official documentation:https://formvalidation.io/
        validation = FormValidation.formValidation(
            KTUtil.getById('kt_login_signin_form'),
            {
                fields: {
                    User: {
                        validators: {
                            notEmpty: {
                                message: 'Vui Lòng Nhập Tài Khoản !!!'
                            }
                        }
                    },
                    Pass: {
                        validators: {
                            notEmpty: {
                                message: 'Vui Lòng Nhập Mật Khẩu !!!'
                            }
                        }
                    }
                },
                plugins: {
                    trigger: new FormValidation.plugins.Trigger(),
                    submitButton: new FormValidation.plugins.SubmitButton(),
                    //defaultSubmit: new FormValidation.plugins.DefaultSubmit(), // Uncomment this line to enable normal button submit after form validation
                    bootstrap: new FormValidation.plugins.Bootstrap()
                }
            }
        );

        $('#kt_login_signin_submit').on('click', function (e) {
            e.preventDefault();

            validation.validate().then(function (status) {
                if (status == 'Valid') {
                    SignIn();
                    //checkLoginAPI();
                } else {
                    swal.fire({
                        text: "Xin Lỗi, Nhập Đủ Dữ Liệu.",
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
        });
        //const urlParams = new URLSearchParams(window.location.search);
        //const username = urlParams.get('username');
        //if (username) {
        //    $('#username').val(username);
        //}

        //function SignIn() {
        //    var formdata = $('#kt_login_signin_form').serialize();
        //    var host = localStorage.getItem("host");
        //    var usernamenew = $('#username').val();
        //    if (username !== usernamenew) {
        //        swal.fire({
        //            title: "Lỗi!",
        //            text: "Tên Đăng Nhập Sai. Vui Lòng Đăng Nhập Lại Đúng Tài Khoản !",
        //            icon: "error",
        //            buttonsStyling: false,
        //            heightAuto: false,
        //            customClass: {
        //                confirmButton: "btn font-weight-bold btn-light-primary"
        //            }
        //        }).then(function () {
        //            KTUtil.scrollTop();
        //        });
        //        // Ngăn chặn việc submit form
        //        e.preventDefault();
        //        return;
        //    }
        //    else {
        //        $.ajax({
        //            url: host + '/Account/loginapi',
        //            type: 'get',
        //            dataType: "json",
        //            data: formdata,
        //            success: function (data) {
        //                if (data.status == true) {
        //                    saveSession(data)
        //                } else {
        //                    swal.fire({
        //                        title: "Có lỗi!",
        //                        text: data.message,
        //                        icon: "error",
        //                        buttonsStyling: false,
        //                        heightAuto: false,
        //                        customClass: {
        //                            confirmButton: "btn font-weight-bold btn-light-primary"
        //                        }

        //                    }).then(function () {
        //                        KTUtil.scrollTop();
        //                    });
        //                }
        //            },
        //            error: function () {
        //                swal.fire({
        //                    title: "Có lỗi!",
        //                    text: "Bạn Không Được Phép Đăng Nhập",
        //                    icon: "error",
        //                    heightAuto: false,
        //                    buttonsStyling: false,
        //                    confirmButtonText: "Ok!",
        //                    customClass: {
        //                        confirmButton: "btn font-weight-bold btn-light-primary"
        //                    }
        //                }).then(function () {
        //                    KTUtil.scrollTop();
        //                });
        //            }
        //        })
        //    }
        //}
        function checkLoginAPI() {
            var form = new FormData();
            form.append("name", "/Login/Login");

            $.ajax({
                type: "POST",
                url: "/Login/CheckAPIFunction",
                data: form,
                processData: false,
                contentType: false,
                success: function (response) {
                    console.log(response);
                    if (response.code === 200) {  
                        if (response.status) {
                            var url = response.apiHost;
                            var name = response.apiFunction.NameFunctionAPI;
                            var type = response.apiFunction.Method;
                            var params = response.paramsF;
                            var returnValues = JSON.parse(response.apiFunction.ReturnValue);
                            //console.log("Do cai nay")
                            SignIn(url, name, type, params, returnValues);
                        } else {
                            //console.log("Do cai kia")
                            SignInV1();
                        }
                    }
                },
                error: function (e) {
                    toastr.error("Lỗi:", e);
                }
            })
        }
        
        function SignIn(url, name, type, params, values) {
            var formdata = $('#kt_login_signin_form').serialize();
            /* var host = localStorage.getItem("host")*/
            var getValue = formdata.split("&");
            if (type.toLowerCase() === "get") {
                var input = "";
                for (var i = 0; i < getValue.length; i++) {
                    var v = (getValue[i].split("="));
                    if (i != 0) {
                        input += "&";
                    }
                    input += params[i].name + "=" + v[1];
                }
            } else if (type.toLowerCase() === "post") {
                var input = {};
                for (var i = 0; i < getValue.length; i++) {
                    var v = (getValue[i].split("="));
                    input[v[0]] = v[1];
                }
            }
            $.ajax({
                url: "http://bill.haphan.com/Account/LoginAPI",
                type: type,
                dataType: "json",
                data: input,
                success: function (data) {
                    if (data.status == true) {
                        saveSession(data);
                    } else {
                        swal.fire({
                            title: "Có lỗi!",
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
                    }
                },
                error: function () {
                    swal.fire({
                        title: "Có lỗi!",
                        text: "Bạn Không Được Phép Đăng Nhập",
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

        function SignInV1() {
            var formdata = $('#kt_login_signin_form').serialize()
            /* var host = localStorage.getItem("host")*/
            $.ajax({
                /*  url: host+'/Account/loginapi',*/
                url: '/Login/LoginiGMS',
                type: 'get',
                data: formdata,
                contentType: false,
                processData: false,
                success: function (data) {
                    console.log(data);
                    if (data.code === 200) {
                        console.log("Login local");
                        window.location.href = "/";
                    } else {
                        swal.fire({
                            title: "Có lỗi!",
                            text: data.msg,
                            icon: "error",
                            buttonsStyling: false,
                            heightAuto: false,
                            customClass: {
                                confirmButton: "btn font-weight-bold btn-light-primary"
                            }

                        }).then(function () {
                            KTUtil.scrollTop();
                        });
                    }
                },
                error: function () {
                    swal.fire({
                        title: "Có lỗi!",
                        text: "Bạn Không Được Phép Đăng Nhập",
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

        function saveSession(data) {
            var UserData = data;
            var UserName = UserData.user;
            var FullName = UserData.fullName
            var DepartmentId = UserData.departmentId;
            var DepartmentName = UserData.departmentName;
            var ApiRolesString = JSON.stringify(UserData.roles);
            $.ajax({
                url: '/Login/LoginApi',
                type: 'get',
                data: { UserName, FullName, DepartmentId, DepartmentName, ApiRolesString },
                success: function (data) {
                    if (data.code == 200) {
                        swal.fire({
                            title: "Thành Công",
                            text: data.msg,
                            icon: "success",
                            buttonsStyling: false,
                            heightAuto: false,
                            showConfirmButton: false,
                            timer: 1500

                        }).then(function () {
                          
                            window.location.href = "Home/Index";
                            KTUtil.scrollTop();
                        });
                    } else {
                        swal.fire({
                            title: "Có Lỗi !",
                            text: data.msg,
                            icon: "error",
                            buttonsStyling: false,
                            heightAuto: false,
                            customClass: {
                                confirmButton: "btn font-weight-bold btn-light-primary"
                            }
                        }).then(function () {
                            KTUtil.scrollTop();
                        });
                    }
                },
                error: function () {
                    swal.fire({
                        title: "Có Lỗi !",
                        text: "Vui Lòng Tải Lại Trang Và Thử Lại !",
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
        // Handle forgot button
        $('#kt_login_forgot').on('click', function (e) {
            e.preventDefault();
            _showForm('forgot');
        });

        // Handle signup
        $('#kt_login_signup').on('click', function (e) {
            e.preventDefault();
            _showForm('signup');
        });
    }
    // Public Functions
    return {
        // public functions
        init: function () {
            _login = $('#kt_login');

            _handleSignInForm();
        }
    };
}();

// Class Initialization
jQuery(document).ready(function () {
    KTLogin.init();
});
