var idWH;

$($.ajax({
    url: '/WarehouseManagement/WareHouse/GetNewTransportationSO',
    type: 'post',
    contentType: false, // Không thiết lập contentType để jQuery tự động xác định
    processData: false, // Không xử lý dữ liệu trước khi gửi
    success: function (data) {
        if (data.code == 200) {
            $('#soNumber').val(data.data)
            poNumber = data.data;
        }
        else {
            toastr.error(data.message)
        }
    }
}));

if (localStorage.getItem("moveinWH") !== null) {
    idWH = localStorage.getItem("moveinWH");
    localStorage.removeItem("moveinWH");
    $.ajax({
        url: "/WarehouseManagement/WareHouse/GetWHName",
        type: "POST",
        data: { idWH },
        success: function (response) {
            if (response.code === 200) {
                $("#warehouse").val(response.nameWH);
            } else {
                toastr.error(response.msg)
            }
        },
        error: function (err) {
            console.log(err)
        }
    })
} else {
    toastr.error("Không có kho hàng được chọn");
}


var detailSaleOrder = [];

function getDataModal() {

    var warehouseID = $('#warehouse').val();
    if (warehouseID === "") {
        toastr.info("Không có kho hàng!");
        return
    }
    $('#exampleModalLong').modal('show');
    $('#goods_datatable').KTDatatable('destroy');
    $('#goods_datatable').empty();
    KTAppsUsersListDatatable.init(idWH);
};

$(document).on('click', '#detailGoodBtn', function (e) {
    //var warehouseID = $('#warehouse').val();
    var arrayId = $('.ValueId').children('input[type="checkbox"]:checked')
    arrayId.each(function () {
        if (this.value != 'on') { ListGoods(this.value, idWH) }

    });
    $('#exampleModalLong').modal('hide')
})

function ListGoods(idgood, idwh) {
    $.ajax({
        url: '/WarehouseManagement/SaleOrder/Detail',
        type: 'get',
        data: { idgood, idwh },
        success: function (data) {
            if (data.code == 200) {
                var amount = $('#amount' + data.goodInWH.IdGoods + '').val()
                if (detailSaleOrder.some(item => item.Id === data.goodInWH.IdGoods)) {
                    $('#amount' + data.goodInWH.IdGoods + '').val(Number(amount) + 1)
                }
                else {
                    let table = '<tr id="' + data.goodInWH.IdGoods + '" role="row" class="odd nhanhang">';
                    table += ''
                    table += '<td>' + data.goodInWH.IdGoods + '</td>'
                    table += '<td>' + data.goodInWH.Name + '</td>'
                    table += `<td><input id="amount${data.goodInWH.IdGoods}" value="1" /></td>`
                    table += `<td id="inventory${data.goodInWH.IdGoods}">${data.goodInWH.Inventory}</td>`
                    table += '<td>' + data.goodInWH.GroupGood + '</td>'
                    table += '<td>' + data.goodInWH.Unit + '</td>'
                    table += '<td><i name="delete" class="icon text-dark-50 flaticon-delete-1 mr-3" style="cursor: pointer"></i></td>'
                    table += '</tr>';
                    $('#tbd').append(table);

                    detailSaleOrder.push({
                        Id: data.goodInWH.IdGoods,
                        Name: data.goodInWH.Name,
                        QtyO: data.goodInWH.Inventory,
                        Unit: data.goodInWH.Unit
                    })
                }
                $('#seachidgood').val('')

            }
            else {
                toastr.error(data.msg)
            }
        }
    })
}

$(document).on('click', 'i[name="delete"]', function (e) {
    $(this).closest('tr').remove()

    detailSaleOrder = detailSaleOrder.filter(item => item.Id !== $(this).closest('tr').attr('id'));
})

var KTAppsUsersListDatatable = function () {
    var _demo = function (idWH) {
        var datatable = $('#goods_datatable').KTDatatable({
            // datasource definition
            data: {
                type: 'remote',
                source: {
                    read: {
                        url: '/WarehouseManagement/SaleOrder/ListGoodInWH',
                        params: {
                            idWH: idWH,
                        },
                        map: function (raw) {
                            return raw.data || [];
                        }
                    },
                },
                pageSize: 10,
                serverPaging: true,
                serverFiltering: true,
                serverSorting: true,
            },

            // layout definition
            layout: {
                /*scroll:true,*/
                minHeight: 500,
                footer: false,
                icons: {
                    rowDetail: {
                        expand: 'fa fa-caret-down',
                        collapse: 'fa fa-caret-right'
                    }
                }
            },

            //toolbar: {
            //    items: {
            //        pagination: {
            //            pages: {
            //                mobile: {
            //                    layout: 'compact'
            //                },
            //                tablet: {
            //                    layout: 'default',
            //                    pagesNumber: 3
            //                },
            //                desktop: {
            //                    layout: 'default',
            //                    pagesNumber: 5
            //                }
            //            }
            //        }
            //    }
            //},

            sortable: false,

            pagination: true,

            search: {
                input: $('#kt_datatable_search_query'),

                key: 'generalSearch'
            },

            columns: [{
                field: "Id",
                sortable: false,
                title: "#",
                width: 20,
                selector: {
                    class: 'ValueId',
                },
            }, {
                field: 'STT',
                title: 'STT',
                responsive: {
                    visible: 'md',
                    hidden: 'lg'
                }
            }, {
                field: 'Name',
                title: 'Tên hàng hoá',

            }, {
                field: 'Unit',
                title: 'Đơn vị',
                responsive: {
                    visible: 'md',
                    hidden: 'lg'
                }
            }, {
                field: 'Inventory',
                title: 'Tồn kho',
                responsive: {
                    visible: 'md',
                    hidden: 'lg'
                }
            }],
        });

    };

    return {
        init: function (idWH) {
            _demo(idWH);
        },
    };
}();

$('#add').on('click', function () {
    // Retrieve data for WIRHeader
    if ($("#importWH").val() === "") {
        toastr.error("Vui lòng chọn kho muốn điều chuyển");
        return;
    }

    if (detailSaleOrder.length === 0) {
        toastr.error("Vui lòng chọn hàng hóa muốn điều chuyển");
        return;
    }

    var getList = $(".nhanhang");
    for (var i = 0; i < getList.length; i++) {
        var getIdGood = $(getList[i]).attr("id");
        var getAmount = $(`#amount${getIdGood}`).val();
        var getInventory = parseInt($(`#inventory${getIdGood}`).text());

        if (getAmount > getInventory) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: `Mã hàng ${getIdGood} không đủ tồn kho!`,
                confirmButtonText: 'OK'
            });
            return
        } else {
            detailSaleOrder.filter(d => d.Id == getIdGood)[0].Qty = getAmount;
        }
    }

    var data = {
        IdSO: $("#soNumber").val(),
        WarehouseID: idWH,
        HandlingStatusID: 1,
        Note: $('#note').val(),
        TotalQuantity: 0,
        GoodsList: detailSaleOrder,
        ImportWarehouseID: $("#importWH").val()
    };

    $.ajax({
        url: '/WarehouseManagement/WareHouse/CreateTransportation',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function (response) {
            if (response.code == 200) {
                Swal.fire({
                    icon: 'success',
                    title: 'Thành công',
                    text: response.message,
                    confirmButtonText: 'OK'
                });
                window.location.href = "/WarehouseManagement/SaleOrder/List"
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    html: response.message ? response.message + '<br>Vui lòng chọn lại số lượng hàng hóa, hoặc liên hệ với Admin để xử lý những phiếu chưa xác nhận' : 'An error occurred while saving data.<br>Please check your input.',
                    confirmButtonText: 'OK'
                });
            }
        },
        error: function () {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: response.message,
                confirmButtonText: 'OK'
            });
        }
    });
});

var KTSelect2_Warehouse = function () {
    var demos = function () {
        $('#importWH').select2({
            placeholder: 'Chọn 1 kho',
        });
    }

    function loadWarehouse() {
        $.ajax({
            url: '/WarehouseManagement/WareHouse/GetAllWareHouse',
            method: 'GET',
            data: {id: idWH},
            dataType: 'json',
            success: function (response) {
                if (response.code === 200) {
                    var $warehouseSelect = $('#importWH');

                    $warehouseSelect.empty();

                    $warehouseSelect.append('<option></option>');

                    $.each(response.data, function (index, warehouse) {
                        var option = new Option(warehouse.name, warehouse.id, false, false);
                        $warehouseSelect.append(option);
                    });

                    $warehouseSelect.trigger('change');
                }
            },
            error: function () {
                console.error('Failed to load warehouse data from API.');
            }
        });
    }

    return {
        init: function () {
            demos();
            loadWarehouse();
        }
    };
}();

// Call the init function when the document is ready
jQuery(document).ready(function () {
    KTSelect2_Warehouse.init();
});