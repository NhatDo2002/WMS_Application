
var arrayCTN = [];
var arrayepc = [];
var arrayepcSO = [];
var arraySO = [];
var jsonData = [];
var TimeStart = "";
var des = '';
var errorEPC = []
//var fx = "FX96007338E6";
var fx = "FX9600733582";

// Tạo client MQTT mới
//const client = new Paho.MQTT.Client("wss://192.168.1.157:8083/ws", "clientId");
//const client = new Paho.MQTT.Client("ws://192.168.1.157:8083/ws", "clientId");
const client = new Paho.MQTT.Client("103.27.239.28", 10000, "/ws", "clientId");
// Xử lý khi kết nối thành công
client.onConnectionLost = function (responseObject) {
    if (responseObject.errorCode !== 0) {
        console.log("Kết nối bị mất: " + responseObject.errorMessage);
    }
};

$(document).ready(function () {
    if (localStorage.getItem("rfidStatus") == "false") {
        $("#detailBtn").html(resourcedelivery.barcode_scan)
        $(".on").css("display", "none");
        $(document).scannerDetection({
            timeBeforeScanTest: 200, // wait for the next character for upto 200ms
            startChar: [120],
            endChar: [13], // be sure the scan is complete if key 13 (enter) is detected
            avgTimeByChar: 40, // it's not a barcode if a character takes longer than 40ms
            ignoreIfFocusOn: 'input', // turn off scanner detection if an input has focus
            minLength: 0,
            onComplete: function (barcode, qty) {
                CompareEPCSocket(`${barcode}`);
            }, // main callback function
            scanButtonKeyCode: 116, // the hardware scan button acts as key 116 (F5)
            scanButtonLongPressThreshold: 5, // assume a long press if 5 or more events come in sequence
            onError: function (string) { alert('Error ' + string); }
        });
    } else {
        $("#detailBtn").html(resourcedelivery.rfid_scan);
    }
})

function CompareEPCSocket(epc, status = false) {
    var tong = $('#tongScan').text()
    $('#tongScan').text((Number(tong)) + 1)
    if (epc == "") {
        $('#tbdRead').append(`<tr data-valid="false">
                                    <td>${resourcedelivery.empty_barcode}</td>
                                    <td></td>
                                    <td></td>
                                    <td><span class="label label-danger label-pill label-inline mr-2">fail</span></td>
                                    <td class="s">1</td>
                                    <td>${resourcedelivery.unidentified}</td></tr>`)
        return;
    }
    $.ajax({
        url: "/PurchaseOrder/CheckGoodSKUs",
        type: "get",
        data: { barcode: epc },
        success: function (response) {
            if (response.code === 200) {
                var getDataInCTN;
                var checkListSKU;
                /*var getData = response.getAllSkus.filter(item => epc.includes(item.identifier));*/
                if (response.isGoodID) {
                    getDataInCTN = arrayCTN.filter(item => (item.id === response.checkGoodID.Id));
                } else {
                    checkListSKU = response.getAllSkus.map(h => h.Id);
                    getDataInCTN = arrayCTN.filter(item => checkListSKU.includes(item.id));
                }
                if (getDataInCTN.length == 1) {
                    var goods = getDataInCTN[0];
                    if (!scannedArray.some(item => item.IdGoods === goods.id)) {
                        if (!arraySO.some(item => item.IdGoods === goods.id)) {
                            arraySO.push({
                                "IdGoods": goods.id,
                                "Status": false,
                                "Quantity": 1
                            })
                            $(`#total${goods.id}`).removeAttr("disabled");
                            $(`#total${goods.id}`).val(Number($(`#total${goods.id}`).val()) + 1).trigger("change");
                        //    var $tbd = $("<tr></tr>");
                        //    tbd = `
                        //<td>${goods.id}</td>
                        //<td id="ctn${goods.id}">${goods.name}</td>
                        //<td>${goods.unit}</td>
                        //<td id="qty${goods.id}">${goods.qtt}</td>
                        //<td>
                        //    <div class="input-group">
                        //         <input type="number" min="1" onpaste="return false" class="positiveOnly scannedQty form-control" id="total${goods.id}" data-index="${goods.id}" style="width:20%;" value="1" placeholder="0">
                        //         <input type="hidden" id="recordedScan${goods.id}" />
                        //    </div>
                        //</td>
                        //<td><span id="status${goods.id}" class="label label-lg label-danger label-pill label-inline">${resourcedelivery.thieu}</span></td>
                        //`;
                        //    $tbd.append(tbd);
                        //    $container = $("#tbdRead");
                        //    const $firstInvalid = $container.children('tr[data-valid="false"]').first();
                        //    if ($firstInvalid.length) {
                        //        $tbd.insertBefore($firstInvalid);
                        //    } else {
                        //        $("#tbdRead").append($tbd);
                            //    }
                        } else {
                            arraySO.filter(item => item.IdGoods === goods.id)[0].Quantity += 1;
                            $(`#total${goods.id}`).val(Number($(`#total${goods.id}`).val()) + 1).trigger("change");
                        }
                        $(`#recordedScan${goods.id}`).val($(`#total${goods.id}`).val());
                    } else {
                        $(`#total${goods.id}`).removeAttr("disabled");
                        if (!arraySO.some(item => item.IdGoods === goods.id)) {
                            arraySO.push({
                                "IdGoods": goods.id,
                                "Status": false,
                                "Quantity": 1
                            })
                            arraySO.filter(item => item.IdGoods === goods.id)[0].Quantity += 1;
                            $(`#total${goods.id}`).val(Number($(`#total${goods.id}`).val()) + 1).trigger("change");
                        } else {
                            arraySO.filter(item => item.IdGoods === goods.id)[0].Quantity += 1;
                            $(`#total${goods.id}`).val(Number($(`#total${goods.id}`).val()) + 1).trigger("change");
                        }
                        $(`#recordedScan${goods.id}`).val($(`#total${goods.id}`).val());
                    }
                } else {
                    //checkGoodInSystemBarcode(upc, epc);
                    $('#tbdRead').append(`<tr data-valid="false">
                                    <td>${resourcedelivery.not_included_in_form}</td>
                                    <td></td>
                                    <td></td>
                                    <td><span class="label label-danger label-pill label-inline mr-2">fail</span></td>
                                    <td class="s">1</td>
                                    <td><span class="text-danger"></span></td></tr>`);
                }
            } else {
                $('#tbdRead').append(`<tr data-valid="false">
                                    <td>${resourcedelivery.unidentified}</td>
                                    <td></td>
                                    <td></td>
                                    <td><span class="label label-danger label-pill label-inline mr-2">fail</span></td>
                                    <td class="s">1</td>
                                    <td><span class="text-danger"></span></td></tr>`);
            }
        },
        error: function (xhr, status, err) {
            toastr.error(err);
            console.log(err);
        }
    });
}

$(document).on("change", ".scannedQty", function () {
    var getIndex = $(this).data("index");
    if (Number($(this).val()) <= 0) {
        $(this).val($(`#recordedScan${getIndex}`).val());
        return;
    }
    var getScannedData = arraySO.filter(item => item.IdGoods === getIndex)[0];
    if (scannedArray.some(item => item.IdGoods === getIndex)) {
        var getScannedArrayQty = scannedArray.filter(item => item.IdGoods === getIndex)[0].Quantity;
        if (Number($(this).val()) < getScannedArrayQty) {
            $(this).val($(`#recordedScan${getIndex}`).val());
            return;
        } else {
            getScannedData.Quantity = Number($(this).val()) - getScannedArrayQty;
        }
    } else {
        getScannedData.Quantity = Number($(this).val());
    }

    if (Number($(`#qty${getIndex}`).text()) < Number($(this).val())) {
        $(`#status${getIndex}`).attr("class", "label label-lg label-warning label-pill label-inline");
        $(`#status${getIndex}`).text(resourcedelivery.du);
    } else if (Number($(`#qty${getIndex}`).text()) === Number($(this).val())) {
        $(`#status${getIndex}`).attr("class", "label label-lg label-success label-pill label-inline");
        $(`#status${getIndex}`).text(resourcedelivery.bang);
    } else {
        $(`#status${getIndex}`).attr("class", "label label-lg label-danger label-pill label-inline");
        $(`#status${getIndex}`).text(resourcedelivery.thieu);
    }

    $(`#recordedScan${getIndex}`).val($(this).val());
})

function checkGoodInSystem(id) {
    $.ajax({
        url: "/WarehouseManagement/SaleOrder/CheckGoodInSystem",
        type: "POST",
        data: { epc: id },
        success: function(response){
            if (response.code === 200) {
                var checkID = arrayCTN.filter(x => x.id === response.gId);
                if (checkID.length > 0) {
                    $('#tbdRead').append(`<tr data-valid="false">
                                    <td>${response.gEPC}</td>
                                    <td id="qty${response.gId}"><span class="label label-danger label-pill label-inline mr-2">fail</span></td>
                                    <td id="total${response.gId}" class="s">1</td>
                                    <td id="ctn${response.gId}">${response.gId}</td>
                                    <td>${resourcedelivery.belong} ${response.nameWH} ${resourcedelivery.different}</td></tr>`)
                } else {
                    $('#tbdRead').append(`<tr data-valid="false">
                                    <td>${response.gEPC}</td>
                                    <td id="qty${response.gId}"><span class="label label-danger label-pill label-inline mr-2">fail</span></td>
                                    <td id="total${response.gId}" class="s">1</td>
                                    <td id="ctn${response.gId}">${response.gId}</td>
                                    <td>${resourcedelivery.not_in}</td></tr>`)
                }
            } else if (response.code === 400) {
                $('#tbdRead').append(`<tr data-valid="false">
                                    <td>${id}</td>
                                    <td id="qty${id}"><span class="label label-danger label-pill label-inline mr-2">fail</span></td>
                                    <td id="total${id}" class="s">1</td>
                                    <td id="ctn${id}"></td>
                                    <td>${resourcedelivery.unidentified}</td></tr>`)
            } else {
                toastr.error(response.message)
            }
        },
        error: function (error) {
            console.log(error)
        }
    })
}

function checkGoodInSystemBarcode(id, barcode) {
    $.ajax({
        url: "/WarehouseManagement/SaleOrder/CheckGoodInSystemBarcode",
        type: "POST",
        data: { idGood: id },
        success: function (response) {
            if (response.code === 200) {
                if ($(`#total${response.gId}`).length == 0) {
                    $('#tbdRead').append(`<tr data-valid="false">
                                    <td>${response.gId}</td>
                                    <td id="ctn${response.gId}">${response.gName}</td>
                                    <td id="qty${response.gId}"><span class="label label-danger label-pill label-inline mr-2">fail</span></td>
                                    <td id="total${response.gId}" class="s">1</td>
                                    <td><span id="status${response.gId}" class="text-danger">Không nằm trong phiếu</span></td></tr>`)
                } else {
                    $(`#total${response.gId}`).text(Number($(`#total${response.gId}`).text()) + 1);
                }
            } else if (response.code === 400) {
                $('#tbdRead').append(`<tr data-valid="false">
                                    <td>${barcode}</td>
                                    <td id="ctn${id}"></td>
                                    <td id="qty${id}"><span class="label label-danger label-pill label-inline mr-2">fail</span></td>
                                    <td id="total${id}" class="s">1</td>
                                    <td><span class="text-danger">${resourcedelivery.unidentified}</span></td></tr>`)
            } else {
                toastr.error(response.message)
            }
        },
        error: function (error) {
            console.log(error)
        }
    })
}

$('.saveButton').on('click', function () {
    var id = $("#id").val();
    var saleOrderId = $("#idsalesorder").val();
    var deliveryDate = $("#datexuat").val();
    var customerName = $("#nameCustomer").val();
    var warehouseName = $("#nameWarehouse").val();
    var user = $("#user").val();
    var note = $("#note").val();

    var dataToSend = {
        id: id,
        saleOrderId: saleOrderId,
        deliveryDate: deliveryDate,
        customerName: customerName,
        warehouseName: warehouseName,
        user: user,
        note: note,
        arrayEpc: (arraySO)
    };

    if (arraySO.length <= 0) {
        toastr.info(resourcedelivery.no_item);
        return;
    }
    $.ajax({
        url: '/WarehouseManagement/Delivery/SaveDelivery',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(dataToSend),
        success: function (response) {
            if (response.code === 200) {
                Swal.fire({
                    icon: 'success',
                    title: resourcedelivery.success,
                    text: response.message,
                });
                setTimeout(function () { window.location.href = "/WarehouseManagement/SaleOrder/List"; }, 1000)
            }
            else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: response.message,
                    confirmButtonText: 'OK'
                });
            }
        },
        error: function (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error,
                confirmButtonText: 'OK'
            });
        }
    });
});


// Xử lý khi nhận tin nhắn
client.onMessageArrived = function (message) {
    console.log(message)
    // Lấy chuỗi payload từ message
    const payload = message.payloadString;

    // Kiểm tra xem chuỗi có phải là JSON hợp lệ không
    if (isValidJson(payload)) {
        try {
            // Phân tích chuỗi JSON
            const jsonObject = JSON.parse(payload);

            // Kiểm tra xem đối tượng có phải là mảng không
            if (Array.isArray(jsonObject)) {
                var userDefined = jsonObject[0].data.userDefined;
                if (fx == userDefined) {
                    var epc = jsonObject[0].data.idHex;
                    if (!arrayepc.includes(epc)) {
                        arrayepc.push(epc);
                        CompareEPCSocket(epc);
                    }
                }

            } else {
                var userDefined = jsonObject.data.userDefined;
                if (fx == userDefined) {
                    var epc = jsonObject.data.idHex;
                    if (!arrayepc.includes(epc)) {
                        arrayepc.push(epc);
                        CompareEPCSocket(epc);
                    }
                }
            }
        } catch (error) {
            console.error("Lỗi khi phân tích JSON: ", error.message);
        }
    } else {
        console.log("Chuỗi không phải là JSON hợp lệ.");
    }
};

function isValidJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false; // Không hợp lệ
    }
    return true; // Hợp lệ
}


// Khi kết nối thành công
function onConnect() {
    console.log("Kết nối thành công đến broker MQTT");

    // Đăng ký một topic
    client.subscribe("/"+fx+"/tevents", { qos: 0 });
    // Gửi một tin nhắn đến topic
    const message = new Paho.MQTT.Message("Hello from Paho MQTT Client!");
    message.destinationName = "/" + fx +"/tevents"; // Cập nhật tên topic nếu cần
}
var timerInterval; // Đối tượng setInterval
var startTime; // Thời gian bắt đầu


function RFID() {
    //TestReadning()
    $("#read").modal("show");
}

//function TestReadning() {
//    var epcsTest = [
//        "e2801191a50300658b9ce941",
//        "e2801191a50300658b9ce942",
//        "e2801191a50300658b9ce943",
//        "e2801191a50300658b9ce944",
//        "e2801191a50300658b9ce945",
//        "e2801191a50300658b9ce946",
//        "e2801191a50300658b9ce947",
//        "e2801191a50300658b9ce948",
//    ]
//    foreach(epcsTest, (e, i) => {
//        if (!arrayepc.includes(e)) {
//            arrayepc.push(e);
//            CompareEPCSocket(e);
//        }
//    })

//}

function startReading() {
    //TestReadning()
    try {

        $('.on').hide();
        $('.off').show();

        // Kết nối đến broker
        client.connect({
            onSuccess: onConnect,
            useSSL: false // Nếu broker của bạn hỗ trợ SSL thì chuyển thành true
        });
        startTime = new Date().getTime();
        if (TimeStart == "") {
            var myDate = new Date();
            TimeStart = myDate.toISOString();
        }
        timerInterval = setInterval(updateTimer, 1000);
    } catch (error) {
        swal.fire(error.message, "", "error");
    }
}

//function toggleRows(index) {
//    var rows = document.getElementsByClassName("nested");
//    if (displayarray.filter(x => x.idgood === index)[0].display === "display: none;") {
//        displayarray.filter(x => x.idgood === index)[0].display = "display: table-row-group;";
//    } else {
//        displayarray.filter(x => x.idgood === index)[0].display = "display: none;";
//    }
    

//    for (var i = 0; i < rows.length; i++) {
//        var parentIndex = rows[i].getAttribute("data-parent");
//        if (parentIndex === index) {
//            if (rows[i].style.display === "table-row-group") {
//                rows[i].style.display = "none";
//            } else {
//                rows[i].style.display = "table-row-group";
                
//            }
//        }
//    }
//}

function toggleRows(index) {
    $(".nested-" + index).toggle()
}

//stop scanner
function Stop() {
    try {
        $('.on').show();
        $('.off').hide();
        /* clearInterval(startInterval);*/
        client.disconnect();
        clearInterval(timerInterval);
    } catch (error) {
        swal.fire(error.message, "", "error");
    }
}
// Hàm để kiểm tra key khi biết giá trị
function findKeyByArrayValue(obj, value) {
    for (var key in obj) {
        if (obj.hasOwnProperty(key) && Array.isArray(obj[key]) && obj[key].includes(value)) {
            return key;
        }
    }
    // Trả về null nếu không tìm thấy
    return "lỗi epc";
}
//End

//-------------------add--------------------
function updateTimer() {
    var currentTime = new Date().getTime();
    var timeDiff = currentTime - startTime;

    // Chuyển đổi thời gian sang giờ, phút, giây
    var hours = Math.floor(timeDiff / (1000 * 60 * 60));
    var minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

    // Định dạng đồng hồ thành 'giờ:phút:giây'
    var time = hours.toString().padStart(2, '0') + ':' +
        minutes.toString().padStart(2, '0') + ':' +
        seconds.toString().padStart(2, '0');

    var timer = document.getElementById('timer');
    timer.textContent = time;
}

function convertDateToString(date) {
    // Lấy số milliseconds từ chuỗi kiểu /Date(1751358169817)/
    var timestamp = parseInt(date.match(/\d+/)[0], 10);
    var date = new Date(timestamp);

    var day = String(date.getDate()).padStart(2, '0');
    var month = String(date.getMonth() + 1).padStart(2, '0'); // Tháng bắt đầu từ 0
    var year = date.getFullYear();

    return `${day}-${month}-${year}`;
}