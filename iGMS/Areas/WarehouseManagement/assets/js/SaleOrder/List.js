var deliveryDatatable;
var saleDatatable;

var KTAppsUsersListDatatable = function () {

    function validate() {
        var s = $('#tungay').val().trim() == '' ? "1900-12-12" : $('#tungay').val().trim();
        var e = $('#denngay').val().trim() == '' ? "3000-12-12" : $('#denngay').val().trim();
        if (s > e) {
            return false
        }
        else {
            return true
        }
    }

    var _demo = function () {
        saleDatatable = $('#sale-order-datatable').KTDatatable({
            // datasource definition
            data: {
                type: 'remote',
                source: {
                    read: {
                        url: '/WarehouseManagement/SaleOrder/ShowListSaleOrder',
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

            layout: {
                //scroll: false,
                //footer: false,
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

            toolbar: {
                items: {
                    pagination: {
                        pages: {
                            mobile: {
                                layout: 'compact'
                            },
                            tablet: {
                                layout: 'default',
                                pagesNumber: 3
                            },
                            desktop: {
                                layout: 'default',
                                pagesNumber: 5
                            }
                        }
                    }
                }
            },

            sortable: true,

            pagination: true,

            search: {
                input: $('#seachidsaleorder'),
                delay: 400,
                key: 'generalSearch'
            },

            columns: [
                {
                    field: 'No',
                    title: 'STT',
                    sortable: false,
                    width: 40,
                    autoHide: false,
                },
                {
                    field: 'id',
                    title: resources.exportID,
                    //textAlign: 'center',
                    sortable: true,
                    width: 150,
                    autoHide: false,
                    template: function (data) {
                        return `
                        <span class="font-weight-bolder" style="cursor:pointer" name="ClickToExport" data-row='${JSON.stringify(data)}'>${data.id}</span>
                        `
                    }
                },
                {
                    field: 'namewarehouse',
                    title: resources.wh,
                    width: 200,
                    //textAlign: 'center'
                },
                {
                    field: 'namecustomer',
                    title: resources.wh,
                    width: 200,
                },
                {
                    field: 'status',
                    title: resources.status,
                    width: 200,
                    autoHide: false,
                    template: function (row) {
                        var status = {
                            'Chưa quét': {
                                'class': 'label-light-danger',
                                content: resources.noScan
                            },
                            'Đã quét': {
                                'class': 'label-light-success',
                                content: resources.scanned
                            },
                            'Chưa quét xong': {
                                'class': 'label-light-warning',
                                content: resources.notDoneScan
                            },
                        };
                        return '<span class="label font-weight-bold label-lg ' + status[row.status].class + ' label-pill label-inline mr-2">' + status[row.status].content + '</span>';
                    },
                }, {
                    field: 'handlingStatus',
                    title: resources.approveStatus,
                    width: 150,
                    autoHide: false,
                    template: function (row) {
                        var status = {
                            'Chưa duyệt': {
                                'class': 'label-light-danger',
                                content: resources.notApproved
                            },
                            'Đã duyệt': {
                                'class': 'label-light-success',
                                content: resources.approved
                            },
                            'Hủy': {
                                'class': 'label-light-dark',
                                content: resources.cancleApprove
                            },
                        };
                        return '<span class="label font-weight-bold label-lg ' + status[row.handlingStatus].class + ' label-pill label-inline mr-2" id="status' + row.id + '">' + status[row.handlingStatus].content + '</span>';
                    },
                }, {
                    field: 'Actions',
                    title: resources.actions,
                    overflow: 'visible',
                    sortable: false,
                    autoHide: false,
                    width: 100,
                    template: function () {
                        return '';
                    },
                    template: function (row) {
                        var string = ``;
                        if (row.handlingStatus === 'Đã duyệt') {
                            string = `<div class="dropdown dropdown-inline" >
                                <a class="btn btn-primary btn-sm btn-clean btn-icon mr-2" data-toggle="dropdown">
                                      <i class="la la-cog"></i>
                                </a>
                                <div class="dropdown-menu dropdown-menu-sm dropdown-menu-right" style="width:200px">
                                    <ul class="navi flex-column navi-hover py-2">
                                        <li class="navi-header font-weight-bolder text-dark font-size-xs text-primary pb-2">
                                           ${resources.chooseAction}
                                        </li>
                                        <li class="navi-item" onClick="Scan('${row.id}')">
                                           <div class="navi-link" style="cursor: pointer">
                                                <span class="navi-icon"><i class="la la-hourglass-2"></i></span>
                                                <span class="navi-text font-weight-bold text-info">${resources.scanningProcess}</span>
                                            </div>
                                        </li>
                                        <li class="navi-item" data-detail="${row.id}" name="detailBtn">
                                           <div class="navi-link" style="cursor: pointer">
                                                <span class="navi-icon"><i class="la la-check-circle-o"></i></span>
                                                <span class="navi-text font-weight-bold text-primary">${resources.scanList}</span>
                                            </div>
                                        </li>
                                        <li class="navi-item" data-approveBtn="${row.id}" name="approveBtn">
                                            <div class="navi-link" style="cursor: pointer">
                                                <span class="navi-icon"><i class="la la-edit"></i></span>
                                                <span class="navi-text font-weight-bold text-success">${resources.approveSO}</span>
                                            </div>
                                        </li>
                                        <li class="navi-item" data-deleteSO="${row.id}" name="deleteSO">
                                            <div class="navi-link" style="cursor: pointer">
                                                <span class="navi-icon"><i class="la la-remove"></i></span>
                                                <span class="navi-text font-weight-bold text-danger">${resources.deleteSO}</span>
                                            </div>
                                        </li> 
                                    </ul>
                                </div>
                            </div>`;
                        } else {
                            string = `<div class="dropdown dropdown-inline" >
                            <a class="btn btn-primary btn-sm btn-clean btn-icon mr-2" data-toggle="dropdown">
                                  <i class="la la-cog"></i>
                            </a>
                            <div class="dropdown-menu dropdown-menu-sm dropdown-menu-right" style="width:200px">
                                <ul class="navi flex-column navi-hover py-2">
                                    <li class="navi-header font-weight-bolder text-dark font-size-xs text-primary pb-2">
                                       ${resources.chooseAction}
                                    </li>
                                    <li class="navi-item detailunapproveSOBtn" data-detail="${row.id}" data-name="unapproved_detail_modal">
                                       <div class="navi-link" style="cursor: pointer">
                                            <span class="navi-icon"><i class="la la-check-circle-o"></i></span>
                                            <span class="navi-text font-weight-bold text-primary">${resources.export_detail}</span>
                                        </div>
                                    </li>
                                    <li class="navi-item" data-approveBtn="${row.id}" name="approveBtn">
                                        <div class="navi-link" style="cursor: pointer">
                                            <span class="navi-icon"><i class="la la-edit"></i></span>
                                            <span class="navi-text font-weight-bold text-success">${resources.approveSO}</span>
                                        </div>
                                    </li>
                                    <li class="navi-item" data-deleteSO="${row.id}" name="deleteSO">
                                        <div class="navi-link" style="cursor: pointer">
                                            <span class="navi-icon"><i class="la la-remove"></i></span>
                                            <span class="navi-text font-weight-bold text-danger">${resources.deleteSO}</span>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>`
                        }
                        return string;
                    },
                }, {
                    field: 'description',
                    title: resources.note,
                },
                {
                    field: 'createBy',
                    title: resources.createBy,
                },
                {
                    field: 'createdate',
                    title: resources.createDate,
                    template: function (row) {
                        // Assuming the date comes in the format: /Date(1728361938197)/
                        var dateStr = row.createdate;
                        // Extract the timestamp from /Date(XXXXXX)/
                        var timestamp = parseInt(dateStr.replace('/Date(', '').replace(')/', ''), 10);

                        // Create a new Date object from the timestamp
                        var date = new Date(timestamp);

                        // Format the date (e.g., 'MM/DD/YYYY')
                        var formattedDate = date.toLocaleDateString('en-GB', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                        });

                        return `<div class="font-weight-bolder text-primary mb-0">${formattedDate}</div>`;  // Example output: '10/08/2024'
                    },
                },
                //{
                //    field: '', title: 'CHI TIẾT', width: 100, sortable: false,
                //    template: function (data) {
                //        return `
                //            <i class="nav-icon fas fa-list" style="cursor:pointer" onclick='showModal(${JSON.stringify(data)})'></i>
                //        `;
                //    }
                //},
            ],
        });

        function parseJsonDate(jsonDate) {
            const timestamp = jsonDate.match(/\d+/)[0];


            const date = new Date(parseInt(timestamp));


            const formattedDate = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();

            return formattedDate;
        }

        //hiển thị danh sách khi chọn ngày
        $('#tungay').on("change", function () {
            if (validate()) {
                console.log($(this).val())
                saleDatatable.search($(this).val(), 's');
            } else {
                Swal.fire({
                    html: resources.fromError,
                    icon: "error",
                    buttonsStyling: false,
                    confirmButtonText: "Ok, got it!",
                    customClass: {
                        confirmButton: "btn btn-primary"
                    }
                })
                $('#tungay').val("")
            };
        })
        $('#denngay').on("change", function () {
            if (validate()) {
                saleDatatable.search($(this).val(), 'e');
            } else {
                Swal.fire({
                    html: resources.toError,
                    icon: "error",
                    buttonsStyling: false,
                    confirmButtonText: "Ok, got it!",
                    customClass: {
                        confirmButton: "btn btn-primary"
                    }
                })
                $('#denngay').val("")
            };
        })

        saleDatatable.on("datatable-on-layout-updated", function () {
            //var status = localStorage.getItem("sostatus");
            //if (status !== null) {
            //    $("#handlingStatus").val(status).trigger();
            //}

            var idso = localStorage.getItem("idso");
            if (idso !== null) {
                $("#seachidsaleorder").val(idso);
                saleDatatable.search(idso, 'idpurchase');

                localStorage.removeItem("idso");
            }
        })

        $('#statussaleorder').on('change', function () {
            saleDatatable.search($(this).val().toLowerCase(), 'status');
        });

        $('#handlingStatus').on('change', function () {
            localStorage.setItem("sostatus", $(this).val());
            saleDatatable.search($(this).val(), 'handlingStatus');
        });

        $('#warehouse').on('change', function () {
            var filterValue = $(this).val();
            saleDatatable.search(filterValue, 'warehouse');
        });

        //$('#tungay').on('change', function () {
        //    var filterValue = $(this).val();
        //    datatable.search((filterValue), 'tungay');
        //});
        //$('#denngay').on('change', function () {
        //    var filterValue = $(this).val();
        //    datatable.search((filterValue), 'denngay');
        //});
        $('#seachidsaleorder').keyup(function (e) {
            var searchText = $(this).val();
            saleDatatable.search(searchText, 'idpurchase');
        });

        $(document).on('change', 'select[name="nhanVien"]', function () {
            saleDatatable.search($(this).val(), 'staff');
        });


        $('#statussaleorder, #handlingStatus, #seachidsaleorder').selectpicker();
        //$('li[name="detailBtn"]').on('click', function () {
        //    console.log($(this).data('detail'))
        //    //initSubDatatable($(this).data('detail'));
        //    //$('#kt_datatable_modal').modal('show');
        //});

    };

    $('#detail_modal').on('show.bs.modal', function () {
        $('#delivery_modal').modal('hide');
    });
    $('#detail_modal').on('hide.bs.modal', function () {
        $('#delivery_modal').modal('show');
    });

    var deliveryInit = function (id) {
        deliveryDatatable = $('#kt_datatable_delivery').KTDatatable({
            // datasource definition
            data: {
                type: 'remote',
                source: {
                    read: {
                        url: '/WarehouseManagement/SaleOrder/DeliveryList',
                        params: { id: id }
                    },
                },
                pageSize: 5,
                serverPaging: true,
                serverFiltering: true,
                serverSorting: true
            },

            // layout definition
            layout: {
                scroll: true,
                height: 550,
                footer: false,
            },

            // column sorting
            sortable: true,

            pagination: true,

            //search: {
            //    input: $('#seachidpurchase'),
            //    key: 'generalSearch'
            //},

            // columns definition
            columns: [{
                field: 'id',
                title: resources.scanFormID,
                sortable: true,
                width: 100,
                autoHide: false,
                template: function (row) {
                    var output = '';
                    output += '<div class="font-weight-bolder mb-0 delivery" data-typeStatus="' + row.typeStatus +'">' + row.id + '</div>';

                    return output;
                },
            }, {
                field: 'idSO',
                title: resources.exportID,
                sortable: true,
                width: 100,
                autoHide: false,
            }, {
                field: 'status',
                title: resources.goodExporting,
                sortable: true,
                autoHide: false,
                template: function (row) {
                    var status = {
                        'Đã xuất': {
                            'class': 'label-light-success',
                            content: resources.exported
                        },
                        'Chưa xuất': {
                            'class': 'label-light-danger',
                            content: resources.pending
                        },
                    };
                    return '<span class="label font-weight-bold label-lg ' + status[row.status].class + ' label-pill label-inline mr-2">' + status[row.status].content + '</span>';
                },
            }, {
                field: 'handling',
                title: resources.approveStatus,
                sortable: true,
                autoHide: false,
                template: function (row) {
                    var status = {
                        'Đã duyệt': {
                            'class': 'label-light-success',
                            content: resources.approved
                        },
                        'Chưa duyệt': {
                            'class': 'label-light-danger',
                            content: resources.notApproved
                        },
                    };
                    return '<span class="label font-weight-bold label-lg ' + status[row.handling].class + ' label-pill label-inline mr-2">' + status[row.handling].content + '</span>';
                },
            }, {
                field: 'Actions',
                title: resources.actions,
                overflow: 'visible',
                sortable: false,
                autoHide: false,
                template: function (row) {
                    return `<div class="dropdown dropdown-inline mr-4">
                      <button type="button" class="btn btn-light-primary btn-icon btn-sm" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                <span class="svg-icon svg-icon-md">
                                    <svg  width="24px" height="24px" viewBox="0 0 24 24" version="1.1">
                                        <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                                            <rect x="0" y="0" width="24" height="24"/>
                                            <path d="M5,8.6862915 L5,5 L8.6862915,5 L11.5857864,2.10050506 L14.4852814,5 L19,5 L19,9.51471863 L21.4852814,12 L19,14.4852814 L19,19 L14.4852814,19 L11.5857864,21.8994949 L8.6862915,19 L5,19 L5,15.3137085 L1.6862915,12 L5,8.6862915 Z M12,15 C13.6568542,15 15,13.6568542 15,12 C15,10.3431458 13.6568542,9 12,9 C10.3431458,9 9,10.3431458 9,12 C9,13.6568542 10.3431458,15 12,15 Z" fill="#000000"/>
                                        </g>
                                    </svg>
                                </span>
                            </button>
                            <div class="dropdown-menu" aria-labelledby="dropdownMenuButton" style="z-index:1051">
                                <ul class="navi flex-column navi-hover py-2">
                                    <li class="navi-header font-weight-bolder text-dark font-size-xs text-primary pb-2">
                                       ${resources.chooseAction}
                                    </li>
                                    <li class="navi-item" data-checked="${row.id}" data-type="${row.typeStatus}" name="checked" style="cursor: pointer;">
                                        <a class="navi-link">
                                            <span class="navi-icon"><i class="la la-check-circle-o"></i></span>
                                            <span class="navi-text font-weight-bold text-success">${resources.scanApprove}</span>
                                        </a>
                                    </li>
                                      <li class="navi-item" data-edit="${row.id}" name="detailDelivery" style="cursor: pointer;">
                                        <a class="navi-link" >
                                            <span class="navi-icon"><i class="la la-edit"></i></span>
                                            <span class="navi-text font-weight-bold text-primary" >${resources.scandetail}</span>
                                        </a>
                                    </li>
                                    <li class="navi-item" data-deleteBtn="${row.id}" name="deleteBtn" style="cursor: pointer;">
                                        <a class="navi-link" >
                                            <span class="navi-icon"><i class="la la-remove"></i></span>
                                            <span class="navi-text font-weight-bold text-danger">${resources.deletescan}</span>
                                        </a>
                                    </li>
                                   
                                </ul>
                            </div>
                        </div>`;
                },
            }, {
                field: 'description',
                title: resources.note,
                sortable: false,
            }, {
                field: 'createBy',
                title: resources.createBy,
            }, {
                field: 'createDate',
                title: resources.createDate,
                template: function (row) {
                    // Assuming the date comes in the format: /Date(1728361938197)/
                    var dateStr = row.createDate;
                    // Extract the timestamp from /Date(XXXXXX)/
                    var timestamp = parseInt(dateStr.replace('/Date(', '').replace(')/', ''), 10);

                    // Create a new Date object from the timestamp
                    var date = new Date(timestamp);

                    // Format the date (e.g., 'MM/DD/YYYY')
                    var formattedDate = date.toLocaleDateString('en-GB', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                    });

                    return `<div class="font-weight-bolder text-primary mb-0">${formattedDate}</div>`;  // Example output: '10/08/2024'
                },
            }],

        });
        $('#seachidreceipt').keyup(function (e) {
            deliveryDatatable.search($(this).val(), 'idreceipt');
        });
    }

    return {
        init: function () {
            _demo();
        },

        initDeliveryInit: function () {
            deliveryInit()
        }
    };
}();

//var SaleOrderDelivery = function () {
//    var _initTable = function (SaleOrderId) {
//        var datatable = $('#delivery_datatable').KTDatatable({
//            // datasource definition
//            data: {
//                type: 'remote',
//                source: {
//                    read: {
//                        url: '/Delivery/GetDeliveryBySaleOrderId',
//                        data: {
//                            SaleOrderId: SaleOrderId,
//                        },
//                        map: function (raw) {
//                            return raw.data || [];
//                        }
//                    },
//                },
//                pageSize: 10,
//                serverPaging: true,
//                serverFiltering: true,
//                serverSorting: true,
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
//                    field: 'STT',
//                    title: 'STT',
//                },
//                {
//                    field: 'DeliveryId',
//                    title: 'Id',
//                },
//                {
//                    field: 'Description',
//                    title: 'Ghi chú',
//                    textAlign: 'center'

//                },
//                {
//                    field: 'CreateDate',
//                    title: 'Ngày quét',
//                    textAlign: 'center'
//                },
//                {
//                    field: '',
//                    title: 'Chi tiết lần quét',
//                    width: 200,
//                    sortable: false,
//                    textAlign: 'center',
//                    template: function (data) {
//                        return `
//                            <i class="nav-icon fas fa-list" style="cursor:pointer" onclick='showDeliveryDetailModal(${JSON.stringify(data)})'></i>
//                        `;
//                    }
//                },
//            ],
//        });

//        $('#exampleModalLong').on('shown.bs.modal', function () {
//            $('#delivery_datatable').KTDatatable('reload');
//        });

//    };

//    return {
//        init: function (warehouseID) {
//            _initTable(warehouseID);
//        },
//    };
//}();

$(document).on("click", "li[name='detailBtn']", function () {
    var idSO = $(this).data("detail");
    $('#hiddenID').val(idSO)
    $('#detail_modal').modal('hide');
    if (deliveryDatatable != null) {
        deliveryDatatable.search(idSO, 'idSale');
    }
    else {
        KTAppsUsersListDatatable.initDeliveryInit(idSO);
        deliveryDatatable.search(idSO, 'idSale');
    }

    $("#delivery_modal").modal('show');
})

//chi tiết phiếu quét
$(document).on('click', 'li[name="detailDelivery"]', function (e) {
    var id = $(this).attr('data-edit')
    $('#detail_modal').modal('show');
    $.ajax({
        url: '/WarehouseManagement/Delivery/CountScannedGoodsInADelivery',
        type: 'post',
        data: { id },
        success: function (response) {
            $("#tbd1").empty();
            if (response.code === 200) {
                for (var i = 0; i < response.data.length; i++) {
                    let table = '<tr id="' + response.data[i].IdGood.trim() + '" role="row" >';
                    table += '<td>' + Number(i + 1) + '</td>'
                    table += '<td>' + response.data[i].IdGood + '</td>'
                    table += '<td>' + response.data[i].GoodName + '</td>'
                    table += '<td>' + response.data[i].Quantity + '</td>'
                    table += '<td>' + response.data[i].QuantityScan + '</td>';
                    table += '</tr>';
                    $('#tbd1').append(table);
                };
            } else {
                toastr.error(response.msg)
            }

        },
        error: function (err) {
            toastr.error('Lỗi: ' + err);
        }
    })
})

$("#detailSOBtn").on("click", () => {
    var id = $('#hiddenID').val();
    getListSO(id, "")
})

$(document).on("click", ".detailunapproveSOBtn", function () {
    var id = $(this).data("detail");
    var name = $(this).data("name");

    getListSO(id, name)
})

function Scan(idSO) {
    var check = $(`#status${idSO}`).text();
    console.log(resources.approved)
    if (check === resources.approved) {
        localStorage.setItem("idClickToExport", idSO);
        window.location.href = "/WarehouseManagement/Delivery/Index";
    } else {
        Swal.fire({
            title: resources.cannotDo,
            html: resources.soNotApprove,
            icon: "error"
        });
    }
}

function getListSO(id, name) {
    console.log(name)
    var tbd = "tbd1";
    if (name === "") {
        $("#detail_modal").modal('show');
    } else {
        tbd += "_unapproved_detail";
        $("#unapproved_detail_modal").modal('show');
    }
    $.ajax({
        url: "/WarehouseManagement/SaleOrder/GetDetailSO",
        type: "POST",
        data: { id },
        success: function (response) {
            $("#" + tbd).empty();
            if (response.code = 200) {
                for (var i = 0; i < response.data.length; i++) {
                    let table = '<tr id="' + response.data[i].IdGoods.trim() + '" role="row" >';
                    table += '<td>' + Number(i + 1) + '</td>'
                    table += '<td>' + response.data[i].IdGoods + '</td>'
                    table += '<td>' + response.data[i].GoodName + '</td>'
                    table += '<td>' + response.data[i].Quantity + '</td>'
                    if (response.data[i].QuantityScan === null) {
                        table += '<td>0</td>';
                    } else {
                        table += '<td>' + response.data[i].QuantityScan + '</td>';
                    }
                    table += '</tr>';
                    $('#' + tbd).append(table);
                };
            } else {
                toastr.error(response.msg)
            }
        },
        error: function (err) {
            console.log(err)
        }
    })
}

//xóa phiếu quét
$(document).on('click', 'li[name="deleteBtn"]', function (e) {
    var id = $(this).attr('data-deleteBtn')
    Swal.fire({
        allowOutsideClick: false,
        html: resources.confirmScanDelete,
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
        if (result.isConfirmed) {
            $.ajax({
                url: '/WarehouseManagement/Delivery/DeleteDelivery',
                type: 'post',
                data: { id },
                success: function (data) {
                    if (data.code == 200) {
                        toastr.success(data.msg);
                        $("#kt_datatable_delivery").KTDatatable().reload()
                    }
                    else {
                        toastr.error(data.msg);
                    }
                },
                error: function () {
                    toastr.error(resources.errorAjax);
                }
            })

        }
        else {
            Swal.close();
        }
    });
})

var DeliveryDetail = function () {
    var _initTable = function (data) {
        var datatable = $('#delivery_detail_datatable').KTDatatable({
            // datasource definition
            data: {
                type: 'remote',
                source: {
                    read: {
                        url: '/WarehouseManagement/Delivery/CountScannedGoodsInADelivery',
                        data: {
                            DeliveryId: data.DeliveryId,
                            SaleOrderId: data.Id
                        },
                        map: function (raw) {
                            return raw.data || [];
                        }
                    },
                },
                pageSize: 10,
                serverPaging: false,
                serverFiltering: false,
                serverSorting: false,
            },

            layout: {
                scroll: false,
                footer: false,
            },

            sortable: true,

            pagination: true,

            search: {
                input: $('#kt_subheader_search_form'),
                delay: 400,
                key: 'generalSearch'
            },

            columns: [
                {
                    field: 'STT',
                    title: 'STT',
                    textAlign: 'center',
                },
                {
                    field: 'IdGoods',
                    title: resources.goodsID,
                    textAlign: 'center',
                },
                {
                    field: 'GoodName',
                    title: resources.goodsName,
                    textAlign: 'center'

                },
                {
                    field: 'QuantityScan',
                    title: resources.scannedQuantity,
                    textAlign: 'center',
                    width: 250,
                },
            ],
        });

        $('#exampleModalLong').on('shown.bs.modal', function () {
            $('#delivery_detail_datatable').KTDatatable('reload');
        });

    };

    return {
        init: function (warehouseID) {
            _initTable(warehouseID);
        },
    };
}();

jQuery(document).ready(function () {
    KTAppsUsersListDatatable.init();
});

function showModal(data) {
    $('#delivery_datatable').KTDatatable('destroy');
    $('#delivery_datatable').empty();
    SaleOrderDelivery.init(data.SaleOrderId);
    if (data.HandlingStatus === 2 || data.HandlingStatus === 3) {
        $('#btnConfirm').prop('disabled', true);
    }
    else {
        $('#btnConfirm').prop('disabled', false);
    }
    $('#modalSaleOrderId').val(data.SaleOrderId);
    $('#exampleModalLong').modal('show');
};

function showDeliveryDetailModal(data) {
    $('#delivery_detail_datatable').KTDatatable('destroy');
    $('#delivery_detail_datatable').empty();
    DeliveryDetail.init(data);
    $('#deliveryDetailModal').modal('show');
};
$(document).on('click', 'span[name="ClickToExport"]', function () {
    var rowData = JSON.parse($(this).attr('data-row'));
    console.log(rowData)
    if (rowData.handlingStatus === "Đã duyệt") {
        localStorage.setItem("idClickToExport", rowData.id);
        window.location.href = "/WarehouseManagement/Delivery/Index";
    } else {
        Swal.fire({
            title: resources.cannotDo,
            html: resources.soNotApprove,
            icon: "error"
        });
    }
})

//duyệt phiếu nhập
$(document).on('click', 'li[name="approveBtn"]', function () {
    var id = $(this).attr('data-approveBtn')
    Swal.fire({
        allowOutsideClick: false,
        html: resources.soConfirm,
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
        if (result.isConfirmed) {
            updateSO(id);
        }
        else {
            Swal.close();
        }
    });
})

$(document).on('click', 'li[name="checked"]', function () {
    var id = $(this).attr('data-checked');
    var getType = $(this).attr('data-type');
    var ids = [id];
    Swal.fire({
        allowOutsideClick: false,
        html: resources.confirmScanApprove,
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
        if (result.isConfirmed) {
            if (getType !== "1") {
                approveDelivery(ids);
            } else {
                approveDeliveryMoveGoods(ids)
            }
        }
        else {
            Swal.close();
        }
    });
})

$(document).on('click', 'button[name="approveAllDelivery"]', function () {
    var listIdDeliveries = $(".delivery");
    var ids = [];
    var getType = "";

    for (var i = 0; i < listIdDeliveries.length; i++) {
        ids.push(listIdDeliveries[i].innerText)
        console.log(listIdDeliveries[i].getAttribute("data-typestatus"));
        if (listIdDeliveries[i].getAttribute("data-typestatus") !== "null") {
            getType = "1";
        }
    }
    Swal.fire({
        allowOutsideClick: false,
        html: resources.approveAllScan,
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
        if (result.isConfirmed) {
            if (getType !== "1") {
                approveDelivery(ids);
            } else {
                approveDeliveryMoveGoods(ids)
            }
        }
        else {
            Swal.close();
        }
    });
})

function approveDeliveryMoveGoods(ids) {
    $.ajax({
        url: '/WarehouseManagement/WareHouse/ApproveDeliveryMoveGoods',
        type: 'post',
        data: { ids },
        success: function (data) {
            if (data.code == 200) {
                toastr.success(data.msg)
                $("#kt_datatable_delivery").KTDatatable().reload();
                // Chuyển đổi base64 thành byte array
                data.fileList.forEach(file => {
                    const byteCharacters = atob(file.fileContentBase64); // Giải mã Base64
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);

                    // Tạo Blob từ byte array
                    const blob = new Blob([byteArray], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

                    // Tạo link để tải xuống mà không cần append vào DOM
                    const link = document.createElement("a");
                    const url = window.URL.createObjectURL(blob);
                    link.href = url;
                    link.download = file.fileName; // Đặt tên tệp khi tải xuống
                    link.click();

                    // Giải phóng URL để tránh lãng phí bộ nhớ
                    window.URL.revokeObjectURL(url);
                });
            }
            else {
                toastr.error(data.msg)
            }
        }
    })
}


function approveDelivery(ids) {
    $.ajax({
        url: '/WarehouseManagement/Delivery/ApproveDelivery',
        type: 'post',
        data: { ids },
        success: function (data) {
            if (data.code == 200) {
                toastr.success(data.msg)
                $("#kt_datatable_delivery").KTDatatable().reload();
            }
            else {
                toastr.error(data.msg)
            }
        }
    })
}

function updateSO(id) {
    $.ajax({
        url: '/WarehouseManagement/SaleOrder/UpdateSaleOrderStatus',
        type: 'post',
        data: { id: id },
        success: function (data) {
            if (data.code == 200) {
                toastr.success(data.message)
                $("#sale-order-datatable").KTDatatable().reload();
            }
            else {
                toastr.error(data.message)
            }
        }
    })
}

$('#btnConfirm').on('click', function () {
    var id = $('#modalSaleOrderId').val();
    $.ajax({
        url: '/WarehouseManagement/SaleOrder/UpdateSaleOrderStatus',
        method: 'POST',
        data: {
            id
        },
        success: function (response) {
            if (response.code == 200) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    html: response.message,
                    confirmButtonText: 'OK'
                });
                $('#btnConfirm').prop('disabled', true);
                $('#sale-order-datatable').KTDatatable('reload');
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    html: response.message,
                    confirmButtonText: 'OK'
                });
            }
        },
        error: function () {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                html: response.message,
                confirmButtonText: 'OK'
            });
        }
    });
});

//xóa phiếu xuất
$(document).on('click', 'li[name="deleteSO"]', function (e) {
    var id = $(this).attr('data-deleteSO')
    Swal.fire({
        allowOutsideClick: false,
        html: resources.confirmDelete,
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
        if (result.isConfirmed) {
            $.ajax({
                url: '/WarehouseManagement/SaleOrder/DeleteSO',
                type: 'post',
                data: { id },
                success: function (data) {
                    if (data.code == 200) {
                        toastr.success(data.message);
                        saleDatatable.search($('#handlingStatus').val(), 'handlingStatus');
                    } else {
                        toastr.error(data.message);
                    }
                },
                error: function () {
                    toastr.error(resources.errorAjax);
                }
            })


        }
        else {
            Swal.close();
        }
    });
})


function parseDate(dateString) {
    var dateParts = dateString.split("-"); // Tách năm, tháng, ngày từ định dạng yyyy-MM-dd
    return dateParts[2] + '/' + dateParts[1] + '/' + dateParts[0]; // Trả về định dạng dd/MM/yyyy
}

function Staff() {
    $.ajax({
        url: '/WarehouseManagement/saleorder/StaffSaleOrder',
        type: 'get',
        success: function (data) {
            $('#nhanVien').empty();
            if (data.code == 200) {
                let table = '<option value="">' + resources.all +'</option>'
                $.each(data.c, function (k, v) {
                    table += '<option value="' + v.name + '">' + v.name + '</option>'
                });
                $('#nhanVien').append(table);
            } else (
                toastr.error(data.msg)
            )
        }
    })
}
Staff()

document.addEventListener("DOMContentLoaded", function () {
    // Chọn các container cần hỗ trợ kéo thả
    const containers = [
        document.getElementById('drag-container-1'),
        document.getElementById('drag-container-2'),
        document.getElementById('drag-container-3'),
        document.getElementById('drag-container-4'),
        document.getElementById('drag-container-5'),

    ];

    // Khởi tạo Dragula
    dragula(containers, {
        accepts: function (el, target) {
            // Luôn cho phép thả vào bất kỳ container nào
            return true;
        },
        removeOnSpill: true
    })
        .on('drag', function (el) {
            /*console.log('Bắt đầu kéo:', el.textContent.trim());*/
        })
        .on('drop', function (el, target, source) {
            //console.log('Đã thả:', el.textContent.trim());
            //console.log('Từ:', source.id, 'Đến:', target.id);
            $("#updateBtn").css("display", "block");
        })
        .on('cancel', function (el) {
            /*console.log('Kéo bị hủy:', el.textContent.trim());*/
        })
        .on('remove', function (el) {
            $("#updateBtn").css("display", "block");
        });
});

$(document).on("dblclick", ".edit-text", function () {
    const $this = $(this);
    var content = $(this).text();
    // Kích hoạt chỉnh sửa
    $this.attr('contenteditable', 'true').focus();

    // Tắt chỉnh sửa khi mất focus hoặc nhấn Enter
    $this.on('blur keydown', function (event) {
        if (event.type === 'blur' || event.key === 'Enter') {
            var newContent = $($this).text();
            if (content !== newContent) {
                $("#updateBtn").css("display", "block");
            }
            event.preventDefault(); // Ngăn Enter thêm dòng
            $this.removeAttr('contenteditable');
            $this.off('blur keydown'); // Xóa sự kiện để tránh lặp lại
        }
    });
})
$(document).on("dblclick", "#billLogo", function () {
    triggerFileInput()
})

function triggerFileInput() {
    // Kích hoạt input file khi double-click vào ảnh
    document.getElementById('imageInput').click();
}

var getFile = null;

function updateImage() {
    const fileInput = document.getElementById('imageInput');
    const img = document.getElementById('billLogo');

    // Kiểm tra xem người dùng có chọn file không
    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();

        // Đọc file và gán ảnh mới vào thẻ <img>
        reader.onload = function (e) {
            img.src = e.target.result;
        };

        reader.readAsDataURL(fileInput.files[0]);

        getFile = fileInput.files[0];
        console.log(getFile);
        $("#updateBtn").css("display", "block");
    }
}

$(document).on("click", "li[name='printSO']", function () {
    var idSO = $(this).data("printso");
    initSOBill(idSO)
})

function initSOBill(idSO) {
    var addHead = `<div class="add-row-container addMore" onclick="addHeader(this)" style="width: 100%;">
        <div class="line"></div>
        <div class="add-button">+</div>
    </div>`;

    $("#drag-container-1").empty();
    var count = 0
    for (let key in dataSOBill[0]) {
        if (count === 0) {
            var string1 = `<h5 data-header="true" class="draggable edit-text" style="font-weight: bolder">${dataSOBill[0][key]}</h5>`;
        } else {
            var string1 = `<p data-header="true" class="draggable edit-text">${dataSOBill[0][key]}</p>`;
        }
        count++;
        $("#drag-container-1").append(string1);
    }
    $("#drag-container-1").append(addHead);
    $("#drag-container-2").empty();
    for (let key in dataSOBill[1]) {
        var string2 = `<p data-header="true" class="draggable edit-text">${dataSOBill[1][key]}</p>`;
        $("#drag-container-2").append(string2);
    }
    $("#drag-container-2").append(addHead);

    var addP = `<div class="add-row-container addMore" onclick="addNewRow(this)">
        <div class="line"></div>
        <div class="add-button">+</div>
    </div>`;
    $("#drag-container-3").empty();
    for (let key in dataSOBill[2]) {
        var string3 = `<p class="draggable"><span data-header="true" class="edit-text">${dataSOBill[2][key]}</span> <span class="write-content edit-text"></span></p>`;
        $("#drag-container-3").append(string3);
    }

    $("#drag-container-3").append(addP);

    $("#drag-container-4").empty();
    for (let key in dataSOBill[3]) {
        var string4 = `<p class="draggable"><span data-header="true" class="edit-text">${dataSOBill[3][key]}</span> <span class="write-content edit-text"></span></p>`;
        $("#drag-container-4").append(string4);
    }
    $("#drag-container-4").append(addP);
    $("#drag-container-5").empty();
    for (let key in dataSOBill[4]) {
        var string5 = `<div class="pl-6 pr-6 draggable">
                        <p data-header="true" class="edit-text" style="font-weight: bold">${dataSOBill[4][key]}</p>
                        <p>(Ký, ghi rõ họ tên)</p>
                        <br><br>
                        <br><br>
                        <br><br>
                    </div>`;
        $("#drag-container-5").append(string5);
    }

    var addSign = `<div class="add-line-container addMore" onclick="addNewSign(this)">
        <div class="sign-line"></div>
        <div class="sign-add-button">+</div>
    </div>`;
    $("#drag-container-5").append(addSign);

    $.ajax({
        url: "/WarehouseManagement/SaleOrder/GetPrintSOData",
        type: "POST",
        data: { idSO },
        success: function (response) {
            console.log(response)
            if (response.code === 200) {
                $("#idSO").text(response.getSO.Id);
                $("#dateSO").text(GetDate(response.getSO.CreateDate));
                var paragraphs = document.querySelectorAll("#drag-container-3 p");
                paragraphs.forEach((paragraph, index) => {
                    var getKey = Object.keys(response.getSO)[index + 2];
                    $(paragraph.querySelector(".write-content")).html(response.getSO[getKey]);
                });

                $("#tbdBillPrint").empty()
                var stt = 1;
                response.getDetailSO.forEach((data) => {
                    var string6 = `<tr>
                                    <td>${stt} </td>
                                    <td>${data.IdGoods}</td>
                                    <td>${data.GoodName}</td>
                                    <td>${data.Unit}</td>
                                    <td>${data.Quantity !== null ? data.Quantity : 0}</td>
                                    <td>${data.QuantityScan !== null ? data.QuantityScan : 0}</td>
                                </tr>`;
                    $("#tbdBillPrint").append(string6);
                    stt++;
                })

                $("#BILL").modal('show');
            } else {
                toastr.error(response.msg)
            }
        },
        error: function (xhr, status, err) {
            toastr.error(err)
        }
    })
}

function GetDate(date) {
    const milliseconds = parseInt(date.match(/\d+/)[0], 10);

    // Tạo đối tượng Date
    const datetime = new Date(milliseconds);

    const day = datetime.getDate();
    const month = datetime.getMonth() + 1; // Tháng trong JavaScript bắt đầu từ 0
    const year = datetime.getFullYear();

    return `Ngày ${day} tháng ${month} năm ${year}`;
}

function addHeader(element) {
    var plus = element;
    var parent = $(element).closest(".drag-container");
    $(element).remove();
    var string = '<p data-header="true" class="draggable edit-text">Nhập nội dung thêm mới</p>';
    $(parent).append(string);
    $(parent).append(plus);
    $("#updateBtn").css("display", "block");
}

function addNewRow(element) {
    var plus = element;
    var parent = $(element).closest(".drag-container");
    $(element).remove();
    var string = `<p class="draggable"><span class="edit-text">- Chỉnh sửa tiêu đề: </span><span class="write-content edit-text"></span></p>`;
    $(parent).append(string);
    $(parent).append(plus);
    $("#updateBtn").css("display", "block");
}

function addNewSign(element) {
    var plus = element;
    var parent = $(element).closest(".drag-container");
    console.log(parent)
    $(element).remove();
    var string = `<div class="pl-6 pr-6 draggable">
                        <p class="edit-text" style="font-weight: bold">Nhập tiêu đề</p>
                        <p>(Ký, ghi rõ họ tên)</p>
                        <br><br>
                        <br><br>
                        <br><br>
                    </div>`;
    $(parent).append(string);
    $(parent).append(plus);
    $("#updateBtn").css("display", "block");
}

function Printing() {
    var backLines = [];
    var getListLine = $(".addMore");
    console.log(getListLine);

    $.each(getListLine, (i, v) => {
        var obj = {}
        var getParent = $(v).closest(".drag-container");
        obj.parent = getParent
        obj.child = v

        backLines.push(obj)
        $(v).remove();
    })

    // Lấy toàn bộ modal (bao gồm style nội bộ)
    const modalContent = document.querySelector('#in').cloneNode(true);

    // Tạo một cửa sổ mới
    const printWindow = window.open('', '_blank', 'width=800,height=600');

    // Tạo tài liệu HTML mới và chèn nội dung modal
    printWindow.document.open();
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Print Preview</title>
            <!-- Thêm các style từ trang hiện tại -->
            ${Array.from(document.styleSheets)
            .map((sheet) => {
                try {
                    if (sheet.href) {
                        // Nếu stylesheet có URL, sử dụng link
                        return `<link rel="stylesheet" href="${sheet.href}">`;
                    } else if (sheet.ownerNode) {
                        // Nếu stylesheet là inline, lấy nội dung
                        return `<style>${sheet.ownerNode.innerHTML}</style>`;
                    }
                } catch (e) {
                    console.warn("Không thể sao chép style từ stylesheet:", e);
                }
                return '';
            })
            .join('')}
        </head>
        <body>
            ${modalContent.outerHTML}
        </body>
        </html>
    `);
    printWindow.document.close();

    // Tùy chọn: Hiển thị hộp thoại in
    printWindow.focus();
    printWindow.print();

    $.each(backLines, (i, v) => {
        $(v.parent).append(v.child);
    })
}

$("#updateBtn").on("click", () => {
    updatePrintLayout();
})

function updatePrintLayout() {
    $("#wait").attr("hidden", false);
    var dataUpdate = [];
    for (var i = 1; i <= 5; i++) {
        var string = "drag-container-" + i;
        var listInfo = $(`#${string} [data-header]`);
        var obj = {}
        $.each(listInfo, (i, v) => {
            var key = `obj${i + 1}`;
            obj[key] = $(v).text();
        })
        dataUpdate.push(obj);
    }
    //var passDataUpdate = JSON.stringify(dataUpdate)
    var formData = new FormData();
    formData.append("img", getFile); // fileInput là input type="file"
    formData.append("data", JSON.stringify(dataUpdate)); // nếu có dữ liệu JSON cần gửi kèm

    $.ajax({
        url: "/WarehouseManagement/SaleOrder/UpdateLayoutPrintBill",
        type: "POST",
        data: formData,
        contentType: false,  // Không đặt contentType vì FormData sẽ tự xử lý
        processData: false,  // Không xử lý dữ liệu để FormData có thể gửi file
        success: function (response) {
            if (response.code === 200) {
                toastr.success(response.msg);
                dataSOBill = dataUpdate;
                $("#updateBtn").css("display", "none");
            } else {
                toastr.error(response.msg)
            }
        },
        error: function (xhr, status, err) {
            toastr.error(err);
        }
    })
}