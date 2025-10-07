var validation;
// Private functions
function _initValidation() {
    // Init form validation rules. For more info check the FormValidation plugin's official documentation:https://formvalidation.io/
    // Step 1
    var form = document.getElementById('form')
    validation = FormValidation.formValidation(
        form,
        {
            fields: {
                name: {
                    validators: {
                        notEmpty: {
                            message: resourceAddWH.is_not_empty
                        },
                    },

                },
                min: {
                    validators: {
                        notEmpty: {
                            message: resourceAddWH.is_not_empty
                        },
                        number: {
                            message: resourceAddWH.not_valid_number
                        },
                        callback: {
                            message: "",
                            callback: function (input) {
                                var value = input.value;
                                // Get the value of the select2 field
                                if (value > Number($('#max').val())) {
                                    return {
                                        valid: false,
                                        message: resourceAddWH.min_more_than_max
                                    };
                                }

                                // Otherwise, validation passes
                                return true;
                            }
                        }
                    },

                },
                max: {
                    validators: {
                        notEmpty: {
                            message: resourceAddWH.is_not_empty
                        },
                        number: {
                            message: resourceAddWH.not_valid_number
                        }
                    },

                },
            },
            plugins: {
                trigger: new FormValidation.plugins.Trigger(),
                bootstrap: new FormValidation.plugins.Bootstrap()
            }
        }
    );
}

_initValidation();

function Add() {
    if (validation) {
        validation.validate().then(function (status) {
            if (status == 'Valid') {
                var name = $('#name').val().trim();
                var min = $('#min').val().trim();
                var max = $('#max').val().trim();
                var des = $("#des").val().trim();
                $('.Loading').css("display", "block");
                if (name.length <= 0) {
                    toastr.error(resourceAddWH.nhaptenkho)
                    $('.Loading').css("display", "none");
                    return;
                }

                if (min.length <= 0) {
                    toastr.error(resourceAddWH.nhapslmin)
                    $('.Loading').css("display", "none");
                    return;
                }
                if (max.length <= 0) {
                    toastr.error(resourceAddWH.nhapslmax)
                    $('.Loading').css("display", "none");
                    return;
                }
                $.ajax({
                    url: '/WarehouseManagement/WareHouse/Add',
                    type: 'post',
                    data: {
                        "name": name, "min": min, "max": max, "des": des
                    },
                    success: function (data) {
                        if (data.code == 200) {
                            toastr.success(data.msg);
                            setTimeout(function () { window.location.href = "/WarehouseManagement/WareHouse/Index" }, 1000)
                        } else if (data.code == 300) {
                            toastr.error(data.msg)
                        }
                        else {
                            toastr.error(data.msg);
                        }
                    },
                    complete: function () {
                        $('.Loading').css("display", "none");//Request is complete so hide spinner
                    }
                })
            }
        })
    }
    
}
