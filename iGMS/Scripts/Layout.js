//if (localStorage.getItem("rfidStatus") == null) {
//    $.ajax({
//        url: "/Home/GetRFIDFunction",
//        type: "GET",
//        success: function (response) {
//            if (response.code === 200) {
//                localStorage.setItem("rfidStatus", response.Status);
//            } else {
//                toastr.error("Lấy thông tin rfid thất bại!");
//            }
//        },
//        error: function (xhr, status, err) {
//            toastr.error("Lấy trạng thái RFID lỗi: " + err);
//        }
//    })
//} else {

//}

localStorage.setItem("rfidStatus", false);

var setTimeOutFunc;
//----------------Delete::CateGoods---------------------
var chat = $.connection.realHub;
chat.client.notify = function (message) {
    if (message == "ok") {
        chat();
        if ($('#scroll').attr('data-idSend') != null) {
            detailChatNew($('#scroll').attr('data-idSend'))
        }
    }
    else if (message == "change") {
        ChangeSession()
    }
    else if (message == "saleorder") {
        clearTimeout(setTimeOutFunc)

        setTimeOutFunc = setTimeout(() => {
            if (localStorage.getItem("admin_check") === "true") {
                UpdateFormNotifies()
            }
        }, 500)
    }
    else if (message == "purchase") {
        clearTimeout(setTimeOutFunc)

        setTimeOutFunc = setTimeout(() => {
            if (localStorage.getItem("admin_check") === "true") {
                UpdateFormNotifies()
            }
        }, 500)
    }
    else if (message == "Inventory") {
        clearTimeout(setTimeOutFunc)

        setTimeOutFunc = setTimeout(() => {
            UpdateInventoryNotifies()
        }, 500)

    } else if (message == "locationEpc") {
        $.ajax({
            url: '/Epcs/GetLocationEpc',
            type: 'get',
            success: function (data) {
                $('#idEPC').val(data.epc)
            }
        })
    }
}
$.connection.hub.start().done(function () {
    console.log('Hub started');
});

$(document).on({
    ajaxSend: function (event, jqXHR, settings) {
        // Lọc các yêu cầu Ajax đến server
        if (settings.url != "/Home/GetRecentPage" && !settings.url.startsWith("http")) {
            $("#wait").attr("hidden", false);
        }
    },
    ajaxStop: function (event, jqXHR, settings) {
        // Kiểm tra nếu không còn yêu cầu Ajax nào
        $("#wait").attr("hidden", true);
    }
});

// Save original fetch
const originalFetch = window.fetch;

// Override fetch
window.fetch = async (...args) => {
    //$("#wait").attr("hidden", false);
    try {
        const response = await originalFetch(...args);

        // Optionally clone response to read its content safely
        const clonedResponse = response.clone();
        clonedResponse.text().then(body => {
            //$("#wait").attr("hidden", true);
        });

        return response;
    } catch (error) {
        console.error('❌ Fetch error:', error);
        throw error;
    }
};

function dateConvert(dateString) {
    var ticks = parseInt(dateString.substr(6));
    var date = new Date(ticks);

    var formattedDate = date.toDateString("en-US");

    return formattedDate;
}

toastr.options = {
    "closeButton": true,
    "debug": false,
    "newestOnTop": false,
    "progressBar": true,
    "positionClass": "toast-top-right",
    "preventDuplicates": false,
    "onclick": null,
    "showDuration": "300",
    "hideDuration": "1000",
    "timeOut": "5000",
    "extendedTimeOut": "1000",
    "showEasing": "swing",
    "hideEasing": "linear",
    "showMethod": "show",
    "hideMethod": "slideUp"
};
function validateAndFormatNumber(id) {
    var input = $(`input[name="${id}"]`).val()
    // Remove any non-digit characters
    const number = input.replace(/[^\d.]/g, '');

    // Format the number with comma separators
    const formattedNumber = Number(number).toLocaleString('en-US', {
    });

    $(`input[name="${id}"]`).val(formattedNumber)
}

var totalTrue = 0;
var currentWH = 1;
var pageSize = 10;
var totalWH = 0;
var numNotiWH = 0;

var currentG = 1;
var numNotiG = 0;
var totalG = 0;

var isNotifyChecked = false;

//function GetUserNotify() {
//    $("#kt_quick_panel_hanghoa").html("");
//    $("#kt_quick_panel_notifications").html("");
//    $("#kt_quick_panel_PO").html("");
//    $("#kt_quick_panel_SO").html("");
//    var params = new URLSearchParams({ page: 1, pageSize: 15 });
//    fetch('/Home/GetUserNotify?' + params.toString(), {
//        method: 'GET',
//    })
//        .then(response => response.json())
//        .then(response => {
//            if (response.code === 200) {
//                toastr.info(resourceLayout.new_message);

//                localStorage.setItem("user_notifies", JSON.stringify(response))
//                NotifyGeneration(localStorage.getItem("user_notifies"))
//            }
//        })
//        .catch(error => console.error("Error:", error));
//}

function UpdateInventoryNotifies() {
    var params = new URLSearchParams({ page: 1, pageSize: 15 });
    fetch('/Home/GetInventoryNotifies?' + params.toString(), {
        method: 'GET',
    })
        .then(response => response.json())
        .then(response => {
            if (response.code === 200) {
                toastr.info(resourceLayout.new_message);
                var calculateNumber = Number(localStorage.getItem("total_count_notifies")) - Number(JSON.parse(localStorage.getItem("good_notifies")).totalGood) - Number(JSON.parse(localStorage.getItem("wh_notifies")).totalWH)
                var goodNotifies = {
                    goodNotify: response.goodNotify,
                    numGoodNotify: response.numGoodNotify,
                    totalGood: response.totalGood
                }
                localStorage.setItem("good_notifies", JSON.stringify(goodNotifies));
                var warehouseNotifies = {
                    warehouseNoti: response.warehouseNoti,
                    numWHNotify: response.numWHNotify,
                    totalWH: response.totalWH
                }
                localStorage.setItem("wh_notifies", JSON.stringify(warehouseNotifies));
                calculateNumber = calculateNumber + Number(response.totalWH) + Number(response.totalGood);
                
                localStorage.setItem("total_count_notifies", calculateNumber);
                $('span[name="numberNotifi"]').text(localStorage.getItem("total_count_notifies"));
                InventoryNotifiesGeneration(localStorage.getItem("good_notifies"), localStorage.getItem("wh_notifies"));
            }
        })
        .catch(error => console.error("Error:", error));
}

function UpdateFormNotifies() {
    var params = new URLSearchParams({ page: 1, pageSize: 15 });
    fetch('/Home/GetFormNotifies?' + params.toString(), {
        method: 'GET',
    })
        .then(response => response.json())
        .then(response => {
            if (response.code === 200) {
                toastr.info(resourceLayout.new_message);
                console.log(response)
                var calculateNumber = Number(localStorage.getItem("total_count_notifies")) - Number(JSON.parse(localStorage.getItem("po_notifies")).totalPO) - Number(JSON.parse(localStorage.getItem("so_notifies")).totalSO)
                var poNotifies = {
                    updatePONotifies: response.updatePONotifies,
                    numPONotify: response.numPONotify,
                    totalPO: response.totalPO
                }
                localStorage.setItem("po_notifies", JSON.stringify(poNotifies));
                var soNotifies = {
                    updateSONotifies: response.updateSONotifies,
                    numSONotify: response.numSONotify,
                    totalSO: response.totalSO
                }
                localStorage.setItem("so_notifies", JSON.stringify(soNotifies));
                calculateNumber = calculateNumber + Number(response.totalPO) + Number(response.totalSO);
                localStorage.setItem("total_count_notifies", calculateNumber);
                $('span[name="numberNotifi"]').text(localStorage.getItem("total_count_notifies"));
                FormNotifiesGeneration(localStorage.getItem("po_notifies"), localStorage.getItem("so_notifies"));
            }
        })
        .catch(error => console.error("Error:", error));
}

function GetUserNotify() {
    $("#kt_quick_panel_hanghoa").html("");
    $("#kt_quick_panel_notifications").html("");
    $("#kt_quick_panel_PO").html("");
    $("#kt_quick_panel_SO").html("");
    var params = new URLSearchParams({ page: 1, pageSize: 15 });
    fetch('/Home/GetUserNotify?' + params.toString(), {
        method: 'GET',
    })
        .then(response => response.json())
        .then(response => {
            if (response.code === 200) {
                toastr.info(resourceLayout.new_message);

                localStorage.setItem("admin_check", response.adminCheck);
                var goodNotifies = {
                    goodNotify: response.goodNotify,
                    numGoodNotify: response.numGoodNotify,
                    totalGood: response.totalGood
                }
                localStorage.setItem("good_notifies", JSON.stringify(goodNotifies));
                var warehouseNotifies = {
                    warehouseNoti: response.warehouseNoti,
                    numWHNotify: response.numWHNotify,
                    totalWH: response.totalWH
                }
                localStorage.setItem("wh_notifies", JSON.stringify(warehouseNotifies));
                var poNotifies = {
                    updatePONotifies: response.updatePONotifies,
                    numPONotify: response.numPONotify,
                    totalPO: response.totalPO
                }
                localStorage.setItem("po_notifies", JSON.stringify(poNotifies));
                var soNotifies = {
                    updateSONotifies: response.updateSONotifies,
                    numSONotify: response.numSONotify,
                    totalSO: response.totalSO
                }
                localStorage.setItem("so_notifies", JSON.stringify(soNotifies));
                localStorage.setItem("total_count_notifies", response.countTotal);
                NotifyGeneration(localStorage.getItem("admin_check"), localStorage.getItem("good_notifies"), localStorage.getItem("wh_notifies"), localStorage.getItem("po_notifies"), localStorage.getItem("so_notifies"));
            }
        })
        .catch(error => console.error("Error:", error));
}

function NotifyGeneration(admin_check, good_notifies, wh_notifies, po_notifies, so_notifies) {
    if (admin_check != null && good_notifies != null && wh_notifies != null && po_notifies != null && so_notifies != null) {
        var getGoodsNotifies = JSON.parse(good_notifies);
        var getWHNotifies = JSON.parse(wh_notifies);
        var getPONotifies = JSON.parse(po_notifies);
        var getSOtifies = JSON.parse(so_notifies);
        var getAdminCheck = JSON.parse(admin_check);
        NotifyCheckStock(getWHNotifies.totalWH, getWHNotifies.warehouseNoti, getWHNotifies.numWHNotify);
        NotifyCheckStockGood(getGoodsNotifies.totalGood, getGoodsNotifies.goodNotify, getGoodsNotifies.numGoodNotify);
        if (getAdminCheck) {
            showPurchaseOrderNoti(getPONotifies.totalPO, getPONotifies.updatePONotifies, getPONotifies.numPONotify);
            showSaleOrderNoti(getSOtifies.totalSO, getSOtifies.updateSONotifies, getSOtifies.numSONotify);
        }
        $('span[name="numberNotifi"]').text(localStorage.getItem("total_count_notifies"));
    }
}

function InventoryNotifiesGeneration(good_notifies, wh_notifies) {
    $("#kt_quick_panel_hanghoa").html("");
    $("#kt_quick_panel_notifications").html("");
    currentWH = 1;
    numNotiWH = 0;
    currentG = 1;
    numNotiG = 0;
    var getGoodsNotifies = JSON.parse(good_notifies);
    var getWHNotifies = JSON.parse(wh_notifies);
    NotifyCheckStock(getWHNotifies.totalWH, getWHNotifies.warehouseNoti, getWHNotifies.numWHNotify);
    NotifyCheckStockGood(getGoodsNotifies.totalGood, getGoodsNotifies.goodNotify, getGoodsNotifies.numGoodNotify);
}

function FormNotifiesGeneration(po_notifies, so_notifies) {
    $("#kt_quick_panel_PO").html("");
    $("#kt_quick_panel_SO").html("");
    var getPONotifies = JSON.parse(po_notifies);
    var getSOtifies = JSON.parse(so_notifies);
    console.log(getPONotifies)
    console.log(getSOtifies)
    currentPO = 1;
    numNotiPO = 0;
    currentSO = 1;
    numNotiSO = 0;
    showPurchaseOrderNoti(getPONotifies.totalPO, getPONotifies.updatePONotifies, getPONotifies.numPONotify);
    showSaleOrderNoti(getSOtifies.totalSO, getSOtifies.updateSONotifies, getSOtifies.numSONotify);
}

// Hàm thông báo tồn kho
function NotifyCheckStock(totalWH, warehouseNoti, numWHNotify) {

    if (warehouseNoti.length > 0) {
        var header = `<h5 class="font-weight-normal text-dark-75 text-hover-primary font-size-lg">${resourceLayout.total_quantity_wh}</h5>
    <div class="separator separator-dashed mt-1 mb-2"></div>`
        $('#kt_quick_panel_notifications').append(header);

        $.each(warehouseNoti, function (k, v) {
            showNotify(v.Message, v.Status, v.IdWareHouse, v.IdGoods, v.UserName);
        });
    }

    totalWH = totalWH;
    numNotiWH += warehouseNoti.length;
    $('span[name="numNotiWH"]').text(numWHNotify);
}

//hàm hiển thị thông báo
function showNotify(message, status, idwarehouse, idgoods, username) {
    
    var noti = $('<div class="notification" style="cursor: pointer"></div>');
    var naviItemContent = $('<div class="notification mb-2"></div>');
    var naviLink = $('<div class="notification-link rounded d-flex align-items-center"></div>');
    var symbol = $('<div class="symbol symbol-50 mr-3"><div class="symbol-label"><i class="flaticon-bell text-danger icon-lg"></i></div></div>');
    var naviText = $('<div class="notification-text d-flex align-items-center"><div class="font-weight-normal text-dark-75 text-hover-primary font-size-lg mb-1">' + initMessage(message) + '</div></div>');

    // Thêm các phần tử HTML vào thông báo
    naviLink.append(symbol);
    naviLink.append(naviText);
    naviItemContent.append(naviLink);
    noti.append(naviItemContent);
    noti.addClass('idwh');

    //  Thêm idwarehouse, idgoods vào thuộc tính data để lưu trữ id của kho
    noti.attr('data-idwarehouse', idwarehouse)
    noti.data('idwarehouse', idwarehouse);
    noti.data('idgoods', idgoods)

    // Kiểm tra trạng thái của thông báo
    if (!status && username) {
        // mờ thông báo có status là false
        noti.addClass('status-false');
    }

    //$('#kt_quick_panel').addClass('offcanvas-on');
    $('#kt_quick_panel_notifications').append(noti);
}

function showMoreNoti() {
    $.ajax({
        url: '/warehouse/InventoryCheck',
        type: 'POST',
        data: { page: currentWH, pageSize: 15 },
        dataType: 'json',
        success: function (data) {
            if (data.code == 200) {
                if (data.warehouseNoti.length > 0) {
                    $.each(data.warehouseNoti, function (k, v) {
                        showNotify(v.Message, v.Status, v.IdWareHouse, v.IdGoods, v.UserName);
                    });
                    currentWH += 1;
                    numNotiWH += data.updatedNotify.length;
                }
            }
        },
        error: function (xhr, status, error) {
            //console.error(xhr.responseText);
        }
    });
}


//Lấy thông tin noti Good
function NotifyCheckStockGood(totalGood, goodNotify, numGoodNotify) {
    if (goodNotify.length > 0) {
        var header = `<h5 class="font-weight-normal text-dark-75 text-hover-primary font-size-lg">${resourceLayout.current_inventory_noti}</h5>
    <div class="separator separator-dashed mt-1 mb-2"></div>`
        $('#kt_quick_panel_hanghoa').append(header);

        $.each(goodNotify, function (k, v) {
            showNotifyGood(v.Message, v.Status, v.IdWareHouse, v.IdGoods, v.UserName);
        });
        currentG += 1;
    }
    numNotiG = goodNotify.length;
    totalG += totalGood;
    $('span[name="numNotiG"]').text(numGoodNotify);
}

//Thông báo noti cho good
function showMoreNotiGood() {
    $.ajax({
        url: '/goods/InventoryCheck',
        type: 'POST',
        data: { page: currentG, pageSize: 15 },
        dataType: 'json',
        success: function (data) {
            if (data.code == 200) {
                if (data.updatedNotify.length > 0) {
                    $.each(data.updatedNotify, function (k, v) {
                        showNotifyGood(v.Message, v.Status, v.IdWareHouse, v.IdGoods, v.UserName);
                    });
                    currentG += 1;
                    numNotiG += data.updatedNotify.length;
                }
            }
        },
        error: function (xhr, status, error) {
            //console.error(xhr.responseText);
        }
    });
}

//Tạo thông báo good
function showNotifyGood(message, status, idwarehouse, idgoods, username) {
    var noti = $('<div class="notification" style="cursor: pointer"></div>');
    var naviItemContent = $('<div class="notification mb-2"></div>');
    var naviLink = $('<div class="notification-link rounded d-flex align-items-center"></div>');
    var symbol = $('<div class="symbol symbol-50 mr-3"><div class="symbol-label"><i class="flaticon-bell text-danger icon-lg"></i></div></div>');
    var naviText = $('<div class="notification-text d-flex align-items-center"><div class="font-weight-normal text-dark-75 text-hover-primary font-size-lg mb-1">' + initMessage(message) + '</div></div>');

    // Thêm các phần tử HTML vào thông báo
    naviLink.append(symbol);
    naviLink.append(naviText);
    naviItemContent.append(naviLink);
    noti.append(naviItemContent);
    noti.addClass('idgoods', idgoods);

    //  Thêm idwarehouse, idgoods vào thuộc tính data để lưu trữ id của kho
    noti.attr('data-idwarehouse', idwarehouse)
    noti.attr('data-idgoods', idgoods)
    noti.data('idwarehouse', idwarehouse);
    noti.data('idgoods', idgoods)

    // Kiểm tra trạng thái của thông báo
    if (!status && username) {
        // mờ thông   báo có status là false
        noti.addClass('status-false');
    }

    //$('#kt_quick_panel').addClass('offcanvas-on');
    $('#kt_quick_panel_hanghoa').append(noti);
}


$("#kt_quick_panel_notifications").on('scroll', function (e) {
    var $this = $(this);
    if (this.scrollTop() + $this.innerHeight() >= this.scrollHeight - 2 && numNotiWH !== totalWH) {
        showMoreNoti()
    }
})

$("#kt_quick_panel_hanghoa").on('scroll', function () {
    var $this = $(this);
    if ($this.scrollTop() + $this.innerHeight() >= this.scrollHeight - 2 && numNotiG < totalG) {
        showMoreNotiGood()
    }
})

//hàm cập nhật status = false
function StockNotifyClicked(message) {
    $.ajax({
        url: '/warehouse/InventoryNotifyClicked',
        type: 'post',
        data: { message },
        success: function (data) {
            if (data.code == 200) {
                var getGoodsNotifies = JSON.parse(localStorage.getItem("good_notifies"));
                var itemGoods = getGoodsNotifies.goodNotify.filter(item => item.Message.trim() === message.trim())
                var getWHNotifies = JSON.parse(localStorage.getItem("wh_notifies"));
                var itemWH = getWHNotifies.warehouseNoti.filter(item => item.Message.trim() === message.trim())
                if (itemGoods.length > 0) {
                    itemGoods[0].Status = false;
                    getGoodsNotifies.numGoodNotify = Number(getGoodsNotifies.numGoodNotify) - 1;
                    localStorage.setItem("good_notifies", JSON.stringify(getGoodsNotifies));
                } else if (itemWH.length > 0) {
                    itemWH[0].Status = false;
                    getWHNotifies.numWHNotify = Number(getWHNotifies.numWHNotify) - 1;
                    localStorage.setItem("wh_notifies", JSON.stringify(getWHNotifies));
                }
                localStorage.setItem("total_count_notifies", Number(localStorage.getItem("total_count_notifies")) - 1);
                $('span[name="numberNotifi"]').text(data.numNotify);
                $('span[name="numNoti"]').text(data.numNotify);
            }
        }
    })
}

// sự kiện cho thông báo
$(document).on('mousedown', '.idgoods', function () {
    var message = $(this).find('.notification-text').text().trim();
    $(this).addClass('status-false');
    StockNotifyClicked(message);


    var idwarehouse = $(this).data('idwarehouse');
    var idgoods = $(this).data('idgoods');
    // Lưu trữ idwarehouse vào localstorage
    localStorage.setItem('idwarehouse', idwarehouse);
    localStorage.setItem('idgoods', idgoods !== null ? idgoods : null)

    window.location.href = '/WarehouseManagement/warehouse/ShowList';

    ////idgoods có giá trị
    //if (idwarehouse && idgoods !== null) {

    //    window.location.href = '/warehouse/ShowList?id=' + idwarehouse + '&idgoods=' + idgoods;
    //}
    ////idgoods không có giá trị
    //else if (idwarehouse && idgoods === null) {

    //    // trước khi chuyển hướng xóa idgoods khỏi localstorage
    //    localStorage.removeItem('idgoods');

    //    window.location.href = '/warehouse/ShowList?id=' + idwarehouse;
    //}
})

$(document).on('mousedown', '.idwh', function () {
    var message = $(this).find('.notification-text').text().trim();
    $(this).addClass('status-false');
    StockNotifyClicked(message);


    var idwarehouse = $(this).data('idwarehouse');
    //var idgoods = $(this).data('idgoods');
    // Lưu trữ idwarehouse vào localstorage
    localStorage.setItem('idwarehouse', idwarehouse);
    //localStorage.setItem('idgoods', idgoods !== null ? idgoods : null)

    window.location.href = '/WarehouseManagement/warehouse/ShowList';

})



var currentPO = 1;
var numNotiPO = 0;
var totalPO = 0;

function showPurchaseOrderNoti(totalPO, updatePONotifies, numPONotify) {
    //$.ajax({
    //    url: "/home/GetPurchaseOrderNoti",
    //    type: "GET",
    //    data: {page: 1, pageSize: 15},
    //    success: function (response) {
    //        if (response.code == 200) {

    //        }
    //    },
    //    error: function (error) {

    //    }
    //}).done(function () {
    //    console.log()
    //    // Sau khi Ajax hoàn thành, thực hiện các tác vụ khác
    //    $("span[name='numberNotifi']").text(parseInt($('span[name="numberNotifi"]').text()) + parseInt($('span[name="numNotiPO"]').text()));
    //});
    if ($("#PO-tab").length === 0) {
        var tabString = `<li class="nav-item">
            <a name="WarehouseManagement" class="nav-link" id="PO-tab" data-toggle="tab" href="#kt_quick_panel_PO">
                ${resourceLayout.import_noti}
                <span name="numNotiPO" class="badge badge-danger" style="margin-left: 5px;"></span>
            </a>
        </li>`;
        $("#notiTab").append(tabString);
    }
    
    if (updatePONotifies.length > 0) {
        var header = `<h5 class="font-weight-normal text-dark-75 text-hover-primary font-size-lg">${resourceLayout.receipt_review}</h5>
    <div class="separator separator-dashed mt-1 mb-2"></div>`;

        $('#kt_quick_panel_PO').append(header);
        $.each(updatePONotifies, function (k, v) {
            showNotifyPO(v.Message, v.Status, v.IdWareHouse, v.IdPurchaseOrder, v.CreateBy);
        });
        numNotiPO += updatePONotifies.length;
        totalPO = totalPO;
        $('span[name="numNotiPO"]').text(numPONotify);
    }
}

function showNotifyPO(message, status, idwarehouse, idpo, username) {
    var noti = $('<div class="notification" style="cursor: pointer"></div>');
    var naviItemContent = $('<div class="notification mb-2"></div>');
    var naviLink = $('<div class="notification-link rounded d-flex align-items-center"></div>');
    var symbol = $('<div class="symbol symbol-50 mr-3"><div class="symbol-label"><i class="flaticon-bell text-danger icon-lg"></i></div></div>');
    var naviText = $('<div class="notification-text d-flex align-items-center"><div class="font-weight-normal text-dark-75 text-hover-primary font-size-lg mb-1">' + initMessage(message) + '</div></div>');

    //// Thêm các phần tử HTML vào thông báo
    naviLink.append(symbol);
    naviLink.append(naviText);
    naviItemContent.append(naviLink);
    noti.append(naviItemContent);
    noti.addClass('idpo');
    ////  Thêm idwarehouse, idgoods vào thuộc tính data để lưu trữ id của kho
    noti.attr("data-idpo", idpo)
    //noti.data('idwarehouse', idwarehouse);
    //noti.data('idgoods', idgoods);

    // Kiểm tra trạng thái của thông báo
    if (!status && username) {
        // mờ thông   báo có status là false
        noti.addClass('status-false');
    }

    //$('#kt_quick_panel').addClass('offcanvas-on');
    $('#kt_quick_panel_PO').append(noti);
}

function showMoreNotiPO() {
    $.ajax({
        url: '/home/GetPurchaseOrderNoti',
        type: 'GET',
        data: { page: currentPO, pageSize: 15 },
        dataType: 'json',
        success: function (data) {
            if (data.code == 200) {
                if (data.updateNotifies.length > 0) {
                    $.each(data.updateNotifies, function (k, v) {
                        showNotifyPO(v.Message, v.Status, v.IdWareHouse, v.PurchaseOrder, v.CreateBy);
                    });
                    currentPO += 1;
                    numNotiPO += data.updateNotifies.length;
                }
            }
        },
        error: function (xhr, status, error) {
            //console.error(xhr.responseText);
        }
    });
}

$("#kt_quick_panel_PO").on('scroll', function (e) {
    var $this = $(this);
    if ($thisthis.scrollTop() + $this.innerHeight() >= this.scrollHeight - 2 && numNotiPO !== totalPO) {
        showMoreNotiPO()
    }
})

//hàm cập nhật status = false cho thông báo phiếu nhập
function PONotifyClicked(message, type, element) {
    $.ajax({
        url: '/home/InventoryNotifyClicked',
        type: 'post',
        data: { message, type },
        success: function (data) {
            if (data.code == 200) {
                var getListPONotifies = JSON.parse(localStorage.getItem("po_notifies"));
                var item = getListPONotifies.updatePONotifies.filter(item => item.Message.trim() === message.trim())[0]
                item.Status = false;
                getListPONotifies.numPONotify = Number(item.numPONotify) - 1;
                localStorage.setItem("po_notifies", JSON.stringify(getListPONotifies));
                localStorage.setItem("total_count_notifies", Number(localStorage.getItem("total_count_notifies")) - 1);
                if (parseInt($("span[name='numNotiPO']").text()) > 0) {
                    $("span[name='numNotiPO']").text(parseInt($("span[name='numNotiPO']").text() - 1))
                }
                $('span[name="numNoti"]').text(parseInt($('span[name="numNoti"]').text()) - 1);
            }
        }   
    })
}

// sự kiện cho thông báo phiếu nhập
$(document).on('mousedown', '.idpo', function () {
    var message = $(this).find('.notification-text').text().trim();
    $(this).addClass('status-false');
    PONotifyClicked(message, "PO", this);

    var idpo = $(this).data('idpo');
    localStorage.setItem('idpo', idpo);

    window.location.href = "/WarehouseManagement/PurchaseOrder/List";
})
$(document).on('click', 'a[name="update"]', function () {
    toastr.info("Còn lâu mới có")
})
var currentSO = 1;
var numNotiSO = 0;
var totalSO = 0;

function showSaleOrderNoti(totalSO, updateSONotifies, numSONotify) {
    //$.ajax({
    //    url: "/home/GetSaleOrderNoti",
    //    type: "GET",
    //    data: {page: 1, pageSize: 15 },
    //    success: function (response) {
    //        if (response.code == 200) {

    //        }
    //    },
    //    error: function (error) {

    //    }
    //}).done(function () {
    //    console.log()
    //    // Sau khi Ajax hoàn thành, thực hiện các tác vụ khác
    //    $("span[name='numberNotifi']").text(parseInt($('span[name="numberNotifi"]').text()) + parseInt($('span[name="numNotiSO"]').text()));
    //});
    if ($("#SO-tab").length === 0) {
        var tabString = `<li class="nav-item">
        <a name="WarehouseManagement" class="nav-link" id="SO-tab" data-toggle="tab" href="#kt_quick_panel_SO">
            ${resourceLayout.export_noti}
            <span name="numNotiSO" class="badge badge-danger" style="margin-left: 5px;"></span>
        </a>
    </li>`;
        $("#notiTab").append(tabString);
    }
    

    if (updateSONotifies.length > 0) {
        var header = `<h5 class="font-weight-normal text-dark-75 text-hover-primary font-size-lg">${resourceLayout.issues_review}</h5>
    <div class="separator separator-dashed mt-1 mb-2"></div>`;

        $('#kt_quick_panel_SO').append(header);
        $.each(updateSONotifies, function (k, v) {
            showNotifySO(v.Message, v.Status, v.IdWareHouse, v.IdSaleOrder, v.CreateBy);
        });
        numNotiSO += updateSONotifies.length;
        totalSO = totalSO;
        $('span[name="numNotiSO"]').text(numSONotify);
    }
}

function showNotifySO(message, status, idwarehouse, idso, username) {
    var noti = $('<div class="notification" style="cursor: pointer"></div>');
    var naviItemContent = $('<div class="notification mb-2"></div>');
    var naviLink = $('<div class="notification-link rounded d-flex align-items-center"></div>');
    var symbol = $('<div class="symbol symbol-50 mr-3"><div class="symbol-label"><i class="flaticon-bell text-danger icon-lg"></i></div></div>');
    var naviText = $('<div class="notification-text d-flex align-items-center"><div class="font-weight-normal text-dark-75 text-hover-primary font-size-lg mb-1">' + initMessage(message) + '</div></div>');

    //// Thêm các phần tử HTML vào thông báo
    naviLink.append(symbol);
    naviLink.append(naviText);
    naviItemContent.append(naviLink);
    noti.append(naviItemContent);
    noti.addClass('idso', idso);

    ////  Thêm idwarehouse, idgoods vào thuộc tính data để lưu trữ id của kho
    noti.attr("data-idso", idso)
    //noti.data('idwarehouse', idwarehouse);
    //noti.data('idgoods', idgoods);

    // Kiểm tra trạng thái của thông báo
    if (!status && username) {
        // mờ thông   báo có status là false
        noti.addClass('status-false');
    }

    //$('#kt_quick_panel').addClass('offcanvas-on');
    $('#kt_quick_panel_SO').append(noti);
}

function showMoreNotiSO() {
    $.ajax({
        url: '/home/GetSalerderNoti',
        type: 'GET',
        data: { page: currentSO, pageSize: 15 },
        dataType: 'json',
        success: function (data) {
            if (data.code == 200) {
                if (data.updateNotifies.length > 0) {
                    $.each(data.updateNotifies, function (k, v) {
                        showNotifySO(v.Message, v.Status, v.IdWareHouse, v.IdSaleOrder, v.CreateBy);
                    });
                    currentSO += 1;
                    numNotiSO += data.updateNotifies.length;
                }
            }
        },
        error: function (xhr, status, error) {
            //console.error(xhr.responseText);
        }
    });
}

$("#kt_quick_panel_SO").on('scroll', function (e) {
    var $this = $(this);
    if (this.scrollTop() + $this.innerHeight() >= this.scrollHeight - 2 && numNotiSO !== totalSO) {
        showMoreNotiSO()
    }
})

//hàm cập nhật status = false cho thông báo phiếu nhập
function SONotifyClicked(message, type, element) {
    $.ajax({
        url: '/home/InventoryNotifyClicked',
        type: 'post',
        data: { message, type },
        success: function (data) {
            if (data.code == 200) {
                var getListSONotifies = JSON.parse(localStorage.getItem("so_notifies"));
                var item = getListSONotifies.updateSONotifies.filter(item => item.Message.trim() === message.trim())[0]
                item.Status = false;
                getListSONotifies.numSONotify = Number(item.numSONotify) - 1;
                localStorage.setItem("so_notifies", JSON.stringify(getListSONotifies));
                localStorage.setItem("total_count_notifies", Number(localStorage.getItem("total_count_notifies")) - 1);
                if (parseInt($("span[name='numNotiSO']").text()) > 0) {
                    $("span[name='numNotiSO']").text(parseInt($("span[name='numNotiSO']").text() - 1))
                }
                $('span[name="numNoti"]').text(parseInt($('span[name="numNoti"]').text()) - 1);
            }
        }
    })
}

$("#logOut").on("click", function () {
    localStorage.removeItem("admin_check")
    localStorage.removeItem("good_notifies")
    localStorage.removeItem("po_notifies")
    localStorage.removeItem("so_notifies")
    localStorage.removeItem("wh_notifies")
    window.location.href = "/Home/Logout";
})

// sự kiện cho thông báo phiếu xuất
$(document).on('mousedown', '.idso', function () {
    var message = $(this).find('.notification-text').text().trim();
    $(this).addClass('status-false');
    SONotifyClicked(message, "SO", this);

    var idso = $(this).data('idso');
    localStorage.setItem('idso', idso);

    window.location.href = "/WarehouseManagement/SaleOrder/List";
})

// mở tab thông báo
$('#kt_quick_panel_toggle').on('click', function () {

});

// đóng tab thông báo
$('#kt_quick_panel_close').click(function () {

});

// sự kiện load trang

$(document).ready(function () {
    if (localStorage.getItem("total_count_notifies") === null) {
        localStorage.setItem("total_count_notifies", 0)
    } 
    if (localStorage.getItem("admin_check") === null || localStorage.getItem("good_notifies") === null || localStorage.getItem("po_notifies") === null || localStorage.getItem("so_notifies") === null || localStorage.getItem("wh_notifies") === null) {
        GetUserNotify();
    } else {
        NotifyGeneration(localStorage.getItem("admin_check"), localStorage.getItem("good_notifies"), localStorage.getItem("wh_notifies"), localStorage.getItem("po_notifies"), localStorage.getItem("so_notifies"));
    }
    //if (localStorage.getItem("user_notifies") === null) {
    //    GetUserNotify();
    //} else {
    //    NotifyGeneration(localStorage.getItem("user_notifies"))
    //}
    // lấy thông tin các trang thường xuyên truy cập
    //$(document).on("click", "a", function () {

    //    // Lấy địa chỉ URL của trang mới
    //    var newPageUrl = $(this).attr("href");

    //    $.ajax({
    //        url: newPageUrl,
    //        type: 'get',
    //        success: function (data) {
    //            // Lấy tiêu đề của trang từ dữ liệu trả về
    //            var pageTitle = $(data).filter("title").text();

    //            $.ajax({
    //                url: '/Home/GetRecentPage',
    //                type: 'post',
    //                data: { PageURL: newPageUrl, titlePage: pageTitle },
    //                success: function (data) {
    //                    console.log(data)
    //                },
    //                error: function (xhr, status, error) {
    //                    console.log(status + ': ' + error);
    //                }
    //            });
    //        },
    //        error: function (xhr, status, error) {
    //            console.log(status + ': ' + error);
    //        }
    //    });
    //});

    //chuyển đổi ngôn ngữ
    $('.change-language').click(function () {

        //Lấy giá trị ngôn ngữ từ thuộc tính data-culture
        var culture = $(this).data('culture');
        var returnUrl = window.location.href
        console.log(returnUrl)
        $.ajax({
            url: '/Base/ChangeCulture',
            type: 'post',
            data: { ddlculture: culture, returnUrl: returnUrl },
            success: function (data) {
                if (data.success == true) {
                    localStorage.setItem("language", data.language)
                    if (data.redirectUrl) {
                        window.location.href = data.redirectUrl;
                        console.log(data.redirectUrl);
                    } else {
                        console.error('Error: Redirect URL is invalid.');
                    }
                }
                else {
                    console.error('Error changing language');
                }
            },
            error: function (error) {
                console.error('Error', error);
            }
        });
    });
});

function initMessage(message) {
    var currentLanguage = "en";
    if (localStorage.getItem("language") !== null) {
        currentLanguage = localStorage.getItem("language");
    }
    return message
        .split('|') // tách chuỗi theo dấu |
        .map(part => {
            part = part.trim();
            if (notifyMultilanguage[part] && notifyMultilanguage[part][currentLanguage]) {
                return notifyMultilanguage[part][currentLanguage];
            }
            return part; // nếu không phải key thì giữ nguyên
        })
        .join(' ');
}

function checkSessionvalidity() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/Home/Page_Load', true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.stat === 200) {
                console.log("1")
            } else if (xhr.status === 401) {
                SignOut()
            }
        }
    };
    xhr.send();
}
setInterval(checkSessionvalidity, 4 * 60 * 1000);
// giữ lại giá trị ngôn ngữ đã chọn và cập nhật languageImage


//function convertEPC() {
//    let EPC = "123456789123456789123456";
//    let EPCIN = "";
//    let SGTIN = "";
//    let ItemRef = "";
//    let Result = "";
//    let UPC = "";
//    let i, SGTINResult, ItemRefResult, CheckDigit = 0;
//    //chuyển đổi các ký tự hexa trong chuỗi EPC thành dạng nhị phân 4 bit tương ứng, và nối chúng thành một chuỗi nhị phân duy nhất EPCIN.
//    for (i = 0; i < EPC.length; i++) {
//        EPCIN += parseInt(EPC.substring(i, i + 1), 16).toString(2).padStart(4, '0');
//    }
//    //lấy 82 bit cuối
//    EPCIN = EPCIN.substring(EPCIN.length - 82);
//    //lấy 24 bit đầu
//    SGTIN = EPCIN.substring(0, 24);
//    //lấy 20 bit tiếp theo
//    ItemRef = EPCIN.substring(24, 44);
//    //tính tổng theo công thức (i*2^(length-1-(i--)))
//    SGTINResult = 0;
//    for (i = 1; i < SGTIN.length; i++) {
//        SGTINResult += parseInt(SGTIN[i]) * Math.pow(2, SGTIN.length - i - 1);
//    }

//    //tính tổng theo công thức (i*2^(length-1-(i--)))
//    ItemRefResult = 0;
//    for (i = 1; i < ItemRef.length; i++) {
//        ItemRefResult += parseInt(ItemRef[i]) * Math.pow(2, ItemRef.length - i - 1);
//    }
//    //them 0 trước nếu itemrs không đủ 5 kí tư
//    Result = SGTINResult.toString() + ("00000" + ItemRefResult).substring(Math.max(0, ("00000" + ItemRefResult).length - 5));
//    CheckDigit = 0;
//    for (i = 1; i <= 17; i++) {
//        if (Result.length > Math.abs(i - 17)) {
//            if (i % 2 != 0) {
//                CheckDigit += 3 * parseInt(Result.substring(Result.length - Math.abs(i - 17) - 1, Result.length - Math.abs(i - 17)), 10);
//            } else {
//                CheckDigit += parseInt(Result.substring(Result.length - Math.abs(i - 17) - 1, Result.length - Math.abs(i - 17)), 10);
//            }
//        }
//    }
//    CheckDigit = parseInt(Math.ceil(CheckDigit / 10) * 10, 10) - CheckDigit;
//    UPC = Result + CheckDigit.toString();
//    console.log(UPC)
//}


if (notPermission !== "") {
    if (notPermission !== "False") {
        toastr.error("Bạn không có quyền thực hiện tác vụ này!");
        $.ajax({
            url: "/Base/UpdateSessionCheck",
            type: "GET",
            success: function (response) {

            },
            error: function (error) {
                console.log(er)
            }
        })
    }
}


//--------------------Session::Name--------------
/*chat()*/
$(function UserSession() {
    $.ajax({
        url: '/home/UserSession',
        type: 'get',
        success: function (data) {
            if (data.code == 200) {
                $('span[name="userSession"]').append(data.username);
                $('span[name="firstUserSession"]').append(data.username);
                $('span[name="nameServer"]').append(data.server);
                $('span[name="nameData"]').append(data.database);
                /*                $('span[name="firstUserSession"]').append(data.user.substring(0,1));*/
                //$('span[name="emailSession"]').append(data.email);
                //$('span[name="loginTimeSession"]').append(data.loginTime);
            } else {
                Swal.fire({
                    title: "Lỗi?",
                    text: data.msg,
                    icon: "error"
                });
            }
        }
    })
})


function ChangeSession() {
    $.ajax({
        url: '/home/ChangeSession',
        type: 'post',
        success: function (data) {
            if (data.code == 200) {

            }
        }
    })
}
