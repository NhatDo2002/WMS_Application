"use strict";
var arrayGetHeader = []


var arrayFunction = [
    {
        name: "Sửa",
    },
    {
        name: "Xóa",
    },
    {
        name: "Tài Khoản",
        main: "/Register/ListUser"
    },
    {
        name: "Hàng Hóa",
        main: "/Goods/Index"
    },
    {
        name: "Đơn Vị",
        main: "/Unit/Index"
    },
    {
        name: "Danh Mục",
        main: "/GroupGoods/Index"
    },
    {
        name: "Quyền",
        main: "/Permission/Index"
    },
    {
        name: "Mật Khẩu",
        main: "/Register/ListUser"
    },
    {
        name: "Khách Hàng",
        main: "/Customer/Index"
    },
    {
        name: "Loại",
        main: "/TypeCustomer/Index"
    },
    {
        name: "Mật Khẩu",
        main: "/Register/ListUser"
    },
    {
        name: "Nhập",
    },
    {
        name: "Xuất",
    },
    {
        name: "Kho",
        main: "/WareHouse/Index"
    },
    {
        name: "Kiểm Kê",
    },
    {
        name: "Cảnh Báo",
        main: "/RFID/SecurityList"
    }
];

var debounce;
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        // Hủy bỏ timeout trước đó nếu có
        clearTimeout(timeoutId);
        // Tạo timeout mới
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

function changeWhistleStatus(status) {
    $.ajax({
        url: "/RFID/UpdateConfig",
        data: {
            status: status
        },
        success: function (res) {
            var title = "";
            if (res == "True") {
                title = "Còi đã được bật!";
                $('#kt_demo_panel_toggle').attr("data-original-title", "Còi đang được bật")
            }
            else {
                title = "Còi đã được tắt!"
                $('#kt_demo_panel_toggle').attr("data-original-title", "Còi đang được tắt")
            }
            Swal.fire({
                text: title,
                icon: "success",
                buttonsStyling: false,
                confirmButtonText: "Ok, got it!",
                customClass: {
                    confirmButton: "btn btn-primary"
                }
            })
        },
        error: function (res) {
            Swal.fire({
                text: "Error!",
                icon: "error",
                buttonsStyling: false,
                confirmButtonText: "Ok, got it!",
                customClass: {
                    confirmButton: "btn btn-primary"
                }
            })
        }
    });
}

$(document).on('change', '#whistleBtnCheck', function () {
    var $switch = $(this); // Store the reference to the switch
    var currentState = $switch.is(':checked'); // Store the current state

    Swal.fire({
        allowOutsideClick: false,
        text: "Xác nhận thay đổi trạng thái còi?",
        icon: "question",
        buttonsStyling: false,
        showCancelButton: true,
        confirmButtonText: "Ok",
        cancelButtonText: "Cancel",
        customClass: {
            confirmButton: "btn btn-primary",
            cancelButton: "btn btn-danger"
        }
    }).then((result) => {
        if (result.value) {
            changeWhistleStatus(currentState); // Use the stored state directly
        } else {
            // Revert the switch to its original state
            $switch.prop('checked', !currentState);
            console.log("Current state restored:", !currentState);
        }
    });
});



//
// Handle User Quick Search For Dropdown, Inline and Offcanvas Search Panels
//

var KTLayoutSearch = function () {
    // Private properties
    var _target;
    var _form;
    var _input;
    var _closeIcon;
    var _resultWrapper;
    var _resultDropdown;
    var _resultDropdownToggle;
    var _closeIconContainer;
    var _inputGroup;
    var _query = '';

    var _hasResult = false;
    var _timeout = false;
    var _isProcessing = false;
    var _requestTimeout = 200; // ajax request fire timeout in milliseconds
    var _spinnerClass = 'spinner spinner-sm spinner-primary';
    var _resultClass = 'quick-search-has-result';
    var _minLength = 1;

    // Private functions
    var _showProgress = function () {
        _isProcessing = true;
        KTUtil.addClass(_closeIconContainer, _spinnerClass);

        if (_closeIcon) {
            KTUtil.hide(_closeIcon);
        }
    }

    var _hideProgress = function () {
        _isProcessing = false;
        KTUtil.removeClass(_closeIconContainer, _spinnerClass);

        if (_closeIcon) {
            if (_input.value.length < _minLength) {
                KTUtil.hide(_closeIcon);
            } else {
                KTUtil.show(_closeIcon, 'flex');
            }
        }
    }

    var _showDropdown = function () {
        if (_resultDropdownToggle && !KTUtil.hasClass(_resultDropdown, 'show')) {
            $(_resultDropdownToggle).dropdown('toggle');
            $(_resultDropdownToggle).dropdown('update');
        }
    }

    var _hideDropdown = function () {
        if (_resultDropdownToggle && KTUtil.hasClass(_resultDropdown, 'show')) {
            $(_resultDropdownToggle).dropdown('toggle');
        }
    }

    function formatId(str) {
        console.log(str)
        // Đưa chuỗi về dạng không dấu
        var noAccent = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        // Thay thế khoảng trắng bằng dấu gạch dưới
        var formattedId = noAccent.replace(/\s+/g, '_');

        // Chuyển thành chữ thường (hoặc chữ hoa nếu cần)
        return formattedId.toLowerCase(); // hoặc .toUpperCase() nếu cần
    }

    function setHeaderSearch(permission, action) {
        // Duyệt qua mảng và lấy từ đầu tiên xuất hiện trong roleName
        //var result = arrayFunction.find(function (item) {

        //    return permission.toLowerCase().includes(item.name.toLowerCase());
        //});
        //console.log(result)
        //if (result === undefined) {
        //    result = {
        //        name: "Hệ Thống",
        //    }
        //}
        //else if (result.name == "Sửa" || result.name == "Xóa") {
        //   result = arrayFunction.find(function (item) {

        //       return item.name.toLowerCase() !== "sửa" && item.name.toLowerCase() !== "xóa" && permission.toLowerCase().includes(item.name.toLowerCase());
        //   });

        //    action = result.main;
        //}
        /*var getIdDiv = formatId(result.Name);*/

        var getString = `<a href="${action}" class="d-flex align-items-center flex-grow-1 mb-2">
                <div class="symbol symbol-30 bg-transparent flex-shrink-0">
                   <span class="svg-icon svg-icon-primary svg-icon-2x">
                       <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24px" height="24px" viewBox="0 0 24 24" version="1.1">
                            <title>Stockholm-icons / Map / Compass</title>
                            <desc>Created with Sketch.</desc>
                            <defs/>
                            <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                                <rect x="0" y="0" width="24" height="24"/>
                                <path d="M12,21 C7.02943725,21 3,16.9705627 3,12 C3,7.02943725 7.02943725,3 12,3 C16.9705627,3 21,7.02943725 21,12 C21,16.9705627 16.9705627,21 12,21 Z M14.1654881,7.35483745 L9.61055177,10.3622525 C9.47921741,10.4489666 9.39637436,10.592455 9.38694497,10.7495509 L9.05991526,16.197949 C9.04337012,16.4735952 9.25341309,16.7104632 9.52905936,16.7270083 C9.63705011,16.7334903 9.74423017,16.7047714 9.83451193,16.6451626 L14.3894482,13.6377475 C14.5207826,13.5510334 14.6036256,13.407545 14.613055,13.2504491 L14.9400847,7.80205104 C14.9566299,7.52640477 14.7465869,7.28953682 14.4709406,7.27299168 C14.3629499,7.26650974 14.2557698,7.29522855 14.1654881,7.35483745 Z" fill="#000000"/>
                            </g>
                        </svg>
                    </span>
                </div>
                <div class="d-flex flex-column ml-3 mt-2 mb-2">
                    <p class="font-weight-bold text-dark text-hover-primary text-center" style="margin-bottom: 0;">
                        ${permission}
                    </p>
                </div>
            </a>`;
        $(_resultWrapper).append(getString); 
        //var getSearchDiv = $(`#${getIdDiv}`);
        //console.log(getSearchDiv)
        //if (getSearchDiv.length === 0) {
        //    var getHeader = `<div class="font-size-sm text-primary font-weight-bolder text-uppercase mb-2" id="${getIdDiv}">
        //        Quản Lý ${result.name}
        //    </div>`
        //    $(_resultWrapper).append($(getHeader)); 
        //}

        //$(getString).insertAfter(`#${getIdDiv}`);
    }

    var _processSearch = function () {
        if (_hasResult && _query === _input.value) {
            _hideProgress();
            KTUtil.addClass(_target, _resultClass);
            _showDropdown();
            KTUtil.scrollUpdate(_resultWrapper);

            return;
        }

        _query = _input.value;

        KTUtil.removeClass(_target, _resultClass);
        _showProgress();
        _hideDropdown();

        setTimeout(function () {
            $.ajax({
                url: "/Home/SearchFunction",
                data: {
                    query: _query
                },
                dataType: 'json',
                success: function (res) {
                    console.log(res);
                    $(_resultWrapper).empty();
                    foreach(res.data, p => {
                        setHeaderSearch(p.Name, p.Url);
                    })
                    _hasResult = true;
                    _hideProgress();
                    KTUtil.addClass(_target, _resultClass);
                    //KTUtil.setHTML(_resultWrapper, res);
                    _showDropdown();
                    KTUtil.scrollUpdate(_resultWrapper);
                },
                error: function (res) {
                    _hasResult = false;
                    _hideProgress();
                    KTUtil.addClass(_target, _resultClass);
                    KTUtil.setHTML(_resultWrapper, '<span class="font-weight-bold text-muted">Connection error. Please try again later..</div>');
                    _showDropdown();
                    KTUtil.scrollUpdate(_resultWrapper);
                }
            });
        }, 1000);
    }

    var _handleCancel = function (e) {
        _input.value = '';
        _query = '';
        _hasResult = false;
        KTUtil.hide(_closeIcon);
        KTUtil.removeClass(_target, _resultClass);
        _hideDropdown();
    }

    var _handleSearch = function () {
        if (_input.value.length < _minLength) {
            _hideProgress();
            _hideDropdown();

            return;
        }

        if (_isProcessing == true) {
            return;
        }

        if (_timeout) {
            clearTimeout(_timeout);
        }

        _timeout = setTimeout(function () {
            _processSearch();
        }, _requestTimeout);
    }

    // Public methods
    return {
        init: function (id) {
            _target = KTUtil.getById(id);

            if (!_target) {
                return;
            }

            _form = KTUtil.find(_target, '.quick-search-form');
            _input = KTUtil.find(_target, '.form-control');
            _closeIcon = KTUtil.find(_target, '.quick-search-close');
            _resultWrapper = KTUtil.find(_target, '.quick-search-wrapper');
            _resultDropdown = KTUtil.find(_target, '.dropdown-menu');
            _resultDropdownToggle = KTUtil.find(_target, '[data-toggle="dropdown"]');
            _inputGroup = KTUtil.find(_target, '.input-group');
            _closeIconContainer = KTUtil.find(_target, '.input-group .input-group-append');

            // Attach input keyup handler
            KTUtil.addEvent(_input, 'keyup', () => {
                clearTimeout(debounce)
                debounce = setTimeout(_handleSearch, 500);
                
            });
            KTUtil.addEvent(_input, 'focus', () => {
                clearTimeout(debounce)
                debounce = setTimeout(_handleSearch, 500);
            });

            // Prevent enter click
            _form.onkeypress = function (e) {
                var key = e.charCode || e.keyCode || 0;
                if (key == 13) {
                    e.preventDefault();
                }
            }

            KTUtil.addEvent(_closeIcon, 'click', _handleCancel);
        }
    };
};


// Init Search For Quick Search Dropdown
if (typeof KTLayoutSearch !== 'undefined') {
    console.log("Khởi tạo search");
    KTLayoutSearch().init('kt_search_function_dropdown');
}



var js = `<div class="quick-search-result">
    <!--begin::Message-->
    <div class="text-muted d-none">
        No record found
    </div>
    <!--end::Message-->

    <!--begin::Section-->
    <div class="font-size-sm text-primary font-weight-bolder text-uppercase mb-2">
        Documents
    </div>
    <div class="mb-10">
        <div class="d-flex align-items-center flex-grow-1 mb-2">
            <div class="symbol symbol-30 bg-transparent flex-shrink-0">
                <img src="https://preview.keenthemes.com/metronic/theme/html/demo1/dist/assets/media/svg/files/doc.svg" alt=""/>
            </div>
            <div class="d-flex flex-column ml-3 mt-2 mb-2">
                <a href="#" class="font-weight-bold text-dark text-hover-primary">
                AirPlus Requirements
                </a>*
                <span class="font-size-sm font-weight-bold text-muted">
                by Grog John
                </span>
            </div>
        </div>
        <div class="d-flex align-items-center flex-grow-1 mb-2">
            <div class="symbol symbol-30 bg-transparent flex-shrink-0">
                <img src="https://preview.keenthemes.com/metronic/theme/html/demo1/dist/assets/media/svg/files/pdf.svg" alt=""/>
            </div>
            <div class="d-flex flex-column ml-3 mt-2 mb-2">
                <a href="#" class="font-weight-bold text-dark text-hover-primary">
                TechNav Documentation
                </a>
                <span class="font-size-sm font-weight-bold text-muted">
                by Mary Broun
                </span>
            </div>
        </div>
        <div class="d-flex align-items-center flex-grow-1 mb-2">
            <div class="symbol symbol-30 bg-transparent flex-shrink-0">
                <img src="https://preview.keenthemes.com/metronic/theme/html/demo1/dist/assets/media/svg/files/xml.svg" alt=""/>
            </div>
            <div class="d-flex flex-column ml-3 mt-2 mb-2">
                <a href="#" class="font-weight-bold text-dark text-hover-primary">
                All Framework Docs
                </a>
                <span class="font-size-sm font-weight-bold text-muted">
                by Nick Stone
                </span>
            </div>
        </div>
        <div class="d-flex align-items-center flex-grow-1 mb-2">
            <div class="symbol symbol-30 bg-transparent flex-shrink-0">
                <img src="https://preview.keenthemes.com/metronic/theme/html/demo1/dist/assets/media/svg/files/pdf.svg" alt=""/>
            </div>
            <div class="d-flex flex-column ml-3 mt-2 mb-2">
                <a href="#" class="font-weight-bold text-dark text-hover-primary">
                Finance & Accounting Reports
                </a>
                <span class="font-size-sm font-weight-bold text-muted">
                by Jhon Larson
                </span>
            </div>
        </div>
    </div>
    <!--end::Section-->

    <!--begin::Section-->
    <div class="font-size-sm text-primary font-weight-bolder text-uppercase mb-2">
        Members
    </div>
    <div class="mb-10">
        <div class="d-flex align-items-center flex-grow-1 mb-2">
            <div class="symbol symbol-30  flex-shrink-0">
                <div class="symbol-label" style="background-image:url('https://preview.keenthemes.com/metronic/theme/html/demo1/dist/assets/media/users/300_20.jpg')"></div>
            </div>
            <div class="d-flex flex-column ml-3 mt-2 mb-2">
                <a href="#" class="font-weight-bold text-dark text-hover-primary">
                Milena Gibson
                </a>
                <span class="font-size-sm font-weight-bold text-muted">
                UI Designer
                </span>
            </div>
        </div>
        <div class="d-flex align-items-center flex-grow-1 mb-2">
            <div class="symbol symbol-30  flex-shrink-0">
                <div class="symbol-label" style="background-image:url('https://preview.keenthemes.com/metronic/theme/html/demo1/dist/assets/media/users/300_15.jpg')"></div>
            </div>
            <div class="d-flex flex-column ml-3 mt-2 mb-2">
                <a href="#" class="font-weight-bold text-dark text-hover-primary">
                Stefan JohnStefan
                </a>
                <span class="font-size-sm font-weight-bold text-muted">
                Marketing Manager
                </span>
            </div>
        </div>
        <div class="d-flex align-items-center flex-grow-1 mb-2">
            <div class="symbol symbol-30  flex-shrink-0" >
                <div class="symbol-label" style="background-image:url('https://preview.keenthemes.com/metronic/theme/html/demo1/dist/assets/media/users/300_12.jpg')"></div>
            </div>
            <div class="d-flex flex-column ml-3 mt-2 mb-2">
                <a href="#" class="font-weight-bold text-dark text-hover-primary">
                Anna Strong
                </a>
                <span class="font-size-sm font-weight-bold text-muted">
                Software Developer
                </span>
            </div>
        </div>
        <div class="d-flex align-items-center flex-grow-1 mb-2">
            <div class="symbol symbol-30  flex-shrink-0" >
                <div class="symbol-label" style="background-image:url('https://preview.keenthemes.com/metronic/theme/html/demo1/dist/assets/media/users/300_16.jpg')"></div>
            </div>
            <div class="d-flex flex-column ml-3 mt-2 mb-2">
                <a href="#" class="font-weight-bold text-dark text-hover-primary">
                Nick Bold
                </a>
                <span class="font-size-sm font-weight-bold text-muted">
                Project Coordinator
                </span>
            </div>
        </div>
    </div>
    <!--end::Section-->

    <!--begin::Section-->
    <div class="font-size-sm text-primary font-weight-bolder text-uppercase mb-2">
        Files
    </div>
    <div class="mb-10">
        <div class="d-flex align-items-center flex-grow-1 mb-2">
            <div class="symbol symbol-30  flex-shrink-0">
                <div class="symbol-label">
                    <i class="flaticon-psd text-primary"></i>
                </div>
            </div>
            <div class="d-flex flex-column ml-3 mt-2 mb-2">
                <a href="#" class="font-weight-bold text-dark text-hover-primary">
                79 PSD files generated
                </a>
                <span class="font-size-sm font-weight-bold text-muted">
                by Grog John
                </span>
            </div>
        </div>
        <div class="d-flex align-items-center flex-grow-1 mb-2">
            <div class="symbol symbol-30  flex-shrink-0">
                <div class="symbol-label">
                    <i class="flaticon2-supermarket text-warning"></i>
                </div>
            </div>
            <div class="d-flex flex-column ml-3 mt-2 mb-2">
                <a href="#" class="font-weight-bold text-dark text-hover-primary">
                $2900 worth products sold
                </a>
                <span class="font-size-sm font-weight-bold text-muted">
                Total 234 items
                </span>
            </div>
        </div>
        <div class="d-flex align-items-center flex-grow-1 mb-2">
            <div class="symbol symbol-30  flex-shrink-0">
                <div class="symbol-label">
                    <i class="flaticon-safe-shield-protection text-info"></i>
                </div>
            </div>
            <div class="d-flex flex-column ml-3 mt-2 mb-2">
                <a href="#" class="font-weight-bold text-dark text-hover-primary">
                4 New items submitted
                </a>
                <span class="font-size-sm font-weight-bold text-muted">
                Marketing Manager
                </span>
            </div>
        </div>
        <div class="d-flex align-items-center flex-grow-1 mb-2">
            <div class="symbol symbol-30  flex-shrink-0">
                <div class="symbol-label">
                    <i class="flaticon-safe-shield-protection text-warning"></i>
                </div>
            </div>
            <div class="d-flex flex-column ml-3 mt-2 mb-2">
                <a href="#" class="font-weight-bold text-dark text-hover-primary">
                4 New items submitted
                </a>
                <span class="font-size-sm font-weight-bold text-muted">
                Marketing Manager
                </span>
            </div>
        </div>
    </div>
    <!--end::Section-->
</div>`;