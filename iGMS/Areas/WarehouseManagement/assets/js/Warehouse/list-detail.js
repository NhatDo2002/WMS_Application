'use strict';
var timeout;
const detailGoodInWHRFID = [{
    field: 'STT',
    title: '#',
    sortable: 'asc',
    width: 50,
    type: 'number',
    selector: false,
    textAlign: 'center',
    template: function (data) {
        return '<span class="font-weight-bolder">' + data.STT + '</span>';
    }
}, {
    field: 'idgoods',
    title: resources.goodId,
    sortable: 'asc',
    template: function (data) {
        var output = '<div class="text-dark-75 font-weight-bolder font-size-lg mb-0" style="white-space: normal; word-wrap: break-word;">' + data.idgoods + '</div>';
        return output;
    },
}, {
    field: 'nameGood',
    title: "Tên hàng hóa",
    sortable: 'asc',
    template: function (data) {
        var output = '<div class="text-dark-75 font-weight-bolder font-size-lg mb-0" style="white-space: normal; word-wrap: break-word;">' + data.nameGood + '</div>';
        return output;
    },
}, {
    field: 'idEPC',
    title: resources.epc,
    sortable: 'asc',
    template: function (data) {
        var string = "";
        if (data.idEPC !== null) {
            string = data.idEPC
        }

        var output = '<div class="text-dark-75 font-weight-bolder font-size-lg mb-0" style="white-space: normal; word-wrap: break-word;">' + string + '</div>';
        return output;
    },
}]

const detailGoodInWHBarcode = [{
    field: 'STT',
    title: '#',
    sortable: 'asc',
    width: 50,
    type: 'number',
    selector: false,
    textAlign: 'center',
    template: function (data) {
        return '<span class="font-weight-bolder">' + data.STT + '</span>';
    }
}, {
    field: 'idgoods',
    title: resources.goodId,
    sortable: 'asc',
    template: function (data) {
        var output = '<div class="text-dark-75 font-weight-bolder font-size-lg mb-0" style="white-space: normal; word-wrap: break-word;">' + data.idgoods + '</div>';
        return output;
    },
}, {
    field: 'nameGood',
    title: "Tên hàng hóa",
    sortable: 'asc',
    template: function (data) {
        var output = '<div class="text-dark-75 font-weight-bolder font-size-lg mb-0" style="white-space: normal; word-wrap: break-word;">' + data.nameGood + '</div>';
        return output;
    },
}, {
    field: 'idSerial',
    title: "Mã định danh",
    sortable: 'asc',
    template: function (data) {
        var string = "";
        if (data.idSerial !== null) {
            string = data.idSerial
        }

        var output = '<div class="text-dark-75 font-weight-bolder font-size-lg mb-0" style="white-space: normal; word-wrap: break-word;">' + string + '</div>';
        return output;
    },
}]

// Class definition
var columnInDetailGoodInWH;
if (localStorage.getItem("rfidStatus") == "true") {
    columnInDetailGoodInWH = detailGoodInWHRFID;
} else {
    columnInDetailGoodInWH = detailGoodInWHBarcode;
}

var KTDatatableModal = function () {

    var initDatatable = function () {
        var el = $('#kt_datatable_detailWH');

        var datatable = el.KTDatatable({
            // datasource definition
            data: {
                type: 'remote',
                source: {
                    read: {
                        url:'/WarehouseManagement/WareHouse/GetDetailListWH',
                    },
                },
                pageSize: 10, // display 20 records per page
                serverPaging: false,
                serverFiltering: false,
                serverSorting: false,
            },

            // layout definition
            layout: {
                theme: 'default',
                scroll: false,
                height: null,
                footer: false,
                noRecords: { // thêm thuộc tính này
                    record: 'Không có dữ liệu', // thông báo sẽ hiển thị
                    footer: '' // có thể để lại trống hoặc thêm footer nếu cần
                },
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

            // column sorting
            sortable: true,

            pagination: true,

            search: {
                input: el.find('#kt_datatable_search_query'),
                key: 'generalSearch'
            },

            // columns definition
            columns: [{
                field: 'STT',
                title: '#',
                sortable: 'asc',
                width: 50,
                type: 'number',
                selector: false,
                textAlign: 'center',
                template: function (data) {
                    return '<span class="font-weight-bolder">' + data.STT + '</span>';
                }
            }, {
                field: 'namewarehouse',
                title: resources.wh,
                sortable: 'asc',
                width: 200,
                template: function (data) {
                    var output = '<div class="d-flex align-items-center">\
								<div class="ml-4">\
									<div class="text-dark-75 font-weight-bolder font-size-lg mb-0" style="white-space: normal; word-wrap: break-word;">' + data.namewarehouse + '</div>\
								</div>\
							</div>';
                    return output;
                },
            }, {
                field: 'count',
                title: resources.quantity,
                sortable: 'asc',
                width: 150,
                template: function (data) {
                    var output = '<div class="d-flex align-items-center" style="width:100px;">\
								<div class="ml-4">\
									<div class="text-dark-75 font-weight-bolder font-size-lg mb-0">' + data.count + '</div>\
								</div>\
							</div>';
                    return output;
                },
            }, {
                field: 'Actions',
                width: 130,
                title: resources.action,
                sortable: false,
                overflow: 'visible',
                textAlign: 'left',
                autoHide: false,
                template: function (row) {
                    return `<div class="dropdown dropdown-inline">
                            <a class=" mr-2" data-toggle="dropdown" style="cursor: pointer">
                                  <span class="svg-icon svg-icon-2x"><!--begin::Svg Icon | path:/var/www/preview.keenthemes.com/metronic/releases/2021-05-14-112058/theme/html/demo8/dist/../src/media/svg/icons/Files/Compiled-file.svg--><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24px" height="24px" viewBox="0 0 24 24" version="1.1">
                                        <title>Stockholm-icons / Files / Compiled-file</title>
                                        <desc>Created with Sketch.</desc>
                                        <defs/>
                                        <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                                            <polygon points="0 0 24 0 24 24 0 24"/>
                                            <path d="M5.85714286,2 L13.7364114,2 C14.0910962,2 14.4343066,2.12568431 14.7051108,2.35473959 L19.4686994,6.3839416 C19.8056532,6.66894833 20,7.08787823 20,7.52920201 L20,20.0833333 C20,21.8738751 19.9795521,22 18.1428571,22 L5.85714286,22 C4.02044787,22 4,21.8738751 4,20.0833333 L4,3.91666667 C4,2.12612489 4.02044787,2 5.85714286,2 Z" fill="#000000" fill-rule="nonzero" opacity="0.3"/>
                                            <rect fill="#000000" opacity="0.3" transform="translate(8.984240, 12.127098) rotate(-45.000000) translate(-8.984240, -12.127098) " x="7.41281179" y="10.5556689" width="3.14285714" height="3.14285714" rx="0.75"/>
                                            <rect fill="#000000" opacity="0.3" transform="translate(15.269955, 12.127098) rotate(-45.000000) translate(-15.269955, -12.127098) " x="13.6985261" y="10.5556689" width="3.14285714" height="3.14285714" rx="0.75"/>
                                            <rect fill="#000000" transform="translate(12.127098, 15.269955) rotate(-45.000000) translate(-12.127098, -15.269955) " x="10.5556689" y="13.6985261" width="3.14285714" height="3.14285714" rx="0.75"/>
                                            <rect fill="#000000" transform="translate(12.127098, 8.984240) rotate(-45.000000) translate(-12.127098, -8.984240) " x="10.5556689" y="7.41281179" width="3.14285714" height="3.14285714" rx="0.75"/>
                                        </g>
                                    </svg>
                                </span>
                            </a>
                            <div class="dropdown-menu dropdown-menu-sm dropdown-menu-right" style="width:250px">
                                <ul class="navi flex-column navi-hover py-2">
                                    <li class="navi-header font-weight-bolder text-dark font-size-xs text-primary pb-2">
                                       ${resources.option}
                                    </li>
                                    <li class="navi-item" data-record-id="${row.idwarehouse}" name="detailBtn">
                                        <div class="navi-link" data-epc="oke" style="cursor: pointer">
                                                <span class="navi-icon mr-2"><!--begin::Svg Icon | path:/var/www/preview.keenthemes.com/metronic/releases/2021-05-14-112058/theme/html/demo8/dist/../src/media/svg/icons/Home/Home.svg--><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24px" height="24px" viewBox="0 0 24 24" version="1.1">
                                                    <title>Stockholm-icons / Home / Home</title>
                                                    <desc>Created with Sketch.</desc>
                                                    <defs/>
                                                    <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                                                        <rect x="0" y="0" width="24" height="24"/>
                                                        <path d="M3.95709826,8.41510662 L11.47855,3.81866389 C11.7986624,3.62303967 12.2013376,3.62303967 12.52145,3.81866389 L20.0429,8.41510557 C20.6374094,8.77841684 21,9.42493654 21,10.1216692 L21,19.0000642 C21,20.1046337 20.1045695,21.0000642 19,21.0000642 L4.99998155,21.0000673 C3.89541205,21.0000673 2.99998155,20.1046368 2.99998155,19.0000673 L2.99999828,10.1216672 C2.99999935,9.42493561 3.36258984,8.77841732 3.95709826,8.41510662 Z M10,13 C9.44771525,13 9,13.4477153 9,14 L9,17 C9,17.5522847 9.44771525,18 10,18 L14,18 C14.5522847,18 15,17.5522847 15,17 L15,14 C15,13.4477153 14.5522847,13 14,13 L10,13 Z" fill="#000000"/>
                                                    </g>
                                                </svg><!--end::Svg Icon--></span>
                                                <span class="navi-text font-weight-bold align-item-center">${resources.actionDetail}</span>
                                            </div>
                                    </li>
                                </ul>
                            </div>
                        </div>`;
                },
            }],
        });

        var card = datatable.closest('.card');

        $('#kt_datatable_search_status').on('change', function () {
            datatable.search($(this).val().toLowerCase(), 'Status');
        });

        $('#kt_datatable_search_type').on('change', function () {
            console.log($(this).val())
            datatable.search($(this).val(), 'namewarehouse');
        });

        $('#kt_datatable_search_query').on('input', function () {
            var searchText = $(this).val();
            datatable.search(searchText, 'namewarehouse');
        });

        $('#kt_datatable_search_status, #kt_datatable_search_type').selectpicker();

        //datatable.on('click', '[data-record-id]', function () {
        //    initSubDatatable($(this).data('record-id'));
        //    $('#kt_datatable_sub').KTDatatable('reload');
        //    $('#kt_datatable_modal').modal('show');
        //});

        datatable.on('datatable-on-layout-updated', function () {
            var getIdWH = localStorage.getItem("idwarehouse");
            if (getIdWH !== null) {
                $(`div[data-record-id="${getIdWH}"]`).click();

                localStorage.removeItem("idwarehouse");
            }
        })

    };

    var initSubDatatable = function (id) {
        var el = $('#kt_datatable_sub');
        var datatable = el.KTDatatable({
            data: {
                type: 'remote',
                source: {
                    read: {
                        url: '/WareHouse/GetGoodsInWH',
                        params: {
                            idwarehouse: id,
                        },
                    },
                },
                pageSize: 10,
                serverPaging: true,
                serverFiltering: true,
                serverSorting: true,
            },

            // layout definition
            layout: {
                theme: 'default',
                scroll: true,
                height: 350,
                footer: false,
                noRecords: { // thêm thuộc tính này
                    record: 'No records found', // thông báo sẽ hiển thị
                    footer: '' // có thể để lại trống hoặc thêm footer nếu cần
                },
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

            //search: {
            //    input: el.find('#kt_datatable_search_query_2'),
            //    key: 'generalSearch'
            //},

            sortable: true,

            // columns definition
            columns: [{
                field: 'STT',
                title: '#',
                sortable: 'asc',
                width: 50,
                type: 'number',
                selector: false,
                textAlign: 'center',
                template: function (data) {
                    return '<span class="font-weight-bolder">' + data.STT + '</span>';
                }
            }, {
                    field: 'idgoods',
                title: resources.goodId,
                    sortable: 'asc',
                    template: function (data) {
                        var output = '<div class="text-dark-75 font-weight-bolder font-size-lg mb-0" style="white-space: normal; word-wrap: break-word;">' + data.idgoods + '</div>';
                        return output;
                    },
                }, {
                    field: 'name',
                title: resources.goodName,
                    sortable: 'asc',
                    template: function (data) {
                        var output = '<div class="text-dark-75 font-weight-bolder font-size-lg mb-0" style="white-space: normal; word-wrap: break-word;">' + data.name + '</div>';
                        return output;
                    },
                },{
                field: 'category',
                title: resources.good_group,
                    sortable: 'asc',
                    template: function (data) {
                        var output = '<div class="text-dark-75 font-weight-bolder font-size-lg mb-0" style="white-space: normal; word-wrap: break-word;">' + data.category + '</div>';
                        return output;
                    },
                },{
                field: 'unit',
                title: resources.unit,
                    sortable: 'asc',
                    template: function (data) {
                        var output = '<div class="text-dark-75 font-weight-bolder font-size-lg mb-0" style="white-space: normal; word-wrap: break-word;">' + data.unit + '</div>';
                        return output;
                    },
                }, {
                    field: 'qtt',
                title: resources.number,
                    sortable: 'asc',
                    template: function (data) {
                        var output = '<div class="text-dark-75 font-weight-bolder font-size-lg mb-0" style="white-space: normal; word-wrap: break-word;">' + data.qtt + '</div>';
                        return output;
                    },
                }],
        });

        var modal = datatable.closest('.modal');

        $('#kt_datatable_search_status_2').on('change', function () {
            datatable.search($(this).val().toLowerCase(), 'Status');
        });

        $('#kt_datatable_search_type_2').on('change', function () {
            datatable.search($(this).val().toLowerCase(), 'Type');
        });

        datatable.on('click', '[data-epc]', function () {
            initDatatableModal2(id, $(this).data('record-id'));
            //$('#kt_datatable_modal').modal('hide');
            $('#kt_datatable_modal_2').modal('show');
        });

        $('#kt_datatable_search_query_2').on('input', function () {
            clearTimeout(timeout);
            var input = $(this);
            timeout = setTimeout(function () {
                var searchText = $(input).val();
                console.log(searchText)
                datatable.search(searchText, 'idpurchase');
            }, 500);
        });

        $('#kt_datatable_search_status_2, #kt_datatable_search_type_2').selectpicker();

        // fix datatable layout after modal shown
        datatable.hide();
        datatable.closest('.modal').on('shown.bs.modal', function () {
            var modalContent = $(this).find('.modal-content');
            datatable.spinnerCallback(true, modalContent);
            datatable.spinnerCallback(false, modalContent);
        }).on('hidden.bs.modal', function () {
            el.KTDatatable('destroy');
        });

        datatable.on('datatable-on-layout-updated', function () {
            datatable.show();
            datatable.redraw();

            var getIdGood = localStorage.getItem("idgoods");
            if (getIdGood != null) {
                $(`button[data-record-id="${getIdGood}"]`).click();

                localStorage.removeItem("idgoods");
            }
        });
    };

    var initDatatableModal2 = function (idwh, idgood) {

        var modal = $('#kt_datatable_modal_2');

        var datatable = $('#kt_datatable_epc_sub').KTDatatable({
            // datasource definition
            data: {
                type: 'remote',
                source: {
                    read: {
                        url: '/WareHouse/GetGoodEPCs',
                        params: {
                            idwarehouse: idwh,
                            idgoods: idgood
                        },
                    },
                },
                pageSize: 10,
                serverPaging: false,
                serverFiltering: false,
                serverSorting: false,
            },

            noRecords: 'No records found',

            // layout definition
            layout: {
                scroll: true, // enable/disable datatable scroll both horizontal and vertical when needed.
                height: 400, // datatable's body's fixed height
                minHeight: 400,
                footer: false, // display/hide footer
            },

            // column sorting
            sortable: true,

            pagination: true,

            search: {
                input: modal.find('#kt_datatable_search_query_3'),
                key: 'generalSearch'
            },

            // columns definition
            columns: columnInDetailGoodInWH
        });

        $('#kt_datatable_search_status_3').on('change', function () {
            datatable.search($(this).val().toLowerCase(), 'Status');
        });

        $('#kt_datatable_search_type_3').on('change', function () {
            datatable.search($(this).val().toLowerCase(), 'Type');
        });

        $('#kt_datatable_search_status_3, #kt_datatable_search_type_3').selectpicker();

        // fix datatable layout after modal shown
        datatable.hide();

        var alreadyReloaded = false;
        modal.on('shown.bs.modal', function () {
            if (!alreadyReloaded) {
                var modalContent = $(this).find('.modal-content');
                datatable.spinnerCallback(true, modalContent);

                datatable.reload();

                datatable.on('datatable-on-layout-updated', function () {
                    datatable.show();
                    datatable.spinnerCallback(false, modalContent);
                    datatable.redraw();
                });

                alreadyReloaded = true;
            }
        }).on('hidden.bs.modal', function () {
            $('#kt_datatable_epc_sub').KTDatatable('destroy');
        });;
    };

    return {
        // public functions
        init: function () {
            initDatatable();
            //initDatatableModal2();
            //initDatatableModal3();
        },

        initDetail: function (id) {
            initSubDatatable(id);
        }
    };
}();

jQuery(document).ready(function () {
    KTDatatableModal.init();
});

$(document).on("click", "button[name='btnSearchEPC']",function () {
    var epc = $(this).data("record-id");
    $.ajax({
        url: "/EPCs/Epc/AddSearchEPC",
        type: "POST",
        data: { epc },
        success: function (response) {
            if (response.code === 200) {
                $('#kt_datatable_epc_sub').KTDatatable("reload");
                toastr.success(response.msg);
            } else {
                toastr.error(response.msg)
            }
        },

    });
})

$(document).on("click", "li[name='detailBtn']", function () {
    //var idSO = $(this).data("detail");
    //$('#hiddenID').val(idSO)
    //$('#detail_modal').modal('hide');
    //if (deliveryDatatable != null) {
    //    deliveryDatatable.destroy();
    //}
    //KTAppsUsersListDatatable.initDeliveryInit(idSO);
    //deliveryDatatable.reload();

    //$("#delivery_modal").modal('show');
    console.log("Hello");
    KTDatatableModal.initDetail($(this).data('record-id'));
    $('#kt_datatable_sub').KTDatatable('reload');
    $('#kt_datatable_modal').modal('show');
});

$(document).on("click", "li[name='moveGoods']", function () {
    var getIDWH = $(this).data('id-wh');
    localStorage.setItem("moveinWH", getIDWH);
    window.location.href = "/WarehouseManagement/WareHouse/MoveGoodsinWH";
})

$("#printBtn").on("click", function () {
    initHeader()
    printData()
})

function initHeader() {
    var string = "drag-container-1"
    var listInfo = $(`#${string} [data-header]`);
    $.each(listInfo, (i, v) => {
        $(v).text(dataBill["header" + (i + 1)]);
    })
}

function printData() {
    $.ajax({
        url: "/WarehouseManagement/WareHouse/WhInventoryData",
        type: "POST",
        success: function (response) {
            if (response.code === 200) {
                $(".printContainer").empty()
     //           $("#countTotal").text("")
                $("#userPrint").text("")
                $("#timePrint").text("")
                response.listWH.forEach(w => {
                    var string1 = `
                        <table id="whPrint${w.idwarehouse}" style=" width: 100%; border-collapse: collapse; text-align: left; table-layout: fixed; margin-bottom: 20px">
                                <thead style="position: sticky; top: 0; background-color: #f2f2f2; color: black; font-weight: bold; border: 1px solid #ddd; border-top: 1px solid black ">
                                    <tr style="">
                                        <th style="padding: 12px; border: 1px solid #ddd; ">Tên kho</th>
                                        <th style="padding: 12px; border: 1px solid #ddd; border-right: none;">Số lượng tồn</th>
                                        <th style="padding: 12px; border: 1px solid #ddd; border-left: none;"></th>
                                    </tr>
                                </thead>
                                <tbody id="whtbodyPrint${w.idwarehouse}" style="">
                                    	<tr>
                                            <td style="padding: 12px; border: 1px solid #ddd;">${w.namewarehouse}</td>
                                            <td style="padding: 12px; border: 1px solid #ddd;border-right: none;">${w.count}</td>
                                            <td style="padding: 12px; border: 1px solid #ddd;border-left: none;"></td>
                                        </tr>
                                </tbody>
                         </table>

                         <table id="goodPrint${w.idwarehouse}" style=" width: 100%; border-collapse: collapse; text-align: left; table-layout: fixed; margin-bottom: 10px">
                                <thead style="position: sticky; top: 0; background-color: #f2f2f2; color: black; font-weight: bold; border: 1px solid #ddd; border-top: 1px solid black ">
                                    <tr style="">
                                        <th style="padding: 12px; border: 1px solid #ddd;">Mã hàng hóa</th>
                                        <th style="padding: 12px; border: 1px solid #ddd;">Tên hàng hóa</th>
                                        <th style="padding: 12px; border: 1px solid #ddd;">Mã EPC</th>
                                    </tr>
                                </thead>
                                <tbody id="goodtbodyPrint${w.idwarehouse}" style="">
                                </tbody>
                         </table>
                         <hr  width="100%" align="center" />
                    `;

                    $(".printContainer").append(string1);

                    var getList = response.listEPC.filter(e => e.IdWareHouse === w.idwarehouse);

                    if (getList.length > 0) {
                        getList.forEach(e => {
                            var string2 = `
                                  <tr>
                                       <td style="padding: 12px; border: 1px solid #ddd;">${e.IdGoods}</td>
                                       <td style="padding: 12px; border: 1px solid #ddd;">${e.Name}</td>
                                       <td style="padding: 12px; border: 1px solid #ddd;">${e.IdEPC}</td>
                                  </tr>
                              `;
                            $(`#goodtbodyPrint${w.idwarehouse}`).append(string2);
                        })
                    } else {
                        var string2 = `
                                  <tr>
                                       <td style="padding: 12px; border: 1px solid #ddd;"></td>
                                       <td style="padding: 12px; border: 1px solid #ddd;"></td>
                                       <td style="padding: 12px; border: 1px solid #ddd;"></td>
                                  </tr>
                              `;
                        $(`#goodtbodyPrint${w.idwarehouse}`).append(string2);
                    }

                })
     //           response.list.forEach(g => {
     //               var string = `
						//<tr>
      //                          <td style="padding: 12px; border: 1px solid #ddd;">${g.Name}</td>
      //                          <td style="padding: 12px; border: 1px solid #ddd;">${g.Email !== null ? g.Email : ""}</td>
						//		<td style="padding: 12px; border: 1px solid #ddd;">${g.Role}</td>
      //                          <td style="padding: 12px; border: 1px solid #ddd;">${convertJsonDate(g.CreateDate)}</td>
      //                          <td style="padding: 12px; border: 1px solid #ddd;">${g.CreateBy}</td>
      //                          <td style="padding: 12px; border: 1px solid #ddd;">${convertJsonDate(g.ModifyDate)}</td>
      //                          <td style="padding: 12px; border: 1px solid #ddd;">${g.ModifyBy}</td>
      //                      </tr>
					//`;
     //               $("#tbodyPrint").append(string);
     //           })
     //           $("#countTotal").text(response.list.length);
                $("#userPrint").text(response.name);
                $("#timePrint").text((response.date));

                $("#printModal").modal("show");
            } else {
                toastr.error(response.msg)
            }
        },
        error: function (xhr, status, err) {
            toastr.error(err)
        }
    })
}

function convertJsonDate(jsonDate) {
    // Trích xuất timestamp từ chuỗi JSON Date
    var timestamp = jsonDate.match(/\/Date\((\d+)\)\//);
    if (timestamp) {
        // Chuyển timestamp thành đối tượng Date
        var date = new Date(parseInt(timestamp[1]));

        // Định dạng ngày tháng theo dd-MM-yyyy
        var day = ("0" + date.getDate()).slice(-2);
        var month = ("0" + (date.getMonth() + 1)).slice(-2); // Tháng bắt đầu từ 0
        var year = date.getFullYear();

        // Trả về ngày theo định dạng dd-MM-yyyy
        return day + "-" + month + "-" + year;
    }
    return null;
}

//$('#printModal').on('shown.bs.modal', function () {
//    console.log(document.querySelector('#printArea').innerHTML); // Xem nội dung
//});

function openAndPrint() {
    // Lấy nội dung từ modal
    const modalContent = $("#printModal").find("#printArea").html();

    // Mở cửa sổ mới
    const newWindow = window.open('', '_blank', 'width=800,height=600');

    // Tạo nội dung HTML cho cửa sổ mới
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>In Nội Dung</title>
            <style>
                body {
                    font-family: 'Poppins', sans-serif;
                    line-height: 1.6;
                    color: #333;
                    margin: 20px;
                }
                .modal-body {
                    text-align: left;
                }
                .printContainer {
                    overflow: visible !important;
                    max-height: fit-content !important;
                    width: 100%;
                    margin-bottom: 20px;
                }
                .modal-header {
                    text-align: center;
                    border-bottom: 2px solid #007bff;
                    margin-bottom: 20px;
                    padding-bottom: 10px;
                }
                .modal-header h1 {
                    font-size: 26px;
                    font-weight: bold;
                    color: #007bff;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                table th, table td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }
                table th {
                    background-color: #f2f2f2;;
                    color: black;
                }
                @media print {
                    body {
                        margin: 10px;
                    }
                    @page {
                        margin: 0; /* Xóa margin mặc định của trình duyệt */
                    }
                }
            </style>
        </head>
        <body>
            ${modalContent}
        </body>
        </html>
    `;

    // Ghi nội dung vào tài liệu của cửa sổ mới
    newWindow.document.open();
    newWindow.document.write(htmlContent);
    newWindow.document.close();

    // In nội dung và đóng cửa sổ sau khi in xong
    newWindow.print();
}

function ExportExcel() {
    $.ajax({
        url: "/WarehouseManagement/WareHouse/WhInventoryExcel",
        type: "POST",
        success: function (response) {
            if (response.code === 200) {
                const byteCharacters = atob(response.fileContent);
                const byteNumbers = new Array(byteCharacters.length);

                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }

                const byteArray = new Uint8Array(byteNumbers);

                // Tạo Blob từ dữ liệu nhị phân
                const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

                // Tạo link để tải xuống mà không cần append vào DOM
                const link = document.createElement("a");
                const url = window.URL.createObjectURL(blob);
                link.href = url;
                link.download = response.fileName; // Đặt tên tệp khi tải xuống
                link.click();

                // Giải phóng URL để tránh lãng phí bộ nhớ
                window.URL.revokeObjectURL(url);

                toastr.success(response.msg);
            } else {
                toastr.error(resources.ErrorCall);
            }
        },
        error: function (xhr, status, error) {
            console.error(error)
        }
    });
}

function ExportPDF() {
    $.ajax({
        url: "/WarehouseManagement/WareHouse/WhInventoryPDF",
        type: "POST",
        success: function (response) {
            if (response.code === 200) {
                const byteCharacters = atob(response.fileContent);
                const byteNumbers = new Array(byteCharacters.length);

                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }

                const byteArray = new Uint8Array(byteNumbers);

                // Tạo Blob từ dữ liệu nhị phân
                const blob = new Blob([byteArray], { type: 'application/pdf' });

                // Tạo link để tải xuống mà không cần append vào DOM
                const link = document.createElement("a");
                const url = window.URL.createObjectURL(blob);
                link.href = url;
                link.download = response.fileName; // Đặt tên tệp khi tải xuống
                link.click();

                // Giải phóng URL để tránh lãng phí bộ nhớ
                window.URL.revokeObjectURL(url);

                toastr.success(response.msg);
            } else {
                toastr.error(resources.ErrorCall);
            }
        },
        error: function (xhr, status, error) {
            console.error(error)
        }
    });
}

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

document.addEventListener("DOMContentLoaded", function () {
    // Chọn các container cần hỗ trợ kéo thả
    const containers = [
        document.getElementById('drag-container-1'),
        document.getElementById('drag-container-2'),
    ];

    // Khởi tạo Dragula
    dragula(containers, {
        accepts: function (el, target) {
            // Luôn cho phép thả vào bất kỳ container nào
            return true;
        },
        /*removeOnSpill: true*/
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
    //.on('remove', function (el) {
    //	$("#updateBtn").css("display", "block");
    //});
});


$("#updateBtn").on("click", function () {
    updateHeader()
})

function updateHeader() {
    $("#wait").attr("hidden", false);
    var dataUpdate = {};
    var string = "drag-container-1"
    var listInfo = $(`#${string} [data-header]`);
    $.each(listInfo, (i, v) => {
        var key = `header${i + 1}`;
        dataUpdate[key] = $(v).text();
    })
    //for (var i = 1; i <= 5; i++) {
    //	var string = "drag-container-" + i;
    //	var listInfo = $(`#${string} [data-header]`);
    //	var obj = {}
    //	$.each(listInfo, (i, v) => {
    //		var key = `obj${i + 1}`;
    //		obj[key] = $(v).text();
    //	})
    //	dataUpdate.push(obj);
    //}
    var passData = JSON.stringify(dataUpdate);
    $.ajax({
        url: "/MasterData/Goods/UpdateHeaderBill",
        type: "POST",
        data: { data: passData },
        success: function (response) {
            if (response.code === 200) {
                toastr.success(response.msg);
                $("#updateBtn").css("display", "none");
            } else {
                toastr.error(response.msg);
            }
        },
        error: function (xhr, status, err) {
            toastr.error(err);
        }
    })
}