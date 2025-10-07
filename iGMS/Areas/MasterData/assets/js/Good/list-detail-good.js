'use strict';
// Class definition
const epcSubDatatableColumn = [{
    field: 'STT',
    title: '#',
    sortable: 'asc',
    type: 'number',
    width: 60,
    selector: false,
    textAlign: 'center',
    template: function (data) {
        return '<span class="font-weight-bolder">' + data.STT + '</span>';
    }
}, {
    field: 'IdGood',
    title: resources.id,
    width: 200,
    sortable: 'asc',
    template: function (data) {
        var output = '<div class="text-dark-75 font-weight-bolder font-size-lg mb-0" style="white-space: normal;word-wrap: break-word;">' + data.IdGood + '</div>';
        return output;
    },
}, {
    field: 'NameGood',
    title: "Tên hàng hóa",
    width: 200,
    sortable: 'asc',
    template: function (data) {
        var output = '<div class="text-dark-75 font-weight-bolder font-size-lg mb-0" style="white-space: normal;word-wrap: break-word;">' + data.NameGood + '</div>';
        return output;
    },
}, {
    field: 'NameWH',
    title: resources.wh,
    sortable: 'asc',
    template: function (data) {
        var output = '<div class="text-dark-75 font-weight-bolder font-size-lg mb-0" style="white-space: normal;word-wrap: break-word;">' + data.NameWH + '</div>';
        return output;
    },
}, {
    field: 'EPC',
    title: resources.epc_code,
    sortable: 'asc',
    width: 200,
    template: function (data) {
        var output = '<div class="text-dark-75 font-weight-bolder font-size-lg mb-0" style="white-space: normal;word-wrap: break-word;">' + data.EPC + '</div>';
        return output;
    },
}];

const barcodeSubDatatableColumn = [{
    field: 'STT',
    title: '#',
    sortable: 'asc',
    type: 'number',
    width: 60,
    selector: false,
    textAlign: 'center',
    template: function (data) {
        return '<span class="font-weight-bolder">' + data.STT + '</span>';
    }
}, {
    field: 'IdGood',
    title: resources.id,
    width: 200,
    sortable: 'asc',
    template: function (data) {
        var output = '<div class="text-dark-75 font-weight-bolder font-size-lg mb-0" style="white-space: normal;word-wrap: break-word;">' + data.IdGood + '</div>';
        return output;
    },
}, {
    field: 'NameGood',
    title: "Tên hàng hóa",
    width: 200,
    sortable: 'asc',
    template: function (data) {
        var output = '<div class="text-dark-75 font-weight-bolder font-size-lg mb-0" style="white-space: normal;word-wrap: break-word;">' + data.NameGood + '</div>';
        return output;
    },
}, {
    field: 'NameWH',
    title: resources.wh,
    sortable: 'asc',
    template: function (data) {
        var output = '<div class="text-dark-75 font-weight-bolder font-size-lg mb-0" style="white-space: normal;word-wrap: break-word;">' + data.NameWH + '</div>';
        return output;
    },
}, {
    field: 'IdSerial',
    title: resources.barcode_identify,
    sortable: 'asc',
    width: 200,
    template: function (data) {
        var string = "";
        if (data.IdSerial != null) {
            string = data.IdSerial;
        }
        var output = '<div class="text-dark-75 font-weight-bolder font-size-lg mb-0" style="white-space: normal;word-wrap: break-word;">' + data.IdSerial + '</div>';
        return output;
    },
}];


var columnInDetailGoodInWH;
if (localStorage.getItem("rfidStatus") == "true") {
    columnInDetailGoodInWH = epcSubDatatableColumn;
} else {
    columnInDetailGoodInWH = barcodeSubDatatableColumn;
}

var DetailGoodTable = function () {

    var initDatatable = function () {
        var el = $('#kt_datatable_good');

        var datatable = el.KTDatatable({
            // datasource definition
            data: {
                type: 'remote',
                source: {
                    read: {
                        url: '/MasterData/Goods/GetDetailListGood',
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
                type: 'number',
                selector: false,
                textAlign: 'center',
                template: function (data) {
                    return '<span class="font-weight-bolder">' + data.STT + '</span>';
                }
            }, {
                field: 'Id',
                title: resources.id,
                sortable: 'asc',

                template: function (data) {
                    var output = '<div class="text-dark-75 font-weight-bolder font-size-lg mb-0">' + data.Id + '</div>';
                    return output;
                },
                }, {
                    field: 'Name',
                title: resources.name,
                    sortable: 'asc',
                    type: 'number',
                    selector: false,
                    textAlign: 'center',
                    template: function (data) {
                        return '<span class="font-weight-bolder text-dark-75 font-size-lg">' + data.Name + '</span>';
                    }
                },
                {
                field: 'Unit',
                    title: resources.unit,
                sortable: 'asc',
                width: 150,
                template: function (data) {
       //             var output = '<div class="d-flex align-items-center" style="width:100px;">\
							//	<div class="ml-4">\
							//		<div class="text-dark-75 font-weight-bolder font-size-lg mb-0" style="width: 50px">' + data.Unit + '</div>\
							//	</div>\
							//</div>';
                    //             return output;
                    return '<span class="font-weight-bolder text-dark-75 font-size-lg">' + data.Unit + '</span>';
                },
            }, {
                field: 'GroupGood',
                    title: resources.group,
                sortable: 'asc',
                type: 'number',
                selector: false,
                textAlign: 'center',
                template: function (data) {
                    return '<span class="font-weight-bolder text-dark-75 font-size-lg">' + data.GroupGood + '</span>';
                }
            }, {
                field: 'Inventory',
                    title: resources.inventory,
                sortable: 'asc',
                type: 'number',
                selector: false,
                textAlign: 'center',
                template: function (data) {
                    return '<span class="font-weight-bolder text-dark-75 font-size-lg">' + data.Inventory + '</span>';
                }
                },
                //{
                //field: 'Actions',
                //width: 130,
                //    title: resources.detail,
                //sortable: false,
                //overflow: 'visible',
                //    textAlign: 'center',
                //autoHide: false,
                //template: function (row) {
                //    return '\
		              //    <button data-record-id="' + row.Id + '" class="btn btn-sm btn-clean" title="' + resources.epc_detail +'">\
		              //        <i class="flaticon2-document"></i> '+ resources.epc_detail +'\
		              //    </button>';
                //},
                //}
            ],
        });

        var card = datatable.closest('.card');

        //$('#kt_datatable_search_status').on('change', function () {
        //    datatable.search($(this).val().toLowerCase(), 'Status');
        //});

        //$('#kt_datatable_search_type').on('change', function () {
        //    console.log($(this).val())
        //    datatable.search($(this).val(), 'namewarehouse');
        //});

        $('#kt_datatable_search_query').on('input', function () {
            var searchText = $(this).val();
            datatable.search(searchText, 'Id');
        });

        $('#kt_datatable_search_status, #kt_datatable_search_type').selectpicker();

        datatable.on('click', '[data-record-id]', function () {
            initSubDatatable($(this).data('record-id'));
            $('#kt_datatable_epc').KTDatatable('reload');
            $('#showlist').modal('show');
        });

        //datatable.on('datatable-on-layout-updated', function () {
        //    var getIdWH = localStorage.getItem("idwarehouse");
        //    if (getIdWH !== null) {
        //        $(`button[data-record-id="${getIdWH}"]`).click();

        //        localStorage.removeItem("idwarehouse");
        //    }
        //})

    };

    var initSubDatatable = function (id) {
        var el = $('#kt_datatable_epc');
        var datatable = el.KTDatatable({
            data: {
                type: 'remote',
                source: {
                    read: {
                        url: '/MasterData/Goods/GetGoodEPCS',
                        params: {
                            id: id,
                        },
                    },
                },
                pageSize: 5,
                serverPaging: false,
                serverFiltering: false,
                serverSorting: false,
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

            search: {
                input: el.find('#kt_datatable_search_query_2'),
                key: 'generalSearch'
            },

            sortable: true,

            // columns definition
            columns: columnInDetailGoodInWH,
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
            var searchText = $(this).val();
            datatable.search(searchText, 'idgoods');
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
    DetailGoodTable.init();
});
