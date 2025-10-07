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
                            message: resourceEditWH.is_not_empty
                        },
                    },

                },
                min: {
                    validators: {
                        notEmpty: {
                            message: resourceEditWH.is_not_empty
                        },
                        number: {
                            message: resourceEditWH.not_valid_number
                        },
                        callback: {
                            message: "",
                            callback: function (input) {
                                var value = input.value;
                                // Get the value of the select2 field
                                if (value > Number($('#max').val())) {
                                    return {
                                        valid: false,
                                        message: resourceEditWH.min_more_than_max
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
                            message: resourceEditWH.is_not_empty
                        },
                        number: {
                            message: resourceEditWH.not_valid_number
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

function Edit() {
    if (validation) {
        validation.validate().then(function (status) {
            if (status == 'Valid') {
                $('.Loading').css("display", "block");
                var name = $('#name').val().trim();
                var id = $('#id').val().trim();
                var min = $('#min').val().trim();
                var max = $('#max').val().trim();
                var des = $("#des").val().trim();
                if (name.length <= 0) {
                    toastr.error(resourceEditWH.nhaptenkho)
                    $('.Loading').css("display", "none");
                    return;
                }

                if (min.length <= 0) {
                    toastr.error(resourceEditWH.nhapslmin)
                    $('.Loading').css("display", "none");
                    return;
                }
                if (max.length <= 0) {
                    toastr.error(resourceEditWH.nhapslmax)
                    $('.Loading').css("display", "none");
                    return;
                }
                $.ajax({
                    url: '/WarehouseManagement/warehouse/Edit',
                    type: 'post',
                    data: {
                        "id": id, "name": name, "min": min, "max": max, "des": des
                    },
                    success: function (data) {
                        if (data.code == 200) {
                            toastr.success(data.msg)
                            setTimeout(function () { window.location.href = "/WarehouseManagement/WareHouse/Index" }, 1000)
                        }
                        else {
                            toastr.error(data.msg)
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