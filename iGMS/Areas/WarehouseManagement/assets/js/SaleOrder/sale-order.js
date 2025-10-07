var goodDatatable;

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
                soNumber: {
                    validators: {
                        notEmpty: {
                            message: resources.is_not_empty
                        },
                        callback: {
                            message: resources.invalid_document_code,
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
                warehouse: {
                    validators: {
                        notEmpty: {
                            message: resources.warehouse_required,
                        },
                    }
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

$($.ajax({
    url: '/WarehouseManagement/SaleOrder/GetNewSO',
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

var KTSelect2_Warehouse = function () {
    var demos = function () {
        $('#warehouse, #warehouse_validate').select2({
            placeholder: resources.chooseWH,
        });
    }

    function loadWarehouse() {
        $.ajax({
            url: '/WarehouseManagement/SaleOrder/WareHouse',
            method: 'GET',
            dataType: 'json',
            success: function (response) {
                if (response.code === 200) {
                    var $warehouseSelect = $('#warehouse, #warehouse_validate');

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


var KTSelect2_Customer = function () {
    var demos = function () {
        $('#customerSelect').select2({
            placeholder: resources.chooseCus,
        });
    }

    function loadCustomer() {
        $.ajax({
            url: '/WarehouseManagement/SaleOrder/Customer',
            method: 'GET',
            dataType: 'json',
            success: function (response) {
                if (response.code === 200) {
                    var $customerSelect = $('#customerSelect');

                    $customerSelect.empty();

                    $customerSelect.append('<option></option>');

                    $.each(response.data, function (index, customer) {
                        var option = new Option(customer.name, customer.id, false, false);
                        $customerSelect.append(option);
                    });

                    $customerSelect.trigger('change');
                }
            },
            error: function () {
                console.error('Failed to load customer data from API.');
            }
        });
    }

    return {
        init: function () {
            demos();
            loadCustomer();
        }
    };
}();

// Call the init function when the document is ready
jQuery(document).ready(function () {
    localStorage.clear();
    KTSelect2_Warehouse.init();
    KTSelect2_Customer.init();
    KTAppsUsersListDatatable2.init();
    KTAppsUsersListDatatable.init();
});

$('#customerSelect').on('select2:select', function (e) {
    var selectedValue = $(this).val();
    $.ajax({
        url: '/WarehouseManagement/SaleOrder/GetCustomerById',
        method: 'POST',
        data: {
            id: selectedValue,
        },
        dataType: 'json',
        success: function (response) {
            if (response.code === 200) {
                $('#customerName').val(response.data.name);
                $('#customerAddress').val(response.data.address);
            }
        },
        error: function () {
            console.error('Failed to load customer data from API.');
        }
    });
});

$("#warehouse").on("change", () => {
    detailSaleOrder = [];
    selectedGoods = [];
    KTAppsUsersListDatatable2.init();
    $("#tbd").empty();
})

function getDataModal() {
   
    var warehouseID = $('#warehouse').val();
    if (warehouseID === "") {
        toastr.info(resources.selectWH);
        return
    }
    goodDatatable.search(warehouseID, 'generalSearch');
    $('#exampleModalLong').modal('show');
};

var detailSaleOrder = [];
var selectedGoods = [];

$(document).on('click', '#detailGoodBtn', function (e) {
    var warehouseID = $('#warehouse').val();
    var arrayId = selectedGoods;
    //arrayId.each(function () {
    //    if (this.value != 'on') { ListGoods(this.value, warehouseID) }

    //});
    for (var i = 0; i < arrayId.length; i++) {
        if (arrayId[i] != 'on') {
            ListGoods(arrayId[i], warehouseID)
        }
       
    }
    $('#exampleModalLong').modal('hide')
    selectedGoods = [];
    KTAppsUsersListDatatable2.init();
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
                    table += `<td><input min="1" inputmode="numeric" onpaste="return false" type="number" class="input-amount form-control" id="amount${data.goodInWH.IdGoods}" value="1" /></td>`
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

$(document).on("change", ".input-amount", function () {
    if ($(this).val() <= 0) {
        $(this).val(1);
    }
})

$(document).on('click', 'i[name="delete"]', function (e) {
    $(this).closest('tr').remove()

    detailSaleOrder = detailSaleOrder.filter(item => item.Id !== $(this).closest('tr').attr('id'));
})

var KTAppsUsersListDatatable = function () {
    var _demo = function () {
        goodDatatable = $('#goods_datatable').KTDatatable({
            // datasource definition
            data: {
                type: 'remote',
                source: {
                    read: {
                        url: '/WarehouseManagement/SaleOrder/ListGoodInWH',
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

            translate: {
                records: {
                    processing: resourceLayout.processing,
                    noRecords: resourceLayout.no_data,
                },
                toolbar: {
                    pagination: {
                        items: {
                            info: `${resourceLayout.showing} {{start}} - {{end}} ${resourceLayout.of} {{total}} ${resourceLayout.entries}`
                        }
                    }
                }
            },

            sortable: false,

            pagination: true,

            search: {
                input: $('#kt_datatable_search_query'),

                key: 'GoodName'
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
                title: 'No.',
                width: 50,
                responsive: {
                    visible: 'md',
                    hidden: 'lg'
                }
                },
                {
                    field: '',
                    sortable: false,
                    title: resources.good_id,
                    template: function (row) {
                        return row.Id;
                    }

                },
                {
                field: 'Name',
                title: resources.goodsName,
            }, {
                field: 'Unit',
                title: resources.unit,
                width: 150,
                responsive: {
                    visible: 'md',
                    hidden: 'lg'
                }
            }, {
                field: 'Inventory',
                title: resources.inventory,
                width: 200,
                responsive: {
                    visible: 'md',
                    hidden: 'lg'
                }
            }],
        });

        $('#goods_datatable').on('change', 'th input[type="checkbox"]', function () {
            var isChecked = $(this).is(':checked'); // Kiểm tra trạng thái của checkbox trong <th>

            // Lấy tất cả các checkbox bên trong bảng (ngoại trừ checkbox trong <th>)
            $('#goods_datatable').find('td input[type="checkbox"]').each(function () {
                var id = $(this).val();
                $(this).prop('checked', isChecked); // Check/uncheck tất cả các checkbox

                // Nếu checkbox trong th được check thì thêm tất cả các ID vào selectedPermissions
                if (isChecked) {
                    if (!selectedGoods.includes(id)) {
                        selectedGoods.push(id);
                    }
                } else {
                    // Nếu checkbox trong th bị uncheck thì xóa tất cả các ID khỏi selectedPermissions
                    selectedGoods = selectedGoods.filter(function (item) {
                        return item !== id;
                    });
                }
            });
        });
        $('#goods_datatable').on('change', 'input[type="checkbox"]', function () {
            var id = $(this).val(); // Lấy ID hoặc giá trị của checkbox

            if ($(this).is(':checked')) {
                // Nếu checkbox được chọn, thêm vào danh sách đã chọn
                if (!selectedGoods.includes(id)) {
                    selectedGoods.push(id);
                }
            } else {
                // Nếu checkbox bị bỏ chọn, xóa khỏi danh sách đã chọn
                selectedGoods = selectedGoods.filter(function (item) {
                    return item !== id;
                });
            }
        });

        $('#goods_datatable').on('datatable-on-layout-updated', function () {
            $('input[type="checkbox"]').each(function () {
                var id = $(this).val();
                if (selectedGoods.includes(id)) {
                    $(this).prop('checked', true); // Đánh dấu lại checkbox đã được chọn
                }
            });
        });

    };

    return {
        init: function (warehouseID) {
            _demo(warehouseID);
        },
    };
}();

function showModal(data) {
    // populate modal with data
    $('#modalQuantityStock').val(data.Inventory);
    $('#modalGoodName').val(data.Name);
    $('#modalUnitName').val(data.IdUnit);
    $('#modalGoodsId').val(data.Id);
    // Show the modal
    $('#saveButton').css('display', 'block');
    $('#saveButton2').css('display', 'none');
    $('#rowDetailsModal').modal('show');
}

function saveData() {
    const quantity = parseInt(document.getElementById('modalQuantity').value);
    const stockQuantity = parseInt(document.getElementById('modalQuantityStock').value);

    if (quantity > stockQuantity) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            html: resources.noInventory,
            confirmButtonText: 'OK'
        });
        return;
    }
    // Lấy Id của sản phẩm từ input
    const productId = document.getElementById('modalGoodsId').value;

    // Kiểm tra xem sản phẩm đã tồn tại trong localStorage chưa
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        // Chỉ kiểm tra các key bắt đầu bằng 'data-'
        if (key.startsWith('data-')) {
            const data = JSON.parse(localStorage.getItem(key));
            if (data && data.Id === productId) {
                if (data.Qty + quantity > stockQuantity) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Không đủ tồn kho cho số lượng xuất cộng thêm của sản phẩm này!',
                        confirmButtonText: 'OK'
                    });
                    $('#rowDetailsModal').modal('hide');
                    return;
                }
                data.Qty = data.Qty + quantity;
                // Cập nhật lại vào localStorage
                localStorage.setItem(key, JSON.stringify(data));
                Swal.fire({
                    icon: 'success',
                    title: 'Thành công',
                    text: 'Dữ liệu đã được lưu!',
                    confirmButtonText: 'OK'
                });

                $('#rowDetailsModal').modal('hide');

                $('#kt_datatable2').KTDatatable('destroy');
                $('#kt_datatable2').empty();
                KTAppsUsersListDatatable2.init();
                return;

            }
        }
    }
    // Lấy dữ liệu từ các input
    const data = {
        No: localStorage.length - 1,
        Id: document.getElementById('modalGoodsId').value,
        Name: document.getElementById('modalGoodName').value,
        Qty: quantity,
        QtyO: stockQuantity,
        Unit: document.getElementById('modalUnitName').value,
    };
    localStorage.setItem(`data-${localStorage.length - 2}`, JSON.stringify(data));
    Swal.fire({
        icon: 'success',
        title: 'Thành công',
        html: resources.saveSuccess,
        confirmButtonText: 'OK'
    });

    $('#rowDetailsModal').modal('hide');

    $('#kt_datatable2').KTDatatable('destroy');
    $('#kt_datatable2').empty();
    KTAppsUsersListDatatable2.init();

}


var KTAppsUsersListDatatable2 = function () {

    var _initDatatable2 = function () {
        const data = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('data-')) {
                data.push(JSON.parse(localStorage.getItem(key)));
            }
        }
        var datatable = $('#kt_datatable2').KTDatatable({
            data: {
                type: 'local',
                source: data,
                pageSize: 10,
                serverPaging: true,
                serverFiltering: true,
                serverSorting: true
            },
            layout: {
                scroll: true,
                footer: false
            },
            rows: {
                autoHide: false
            },
            sortable: true,
            pagination: true,
            search: {
                input: $('#kt_subheader_search_form'),
                delay: 400,
                key: 'generalSearch'
            },
            columns: [
                { field: 'No', title: 'No', width: 100, sortable: false },
                { field: 'Id', title: 'Id', width: 100, sortable: false },
                { field: 'Name', title: resources.goodsName, width: 150, sortable: false },
                { field: 'Unit', title: resources.unit, width: 100, sortable: false },
                { field: 'Qty', title: resources.exportQuantity, width: 150, sortable: false },
                {
                    field: 'Edit', title: resources.delete, width: 100, sortable: false,
                    template: function (data) {
                        return `<a class="btn btn-warning edit-btn" onclick="editGoodsInTable('${data.Id}')" style="cursor:pointer">Sửa</a>`;
                    }
                },
                {
                    field: 'Remove', title: 'Xóa', width: 100, sortable: false,
                    template: function (data) {
                        return `<a class="btn btn-danger delete-btn" onclick="deleteGoodsInTable('${data.Id}')" style="cursor:pointer">Xóa</a>`;
                    }
                },
            ]
        });
    };

    return {
        init: function () {
            _initDatatable2();
        }
    };
}();

$('#add').on('click', function () {
    // Retrieve data for WIRHeader
    if (validation) {
        validation.validate().then(function (status) {
            if (status == 'Valid') {
                var tbody = document.getElementById('tbd');
                if (tbody.rows.length > 0) {
                    var getList = $(".nhanhang");
                    for (var i = 0; i < getList.length; i++) {
                        var getIdGood = $(getList[i]).attr("id");
                        var getAmount = $(`#amount${getIdGood}`).val();
                        var getInventory = parseInt($(`#inventory${getIdGood}`).text());

                        if (getAmount > getInventory) {
                            Swal.fire({
                                icon: 'error',
                                title: 'Error',
                                html: `${resources.goodsID} ${getIdGood} ${resources.lessInven}`,
                                confirmButtonText: 'OK'
                            });
                            return
                        } else {
                            detailSaleOrder.filter(d => d.Id == getIdGood)[0].Qty = getAmount;
                        }
                    }

                    var data = {
                        IdSO: $("#soNumber").val(),
                        WarehouseID: $('#warehouse').val(),
                        HandlingStatusID: 1,
                        Note: $('#note').val(),
                        CustomerName: $('#customerSelect').val(),
                        TotalQuantity: 0,
                        GoodsList: detailSaleOrder
                    };

                    $.ajax({
                        url: '/WarehouseManagement/SaleOrder/CreateSaleOrder',
                        method: 'POST',
                        contentType: 'application/json',
                        dataType: 'json',
                        data: JSON.stringify(data),
                        success: function (response) {
                            if (response.code == 200) {
                                Swal.fire({
                                    icon: 'success',
                                    title: resources.success,
                                    html: response.message,
                                    confirmButtonText: 'OK'
                                });
                                window.location.href = "WarehouseManagement/SaleOrder/List"
                            } else {
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Error',
                                    html: response.message ? response.message : "",
                                    confirmButtonText: 'OK'
                                });
                            }
                        },
                        error: function (xhr, status, error) {
                            Swal.fire({
                                icon: 'error',
                                title: 'Error',
                                html: error,
                                confirmButtonText: 'OK'
                            });
                        }
                    });
                }
                else {
                    toastr.error(resources.good_required)
                }
            }
        })
    }
    
});

function removeFromLocalStorage(productId) {
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('data-')) {
            const data = JSON.parse(localStorage.getItem(key));
            if (data && data.Id === productId) {
                localStorage.removeItem(key);
                break;
            }
        }
    }
}

function getProductData(productId) {
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('data-')) {
            const data = JSON.parse(localStorage.getItem(key));
            if (data && data.Id === productId) {
                return data; // Trả về dữ liệu sản phẩm
            }
        }
    }
    return null;
}

function deleteGoodsInTable(id) {
    const productId = id;
    Swal.fire({
        title: 'Bạn có chắc chắn?',
        text: "Bạn có muốn xóa sản phẩm này!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Xóa!',
        cancelButtonText: 'Hủy'
    }).then((result) => {
        if (result.isConfirmed) {
            // Xóa sản phẩm khỏi localStorage
            removeFromLocalStorage(productId);
            Swal.fire(
                'Đã xóa!',
                'Sản phẩm đã được xóa khỏi danh sách.',
                'success'
            );
            $('#kt_datatable2').KTDatatable('destroy');
            $('#kt_datatable2').empty();
            KTAppsUsersListDatatable2.init();
        }
    });
};

// Sự kiện khi nhấn nút Sửa
function editGoodsInTable(id) {
    const productId = id;
    const productData = getProductData(productId);

    // Điền thông tin vào modal
    document.getElementById('modalGoodsId').value = productData.Id;
    document.getElementById('modalGoodName').value = productData.Name;
    document.getElementById('modalQuantity').value = productData.Qty;
    document.getElementById('modalQuantityStock').value = productData.QtyO;
    $('#saveButton2').css('display', 'block');
    $('#saveButton').css('display', 'none');
    // Hiện modal
    $('#rowDetailsModal').modal('show');

    // Cập nhật dữ liệu khi bấm lưu
    document.getElementById('saveButton2').onclick = function () {
        const newQuantity = parseInt(document.getElementById('modalQuantity').value);
        if (newQuantity > productData.QtyO) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Số lượng không thể lớn hơn số lượng hiện có!',
                confirmButtonText: 'OK'
            });
            $('#rowDetailsModal').modal('hide');
            return;
        }

        // Cập nhật dữ liệu trong localStorage
        const updatedData = {
            No: productData.No,
            Id: productData.Id,
            Name: productData.Name,
            Qty: newQuantity,
            QtyO: productData.QtyO,
            Unit: productData.Unit
        };
        localStorage.setItem(`data-${productData.No - 1}`, JSON.stringify(updatedData));
        Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Dữ liệu đã được cập nhật!',
            confirmButtonText: 'OK'
        });
        $('#rowDetailsModal').modal('hide');
        $('#kt_datatable2').KTDatatable('destroy');
        $('#kt_datatable2').empty();
        KTAppsUsersListDatatable2.init(); // Cập nhật lại datatable
    };
};

function isValidId(id) {
    const regex = /^[a-zA-Z0-9_-]+$/;
    //const regex = /^[^\s@#\$%\^&\*\(\)\+\=\{\}\[\]\|\\:;\"'<>,\.\/\?`~]+$/;

    return regex.test(id);
}