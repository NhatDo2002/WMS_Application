'use strict';
// Class definition

var KTDatatableModal = function () {

    var initDatatable = function () {
        var el = $('#kt_datatable_searchEPC');

        var datatable = el.KTDatatable({
            // datasource definition
            data: {
                type: 'remote',
                source: {
                    read: {
                        url: '/MasterData/Goods/GetListSearchGood',
                    },
                },
                pageSize: 10, // display 20 records per page
                serverPaging: true,
                serverFiltering: true,
                serverSorting: true,
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
                field: 'GoodId',
                title: 'Mã hàng hóa',
                sortable: 'asc',
                template: function (data) {
                    var output = '<div class="d-flex align-items-center" style="width:100px;">\
								<div class="ml-4">\
									<div class="text-dark-75 font-weight-bolder font-size-lg mb-0">' + data.GoodId + '</div>\
								</div>\
							</div>';
                    return output;
                },
            }, {
                field: 'GoodName',
                title: 'Tên hàng hóa',
                sortable: 'asc',
                template: function (data) {
                    var output = '<div class="d-flex align-items-center" style="width:100px;">\
								<div class="ml-4">\
									<div class="text-dark-75 font-weight-bolder font-size-lg mb-0">' + data.GoodName + '</div>\
								</div>\
							</div>';
                    return output;
                },
            },{
                field: 'EPC',
                title: 'Mã EPC',
                sortable: false,
                sortable: 'asc',
                width: 250,
                template: function (data) {
                    var output = '<div class="d-flex align-items-center" style="width:100px;">\
								<div class="ml-4">\
									<div class="text-dark-75 font-weight-bolder font-size-lg mb-0">' + data.EPC + '</div>\
								</div>\
							</div>';
                    return output;
                },
            },{
                field: 'Warehouse',
                sortable: false,
                title: 'Tên kho',
                sortable: 'asc',
                width: 130,
                template: function (data) {
                    var output = '<div class="d-flex align-items-center" style="width:100px;">\
								<div class="ml-4">\
									<div class="text-dark-75 font-weight-bolder font-size-lg mb-0">' + data.Warehouse + '</div>\
								</div>\
							</div>';
                    return output;
                },
            }, {
                field: 'Actions',
                title: 'Hành động',
                sortable: false,
                overflow: 'visible',
                textAlign: 'left',
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
                                       Chọn hành động
                                    </li>
                                    <li class="navi-item" data-checked="${row.EPC}" name="checkedEPC" style="cursor: pointer;">
                                        <a class="navi-link">
                                            <span class="navi-icon"><i class="la la-check-circle-o"></i></span>
                                            <span class="navi-text font-weight-bold text-success">Xác nhận tìm kiếm thành công</span>
                                        </a>
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
            datatable.search($(this).val(), 'WarehouseName');
        });

        $('#kt_datatable_search_query').on('input', function () {
            var searchText = $(this).val();
            datatable.search(searchText, 'generalSearch');
        });

        $('#kt_datatable_search_status, #kt_datatable_search_type').selectpicker();

        //datatable.on('click', '[data-record-id]', function () {
        //    initSubDatatable($(this).data('record-id'));
        //    $('#kt_datatable_sub').KTDatatable('reload');
        //    $('#kt_datatable_modal').modal('show');
        //});

        //datatable.on('datatable-on-layout-updated', function () {
        //    var getIdWH = localStorage.getItem("idwarehouse");
        //    if (getIdWH !== null) {
        //        $(`button[data-record-id="${getIdWH}"]`).click();

        //        localStorage.removeItem("idwarehouse");
        //    }
        //})

    };

    return {
        // public functions
        init: function () {
            initDatatable();
            //initDatatableModal2();
            //initDatatableModal3();
        }
    };
}();

jQuery(document).ready(function () {
    KTDatatableModal.init();
});

$(document).on("click", "li[name='checkedEPC']", function () {
    var epc = $(this).data("checked");

    $.ajax({
        url: "/EPCs/Epc/FinishSearchEPC",
        type: "POST",
        data: { epc },
        success: function (response) {
            if (response.code === 200) {
                $('#kt_datatable_searchEPC').KTDatatable("reload");
                toastr.success(response.msg);
            } else {
                toastr.error(response.msg);
            }
        },
        error: function (err) {
            toastr.error(err);
        }
    })
})