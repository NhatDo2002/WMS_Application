//const ids = [
//    'e28068940000400db0d0f84c',
//    'e28068940000400b9e547c79',
//    //'e28068940000400b9e547c79'
//];
var getType = "";
var scannedArray = [];
var arrayGoodEPC = [];
var arrayGoodReading = [];
var arrayReadedEPC = [];
var displayarray = [];
var datatableForReading;
var OrderDetailGoodsScan = function () {
    var _demo = function () {
        // Retrieve the data from localStorage
        var savedData = JSON.parse(localStorage.getItem('detailSaleOrders')) || [];

        datatableForReading = $('#sale-order-goods-scan-datatable').KTDatatable({
            // datasource definition
            data: {
                type: 'local', // changed from 'remote' to 'local'
                source: savedData, // use the data retrieved from localStorage
                pageSize: 10,
            },

            layout: {
                scroll: false,
                footer: false,
            },

            sortable: false,

            pagination: false,

            search: {
                input: $('#kt_subheader_search_form'),
                delay: 400,
                key: 'generalSearch'
            },

            columns: [
                {
                    field: '',
                    title: resourcedelivery.status,
                    width: 100, // Thêm thuộc tính width để thay đổi độ rộng của cột
                    template: function (row, index) {
                        return `<span style="width:100%" class=" font-weight-bolder status${row.idgood}"></span>`;
                    }
                },
                {
                    field: 'STT',
                    title: 'STT',
                    width: 40,
                    template: function (row, index) {
                        return index + 1;
                    }
                },
                {
                    field: 'idgood',
                    title: resourcedelivery.goodsID,
                    textAlign: 'center',
                },
                {
                    field: 'name',
                    title: resourcedelivery.goodsName,
                    textAlign: 'center'
                },
                {
                    field: 'qttscan',
                    title: resourcedelivery.scanQuantity,
                    textAlign: 'center',
                    template: function (data, index) {
                        return `<span style="width:100%" class="font-weight-bolder" id="qtyScan${data.idgood}" data-id="${data.idgood}" data-index=${index}>${data.qttscan}</span>`;
                    }
                },
                {
                    field: 'qtt',
                    title: resourcedelivery.quantity,
                    textAlign: 'center',
                    template: function (data, index) {
                        return `<span style="width:100%" class="qtyO font-weight-bolder" id="qtyO${data.idgood}" data-id="${data.idgood}" data-index=${index}>${data.qtt}</span>`;
                    }
                },
                {
                    field: 'gr',
                    title: resourcedelivery.goodsGroup,
                    textAlign: 'center'
                },
                {
                    field: 'unit',
                    title: resourcedelivery.unit,
                    textAlign: 'center'
                },
            ],
        });

        datatableForReading.on('datatable-on-layout-updated', function () {
            applyRowColors();
        });
    };

    var applyRowColors = function () {
        $('.qtyO').each(function () {
            var $qtyO = $(this);
            var id = $qtyO.data('id');
            //var index = $qtyO.data('index');
            var $qty = $(`#qty${id}`);
            var getqtyScan = $(`#qtyScan${id}`);

            var qtyOValue = parseFloat($qtyO.text());
            var qtyScan = parseFloat(getqtyScan.text());

            var $statusCell = $qtyO.closest('tr').find('td:first');

            if (qtyOValue < qtyScan) {
                $statusCell.css('background-color', 'yellow');
                $(`.status${id}`).text(resourcedelivery.du);
            } else if (qtyOValue > qtyScan) {
                $statusCell.css('background-color', 'red');
                $(`.status${id}`).text(resourcedelivery.thieu);
            } else {
                $statusCell.css('background-color', 'green');
                $(`.status${id}`).text(resourcedelivery.bang);
            }
        });
    }
    return {
        init: function () {
            _demo();
        },
    };
}();


//var OrderDetailSurplusGoodsScan = function () {
//    var _demo = function () {
//        var id = $('input[name="idsalesorder"]').val()
//        var datatable = $('#sale-order-surplus-goods-scan-datatable').KTDatatable({
//            data: {
//                type: 'remote',
//                source: {
//                    read: {
//                        url: '/Delivery/CountScannedSurplusGoodsInADelivery',
//                        data: {
//                            SaleOrderId : id,
//                        },
//                        map: function (raw) {
//                            return raw.data || [];
//                        }
//                    },
//                },
//                pageSize: 10,
//                serverPaging: false,
//                serverFiltering: true,
//                serverSorting: false,
//            },

//            layout: {
//                scroll: false,
//                footer: false,
//            },

//            sortable: true,

//            pagination: true,

//            search: {
//                input: $('#kt_subheader_search_form'),
//                delay: 400,
//                key: 'generalSearch'
//            },

//            columns: [
//                {
//                    field: 'IdGoods',
//                    title: 'MÃ HÀNG HÓA',
//                    textAlign: 'center',
//                },
//                {
//                    field: 'WarehouseName',
//                    title: 'TÊN KHO HÀNG',
//                    textAlign: 'center',
//                },
//                {
//                    field: 'Count',
//                    title: 'SỐ LƯỢNG',
//                    textAlign: 'center'
//                },
//            ],
//        });
//    };
//    return {
//        init: function () {
//            _demo();
//        },
//    };
//}();

jQuery(document).ready(function () {
    GetNV();
    saveDataToLocalStorage();
    //OrderDetailSurplusGoodsScan.init();
});

function saveDataToLocalStorage() {
    var id = localStorage.getItem("idClickToExport")
    if (id !== undefined) {
        $('input[name="idsalesorder"]').val(id)
        GetData(id)
        localStorage.removeItem("idClickToExport");
    }
};

function initReadingTable() {
    $('#tbdRead').empty();
    var tbd = '';
    for (var i = 0; i < arrayGoodReading.length; i++) {
        if (!arrayCTN.some(a => a.id === arrayGoodReading[i].idgood)) {
            var style = "label label-lg label-danger label-pill label-inline";
            var status = resourcedelivery.thieu;
            if (arrayGoodReading[i].qttscan > 0) {
                if (arrayGoodReading[i].qttscan < arrayGoodReading[i].qtt) {
                    style = "label label-lg label-danger label-pill label-inline";
                    status = resourcedelivery.thieu;
                } else if (arrayGoodReading[i].qttscan > arrayGoodReading[i].qtt) {
                    style = "label label-lg label-warning label-pill label-inline";
                    status = resourcedelivery.du;
                } else if (arrayGoodReading[i].qttscan === arrayGoodReading[i].qtt) {
                    style = "label label-lg label-success label-pill label-inline";
                    status = resourcedelivery.bang;
                }

                scannedArray.push({
                    "IdGoods": arrayGoodReading[i].idgood,
                    "Status": false,
                    "Quantity": arrayGoodReading[i].qttscan
                });
            }

            tbd = `<tr id="row${arrayGoodReading[i].idgood}" class="closeRow">
                        <td>${arrayGoodReading[i].idgood}</td>
                        <td>${arrayGoodReading[i].name}</td>
                        <td>${arrayGoodReading[i].unit}</td>
                        <td id="qty${arrayGoodReading[i].idgood}">${arrayGoodReading[i].qtt}</td>
                        <td>
                            <div class="input-group" style="width: 50%;">
                                 <input type="number" disabled="disabled" class="scannedQty form-control" id="total${arrayGoodReading[i].idgood}" disabled data-index="${arrayGoodReading[i].idgood}" style="width:20%;" value="${arrayGoodReading[i].qttscan !== null ? arrayGoodReading[i].qttscan : 0}" placeholder="0">
                                 <input type="hidden" id="recordedScan${arrayGoodReading[i].idgood}" value="${arrayGoodReading[i].qttscan !== null ? arrayGoodReading[i].qttscan : 0}"/>
                            </div>
                        </td>
                        <td><span id="status${arrayGoodReading[i].idgood}" class="${style}">${status}</span></td>
                        
                </tr>`;
            /*var string = `<td style="cursor: pointer; " onclick="toggleRows('${arrayGoodReading[i].idgood}')"><i class="fa fa - caret - down"></i></td>`*/
            arrayCTN.push({
                id: arrayGoodReading[i].idgood,
                qtt: arrayGoodReading[i].qtt,
                qttscan: arrayGoodReading[i].qttscan,
                name: arrayGoodReading[i].name,
                sku: arrayGoodReading[i].sku,
                identifier: arrayGoodReading[i].identifier,
                unit: arrayGoodReading[i].unit
            });
            $('#tbdRead').append(tbd);
            //tbd = `<tr class="nest nested-${arrayGoodReading[i].idgood}" data-parent="${arrayGoodReading[i].idgood}" style="display: none;">`
            //tbd += `<td colspan="6">`
            //tbd += `<table class="table table-separate table-head-custom">`
            //tbd += `<thead>
            //            <th>Mã hàng hóa</th>
            //            <th>Ngày nhập</th>
            //            <th>Vị trí</th>
            //            <th>Số lượng</th>
            //        </thead>`

            //tbd += `<tbody >`
            //foreach(arrayGoodReading[i].listDPO, dpo => {
            //    tbd += `<tr>
            //       <td>${dpo.IdGoods}</td>
            //       <td>${convertDateToString(dpo.CreateDate)}</td>
            //       <td>${dpo.Location}</td>
            //       <td>${dpo.Quantity}</td>
            //   </tr>`;
            //})
            //tbd += "</tbody> </table> </td> </tr>";

            //$('#tbdRead').append(tbd);

        } 


        //var getListEPC = arrayGoodEPC.filter(x => x.IdGoods == arrayGoodReading[i].idgood);
        //foreach(getListEPC, (epc) => {
        //    tbd += `
        //            <tr class="nested" id="${epc}" data-parent="${arrayGoodReading[i].idgood}">

        //          </tr>`
        //});

    }
    //arrayReadedEPC.forEach(function (item) {
    //    var getData = arrayGoodReading.filter(x => x.idgood == item.IdGood)[0];
    //    if (!scannedArray.some(sa => sa.IdGoods === item.IdGood)) {
    //        scannedArray.push({
    //            "IdGoods": item.IdGood,
    //            "Status": false,
    //            "Quantity": item.QuantityScan
    //        });
    //        var $tbd = $("<tr></tr>");
    //        tbd = `
    //                    <td>${item.IdGood}</td>
    //                    <td id="ctn${item.IdGood}">${getData.name}</td>
    //                    <td id="qty${item.IdGood}">${item.Quantity}</td>
    //                    <td>
    //                        <div class="input-group" style="width: 50%;">
    //                             <input type="number" disabled="disabled" class="scannedQty form-control" id="total${item.IdGood}" data-index="${item.IdGood}" style="width:20%;" value="${item.QuantityScan}" placeholder="0">
    //                             <input type="hidden" id="recordedScan${item.IdGood}" value="${item.QuantityScan}"/>
    //                        </div>
    //                    </td>
    //           `;

    //        if (item.Quantity === item.QuantityScan) {
    //            tbd += `<td><span id="status${item.IdGood}" class="label label-lg label-success label-pill label-inline">${resourcedelivery.bang}</span></td>`
    //        } else if (item.Quantity < item.QuantityScan) {
    //            tbd += `<td><span id="status${item.IdGood}" class="label label-lg label-warning label-pill label-inline">${resourcedelivery.du}</span></td>`
    //        } else {
    //            tbd += `<td><span id="status${item.IdGood}" class="label label-lg label-danger label-pill label-inline">${resourcedelivery.thieu}</span></td>`
    //        }
    //        $tbd.append(tbd);

    //        $("#tbdRead").append($tbd);
    //    } else {
    //        $(`#total${item.IdGood}`).val(Number($(`#total${item.IdGood}`).val()) + item.QuantityScan)
    //        $(`#recordedScan${item.IdGood}`).val(Number($(`#recordedScan${item.IdGood}`).val()) + item.QuantityScan)
    //        var getData = scannedArray.filter(sa => sa.IdGoods === item.IdGood)[0];
    //        getData.Quantity += item.QuantityScan;
    //        if (getData.Quantity === item.Quantity) {
    //            $(`#status${item.IdGood}`).attr("class", "label label-lg label-success label-pill label-inline");
    //            $(`#status${item.IdGood}`).text(resourcedelivery.bang);
    //        } else if (getData.Quantity > item.Quantity) {
    //            $(`#status${item.IdGood}`).attr("class", "label label-lg label-warning label-pill label-inline");
    //            $(`#status${item.IdGood}`).text(resourcedelivery.du);
    //        } else {
    //            $(`#status${item.IdGood}`).attr("class", "label label-lg label-danger label-pill label-inline");
    //            $(`#status${item.IdGood}`).text(resourcedelivery.thieu);
    //        }
    //    }
    //});
}


function GetData(id) {
    arrayepcSO = [];
    $.ajax({
        url: '/WarehouseManagement/SaleOrder/Bill',
        type: 'get',
        data: { id: id },
        success: function (data) {
            if (data.code == 200) {
                arrayReadedEPC = [];
                localStorage.removeItem('detailSaleOrders');
                if (data.c.every(d => d.status === true)) {
                    Swal.fire({
                        title: 'Mã Phiếu Xuất Đã quét',
                        icon: "warning"
                    });
                } else {
                    getType = data.c[0].typeStatus;
                    arrayGoodReading = (data.updatedList);
                    foreach(arrayGoodReading, a => {
                        displayarray.push({
                            idgood: a.idgood,
                            display: "display: none;"
                        })
                    })
                    localStorage.setItem('detailSaleOrders', JSON.stringify(data.updatedList));
                    var d = new Date()
                    $('#id').val(d.Day)
                    $('#id').val(d.getDate() + "" + (d.getMonth() + 1) + "" + d.getFullYear() + "" + d.getHours() + "" + d.getMinutes() + "" + d.getSeconds())
                    $.each(data.c, function (k, v) {
                        $('input[name="nameCustomer"]').val(v.customer)
                        $('input[name ="nameWarehouse"]').val(v.ware)
                        $('input[name ="datexuat"]').val(v.createdate)
                        //--------------------------------------------------
                        $('span[name="idsalesorder"]').append(v.id)
                        $('span[name="datedh"]').append(v.createdate)
                        $('span[name="nameCustomer"]').append(v.customer)
                        $('span[name="addressCustomer"]').append(v.address)
                        $('span[name="warehouse"]').append(v.ware)
                    })

                    //$('input[name="nameCustomer"]').val(data.c.customer)
                    //$('input[name ="nameWarehouse"]').val(data.c.ware)
                    //$('input[name ="datexuat"]').val(data.c.createdate)
                    ////--------------------------------------------
                    //$('span[name="idsalesorder"]').append(data.c.id)
                    //$('span[name="datedh"]').append(data.c.createdate)
                    //$('span[name="nameCustomer"]').append(data.c.customer)
                    //$('span[name="addressCustomer"]').append(data.c.address)
                    //$('span[name="warehouse"]').append(data.c.ware)

                    if (data.c.status == true) {
                        $('#confirmExportButton').prop('disabled', true);
                    }

                    if (datatableForReading) {
                        datatableForReading.destroy()
                    }
                    OrderDetailGoodsScan.init()
                    //$('#sale-order-goods-scan-datatable').KTDatatable().reload();
                    arrayCTN = [];
                    arrayepc = [];
                    scannedArray = [];
                    arraySO = [];
                    initReadingTable()
                    toastr.success(data.msg);
                }
            }
            else {
                toastr.error(data.msg)
            }
        }
    })
}

$(document).on('keypress', 'input[name="idsalesorder"]', function (e) {
    if (e.which == 13) {
        var id = $(this).val().trim();
        GetData(id)
    }
})

function GetNV() {
    var currentPath = '/WarehouseManagement/SaleOrder/Index'
    $.ajax({
        url: '/WarehouseManagement/Receipt/UserNVByAction',
        data: {
            currentPath: currentPath
        },
        type: 'get',
        success: function (data) {
            $('#user').empty();
            if (data.code == 200) {
                let table = `<option value="-1">${resourcedelivery.choose_staff}</option>`
                $.each(data.c, function (k, v) {
                    table += '<option value="' + v.id + '">' + v.name + '</option>'
                })
                $('#user').append(table);
            }
        }
    })
}

$('#confirmExportButton').on('click', function () {
    var id = $("#idsalesorder").val();

    $.ajax({
        url: '/WarehouseManagement/SaleOrder/ConfirmSaleOrder',
        type: 'POST',
        data: {
            id
        },
        success: function (response) {
            if (response.code === 200) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: response.message,
                    confirmButtonText: 'OK'
                });
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
            console.log('Error:', error);
        }
    });
});