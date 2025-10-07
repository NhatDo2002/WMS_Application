"use strict"

//const ws = new WebSocket("wss://shit.solutions:9898");
var con = $.connection.realHub;
// Shared Colors Definition
const primary = '#6993FF';
const success = '#1BC5BD';
const info = '#8950FC';
const warning = '#FFA800';
const danger = '#F64E60';


con.client.notify = function (message) {

    if (message == 'purchase') {
        /*RoleClickPurchase();*/
        /*PurchaseOrderNotify();*/
        console.log(1);
    }
    else if (message == 'saleorder') {
        /*SaleOrderNotify();*/
    }
}

$.connection.hub.start().done(function () {
    console.log('Hub started');
});

$(document).ready(function () {
    //GetRecentPage();
    //RoleClickPurchase();
    //RoleClickSale();
});


function RoleClickPurchase() {
    $.ajax({
        url: '/authorization/PurchaseManager',
        type: 'get',
        success: function (data) {
            if (data.code == 300) {
                PurchaseOrderNotify();
            }
        }
    })
}
function RoleClickSale() {
    $.ajax({
        url: '/authorization/SalesManager',
        type: 'get',
        success: function (data) {
            if (data.code == 300) {
                SaleOrderNotify();
            }
        }
    })
}
function PurchaseOrderNotify() {

    $('#clickpurchase').click(function () {

        localStorage.setItem('purchaseStatus', 'false');
        window.location.href = '/PurchaseOrder/List';
    });

    $.ajax({
        url: '/home/PurchaseNotify',
        type: 'post',
        success: function (data) {
            $('span[name="purchasenotify"]').text(data.numNotify);
        },
        error: function (xhr, status, error) {
            console.error(xhr.responseText);
        }
    })
}

function SaleOrderNotify() {

    $('#clicksaleorder').click(function () {
        localStorage.setItem('saleorderStatus', 'false');
        window.location.href = '/WarehouseManagement/SaleOrder/List';
    })

    $.ajax({
        url: '/home/SaleOrderNotify',
        type: 'post',
        success: function (data) {
            $('span[name="saleordernotify"]').text(data.numNotify);
        },
        error: function (xhr, status, error) {
            console.error(xhr.responseText);
        }
    })
}
// hiển thị danh sách truy cập thường xuyên
//function GetRecentPage() {
//    $.ajax({
//        url: '/Home/RecentPageShow',
//        type: 'get',
//        success: function (data) {
//            var recentPages = data.recentpage;

//            var container = $("#recentPagesContainer");

//            if (recentPages && recentPages.length > 0) {
//                container.empty();

//                recentPages.forEach(function (page) {
//                    $.ajax({
//                        url: '/Home/GetResources',
//                        type: 'get',
//                        data: { key: page.Title }, // Truyền trường Title từ dữ liệu recentPages
//                        success: function (localizedTitle) {
//                            console.log(localizedTitle)
//                            var div = $("<div>").addClass("d-flex align-items-center mb-10");
//                            div.html('<div class="symbol symbol-40 symbol-light-success mr-5">' +
//                                '<span class="symbol-label">' +
//                                '<span class="svg-icon svg-icon-xl svg-icon-success">' +
//                                '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24px" height="24px" viewBox="0 0 24 24" version="1.1">' +
//                                '<g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">' +
//                                '<rect x="0" y="0" width="24" height="24"></rect>' +
//                                '<path d="M5,3 L6,3 C6.55228475,3 7,3.44771525 7,4 L7,20 C7,20.5522847 6.55228475,21 6,21 L5,21 C4.44771525,21 4,20.5522847 4,20 L4,4 C4,3.44771525 4.44771525,3 5,3 Z M10,3 L11,3 C11.5522847,3 12,3.44771525 12,4 L12,20 C12,20.5522847 11.5522847,21 11,21 L10,21 C9.44771525,21 9,20.5522847 9,20 L9,4 C9,3.44771525 9.44771525,3 10,3 Z" fill="#000000"></path>' +
//                                '<rect fill="#000000" opacity="0.3" transform="translate(17.825568, 11.945519) rotate(-19.000000) translate(-17.825568, -11.945519)" x="16.3255682" y="2.94551858" width="3" height="18" rx="1"></rect>' +
//                                '</g>' +
//                                '</svg>' +
//                                '</span>' +
//                                '</span>' +
//                                '</div>' +
//                                '<div class="d-flex flex-column font-weight-bold">' +
//                                '<a href="' + page.PageURL + '" class="text-dark text-hover-primary mb-1 font-size-lg">' + localizedTitle.Value + '</a>' +
//                                '</div>');

//                            container.append(div);
//                        },
//                        error: function (xhr, status, error) {
//                            console.error('Error getting localized string:', error);
//                        }
//                    });
//                });
//            }
//        },
//        error: function (xhr, status, error) {
//            console.error(xhr.responseText);
//        }
//    });
//}

// Lấy ngày hiện tại
var today = new Date();

// Lấy ngày trong tháng
var day = today.getDate();
// Định dạng lại chuỗi ngày thành dd
var dayString = (day < 10 ? '0' : '') + day;

// Lấy tháng
var month = today.getMonth() + 1;
// Định dạng lại chuỗi tháng thành mm
var monthString = (month < 10 ? '0' : '') + month;

// Lấy năm
//var year = today.getFullYear();

//$("#showListWarehouse").on("click", function () {
//    window.location.href = "/WareHouse/Index";
//})
//$("#goodDetailList").on("click", function () {
//    window.location.href = "/Goods/DetailList";
//})
//$("#assetShowList").on("click", function () {
//    window.location.href = "/WareHouse/ShowList";
//})


$('#dashboardBtn').addClass('menu-item-active')

//// Hiển thị ngày tháng trong phần tử HTML tương ứng
//document.getElementById('kt_dashboard_daterangepicker_date').innerText = dayString + '/' + monthString;

//Conver Json Date
function parseJsonDate(jsonDate) {
    const timestamp = jsonDate.match(/\d+/)[0];


    const date = new Date(parseInt(timestamp));


    const formattedDate = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();

    return formattedDate;
}

var initialize = function () {
    //Import/Export charts
    var _demo2 = function () {
        var importList;
        var exportList;
        var stockList;
        $.ajax({
            url: "/WarehouseManagement/purchaseorder/GetPurchaseStatistics",
            type: "get",
            success: function (data) {
                var dateList = data.dates.map(jsonDate => {
                    // Extract the timestamp and create a Date object
                    const timestamp = parseInt(jsonDate.replace("/Date(", "").replace(")/", ""), 10);
                    const date = new Date(timestamp);

                    // Format the date in local timezone
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
                    const day = String(date.getDate()).padStart(2, '0');

                    return `${year}-${month}-${day}`;
                })
                data.dates = dateList;
                importList = data;
                headerChart2[0].data = importList.totals;
                $.ajax({
                    url: "/WarehouseManagement/saleorder/GetSaleStatistics",
                    type: "get",
                    success: function (data) {
                        var dateList = data.dates.map(jsonDate => {
                            // Extract the timestamp and create a Date object
                            const timestamp = parseInt(jsonDate.replace("/Date(", "").replace(")/", ""), 10);
                            const date = new Date(timestamp);

                            // Format the date in local timezone
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
                            const day = String(date.getDate()).padStart(2, '0');

                            return `${year}-${month}-${day}`;
                        })
                        data.dates = dateList;
                        exportList = data;
                        headerChart2[1].data = exportList.totals;
                        $.ajax({
                            url: "/stock/GetStockStatistics",
                            type: "get",
                            success: function (data) {
                                var dateList = data.dates.map(jsonDate => {
                                    // Extract the timestamp and create a Date object
                                    const timestamp = parseInt(jsonDate.replace("/Date(", "").replace(")/", ""), 10);
                                    const date = new Date(timestamp);

                                    // Format the date in local timezone
                                    const year = date.getFullYear();
                                    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
                                    const day = String(date.getDate()).padStart(2, '0');

                                    return `${year}-${month}-${day}`;
                                })
                                data.dates = dateList;
                                stockList = data;
                                headerChart2[2].data = stockList.totals;
                                const apexChart = "#chart_2";
                                var options = {
                                    series: headerChart2,
                                    chart: {
                                        height: 350,
                                        type: 'area',
                                        toolbar: {
                                            show: true, // Bật thanh toolbar
                                            tools: {
                                                download: false, // Ẩn nút download mặc định
                                                customIcons: [
                                                    {
                                                        icon: `<span class="svg-icon svg-icon-lg"><!--begin::Svg Icon | path:/var/www/preview.keenthemes.com/metronic/releases/2021-05-14-112058/theme/html/demo8/dist/../src/media/svg/icons/Text/Menu.svg--><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24px" height="24px" viewBox="0 0 24 24" version="1.1">
                                                            <title>Stockholm-icons / Text / Menu</title>
                                                            <desc>Created with Sketch.</desc>
                                                            <defs/>
                                                            <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                                                                <rect x="0" y="0" width="24" height="24"/>
                                                                <rect fill="#000000" x="4" y="5" width="16" height="3" rx="1.5"/>
                                                                <path d="M5.5,15 L18.5,15 C19.3284271,15 20,15.6715729 20,16.5 C20,17.3284271 19.3284271,18 18.5,18 L5.5,18 C4.67157288,18 4,17.3284271 4,16.5 C4,15.6715729 4.67157288,15 5.5,15 Z M5.5,10 L18.5,10 C19.3284271,10 20,10.6715729 20,11.5 C20,12.3284271 19.3284271,13 18.5,13 L5.5,13 C4.67157288,13 4,12.3284271 4,11.5 C4,10.6715729 4.67157288,10 5.5,10 Z" fill="#000000" opacity="0.3"/>
                                                            </g>
                                                        </svg><!--end::Svg Icon--></span><!--end::Svg Icon--></span>`, // Icon tùy chỉnh
                                                        index: -1,
                                                        title: 'Download Options',
                                                        class: 'custom-apex-download-btn',
                                                        click: function (chart, options, e) {
                                                            // Toggle hiển thị menu sổ xuống
                                                            const dropdown = document.querySelector('.custom-apex-download-menu');
                                                            //dropdown.style.display =
                                                            //    dropdown.style.display === 'block' ? 'none' : 'block';
                                                            dropdown.classList.toggle('show');
                                                        }
                                                    }
                                                ]
                                            },
                                        }
                                    },
                                    dataLabels: {
                                        enabled: false
                                    },
                                    stroke: {
                                        curve: 'smooth'
                                    },
                                    xaxis: {
                                        type: 'date',
                                        categories: importList.dates
                                    },
                                    tooltip: {
                                        x: {
                                            format: 'dd/MM/yyyy'
                                        },
                                    },
                                    colors: [primary, success, warning]
                                };

                                var chart = new ApexCharts(document.querySelector(apexChart), options);
                                chart.render();

                                // Tạo menu sổ xuống với các class độc nhất
                                const dropdownHTML = `
                                <div class="custom-apex-download-menu" style="position: absolute;">
                                    <div class="custom-apex-download-item" data-type="png">Download PNG</div>
                                    <div class="custom-apex-download-item" data-type="svg">Download SVG</div>
                                    <div class="custom-apex-download-item" data-type="csv">Download Excel</div>
                                </div>
                            `;
                                document.body.insertAdjacentHTML('beforeend', dropdownHTML); // Thêm menu vào cuối body

                                const dropdown = document.querySelector('.custom-apex-download-menu');

                                //// Hàm cập nhật vị trí dropdown
                                //function updateDropdownPosition() {
                                //    const btnRect = button.getBoundingClientRect();
                                //    dropdown.style.top = `${btnRect.bottom + window.scrollY}px`;
                                //    dropdown.style.left = `${btnRect.left + window.scrollX}px`;
                                //}

                                // Xử lý hiển thị menu tại vị trí chính xác
                                $(document).on('click','.custom-apex-download-btn', (e) => {
                                    const dropdown = document.querySelector('.custom-apex-download-menu');
                                    const btnRect = e.target.getBoundingClientRect();
                                    if (dropdown) {
                                        dropdown.style.top = `${btnRect.bottom + window.scrollY}px`;
                                        dropdown.style.left = `${btnRect.left + window.scrollX}px`;
                                    }
                                });

                                // Xử lý sự kiện click vào menu item
                                document.querySelectorAll('.custom-apex-download-item').forEach(item => {
                                    item.addEventListener('click', (event) => {
                                        const type = event.target.getAttribute('data-type');
                                        const dropdown = document.querySelector('.custom-apex-download-menu');
                                        dropdown.classList.remove('show'); // Đóng menu sau khi chọn

                                        if (type === 'png' || type === 'svg') {
                                            chart.dataURI().then(({ imgURI, svgURI }) => {
                                                const link = document.createElement("a");
                                                link.href = type === 'png' ? imgURI : svgURI;
                                                link.download = `custom_chart.${type}`;
                                                link.click();
                                            });
                                        } else if (type === 'csv') {
                                            exportChartDataToCSV(chart)
                                        }
                                    });
                                });

                                function exportChartDataToCSV(chart, fileName = 'chart_data.xlsx') {
                                    const seriesData = chart.w.globals.series; // Lấy dữ liệu từ biểu đồ
                                    const categories = chart.w.globals.labels; // Lấy nhãn (categories) của trục X

                                    // Kiểm tra nếu dữ liệu không có
                                    if (!seriesData || !categories) {
                                        console.error("Không có dữ liệu để xuất");
                                        return;
                                    }

                                    // Chuẩn bị dữ liệu cho bảng tính
                                    let data = [];

                                    // Thêm tiêu đề (header)
                                    const header = ['STT', ...chart.w.globals.seriesNames];
                                    data.push(header);

                                    // Thêm dữ liệu vào bảng
                                    categories.forEach((category, index) => {
                                        let row = [category];
                                        row.push(...seriesData.map(series => series[index] || ""));
                                        data.push(row);
                                    });

                                    // Tạo workbook từ dữ liệu
                                    const wb = XLSX.utils.book_new();
                                    const ws = XLSX.utils.aoa_to_sheet(data); // Chuyển dữ liệu thành worksheet
                                    XLSX.utils.book_append_sheet(wb, ws, "Chart Data");

                                    // Tạo dữ liệu dưới dạng Blob
                                    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });

                                    // Tạo một Blob và kích hoạt liên kết tải xuống
                                    const blob = new Blob([s2ab(wbout)], { type: "application/octet-stream" });
                                    const link = document.createElement("a");
                                    link.href = URL.createObjectURL(blob);
                                    link.download = fileName;
                                    link.click();

                                    //// Tải xuống tệp CSV
                                    //const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                                    //const link = document.createElement("a");
                                    //link.href = URL.createObjectURL(blob);
                                    //link.download = fileName; // Đặt tên tệp khi tải xuống
                                    //link.click(); // Kích hoạt sự kiện click
                                    URL.revokeObjectURL(link.href); // Giải phóng bộ nhớ
                                }

                                // Hàm chuyển đổi string thành ArrayBuffer (phương thức hỗ trợ tạo Blob)
                                function s2ab(s) {
                                    const buf = new ArrayBuffer(s.length);
                                    const view = new Uint8Array(buf);
                                    for (let i = 0; i < s.length; i++) {
                                        view[i] = s.charCodeAt(i) & 0xFF;
                                    }
                                    return buf;
                                }

                                // Xử lý sự kiện click bên ngoài để đóng menu
                                document.addEventListener('click', (e) => {
                                    const dropdown = document.querySelector('.custom-apex-download-menu');
                                    const button = document.querySelector('.custom-apex-download-btn');
                                    if (dropdown && !dropdown.contains(e.target) && !button.contains(e.target)) {
                                        dropdown.classList.remove('show');
                                    }
                                });

                                //// Liên kết hàm cập nhật vị trí với sự kiện scroll và resize
                                //window.addEventListener('scroll', () => {
                                //    if (dropdown.classList.contains('show')) {
                                //        updateDropdownPosition();
                                //    }
                                //});

                                //window.addEventListener('resize', () => {
                                //    if (dropdown.classList.contains('show')) {
                                //        updateDropdownPosition();
                                //    }
                                //});

                            },
                            error: function () {
                                console.error('Error getting localized string:', error);
                            }
                        });
                    },
                    error: function () {
                        console.error('Error getting localized string:', error);
                    }
                });
            },
            error: function () {
                console.error('Error getting localized string:', error);
            }
        })
    }
    
    var _demo12 = function () {
        $.ajax({
            url: "/WarehouseManagement/WareHouse/WarehouseStatistics",
            type: "get",
            success: function (data) {  
                const apexChart = "#chart_12";
                var options = {
                    series: data.totals,
                    chart: {
                        width: 400,
                        type: 'pie',
                    },
                    legend: {
                        position: 'bottom',
                    },
                    labels: data.names,
                    responsive: [{
                        breakpoint: 1300,
                        options: {
                            chart: {
                                width: 350
                            },
                            legend: {
                                position: 'bottom'
                            }
                        }
                    }, {
                        breakpoint: 1200,
                        options: {
                            chart: {
                                width: 300
                            },
                            legend: {
                                position: 'bottom'
                            }
                        }
                    }],
                    colors: [primary, success, warning, danger, info]
                };

                var chart = new ApexCharts(document.querySelector(apexChart), options);
                chart.render();
            },
            error: function () {
                console.error('Error getting localized string:', error);
            }
        })
    }

    var _demo3 = function () {
        var po;
        var so;
        $.ajax({
            url: "/WarehouseManagement/purchaseorder/GetPurchaseQuantityStatistics",
            type: "get",
            success: function (data) {
                po = data
                headerChart3[0].data = po.totals
                $.ajax({
                    url: "/saleorder/GetSaleQuantityStatistics",
                    type: "get",
                    success: function (data) {
                        so = data;
                        headerChart3[1].data = so.totals
                        const apexChart = "#chart_3";
                        var options = {
                            series: headerChart3,
                            chart: {
                                type: 'bar',
                                height: 350,
                                toolbar: {
                                    show: true, // Bật thanh toolbar
                                    tools: {
                                        download: false, // Ẩn nút download mặc định
                                        customIcons: [
                                            {
                                                icon: `<span class="svg-icon svg-icon-lg"><!--begin::Svg Icon | path:/var/www/preview.keenthemes.com/metronic/releases/2021-05-14-112058/theme/html/demo8/dist/../src/media/svg/icons/Text/Menu.svg--><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24px" height="24px" viewBox="0 0 24 24" version="1.1">
                                                            <title>Stockholm-icons / Text / Menu</title>
                                                            <desc>Created with Sketch.</desc>
                                                            <defs/>
                                                            <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                                                                <rect x="0" y="0" width="24" height="24"/>
                                                                <rect fill="#000000" x="4" y="5" width="16" height="3" rx="1.5"/>
                                                                <path d="M5.5,15 L18.5,15 C19.3284271,15 20,15.6715729 20,16.5 C20,17.3284271 19.3284271,18 18.5,18 L5.5,18 C4.67157288,18 4,17.3284271 4,16.5 C4,15.6715729 4.67157288,15 5.5,15 Z M5.5,10 L18.5,10 C19.3284271,10 20,10.6715729 20,11.5 C20,12.3284271 19.3284271,13 18.5,13 L5.5,13 C4.67157288,13 4,12.3284271 4,11.5 C4,10.6715729 4.67157288,10 5.5,10 Z" fill="#000000" opacity="0.3"/>
                                                            </g>
                                                        </svg><!--end::Svg Icon--></span><!--end::Svg Icon--></span>`, // Icon tùy chỉnh
                                                index: -1,
                                                title: 'Download Options',
                                                class: 'custom-apex-download-btn-chart3',
                                                click: function (chart, options, e) {
                                                    // Toggle hiển thị menu sổ xuống
                                                    const dropdown = document.querySelector('.custom-apex-download-menu-chart3');
                                                    //dropdown.style.display =
                                                    //    dropdown.style.display === 'block' ? 'none' : 'block';
                                                    dropdown.classList.toggle('show');
                                                }
                                            }
                                        ]
                                    },
                                }
                            },
                            plotOptions: {
                                bar: {
                                    horizontal: false,
                                    columnWidth: '55%',
                                    endingShape: 'rounded'
                                },
                            },
                            dataLabels: {
                                enabled: false
                            },
                            stroke: {
                                show: true,
                                width: 2,
                                colors: ['transparent']
                            },
                            xaxis: {
                                categories: data.month,
                            },
                            yaxis: {
                                title: {
                                    text: 'quantity'
                                }
                            },
                            fill: {
                                opacity: 1
                            },
                            tooltip: {
                                y: {
                                    formatter: function (val) {
                                        return val + " items"
                                    }
                                }
                            },
                            colors: [primary, success]
                        };

                        var chart = new ApexCharts(document.querySelector(apexChart), options);
                        chart.render();

                        // Tạo menu sổ xuống với các class độc nhất
                        const dropdownHTML = `
                                <div class="custom-apex-download-menu-chart3" style="position: absolute;">
                                    <div class="custom-apex-download-item-chart3" data-type="png">Download PNG</div>
                                    <div class="custom-apex-download-item-chart3" data-type="svg">Download SVG</div>
                                    <div class="custom-apex-download-item-chart3" data-type="csv">Download Excel</div>
                                </div>
                            `;
                        document.body.insertAdjacentHTML('beforeend', dropdownHTML); // Thêm menu vào cuối body

                        const dropdown = document.querySelector('.custom-apex-download-menu-chart3');

                        // Hàm cập nhật vị trí dropdown
                        function updateDropdownPosition() {
                            const btnRect = button.getBoundingClientRect();
                            dropdown.style.top = `${btnRect.bottom + window.scrollY}px`;
                            dropdown.style.left = `${btnRect.left + window.scrollX}px`;
                        }

                        // Xử lý hiển thị menu tại vị trí chính xác
                        $(document).on('click','.custom-apex-download-btn-chart3', (e) => {
                            const dropdown = document.querySelector('.custom-apex-download-menu-chart3');
                            const btnRect = e.target.getBoundingClientRect();
                            if (dropdown) {
                                dropdown.style.top = `${btnRect.bottom + window.scrollY}px`;
                                dropdown.style.left = `${btnRect.left + window.scrollX}px`;
                            }
                        });

                        function exportChartDataToCSV(chart, fileName = 'chart_data.xlsx') {
                            const seriesData = chart.w.globals.series; // Lấy dữ liệu từ biểu đồ
                            const categories = chart.w.globals.labels; // Lấy nhãn (categories) của trục X

                            // Kiểm tra nếu dữ liệu không có
                            if (!seriesData || !categories) {
                                console.error("Không có dữ liệu để xuất");
                                return;
                            }

                            // Chuẩn bị dữ liệu cho bảng tính
                            let data = [];

                            // Thêm tiêu đề (header)
                            const header = ['Tháng', ...chart.w.globals.seriesNames];
                            data.push(header);

                            // Thêm dữ liệu vào bảng
                            categories.forEach((category, index) => {
                                let row = [category];
                                row.push(...seriesData.map(series => series[index] || ""));
                                data.push(row);
                            });

                            // Tạo workbook từ dữ liệu
                            const wb = XLSX.utils.book_new();
                            const ws = XLSX.utils.aoa_to_sheet(data); // Chuyển dữ liệu thành worksheet
                            XLSX.utils.book_append_sheet(wb, ws, "Chart Data");

                            // Tạo dữ liệu dưới dạng Blob
                            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });

                            // Tạo một Blob và kích hoạt liên kết tải xuống
                            const blob = new Blob([s2ab(wbout)], { type: "application/octet-stream" });
                            const link = document.createElement("a");
                            link.href = URL.createObjectURL(blob);
                            link.download = fileName;
                            link.click();

                            //// Tải xuống tệp CSV
                            //const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                            //const link = document.createElement("a");
                            //link.href = URL.createObjectURL(blob);
                            //link.download = fileName; // Đặt tên tệp khi tải xuống
                            //link.click(); // Kích hoạt sự kiện click
                            URL.revokeObjectURL(link.href); // Giải phóng bộ nhớ
                        }

                        // Hàm chuyển đổi string thành ArrayBuffer (phương thức hỗ trợ tạo Blob)
                        function s2ab(s) {
                            const buf = new ArrayBuffer(s.length);
                            const view = new Uint8Array(buf);
                            for (let i = 0; i < s.length; i++) {
                                view[i] = s.charCodeAt(i) & 0xFF;
                            }
                            return buf;
                        }


                        // Xử lý sự kiện click vào menu item
                        document.querySelectorAll('.custom-apex-download-item-chart3').forEach(item => {
                            item.addEventListener('click', (event) => {
                                const type = event.target.getAttribute('data-type');
                                const dropdown = document.querySelector('.custom-apex-download-menu-chart3');
                                dropdown.classList.remove('show'); // Đóng menu sau khi chọn

                                if (type === 'png' || type === 'svg') {
                                    chart.dataURI().then(({ imgURI, svgURI }) => {
                                        const link = document.createElement("a");
                                        link.href = type === 'png' ? imgURI : svgURI;
                                        link.download = `custom_chart.${type}`;
                                        link.click();
                                    });
                                } else if (type === 'csv') {
                                    exportChartDataToCSV(chart);
                                }
                            });
                        });

                        // Xử lý sự kiện click bên ngoài để đóng menu
                        document.addEventListener('click', (e) => {
                            const dropdown = document.querySelector('.custom-apex-download-menu-chart3');
                            const button = document.querySelector('.custom-apex-download-btn-chart3');
                            if (dropdown && !dropdown.contains(e.target) && !button.contains(e.target)) {
                                dropdown.classList.remove('show');
                            }
                        });
                    },
                    error: function () {
                        console.error('Error getting localized string:', error);
                    }
                })
            },
            error: function () {
                console.error('Error getting localized string:', error);
            }
        })
    }

    var ranking = function() {
        $.ajax({
            url: "/home/GetTop3",
            type: "get",
            success: function (data) {
                var rank = ``
                var colors = ['#ffd700', '#b0b0b0', '#ed8d1f']
                $.each(data.topGoods, function (k, v) {
                    rank += `<div class="ranking-card" style="--rank-color: ${colors[k]};">
        <div class="rank-badge">${k+1}</div>
        <div class="details">
            <h2 id="${v.Id}">${v.name}</h2>
            <span class="score" id="top1Score">${v.total == null ? 0 : v.total}</span>
        </div>
    </div>`
                })
                $('#rank').append(rank)
            },
            error: function (data) {
                toastr.error(data.message);
            }
        });
    }

    return {
        init: function () {
            _demo2();
            _demo12();
            _demo3();
            ranking();
        },
    }
}();

jQuery(document).ready(function () {
    initialize.init();
});

$("div[title='Download PNG']").on("click", function (e) {
    e.preventDefault();
    console.log("hello");
})



