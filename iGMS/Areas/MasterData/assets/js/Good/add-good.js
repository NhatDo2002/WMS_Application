"use strict";
// Class definition
var KTWizard1 = function () {
    // Base elements
    var _wizardEl;
    var _formEl;
    var _wizardObj;
    var _validations = [];

    // Private functions
    var _initValidation = function () {
        // Init form validation rules. For more info check the FormValidation plugin's official documentation:https://formvalidation.io/
        // Step 1
        _validations.push(FormValidation.formValidation(
            _formEl,
            {
                fields: {
                    idgood: {
                        validators: {
                            notEmpty: {
                                message: resource.enter_product_code
                            },
                            callback: {
                                message: resource.include_invalid_char,
                                callback: function (input) {
                                    var value = input.value;
                                    // Get the value of the select2 field
                                    if (!isValidId(value)) {
                                        return false;
                                    }

                                    // Otherwise, validation passes
                                    return true;
                                }
                            }
                        }
                    },
                    name: {
                        validators: {
                            notEmpty: {
                                message: resource.enter_product_name
                            }
                        }
                    },
                    //identifier: {
                    //    validators: {
                    //        notEmpty: {
                    //            message: 'Vui lòng điền mã tham chiếu'
                    //        }
                    //    }
                    //},
                    //sku: {
                    //    validators: {
                    //        notEmpty: {
                    //            message: 'Vui lòng điền đơn vị lưu kho'
                    //        }
                    //    }
                    //},

                    //warehouse: {
                    //    validators: {
                    //        callback: {
                    //            message: 'Vui lòng chọn kho hàng',
                    //            callback: function (input) {
                    //                // Get the value of the select2 field
                    //                var value = input.value;

                    //                // If the value is -1, return false to trigger the error message
                    //                if (value === "-1") {
                    //                    return false;
                    //                }

                    //                // Otherwise, validation passes
                    //                return true;
                    //            }
                    //        }
                    //    }
                    //},
                },
                plugins: {
                    trigger: new FormValidation.plugins.Trigger(),
                    // Bootstrap Framework Integration
                    bootstrap: new FormValidation.plugins.Bootstrap({
                        //eleInvalidClass: '',
                        eleValidClass: '',
                    })
                }
            }
        ));
    }

    var _initWizard = function () {
        // Initialize form wizard
        _wizardObj = new KTWizard(_wizardEl, {
            startStep: 1, // initial active step number
            clickableSteps: false  // allow step clicking
        });

        // Validation before going to next page
        _wizardObj.on('change', function (wizard) {
            
            if (wizard.getStep() > wizard.getNewStep()) {
                return; // Skip if stepped back
            }

            if (wizard.getNewStep() == 3) {
                UpdateInfoLastPage();
                wizard.goTo(wizard.getNewStep());
            }


            // Validate form before change wizard step
            var validator = _validations[wizard.getStep() - 1]; // get validator for currnt step

            if (validator) {
                validator.validate().then(function (status) {
                    if (status == 'Valid') {
                        if (wizard.getNewStep() == 3) {
                            UpdateInfoLastPage();
                            wizard.goTo(wizard.getNewStep());
                        }
                        if (wizard.getStep() === 1) {
                            var id = $("#idgood").val();
                            $.ajax({
                                url: "/MasterData/Goods/CheckIdGoodInSystem",
                                type: "Post",
                                data: { id },
                                success: function (response) {
                                    if (response.code == 200) {
                                        wizard.goTo(wizard.getNewStep());
                                    } else {
                                        $("#idgood").focus();
                                        $("#idgood").css("border-color", "red");


                                        toastr.error(resource.goods_exist);
                                    }
                                }
                            })
                        } else {
                            wizard.goTo(wizard.getNewStep());
                        }
                        KTUtil.scrollTop();
                    } else {
                        Swal.fire({
                            text: "Vui lòng điền đầy đủ thông tin bắt buộc trước khi đến bước tiếp theo",
                            icon: "error",
                            buttonsStyling: false,
                            confirmButtonText: "OK",
                            customClass: {
                                confirmButton: "btn btn-primary font-weight-bold"
                            }
                        }).then(function () {
                            KTUtil.scrollTop();
                        });
                    }
                });
            }

            return false;  // Do not change wizard step, further action will be handled by he validator
        });

        // Change event
        _wizardObj.on('changed', function (wizard) {
            KTUtil.scrollTop();
        });

        // Submit event
        _wizardObj.on('submit', function (wizard) {
            AddGoods();
        });
    }

    return {
        // public functions
        init: function () {
            _wizardEl = KTUtil.getById('kt_wizard');
            _formEl = KTUtil.getById('good_add_form');

            _initValidation();
            _initWizard();
        }
    };
}();

jQuery(document).ready(function () {
    KTWizard1.init();
});

$("#idgood").on("change", () => {
    $("#idgood").removeAttr('style');
})

function UpdateInfoLastPage() {
    var goodID = $('#idgood').val();
    $('#ID').html($('#idgood').val());
    $('#NAME').html($('#name').val());
    $('#WAREHOUSE').html($("select[name='warehouse'] option[value='" + $("select[name='warehouse']").val() + "']").html());
    if ($("select[name='groupgoods']").val() == "-1") {
        $('#GROUP').html("");
    } else {
        $('#GROUP').html($("select[name='groupgoods'] option[value='" + $("select[name='groupgoods']").val() + "']").html());
    }
    if ($("select[name='unit']").val() == "-1") {
        $('#UNIT').html("");
    } else {
        $('#UNIT').html($("select[name='unit'] option[value='" + $("select[name='unit']").val() + "']").html());
    }
    $('#NUMBER').html($('#qtt').val());
    $('#EPCCOUNT').html(arrayepc.length);
    $('#EPCTOTAL').html(epcshow.length);
    arrayepc.forEach((item, index) => {
        var tr = `<tr class="more" id="more${goodID}">
                                  <td>${index}</td>
                                  <td>${item}</td>
                                  <td id="${item + "_" + goodID}">${goodID}</td>
                                  </tr>`
        $('#EPCDetail').append(tr);
    })
}

function AddGoods() {

    //lấy thông tin khi nhập vào input....;
    var idGoods = $('#idgood').val();
    var NameGoods = $('#name').val();
    var GroupGoods = $('#groupgoods').val();
    var UnitGoods = $('select[name="unit"]').val();
    var NoteGoods = $('#note').val();
    var Inventory = $('#qtt').val();
    var Identifier = $('#identifier').val();

    //if (!isValidId(idGoods)) {
    //    toastr.error(resource.product_code_standard);
    //    return;
    //}

    var good = {
        Id: idGoods,
        Name: NameGoods,
        IdGroupGood: GroupGoods,
        IdUnit: UnitGoods,
        Description: NoteGoods,
        Inventory: Inventory,
        Identifier: Identifier,
    }
    sendAjaxRequest(good)
}
function sendAjaxRequest(good) {
    var arrayepc = [];
    //var idDetailWarehouse = $('#warehouse').val().trim()
    //if (idDetailWarehouse == "-1") { idDetailWarehouse = null };
    //$.each(errorEPC, function (k, v) {
    //    epcshow = epcshow.filter(function (element) {
    //        return element !== v;
    //    })
    //});
    $.ajax({
        url: '/MasterData/Goods/Add',
        type: 'Post',
        data: { good: good, arrayepc: JSON.stringify(arrayepc) },
        success: function (data) {
            if (data.status == 200) {
                toastr.success(data.msg);
                setTimeout(function () { window.location.href = "/MasterData/Goods/Index"; }, 1000);
            }
            else {
                toastr.error(data.msg);
            }
        },
    });
}

function isValidId(id) {
    const regex = /^[a-zA-Z0-9_-]+$/;
    //const regex = /^[^\s@#\$%\^&\*\(\)\+\=\{\}\[\]\|\\:;\"'<>,\.\/\?`~]+$/;

    return regex.test(id);
}

